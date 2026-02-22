import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchFavoriteClips,
  fetchLibraryClips,
  fetchLibraryMeta,
  setClipFavorite,
  type Clip,
} from "../data/api";
import { FilterSidebar } from "./library/filter-sidebar";
import { ClipList } from "./library/clip-list";
import { ClipDetailPanel } from "./library/clip-detail-panel";
import { Sheet, SheetContent } from "./ui/sheet";
import { Button } from "./ui/button";
import { Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ViewMode = "grid" | "list";
export type SortMode = "default" | "shortest" | "longest";

interface ClipLibraryPageProps {
  favoritesOnly?: boolean;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const memoryCache = new Map<string, CachedLibraryState>();

interface CachedLibraryState {
  clips: Clip[];
  hasMoreFromServer: boolean;
  nextOffset: number;
  mainTagOptions: string[];
  videoTagOptions: string[];
  subTagOptions: string[];
  positionOptions: string[];
  cachedAt: number;
}

function cacheKey(favoritesOnly: boolean): string {
  return `clip-library:${favoritesOnly ? "favorites" : "all"}`;
}

function clearLibraryCaches(): void {
  const keys = [cacheKey(false), cacheKey(true)];
  for (const key of keys) {
    memoryCache.delete(key);
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

function readCachedState(favoritesOnly: boolean): CachedLibraryState | null {
  const key = cacheKey(favoritesOnly);
  const now = Date.now();
  const inMemory = memoryCache.get(key);
  if (inMemory && now - inMemory.cachedAt < CACHE_TTL_MS) {
    return inMemory;
  }
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLibraryState;
    if (now - parsed.cachedAt >= CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedState(favoritesOnly: boolean, state: CachedLibraryState): void {
  const key = cacheKey(favoritesOnly);
  memoryCache.set(key, state);
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore storage quota/private mode issues.
  }
}

function ClipLibraryPage({ favoritesOnly = false }: ClipLibraryPageProps) {
  const PAGE_SIZE = 30;
  const [clips, setClips] = useState<Clip[]>([]);
  const [hasMoreFromServer, setHasMoreFromServer] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [mainTagOptions, setMainTagOptions] = useState<string[]>([]);
  const [videoTagOptions, setVideoTagOptions] = useState<string[]>([]);
  const [subTagOptions, setSubTagOptions] = useState<string[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedMainTags, setSelectedMainTags] = useState<Set<string>>(new Set());
  const [selectedVideoTags, setSelectedVideoTags] = useState<Set<string>>(new Set());
  const [selectedSubTags, setSelectedSubTags] = useState<Set<string>>(new Set());
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const persistCache = useCallback(
    (next: {
      clips: Clip[];
      hasMoreFromServer: boolean;
      nextOffset: number;
      mainTagOptions: string[];
      videoTagOptions: string[];
      subTagOptions: string[];
      positionOptions: string[];
    }) => {
      writeCachedState(favoritesOnly, {
        ...next,
        cachedAt: Date.now(),
      });
    },
    [favoritesOnly]
  );

  useEffect(() => {
    let alive = true;
    async function loadMeta() {
      try {
        const meta = await fetchLibraryMeta();
        if (!alive) return;
        setMainTagOptions(meta.mainTagOptions);
        setVideoTagOptions(meta.videoTagOptions);
        setSubTagOptions(meta.subTagOptions);
        setPositionOptions(meta.positionOptions);
      } catch (error) {
        if (!alive) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load library metadata");
      }
    }
    loadMeta();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const cached = readCachedState(favoritesOnly);
    if (cached) {
      setClips(cached.clips);
      setHasMoreFromServer(cached.hasMoreFromServer);
      setNextOffset(cached.nextOffset);
      setMainTagOptions(cached.mainTagOptions);
      setVideoTagOptions(cached.videoTagOptions);
      setSubTagOptions(cached.subTagOptions);
      setPositionOptions(cached.positionOptions);
      setIsLoading(false);
      return;
    }

    let alive = true;
    async function loadFirstPage() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const page = await (favoritesOnly
          ? fetchFavoriteClips(PAGE_SIZE, 0)
          : fetchLibraryClips(PAGE_SIZE, 0));
        if (!alive) return;

        const mainFromClips = Array.from(
          new Set(page.clips.flatMap((clip) => clip.mainTags || []))
        ).sort();
        const videoFromClips = Array.from(
          new Set(page.clips.flatMap((clip) => clip.videoTags || []))
        ).sort();
        const subFromClips = Array.from(
          new Set(page.clips.flatMap((clip) => clip.subTags || []))
        ).sort();

        setMainTagOptions((prev) => Array.from(new Set([...prev, ...mainFromClips])).sort());
        setVideoTagOptions((prev) => Array.from(new Set([...prev, ...videoFromClips])).sort());
        setSubTagOptions((prev) => Array.from(new Set([...prev, ...subFromClips])).sort());
        setClips(page.clips);
        setHasMoreFromServer(page.hasMore);
        setNextOffset(page.nextOffset);
        persistCache({
          clips: page.clips,
          hasMoreFromServer: page.hasMore,
          nextOffset: page.nextOffset,
          mainTagOptions: Array.from(new Set([...mainTagOptions, ...mainFromClips])).sort(),
          videoTagOptions: Array.from(new Set([...videoTagOptions, ...videoFromClips])).sort(),
          subTagOptions: Array.from(new Set([...subTagOptions, ...subFromClips])).sort(),
          positionOptions,
        });
      } catch (error) {
        if (!alive) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load clips");
      } finally {
        if (alive) setIsLoading(false);
      }
    }
    loadFirstPage();
    return () => {
      alive = false;
    };
  }, [favoritesOnly]); // intentionally keyed by page type

  const loadMoreClips = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMoreFromServer) {
      return;
    }
    setIsLoadingMore(true);
    setErrorMessage(null);
    try {
      const page = await (favoritesOnly
        ? fetchFavoriteClips(PAGE_SIZE, nextOffset)
        : fetchLibraryClips(PAGE_SIZE, nextOffset));
      setClips((prev) => [...prev, ...page.clips]);

      const mainFromClips = Array.from(
        new Set(page.clips.flatMap((clip) => clip.mainTags || []))
      ).sort();
      const videoFromClips = Array.from(
        new Set(page.clips.flatMap((clip) => clip.videoTags || []))
      ).sort();
      const subFromClips = Array.from(
        new Set(page.clips.flatMap((clip) => clip.subTags || []))
      ).sort();
      const mergedMain = Array.from(new Set([...mainTagOptions, ...mainFromClips])).sort();
      const mergedVideo = Array.from(new Set([...videoTagOptions, ...videoFromClips])).sort();
      const mergedSub = Array.from(new Set([...subTagOptions, ...subFromClips])).sort();
      const nextClips = [...clips, ...page.clips];

      setMainTagOptions(mergedMain);
      setVideoTagOptions(mergedVideo);
      setSubTagOptions(mergedSub);
      setHasMoreFromServer(page.hasMore);
      setNextOffset(page.nextOffset);
      persistCache({
        clips: nextClips,
        hasMoreFromServer: page.hasMore,
        nextOffset: page.nextOffset,
        mainTagOptions: mergedMain,
        videoTagOptions: mergedVideo,
        subTagOptions: mergedSub,
        positionOptions,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load more clips");
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    clips,
    favoritesOnly,
    hasMoreFromServer,
    isLoading,
    isLoadingMore,
    mainTagOptions,
    nextOffset,
    persistCache,
    positionOptions,
    subTagOptions,
    videoTagOptions,
  ]);

  // Background prefetch: keep loading next pages automatically until fully loaded.
  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMoreFromServer) {
      return;
    }
    const timer = setTimeout(() => {
      void loadMoreClips();
    }, 350);
    return () => clearTimeout(timer);
  }, [hasMoreFromServer, isLoading, isLoadingMore, loadMoreClips]);

  // Filter and sort clips
  const filteredClips = useMemo(() => {
    let result = [...clips];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (clip) =>
          clip.title.toLowerCase().includes(query) ||
          clip.summary.toLowerCase().includes(query) ||
          clip.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (selectedTypes.size > 0) {
      result = result.filter((clip) => selectedTypes.has(clip.type));
    }

    // Main tags filter
    if (selectedMainTags.size > 0) {
      result = result.filter((clip) =>
        clip.mainTags.some((tag) => selectedMainTags.has(tag))
      );
    }

    // Video tags filter
    if (selectedVideoTags.size > 0) {
      result = result.filter((clip) =>
        clip.videoTags.some((tag) => selectedVideoTags.has(tag))
      );
    }

    // Sub tags filter
    if (selectedSubTags.size > 0) {
      result = result.filter((clip) =>
        clip.subTags.some((tag) => selectedSubTags.has(tag))
      );
    }

    // Position filter
    if (selectedPositions.size > 0) {
      result = result.filter((clip) => clip.position && selectedPositions.has(clip.position));
    }

    // Sort
    switch (sortMode) {
      case "shortest":
        result.sort((a, b) => a.duration - b.duration);
        break;
      case "longest":
        result.sort((a, b) => b.duration - a.duration);
        break;
      case "default":
      default:
        break;
    }

    return result;
  }, [
    clips,
    searchQuery,
    selectedTypes,
    selectedMainTags,
    selectedVideoTags,
    selectedSubTags,
    selectedPositions,
    sortMode,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTypes(new Set());
    setSelectedMainTags(new Set());
    setSelectedVideoTags(new Set());
    setSelectedSubTags(new Set());
    setSelectedPositions(new Set());
  };

  const hasActiveFilters =
    searchQuery ||
    selectedTypes.size > 0 ||
    selectedMainTags.size > 0 ||
    selectedVideoTags.size > 0 ||
    selectedSubTags.size > 0 ||
    selectedPositions.size > 0;

  const handleToggleFavorite = async (clip: Clip) => {
    const next = !clip.isFavorite;
    setClips((prev) =>
      prev.map((item) => (item.id === clip.id ? { ...item, isFavorite: next } : item))
    );
    setSelectedClip((prev) => (prev && prev.id === clip.id ? { ...prev, isFavorite: next } : prev));
    try {
      await setClipFavorite(clip.id, next);
      clearLibraryCaches();
      if (favoritesOnly && !next) {
        setSelectedClip(null);
        setClips((prev) => {
          const nextClips = prev.filter((item) => item.id !== clip.id);
          persistCache({
            clips: nextClips,
            hasMoreFromServer,
            nextOffset,
            mainTagOptions,
            videoTagOptions,
            subTagOptions,
            positionOptions,
          });
          return nextClips;
        });
      } else {
        const nextClips = clips.map((item) =>
          item.id === clip.id ? { ...item, isFavorite: next } : item
        );
        persistCache({
          clips: nextClips,
          hasMoreFromServer,
          nextOffset,
          mainTagOptions,
          videoTagOptions,
          subTagOptions,
          positionOptions,
        });
      }
    } catch {
      setClips((prev) =>
        prev.map((item) => (item.id === clip.id ? { ...item, isFavorite: !next } : item))
      );
      setSelectedClip((prev) =>
        prev && prev.id === clip.id ? { ...prev, isFavorite: !next } : prev
      );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-4rem)]">
      {/* Desktop Filter Sidebar */}
      <div className="hidden lg:block w-72 border-r border-border overflow-y-auto shrink-0">
        <FilterSidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          selectedMainTags={selectedMainTags}
          setSelectedMainTags={setSelectedMainTags}
          selectedVideoTags={selectedVideoTags}
          setSelectedVideoTags={setSelectedVideoTags}
          selectedSubTags={selectedSubTags}
          setSelectedSubTags={setSelectedSubTags}
          selectedPositions={selectedPositions}
          setSelectedPositions={setSelectedPositions}
          mainTagOptions={mainTagOptions}
          videoTagOptions={videoTagOptions}
          subTagOptions={subTagOptions}
          positionOptions={positionOptions}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <FilterSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
            selectedMainTags={selectedMainTags}
            setSelectedMainTags={setSelectedMainTags}
            selectedVideoTags={selectedVideoTags}
            setSelectedVideoTags={setSelectedVideoTags}
            selectedSubTags={selectedSubTags}
            setSelectedSubTags={setSelectedSubTags}
            selectedPositions={selectedPositions}
            setSelectedPositions={setSelectedPositions}
            mainTagOptions={mainTagOptions}
            videoTagOptions={videoTagOptions}
            subTagOptions={subTagOptions}
            positionOptions={positionOptions}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </SheetContent>
      </Sheet>

      {/* Clip List */}
      <div className={`flex-1 flex flex-col min-h-0 ${selectedClip ? 'hidden xl:flex' : ''}`}>
        <div className="p-4 lg:hidden border-b border-border">
          <Button
            variant="outline"
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--electric-blue)] text-white text-xs">
                Active
              </span>
            )}
          </Button>
        </div>
        <ClipList
          title={favoritesOnly ? "Favorite Clips" : "Clip Library"}
          clips={filteredClips}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortMode={sortMode}
          setSortMode={setSortMode}
          selectedClip={selectedClip}
          onSelectClip={setSelectedClip}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          errorMessage={errorMessage}
          hasMoreFromServer={hasMoreFromServer}
          onLoadMore={loadMoreClips}
        />
      </div>

      {/* Clip Detail Panel */}
      <AnimatePresence>
        {selectedClip && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`w-full xl:w-[480px] border-l border-border bg-card overflow-y-auto ${
              selectedClip ? 'block' : 'hidden xl:block'
            }`}
          >
            <ClipDetailPanel
              clip={selectedClip}
              onClose={() => setSelectedClip(null)}
              onToggleFavorite={handleToggleFavorite}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Library() {
  return <ClipLibraryPage favoritesOnly={false} />;
}

export function FavoriteClips() {
  return <ClipLibraryPage favoritesOnly />;
}
