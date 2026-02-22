import { type Clip, getClipStreamUrl } from "../../data/api";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { X, Star, Clock, Tag, Clapperboard } from "lucide-react";
import { useNavigate } from "react-router";

interface ClipDetailPanelProps {
  clip: Clip;
  onClose: () => void;
  onToggleFavorite: (clip: Clip) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ClipDetailPanel({ clip, onClose, onToggleFavorite }: ClipDetailPanelProps) {
  const clipUrl = getClipStreamUrl(clip.id);
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg">Clip Details</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="xl:hidden h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-12">
          {/* Video Player Area */}
          <div className="aspect-video rounded-lg bg-muted overflow-hidden relative">
            <video
              key={clip.id}
              className="w-full h-full object-cover"
              src={clipUrl}
              controls
              preload="none"
            />
          </div>

          {/* Title and Type */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <h1 className="text-xl flex-1 text-foreground">{clip.title}</h1>
              {clip.isFavorite && (
                <Star className="w-5 h-5 text-[var(--electric-blue)] fill-[var(--electric-blue)] flex-shrink-0 mt-1" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={
                  clip.type === "Concept"
                    ? "border-purple-500 text-purple-500 bg-purple-500/10"
                    : "border-[var(--electric-blue)] text-[var(--electric-blue)] bg-[var(--electric-blue)]/10"
                }
              >
                {clip.type}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {formatDuration(clip.duration)}
              </div>
            </div>
          </div>

          {/* Source Information */}
          <div className="space-y-2">
            <h3 className="text-sm text-muted-foreground uppercase tracking-wide">Source</h3>
            <div className="space-y-1">
              <p className="text-sm text-foreground">{clip.sourceCourse}</p>
              <p className="text-xs text-muted-foreground">
                {clip.timestampStart} — {clip.timestampEnd}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => navigate(`/videos?videoId=${clip.videoId}`)}
              >
                <Clapperboard className="w-4 h-4 mr-2" />
                Open In Video Library
              </Button>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2">
            <h3 className="text-sm text-muted-foreground uppercase tracking-wide">Summary</h3>
            <p className="text-sm leading-relaxed text-foreground">{clip.summary}</p>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm text-muted-foreground uppercase tracking-wide">Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {clip.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            {clip.position && (
              <div className="pt-2">
                <Badge variant="outline" className="border-muted-foreground/30">
                  Position: {clip.position}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onToggleFavorite(clip)}
              className={
                clip.isFavorite
                  ? "w-full border-[var(--electric-blue)] text-[var(--electric-blue)]"
                  : "w-full"
              }
            >
              <Star className={`w-4 h-4 mr-2 ${clip.isFavorite ? "fill-[var(--electric-blue)]" : ""}`} />
              {clip.isFavorite ? "Favorited" : "Mark as Favorite"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
