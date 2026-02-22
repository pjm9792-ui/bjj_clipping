import { type Clip } from "../../data/api";
import { type ViewMode } from "../library";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Star, Camera } from "lucide-react";
import { motion } from "motion/react";

interface ClipCardProps {
  clip: Clip;
  viewMode: ViewMode;
  isSelected: boolean;
  onClick: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ClipCard({ clip, viewMode, isSelected, onClick }: ClipCardProps) {
  if (viewMode === "list") {
    return (
      <motion.div layout>
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
            isSelected ? "ring-2 ring-[var(--electric-blue)] shadow-lg" : ""
          }`}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Thumbnail */}
              <div className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {clip.thumbnailUrl ? (
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="line-clamp-1">{clip.title}</h3>
                  {clip.isFavorite && (
                    <Star className="w-4 h-4 text-[var(--electric-blue)] fill-[var(--electric-blue)] flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
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
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(clip.duration)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2 overflow-hidden">
                  {clip.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs max-w-full truncate"
                      title={tag}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {clip.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{clip.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {clip.sourceVideo && clip.sourceVideo !== clip.sourceCourse
                    ? `${clip.sourceCourse} • ${clip.sourceVideo}`
                    : clip.sourceCourse}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div layout>
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
          isSelected ? "ring-2 ring-[var(--electric-blue)] shadow-lg" : ""
        }`}
        onClick={onClick}
      >
        <CardContent className="p-0">
          {/* Thumbnail */}
          <div className="aspect-video rounded-t-lg bg-muted flex items-center justify-center overflow-hidden relative">
            {clip.thumbnailUrl ? (
              <img
                src={clip.thumbnailUrl}
                alt={clip.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Camera className="w-7 h-7" />
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(clip.duration)}
            </div>
            {clip.isFavorite && (
              <div className="absolute top-2 right-2">
                <Star className="w-5 h-5 text-[var(--electric-blue)] fill-[var(--electric-blue)]" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-2">
            <h3 className="line-clamp-2 min-h-[3rem]">{clip.title}</h3>
            <div className="flex items-center gap-2">
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
            </div>
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
              {clip.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs max-w-full truncate"
                  title={tag}
                >
                  {tag}
                </Badge>
              ))}
              {clip.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{clip.tags.length - 3}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {clip.sourceCourse}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
