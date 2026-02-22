import { Link, useLocation } from "react-router";
import { Scissors, Library, User, Settings, Heart, Clapperboard } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--electric-blue)] flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl tracking-tight text-foreground">BJJ Clipper</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/") && location.pathname === "/"
                  ? "bg-[var(--electric-blue)]/10 text-[var(--electric-blue)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Clip a Video
            </Link>
            <Link
              to="/library"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/library")
                  ? "bg-[var(--electric-blue)]/10 text-[var(--electric-blue)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Library
            </Link>
            <Link
              to="/favorites"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/favorites")
                  ? "bg-[var(--electric-blue)]/10 text-[var(--electric-blue)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Favorite Clips
            </Link>
            <Link
              to="/videos"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive("/videos")
                  ? "bg-[var(--electric-blue)]/10 text-[var(--electric-blue)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Video Library
            </Link>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden border-t border-border bg-background">
        <div className="flex items-center">
          <Link
            to="/"
            className={`flex-1 flex items-center justify-center gap-2 py-3 ${
              isActive("/") && location.pathname === "/"
                ? "text-[var(--electric-blue)] border-t-2 border-[var(--electric-blue)]"
                : "text-muted-foreground"
            }`}
          >
            <Scissors className="w-5 h-5" />
            <span className="text-sm">Clip</span>
          </Link>
          <Link
            to="/library"
            className={`flex-1 flex items-center justify-center gap-2 py-3 ${
              isActive("/library")
                ? "text-[var(--electric-blue)] border-t-2 border-[var(--electric-blue)]"
                : "text-muted-foreground"
            }`}
          >
            <Library className="w-5 h-5" />
            <span className="text-sm">Library</span>
          </Link>
          <Link
            to="/favorites"
            className={`flex-1 flex items-center justify-center gap-2 py-3 ${
              isActive("/favorites")
                ? "text-[var(--electric-blue)] border-t-2 border-[var(--electric-blue)]"
                : "text-muted-foreground"
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm">Favs</span>
          </Link>
          <Link
            to="/videos"
            className={`flex-1 flex items-center justify-center gap-2 py-3 ${
              isActive("/videos")
                ? "text-[var(--electric-blue)] border-t-2 border-[var(--electric-blue)]"
                : "text-muted-foreground"
            }`}
          >
            <Clapperboard className="w-5 h-5" />
            <span className="text-sm">Videos</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
