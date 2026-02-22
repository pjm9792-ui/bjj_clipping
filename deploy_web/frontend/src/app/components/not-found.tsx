import { Link } from "react-router";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl mb-3">404</h1>
      <h2 className="text-xl mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button className="bg-[var(--electric-blue)] text-white hover:bg-[var(--electric-blue)]/90">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
