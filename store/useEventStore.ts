import { create } from "zustand";

export type CategoryType = {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
};

export type EventType = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  date: Date | null;
  location: string | null;
  isPaid: boolean;
  price: string | null;
  status: string;
  categoryId: string | null;
  createdAt: Date;
};

export type EventItem = {
  event: EventType;
  category: CategoryType | null;
};

interface EventStore {
  events: EventItem[];
  categories: CategoryType[];
  setEvents: (events: EventItem[]) => void;
  setCategories: (categories: CategoryType[]) => void;
  addEvent: (event: EventItem) => void;
  deleteEvent: (id: string) => void;
  updateEvent: (id: string, updatedEvent: EventItem) => void;
  addCategory: (category: CategoryType) => void;
  deleteCategory: (id: string) => void; // <--- ДОБАВИЛИ ЭТО
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  categories: [],

  setEvents: (events) => set({ events }),
  setCategories: (categories) => set({ categories }),

  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),

  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((item) => item.event.id !== id),
    })),

  updateEvent: (id, updatedEvent) =>
    set((state) => ({
      events: state.events.map((item) =>
        item.event.id === id ? updatedEvent : item,
      ),
    })),

  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  // <--- НОВАЯ ФУНКЦИЯ: Удаляем категорию из списка и обнуляем её у событий в памяти
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      events: state.events.map((item) =>
        item.event.categoryId === id
          ? {
              ...item,
              event: { ...item.event, categoryId: null },
              category: null,
            }
          : item,
      ),
    })),
}));
