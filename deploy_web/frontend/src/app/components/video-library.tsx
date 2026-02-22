import { useEffect, useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { fetchVideos, getVideoStreamUrl, type VideoItem } from "../data/api";
import { Video } from "lucide-react";
import { useSearchParams } from "react-router";

export function VideoLibrary() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const rows = await fetchVideos();
        if (!alive) return;
        setVideos(rows);
      } catch (error) {
        if (!alive) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load videos");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const videoId = searchParams.get("videoId");
    if (!videoId || videos.length === 0) return;
    const match = videos.find((video) => video.id === videoId);
    if (match) {
      setSelectedVideo(match);
    }
  }, [videos, searchParams]);

  const filtered = useMemo(() => {
    if (!query.trim()) return videos;
    const q = query.toLowerCase();
    return videos.filter(
      (video) =>
        video.title.toLowerCase().includes(q) ||
        video.summary.toLowerCase().includes(q) ||
        video.mainTags.some((t) => t.toLowerCase().includes(q)) ||
        video.subTags.some((t) => t.toLowerCase().includes(q))
    );
  }, [videos, query]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-4rem)]">
      <div className={`flex-1 border-r border-border ${selectedVideo ? "hidden xl:block" : ""}`}>
        <div className="p-4 lg:p-6 border-b border-border space-y-3">
          <h2 className="text-lg text-foreground">Video Library</h2>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search videos..."
            className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="overflow-y-auto p-4 lg:p-6 space-y-3">
          {errorMessage ? <p className="text-sm text-muted-foreground">{errorMessage}</p> : null}
          {loading ? <p className="text-sm text-muted-foreground">Loading videos...</p> : null}
          {!loading && filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No videos found.</p>
          ) : null}
          {filtered.map((video) => (
            <Card
              key={video.id}
              className={`cursor-pointer transition-all ${
                selectedVideo?.id === video.id ? "ring-2 ring-[var(--electric-blue)]" : ""
              }`}
              onClick={() => {
                setSelectedVideo(video);
                setSearchParams({ videoId: video.id });
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-foreground">{video.title}</h3>
                  <Badge variant="outline">{video.clipCount} clips</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{video.summary}</p>
                <div className="flex flex-wrap gap-1.5">
                  {video.mainTags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedVideo ? (
        <div className="w-full xl:w-[520px] bg-card overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg text-foreground">Video Details</h2>
            <Button
              variant="ghost"
              className="xl:hidden"
              onClick={() => {
                setSelectedVideo(null);
                setSearchParams({});
              }}
            >
              Back
            </Button>
          </div>
          <div className="p-6 space-y-5">
            <div className="aspect-video rounded-lg bg-muted overflow-hidden">
              <video
                className="w-full h-full object-cover"
                src={getVideoStreamUrl(selectedVideo.id)}
                controls
                preload="metadata"
              />
            </div>
            <h3 className="text-xl text-foreground">{selectedVideo.title}</h3>
            <p className="text-sm text-muted-foreground">{selectedVideo.summary}</p>
            <div className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground">Main Tags</p>
              <div className="flex flex-wrap gap-2">
                {selectedVideo.mainTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase text-muted-foreground">Sub Tags</p>
              <div className="flex flex-wrap gap-2">
                {selectedVideo.subTags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Video className="w-4 h-4" />
              {selectedVideo.clipCount} clips from this video
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
