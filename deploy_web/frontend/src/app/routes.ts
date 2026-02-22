import { createBrowserRouter } from "react-router";
import { Root } from "./components/root";
import { ClipVideo } from "./components/clip-video";
import { FavoriteClips, Library } from "./components/library";
import { VideoLibrary } from "./components/video-library";
import { NotFound } from "./components/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: ClipVideo },
      { path: "library", Component: Library },
      { path: "favorites", Component: FavoriteClips },
      { path: "videos", Component: VideoLibrary },
      { path: "*", Component: NotFound },
    ],
  },
]);
