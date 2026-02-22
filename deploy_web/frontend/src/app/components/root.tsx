import { Outlet } from "react-router";
import { Navigation } from "./navigation";

export function Root() {
  return (
    <div className="dark min-h-screen bg-background">
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
