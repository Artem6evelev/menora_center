import { create } from "zustand";

interface ServiceStore {
  services: any[];
  categories: any[];
  setServices: (services: any[]) => void;
  setCategories: (categories: any[]) => void;
  addService: (service: any) => void;
  updateService: (id: string, updated: any) => void;
  deleteService: (id: string) => void;
  addCategory: (category: any) => void;
  removeCategory: (id: string) => void; // <--- Добавили
}

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],
  categories: [],
  setServices: (services) => set({ services }),
  setCategories: (categories) => set({ categories }),
  addService: (service) =>
    set((state) => ({ services: [service, ...state.services] })),
  updateService: (id, updated) =>
    set((state) => ({
      services: state.services.map((s) => (s.service.id === id ? updated : s)),
    })),
  deleteService: (id) =>
    set((state) => ({
      services: state.services.filter((s) => s.service.id !== id),
    })),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  // Функция удаления категории из UI:
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      // Также очищаем категорию у услуг в интерфейсе
      services: state.services.map((s) =>
        s.service.categoryId === id
          ? {
              ...s,
              category: null,
              service: { ...s.service, categoryId: null },
            }
          : s,
      ),
    })),
}));
