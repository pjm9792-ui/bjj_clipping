"""Supabase data + storage backend for BJJ clip library."""

from __future__ import annotations

import mimetypes
import os
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from tusclient import client as tus_client

from dotenv import load_dotenv


load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.")


def _api_headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }
    if extra:
        headers.update(extra)
    return headers


def _request(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json_body: Any | None = None,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    ok_codes: tuple[int, ...] = (200, 201, 204),
) -> Any:
    url = f"{SUPABASE_URL}{path}"
    merged_headers = _api_headers(headers)
    response = requests.request(
        method=method,
        url=url,
        params=params,
        json=json_body,
        data=data,
        headers=merged_headers,
        timeout=120,
    )
    if response.status_code not in ok_codes:
        raise RuntimeError(
            f"Supabase request failed: {method} {path} [{response.status_code}] {response.text}"
        )
    if response.content:
        return response.json()
    return None


def _normalize_tag(name: str) -> str:
    return name.strip().lower()


def make_storage_uri(bucket: str, object_path: str) -> str:
    return f"supabase://{bucket}/{object_path.lstrip('/')}"


def parse_storage_uri(uri: str) -> tuple[str, str]:
    if not uri.startswith("supabase://"):
        raise ValueError(f"Not a supabase uri: {uri}")
    tail = uri[len("supabase://") :]
    if "/" not in tail:
        raise ValueError(f"Invalid supabase uri: {uri}")
    bucket, obj = tail.split("/", 1)
    return bucket, obj


def ensure_bucket(bucket: str, public: bool = False) -> None:
    existing = _request("GET", "/storage/v1/bucket", ok_codes=(200,))
    if any(item.get("id") == bucket for item in existing):
        return
    try:
        _request(
            "POST",
            "/storage/v1/bucket",
            json_body={"id": bucket, "name": bucket, "public": public},
            ok_codes=(200,),
        )
    except RuntimeError as exc:
        # Ignore race/exists errors if another process created it.
        message = str(exc).lower()
        if "already exists" not in message and "duplicate" not in message:
            raise


def ensure_schema_ready() -> None:
    try:
        table_select("videos", columns="id", order="id.asc")
        table_select("clips", columns="id", order="id.asc")
        table_select("tags", columns="id", order="id.asc")
        table_select("clip_tags", columns="clip_id", order="clip_id.asc")
        table_select("video_tags", columns="video_id", order="video_id.asc")
    except RuntimeError as exc:
        message = str(exc)
        if "PGRST205" in message or "Could not find the table" in message:
            raise RuntimeError(
                "Supabase tables are missing. Run supabase/schema.sql in Supabase SQL Editor, "
                "then rerun migration."
            ) from exc
        raise


def upload_file(bucket: str, object_path: str, local_path: str, upsert: bool = True) -> str:
    ensure_bucket(bucket, public=False)
    source = Path(local_path)
    if not source.exists() or not source.is_file():
        raise FileNotFoundError(local_path)
    content_type = mimetypes.guess_type(source.name)[0] or "application/octet-stream"
    file_size = source.stat().st_size
    # Supabase simple object upload is best for small files; use TUS for larger objects.
    if file_size >= 45 * 1024 * 1024:
        _upload_file_resumable(bucket, object_path, str(source), content_type, upsert=upsert)
    else:
        with source.open("rb") as fh:
            payload = fh.read()
        try:
            _request(
                "POST",
                f"/storage/v1/object/{bucket}/{quote(object_path)}",
                data=payload,
                headers={
                    "Content-Type": content_type,
                    "x-upsert": "true" if upsert else "false",
                },
                ok_codes=(200,),
            )
        except RuntimeError as exc:
            message = str(exc).lower()
            if "payload too large" in message or '"statuscode":"413"' in message:
                _upload_file_resumable(bucket, object_path, str(source), content_type, upsert=upsert)
            else:
                raise
    return make_storage_uri(bucket, object_path)


def _upload_file_resumable(
    bucket: str,
    object_path: str,
    local_path: str,
    content_type: str,
    *,
    upsert: bool = True,
) -> None:
    endpoint = f"{SUPABASE_URL}/storage/v1/upload/resumable"
    headers = _api_headers({"x-upsert": "true" if upsert else "false"})
    client = tus_client.TusClient(endpoint, headers=headers)
    uploader_kwargs = {
        "file_path": local_path,
        "chunk_size": 2 * 1024 * 1024,
        "metadata": {
            "bucketName": bucket,
            "objectName": object_path,
            "contentType": content_type,
            "cacheControl": "3600",
        },
    }
    # Prevent large payload during create call, which may trigger HTTP 413.
    try:
        uploader = client.uploader(upload_data_during_creation=False, **uploader_kwargs)
    except TypeError:
        uploader = client.uploader(**uploader_kwargs)
    uploader.upload()


def upload_text(bucket: str, object_path: str, content: str, upsert: bool = True) -> str:
    ensure_bucket(bucket, public=False)
    _request(
        "POST",
        f"/storage/v1/object/{bucket}/{quote(object_path)}",
        data=content.encode("utf-8"),
        headers={"Content-Type": "text/plain; charset=utf-8", "x-upsert": "true" if upsert else "false"},
        ok_codes=(200,),
    )
    return make_storage_uri(bucket, object_path)


def download_text(bucket: str, object_path: str) -> str:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{quote(object_path)}"
    response = requests.get(url, headers=_api_headers(), timeout=120)
    if response.status_code == 404:
        raise FileNotFoundError(object_path)
    if response.status_code != 200:
        raise RuntimeError(f"Storage download failed [{response.status_code}] {response.text}")
    return response.text


def create_signed_url(uri: str, expires_in: int = 3600) -> str:
    bucket, object_path = parse_storage_uri(uri)
    payload = _request(
        "POST",
        f"/storage/v1/object/sign/{bucket}/{quote(object_path)}",
        json_body={"expiresIn": expires_in},
        ok_codes=(200,),
    )
    signed = payload.get("signedURL", "")
    if signed.startswith("http://") or signed.startswith("https://"):
        return signed
    return f"{SUPABASE_URL}/storage/v1{signed}"


def clip_thumbnail_uri_from_clip_uri(clip_uri: str) -> str:
    bucket, object_path = parse_storage_uri(clip_uri)
    if bucket != "clips":
        raise ValueError(f"Expected clips bucket uri, got: {clip_uri}")
    base = object_path.rsplit(".", 1)[0]
    return make_storage_uri("thumbnails", f"{base}.jpg")


def table_select(
    table: str,
    *,
    columns: str = "*",
    filters: dict[str, str] | None = None,
    order: str | None = None,
    limit: int | None = None,
    offset: int | None = None,
) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"select": columns}
    if filters:
        params.update(filters)
    if order:
        params["order"] = order
    if limit is not None:
        params["limit"] = str(limit)
    if offset is not None:
        params["offset"] = str(offset)
    return _request("GET", f"/rest/v1/{table}", params=params, ok_codes=(200,))


def table_insert(table: str, payload: dict[str, Any] | list[dict[str, Any]]) -> list[dict[str, Any]]:
    return _request(
        "POST",
        f"/rest/v1/{table}",
        json_body=payload,
        headers={"Content-Type": "application/json", "Prefer": "return=representation"},
        ok_codes=(200, 201),
    )


def table_upsert(
    table: str,
    payload: dict[str, Any] | list[dict[str, Any]],
    *,
    on_conflict: str,
) -> list[dict[str, Any]]:
    return _request(
        "POST",
        f"/rest/v1/{table}",
        params={"on_conflict": on_conflict},
        json_body=payload,
        headers={
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
        ok_codes=(200, 201),
    )


def table_update(table: str, payload: dict[str, Any], *, filters: dict[str, str]) -> list[dict[str, Any]]:
    return _request(
        "PATCH",
        f"/rest/v1/{table}",
        params=filters,
        json_body=payload,
        headers={"Content-Type": "application/json", "Prefer": "return=representation"},
        ok_codes=(200, 201),
    )


def table_delete(table: str, *, filters: dict[str, str]) -> None:
    _request(
        "DELETE",
        f"/rest/v1/{table}",
        params=filters,
        headers={"Prefer": "return=minimal"},
        ok_codes=(204,),
    )


def _eq_filters(**kwargs: Any) -> dict[str, str]:
    return {k: f"eq.{v}" for k, v in kwargs.items()}


def _in_filter(values: list[int]) -> str:
    return f"in.({','.join(str(v) for v in values)})"


def get_or_create_video(title: str, file_path: str) -> int:
    rows = table_select("videos", filters=_eq_filters(file_path=file_path))
    if rows:
        return int(rows[0]["id"])
    created = table_insert("videos", {"title": title, "file_path": file_path})
    return int(created[0]["id"])


def update_video_metadata(video_id: int, *, title: str | None = None, summary: str | None = None) -> None:
    payload: dict[str, Any] = {}
    if title:
        payload["title"] = title
    if summary:
        payload["description"] = summary
    if payload:
        table_update("videos", payload, filters=_eq_filters(id=video_id))


def get_or_create_clip(
    *,
    video_id: int,
    file_path: str,
    start_sec: float | None,
    end_sec: float | None,
    clip_type: str,
    title: str | None,
    description: str | None,
) -> int:
    rows = table_select("clips", filters=_eq_filters(file_path=file_path))
    if rows:
        return int(rows[0]["id"])
    duration_sec = (float(end_sec) - float(start_sec)) if start_sec is not None and end_sec is not None else None
    created = table_insert(
        "clips",
        {
            "video_id": video_id,
            "file_path": file_path,
            "start_sec": start_sec,
            "end_sec": end_sec,
            "duration_sec": duration_sec,
            "type": clip_type,
            "title": title,
            "description": description,
        },
    )
    return int(created[0]["id"])


def update_clip_metadata(
    clip_id: int,
    *,
    title: str | None = None,
    description: str | None = None,
    start_sec: float | None = None,
    end_sec: float | None = None,
    clip_type: str | None = None,
) -> None:
    payload: dict[str, Any] = {}
    if title is not None:
        payload["title"] = title
    if description is not None:
        payload["description"] = description
    if start_sec is not None:
        payload["start_sec"] = start_sec
    if end_sec is not None:
        payload["end_sec"] = end_sec
    if start_sec is not None and end_sec is not None:
        payload["duration_sec"] = float(end_sec) - float(start_sec)
    if clip_type is not None:
        payload["type"] = clip_type
    if payload:
        table_update("clips", payload, filters=_eq_filters(id=clip_id))


def upsert_tag(facet: str, name: str, *, is_allowed: int = 0) -> int:
    row = table_upsert(
        "tags",
        {
            "facet": facet.strip().lower(),
            "name": _normalize_tag(name),
            "is_allowed": int(is_allowed),
        },
        on_conflict="facet,name",
    )[0]
    return int(row["id"])


def replace_clip_tags(
    clip_id: int,
    *,
    main_tags: list[str],
    sub_tags: list[str],
    video_tags: list[str] | None = None,
) -> None:
    table_delete("clip_tags", filters=_eq_filters(clip_id=clip_id))
    links: list[dict[str, Any]] = []
    for tag in sorted({_normalize_tag(t) for t in main_tags if t.strip()}):
        tag_id = upsert_tag("main", tag, is_allowed=1)
        links.append({"clip_id": clip_id, "tag_id": tag_id})
    for tag in sorted({_normalize_tag(t) for t in (video_tags or []) if t.strip()}):
        tag_id = upsert_tag("video", tag, is_allowed=1)
        links.append({"clip_id": clip_id, "tag_id": tag_id})
    for tag in sorted({_normalize_tag(t) for t in sub_tags if t.strip()}):
        tag_id = upsert_tag("sub", tag, is_allowed=0)
        links.append({"clip_id": clip_id, "tag_id": tag_id})
    if links:
        table_upsert("clip_tags", links, on_conflict="clip_id,tag_id")


def replace_video_tags(
    video_id: int,
    *,
    main_tags: list[str],
    sub_tags: list[str],
    video_tags: list[str] | None = None,
) -> None:
    table_delete("video_tags", filters=_eq_filters(video_id=video_id))
    links: list[dict[str, Any]] = []
    for tag in sorted({_normalize_tag(t) for t in main_tags if t.strip()}):
        tag_id = upsert_tag("main", tag, is_allowed=1)
        links.append({"video_id": video_id, "tag_id": tag_id})
    for tag in sorted({_normalize_tag(t) for t in (video_tags or []) if t.strip()}):
        tag_id = upsert_tag("video", tag, is_allowed=1)
        links.append({"video_id": video_id, "tag_id": tag_id})
    for tag in sorted({_normalize_tag(t) for t in sub_tags if t.strip()}):
        tag_id = upsert_tag("sub", tag, is_allowed=0)
        links.append({"video_id": video_id, "tag_id": tag_id})
    if links:
        table_upsert("video_tags", links, on_conflict="video_id,tag_id")


def set_clip_favorite(clip_id: int, is_favorite: bool) -> None:
    table_update("clips", {"is_favorite": bool(is_favorite)}, filters=_eq_filters(id=clip_id))


def list_tags(facet: str | None = None) -> list[dict[str, Any]]:
    filters = _eq_filters(facet=facet) if facet else None
    return table_select("tags", filters=filters, order="facet.asc,name.asc")


def list_videos() -> list[dict[str, Any]]:
    videos = table_select("videos", order="created_at.desc,id.desc")
    clips = table_select("clips", columns="id,video_id")
    count_by_video: dict[int, int] = {}
    for clip in clips:
        vid = int(clip["video_id"])
        count_by_video[vid] = count_by_video.get(vid, 0) + 1
    out: list[dict[str, Any]] = []
    for video in videos:
        row = dict(video)
        row["clip_count"] = count_by_video.get(int(video["id"]), 0)
        out.append(row)
    return out


def query_clips() -> list[dict[str, Any]]:
    clips = table_select("clips", order="id.asc")
    videos = table_select("videos", columns="id,title")
    titles = {int(v["id"]): v.get("title") for v in videos}
    out: list[dict[str, Any]] = []
    for clip in clips:
        row = dict(clip)
        row["video_title"] = titles.get(int(clip["video_id"]))
        out.append(row)
    return out


def query_clips_paginated(
    *,
    limit: int,
    offset: int,
    favorites_only: bool = False,
) -> tuple[list[dict[str, Any]], bool]:
    filters = {"is_favorite": "eq.true"} if favorites_only else None
    rows = table_select(
        "clips",
        filters=filters,
        order="id.asc",
        limit=limit + 1,
        offset=offset,
    )
    has_more = len(rows) > limit
    page_rows = rows[:limit]

    video_ids = sorted({int(r["video_id"]) for r in page_rows})
    video_title_by_id: dict[int, str | None] = {}
    if video_ids:
        videos = table_select(
            "videos",
            columns="id,title",
            filters={"id": _in_filter(video_ids)},
        )
        video_title_by_id = {int(v["id"]): v.get("title") for v in videos}

    out: list[dict[str, Any]] = []
    for clip in page_rows:
        row = dict(clip)
        row["video_title"] = video_title_by_id.get(int(clip["video_id"]))
        out.append(row)
    return out, has_more


def get_tags_for_clips(clip_ids: list[int]) -> dict[int, list[dict[str, Any]]]:
    if not clip_ids:
        return {}
    links = table_select(
        "clip_tags",
        columns="clip_id,tag_id",
        filters={"clip_id": _in_filter(clip_ids)},
    )
    if not links:
        return {clip_id: [] for clip_id in clip_ids}

    tag_ids = sorted({int(link["tag_id"]) for link in links})
    tags_by_id: dict[int, dict[str, Any]] = {}
    if tag_ids:
        tags = table_select("tags", columns="id,facet,name", filters={"id": _in_filter(tag_ids)})
        tags_by_id = {int(tag["id"]): tag for tag in tags}

    tags_by_clip: dict[int, list[dict[str, Any]]] = {clip_id: [] for clip_id in clip_ids}
    for link in links:
        clip_id = int(link["clip_id"])
        tag_id = int(link["tag_id"])
        tag = tags_by_id.get(tag_id)
        if tag is not None:
            tags_by_clip.setdefault(clip_id, []).append(tag)

    for tag_list in tags_by_clip.values():
        tag_list.sort(key=lambda t: (t.get("facet", ""), t.get("name", "")))
    return tags_by_clip


def list_favorite_clips() -> list[dict[str, Any]]:
    clips = table_select("clips", filters={"is_favorite": "eq.true"}, order="created_at.desc,id.desc")
    videos = table_select("videos", columns="id,title")
    titles = {int(v["id"]): v.get("title") for v in videos}
    out: list[dict[str, Any]] = []
    for clip in clips:
        row = dict(clip)
        row["video_title"] = titles.get(int(clip["video_id"]))
        out.append(row)
    return out


def get_clip(clip_id: int) -> dict[str, Any] | None:
    rows = table_select("clips", filters=_eq_filters(id=clip_id), limit=1)
    if not rows:
        return None
    return rows[0]


def get_video(video_id: int) -> dict[str, Any] | None:
    rows = table_select("videos", filters=_eq_filters(id=video_id), limit=1)
    if not rows:
        return None
    return rows[0]


def get_tags_for_clip(clip_id: int) -> list[dict[str, Any]]:
    links = table_select("clip_tags", filters=_eq_filters(clip_id=clip_id))
    if not links:
        return []
    tag_ids = [int(l["tag_id"]) for l in links]
    tags = table_select("tags", filters={"id": _in_filter(tag_ids)})
    tags.sort(key=lambda t: (t.get("facet", ""), t.get("name", "")))
    return tags


def get_tags_for_video(video_id: int) -> list[dict[str, Any]]:
    links = table_select("video_tags", filters=_eq_filters(video_id=video_id))
    if not links:
        return []
    tag_ids = [int(l["tag_id"]) for l in links]
    tags = table_select("tags", filters={"id": _in_filter(tag_ids)})
    tags.sort(key=lambda t: (t.get("facet", ""), t.get("name", "")))
    return tags


def prune_missing_media() -> dict[str, int]:
    """For Supabase storage-backed paths, do not prune by default."""
    return {
        "removed_missing_videos": 0,
        "removed_clips_from_missing_videos": 0,
        "removed_missing_clips": 0,
    }
