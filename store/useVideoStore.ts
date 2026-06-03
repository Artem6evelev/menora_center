import { create } from "zustand";

// Тип нашего видео (теперь с id из базы)
export interface VideoLesson {
  id: string;
  title: string;
  link: string;
}

interface VideoStore {
  videos: VideoLesson[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setVideos: (videos: VideoLesson[]) => void;
  getFilteredVideos: () => VideoLesson[];
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  videos: [], // Изначально пусто, заполняется из базы
  searchQuery: "",

  // Экшен для обновления поиска
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Экшен для загрузки видео из базы в стор
  setVideos: (videos) => set({ videos }),

  // Селектор-помощник для фильтрации
  getFilteredVideos: () => {
    const { videos, searchQuery } = get();
    if (!searchQuery.trim()) return videos;

    return videos.filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  },
}));
