"""FastAPI backend for the BJJ clip library UI."""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

import supabase_store as store


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    if raw.strip():
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return ["http://localhost:5173", "http://127.0.0.1:5173"]


def _prepare_db(db_path: str) -> None:
    _ = db_path


def _format_timestamp(seconds: float | None) -> str:
    if seconds is None:
        return "00:00"
    total = max(0, int(round(seconds)))
    mins, secs = divmod(total, 60)
    hours, mins = divmod(mins, 60)
    if hours:
        return f"{hours:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


def _duration_seconds(row: dict[str, Any]) -> int:
    duration = row.get("duration_sec")
    if duration is not None:
        return max(0, int(round(float(duration))))
    start = row.get("start_sec")
    end = row.get("end_sec")
    if start is None or end is None:
        return 0
    return max(0, int(round(float(end) - float(start))))


def _safe_datetime(value: str | None) -> str:
    if not value:
        return datetime.utcnow().isoformat() + "Z"
    return value


def _clip_row_to_ui(clip: dict[str, Any], tags: list[dict[str, Any]]) -> dict[str, Any]:
    main_tags = sorted({t["name"] for t in tags if t["facet"] == "main"})
    video_tags = sorted({t["name"] for t in tags if t["facet"] == "video"})
    sub_tags = sorted({t["name"] for t in tags if t["facet"] == "sub"})
    all_tags = sorted(set(main_tags + video_tags + sub_tags))

    clip_path = Path(str(clip["file_path"]))
    source_video = clip.get("video_title") or "Unknown video"
    title = clip.get("title") or clip_path.stem

    thumbnail_url: str | None = None
    try:
        if str(clip["file_path"]).startswith("supabase://clips/"):
            thumb_uri = store.clip_thumbnail_uri_from_clip_uri(str(clip["file_path"]))
            thumbnail_url = store.create_signed_url(thumb_uri)
    except Exception:
        thumbnail_url = None

    return {
        "id": str(clip["id"]),
        "title": title,
        "type": "Concept" if clip["type"] == "concept" else "Technique",
        "duration": _duration_seconds(clip),
        "tags": all_tags,
        "mainTags": main_tags,
        "videoTags": video_tags,
        "subTags": sub_tags,
        "position": None,
        "sourceCourse": clip.get("video_title") or "Unknown course",
        "sourceVideo": source_video,
        "timestampStart": _format_timestamp(clip.get("start_sec")),
        "timestampEnd": _format_timestamp(clip.get("end_sec")),
        "summary": clip.get("description") or "No summary available.",
        "isFavorite": bool(clip.get("is_favorite", 0)),
        "createdAt": _safe_datetime(clip.get("created_at")),
        "filePath": clip["file_path"],
        "videoId": str(clip["video_id"]),
        "thumbnailUrl": thumbnail_url,
    }


def _video_row_to_ui(video: dict[str, Any], tags: list[dict[str, Any]]) -> dict[str, Any]:
    main_tags = sorted({t["name"] for t in tags if t["facet"] == "main"})
    sub_tags = sorted({t["name"] for t in tags if t["facet"] == "sub"})
    return {
        "id": str(video["id"]),
        "title": video.get("title") or "Untitled video",
        "summary": video.get("description") or "No summary available.",
        "filePath": video["file_path"],
        "clipCount": int(video.get("clip_count", 0)),
        "mainTags": main_tags,
        "subTags": sub_tags,
        "createdAt": _safe_datetime(video.get("created_at")),
    }


app = FastAPI(title="BJJ Clip Library API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/library/meta")
def library_meta(
    db_path: str = Query(default="", description="Unused legacy DB path"),
) -> dict[str, Any]:
    _prepare_db(db_path)
    tags = store.list_tags()
    main_tag_options = sorted([t["name"] for t in tags if t["facet"] == "main"])
    video_tag_options = sorted([t["name"] for t in tags if t["facet"] == "video"])
    sub_tag_options = sorted([t["name"] for t in tags if t["facet"] == "sub"])
    return {
        "mainTagOptions": main_tag_options,
        "videoTagOptions": video_tag_options,
        "subTagOptions": sub_tag_options,
        "positionOptions": [],
    }


@app.get("/api/library/clips")
def library_clips(
    limit: int = Query(default=36, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db_path: str = Query(default="", description="Unused legacy DB path"),
) -> dict[str, Any]:
    _prepare_db(db_path)
    rows, has_more = store.query_clips_paginated(limit=limit, offset=offset, favorites_only=False)
    clip_ids = [int(row["id"]) for row in rows]
    tags_by_clip_id = store.get_tags_for_clips(clip_ids)
    clips: list[dict[str, Any]] = [
        _clip_row_to_ui(row, tags_by_clip_id.get(int(row["id"]), []))
        for row in rows
    ]
    return {
        "clips": clips,
        "limit": limit,
        "offset": offset,
        "nextOffset": offset + len(rows),
        "hasMore": has_more,
    }


@app.get("/api/library/favorites")
def library_favorites(
    limit: int = Query(default=36, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db_path: str = Query(default="", description="Unused legacy DB path"),
) -> dict[str, Any]:
    _prepare_db(db_path)
    rows, has_more = store.query_clips_paginated(limit=limit, offset=offset, favorites_only=True)
    clip_ids = [int(row["id"]) for row in rows]
    tags_by_clip_id = store.get_tags_for_clips(clip_ids)
    clips: list[dict[str, Any]] = [
        _clip_row_to_ui(row, tags_by_clip_id.get(int(row["id"]), []))
        for row in rows
    ]
    return {
        "clips": clips,
        "limit": limit,
        "offset": offset,
        "nextOffset": offset + len(rows),
        "hasMore": has_more,
    }


@app.post("/api/clips/{clip_id}/favorite")
def set_favorite(
    clip_id: int,
    value: bool = Query(..., description="Favorite state"),
    db_path: str = Query(default="", description="Unused legacy DB path"),
) -> dict[str, Any]:
    _prepare_db(db_path)
    store.set_clip_favorite(clip_id=clip_id, is_favorite=value)
    return {"clipId": clip_id, "isFavorite": value}


@app.get("/api/library/videos")
def library_videos(
    db_path: str = Query(default="", description="Unused legacy DB path"),
) -> dict[str, Any]:
    _prepare_db(db_path)
    rows = store.list_videos()
    videos: list[dict[str, Any]] = []
    for row in rows:
        tags = store.get_tags_for_video(int(row["id"]))
        videos.append(_video_row_to_ui(row, tags))
    return {"videos": videos}


@app.get("/api/clips/{clip_id}/stream")
def stream_clip(
    clip_id: int,
    db_path: str = Query(default="", description="Unused legacy DB path"),
) -> RedirectResponse:
    _prepare_db(db_path)
    row = store.get_clip(clip_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Clip not found")
    uri = row["file_path"]
    if not str(uri).startswith("supabase://"):
        raise HTTPException(status_code=404, detail="Clip is not in Supabase storage")
    return RedirectResponse(url=store.create_signed_url(uri))


@app.get("/api/videos/{video_id}/stream")
def stream_video(
    video_id: int,
    db_path: str = Query(default="", description="Unused legacy DB path"),
) -> RedirectResponse:
    _prepare_db(db_path)
    row = store.get_video(video_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Video not found")
    uri = row["file_path"]
    if not str(uri).startswith("supabase://"):
        raise HTTPException(status_code=404, detail="Video is not in Supabase storage")
    return RedirectResponse(url=store.create_signed_url(uri))
