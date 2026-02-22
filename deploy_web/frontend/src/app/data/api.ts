export interface Clip {
  id: string;
  videoId: string;
  title: string;
  type: "Concept" | "Technique";
  duration: number;
  tags: string[];
  mainTags: string[];
  videoTags: string[];
  subTags: string[];
  position?: string | null;
  sourceCourse: string;
  sourceVideo?: string;
  timestampStart: string;
  timestampEnd: string;
  summary: string;
  isFavorite?: boolean;
  createdAt: string;
  filePath: string;
  thumbnailUrl?: string | null;
}

export interface LibraryMeta {
  mainTagOptions: string[];
  videoTagOptions: string[];
  subTagOptions: string[];
  positionOptions: string[];
}

export interface VideoItem {
  id: string;
  title: string;
  summary: string;
  filePath: string;
  clipCount: number;
  mainTags: string[];
  subTags: string[];
  createdAt: string;
}

export interface ClipsPage {
  clips: Clip[];
  limit: number;
  offset: number;
  nextOffset: number;
  hasMore: boolean;
}

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export async function fetchLibraryMeta(): Promise<LibraryMeta> {
  const response = await fetch(`${API_BASE}/api/library/meta`);
  if (!response.ok) {
    throw new Error("Failed to load library metadata");
  }
  return response.json();
}

export async function fetchLibraryClips(
  limit = 36,
  offset = 0
): Promise<ClipsPage> {
  const response = await fetch(
    `${API_BASE}/api/library/clips?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error("Failed to load clips");
  }
  return response.json() as Promise<ClipsPage>;
}

export async function fetchFavoriteClips(
  limit = 36,
  offset = 0
): Promise<ClipsPage> {
  const response = await fetch(
    `${API_BASE}/api/library/favorites?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error("Failed to load favorite clips");
  }
  return response.json() as Promise<ClipsPage>;
}

export async function setClipFavorite(clipId: string, value: boolean): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/clips/${clipId}/favorite?value=${String(value)}`,
    { method: "POST" }
  );
  if (!response.ok) {
    throw new Error("Failed to update favorite");
  }
}

export async function fetchVideos(): Promise<VideoItem[]> {
  const response = await fetch(`${API_BASE}/api/library/videos`);
  if (!response.ok) {
    throw new Error("Failed to load videos");
  }
  const data = await response.json();
  return data.videos as VideoItem[];
}

export function getClipStreamUrl(clipId: string): string {
  return `${API_BASE}/api/clips/${clipId}/stream`;
}

export function getVideoStreamUrl(videoId: string): string {
  return `${API_BASE}/api/videos/${videoId}/stream`;
}
