// store/useAuthorStore.ts
import { create } from "zustand";

type ContentFilter = "all" | "articles" | "videos";

interface AuthorStore {
  activeFilter: ContentFilter;
  setFilter: (filter: ContentFilter) => void;
  selectedVideo: any | null;
  setSelectedVideo: (video: any | null) => void;
}

export const useAuthorStore = create<AuthorStore>((set) => ({
  activeFilter: "all",
  setFilter: (filter) => set({ activeFilter: filter }),
  selectedVideo: null,
  setSelectedVideo: (video) => set({ selectedVideo: video }),
}));
