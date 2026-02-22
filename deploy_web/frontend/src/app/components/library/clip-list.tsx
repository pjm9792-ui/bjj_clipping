import { useEffect, useRef } from "react";
import { type Clip } from "../../data/api";
import { type ViewMode, type SortMode } from "../library";
import { ClipCard } from "./clip-card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { LayoutGrid, List, Loader2, Scissors } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";

interface ClipListProps {
  title: string;
  clips: Clip[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  selectedClip: Clip | null;
  onSelectClip: (clip: Clip) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  hasMoreFromServer: boolean;
  onLoadMore: () => void;
}

export function ClipList({
  title,
  clips,
  viewMode,
  setViewMode,
  sortMode,
  setSortMode,
  selectedClip,
  onSelectClip,
  hasActiveFilters,
  onClearFilters,
  isLoading,
  isLoadingMore,
  errorMessage,
  hasMoreFromServer,
  onLoadMore,
}: ClipListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMoreFromServer) {
      return;
    }
    const node = loadMoreRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreFromServer, isLoading, isLoadingMore, onLoadMore]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg mb-1 text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {clips.length} {clips.length === 1 ? "clip" : "clips"} loaded
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="shortest">Shortest</SelectItem>
              <SelectItem value="longest">Longest</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-muted">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-7 px-2 ${
                viewMode === "grid"
                  ? "bg-background shadow-sm"
                  : "hover:bg-transparent"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={`h-7 px-2 ${
                viewMode === "list"
                  ? "bg-background shadow-sm"
                  : "hover:bg-transparent"
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Clip Grid/List */}
      <div className="flex-1 overflow-y-auto">
        {errorMessage ? (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <h3 className="text-lg mb-2">Could not load clips</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{errorMessage}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full p-12 text-sm text-muted-foreground">
            Loading clips...
          </div>
        ) : clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg mb-2">
              {hasActiveFilters ? "No clips match your filters" : "No clips yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {hasActiveFilters
                ? "Try adjusting your search or filter criteria."
                : "Start by clipping a video to build your library."}
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="border-[var(--electric-blue)] text-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10"
              >
                Clear Filters
              </Button>
            ) : (
              <Link to="/">
                <Button className="bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90">
                  <Scissors className="w-4 h-4 mr-2" />
                  Clip a Video
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="p-4 lg:p-6">
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
                  : "space-y-3"
              }
            >
              {clips.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  viewMode={viewMode}
                  isSelected={selectedClip?.id === clip.id}
                  onClick={() => onSelectClip(clip)}
                />
              ))}
            </motion.div>
            {hasMoreFromServer && (
              <div className="mt-6 flex items-center justify-center text-sm text-muted-foreground">
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading more clips...
                  </>
                ) : (
                  "Loading more as you scroll..."
                )}
              </div>
            )}
            <div ref={loadMoreRef} className="h-1 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
