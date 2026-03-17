import { create } from "zustand";
import { getPublicEventsPaginated } from "@/actions/event";

interface PublicEventsStore {
  events: any[];
  page: number;
  hasMore: boolean;
  categoryId: string | null;
  selectedDate: string | null; // <--- Храним выбранную дату ("YYYY-MM-DD")
  isLoading: boolean;

  setInitialData: (events: any[], hasMore: boolean) => void;
  setCategory: (id: string | null) => Promise<void>;
  setDate: (date: string | null) => Promise<void>; // <--- Экшен для даты
  loadMore: () => Promise<void>;
}

export const usePublicEventsStore = create<PublicEventsStore>((set, get) => ({
  events: [],
  page: 1,
  hasMore: false,
  categoryId: null,
  selectedDate: null,
  isLoading: false,

  setInitialData: (events, hasMore) =>
    set({ events, hasMore, page: 1, categoryId: null, selectedDate: null }),

  setCategory: async (id) => {
    const { categoryId, selectedDate } = get();
    if (categoryId === id) return;

    set({ isLoading: true, categoryId: id });
    const { events, hasMore } = await getPublicEventsPaginated(
      1,
      12,
      id,
      selectedDate,
    );
    set({ events, hasMore, page: 1, isLoading: false });
  },

  // НОВОЕ: Обработка смены даты
  setDate: async (date) => {
    const { categoryId, selectedDate } = get();
    if (selectedDate === date) return;

    set({ isLoading: true, selectedDate: date });
    const { events, hasMore } = await getPublicEventsPaginated(
      1,
      12,
      categoryId,
      date,
    );
    set({ events, hasMore, page: 1, isLoading: false });
  },

  loadMore: async () => {
    const { page, categoryId, selectedDate, events, hasMore, isLoading } =
      get();
    if (!hasMore || isLoading) return;

    set({ isLoading: true });
    const nextPage = page + 1;

    // Передаем дату при загрузке следующих страниц
    const data = await getPublicEventsPaginated(
      nextPage,
      12,
      categoryId,
      selectedDate,
    );

    set({
      events: [...events, ...data.events],
      hasMore: data.hasMore,
      page: nextPage,
      isLoading: false,
    });
  },
}));
