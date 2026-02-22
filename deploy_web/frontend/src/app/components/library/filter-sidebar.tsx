import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Search } from "lucide-react";

interface FilterSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTypes: Set<string>;
  setSelectedTypes: (types: Set<string>) => void;
  selectedMainTags: Set<string>;
  setSelectedMainTags: (tags: Set<string>) => void;
  selectedVideoTags: Set<string>;
  setSelectedVideoTags: (tags: Set<string>) => void;
  selectedSubTags: Set<string>;
  setSelectedSubTags: (tags: Set<string>) => void;
  selectedPositions: Set<string>;
  setSelectedPositions: (positions: Set<string>) => void;
  mainTagOptions: string[];
  videoTagOptions: string[];
  subTagOptions: string[];
  positionOptions: string[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  searchQuery,
  setSearchQuery,
  selectedTypes,
  setSelectedTypes,
  selectedMainTags,
  setSelectedMainTags,
  selectedVideoTags,
  setSelectedVideoTags,
  selectedSubTags,
  setSelectedSubTags,
  selectedPositions,
  setSelectedPositions,
  mainTagOptions,
  videoTagOptions,
  subTagOptions,
  positionOptions,
  onClearFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const toggleMainTag = (tag: string) => {
    const newSet = new Set(selectedMainTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setSelectedMainTags(newSet);
  };

  const togglePosition = (position: string) => {
    const newSet = new Set(selectedPositions);
    if (newSet.has(position)) {
      newSet.delete(position);
    } else {
      newSet.add(position);
    }
    setSelectedPositions(newSet);
  };

  const toggleSubTag = (tag: string) => {
    const newSet = new Set(selectedSubTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setSelectedSubTags(newSet);
  };

  const toggleVideoTag = (tag: string) => {
    const newSet = new Set(selectedVideoTags);
    if (newSet.has(tag)) {
      newSet.delete(tag);
    } else {
      newSet.add(tag);
    }
    setSelectedVideoTags(newSet);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-foreground">Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 text-xs text-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 pb-12">
          {/* Type Filter */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground uppercase tracking-wide">Type</Label>
            <div className="flex flex-wrap gap-2">
              {["Concept", "Technique"].map((type) => (
                <Badge
                  key={type}
                  variant={selectedTypes.has(type) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedTypes.has(type)
                      ? "bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90 border-[var(--electric-blue)]"
                      : "hover:border-[var(--electric-blue)]/50"
                  }`}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Main Tags Filter */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground uppercase tracking-wide">Main Tags</Label>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {mainTagOptions.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedMainTags.has(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedMainTags.has(tag)
                      ? "bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90 border-[var(--electric-blue)]"
                      : "hover:border-[var(--electric-blue)]/50"
                  }`}
                  onClick={() => toggleMainTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Video Tag Filter */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground uppercase tracking-wide">Video Tag</Label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {videoTagOptions.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedVideoTags.has(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedVideoTags.has(tag)
                      ? "bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90 border-[var(--electric-blue)]"
                      : "hover:border-[var(--electric-blue)]/50"
                  }`}
                  onClick={() => toggleVideoTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sub Tags Filter */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground uppercase tracking-wide">Sub Tags</Label>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {subTagOptions.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedSubTags.has(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedSubTags.has(tag)
                      ? "bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90 border-[var(--electric-blue)]"
                      : "hover:border-[var(--electric-blue)]/50"
                  }`}
                  onClick={() => toggleSubTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Position Filter */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground uppercase tracking-wide">Position</Label>
            <div className="flex flex-wrap gap-2">
              {positionOptions.map((position) => (
                <Badge
                  key={position}
                  variant={selectedPositions.has(position) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedPositions.has(position)
                      ? "bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90 border-[var(--electric-blue)]"
                      : "hover:border-[var(--electric-blue)]/50"
                  }`}
                  onClick={() => togglePosition(position)}
                >
                  {position}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
