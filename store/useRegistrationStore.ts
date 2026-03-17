// store/useRegistrationStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RegistrationStore {
  pendingEventId: string | null;
  setPendingEvent: (id: string) => void;
  clearPendingEvent: () => void;
}

// persist сохраняет данные в localStorage браузера
export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      pendingEventId: null,
      setPendingEvent: (id) => set({ pendingEventId: id }),
      clearPendingEvent: () => set({ pendingEventId: null }),
    }),
    {
      name: "event-registration-storage", // имя ключа в памяти браузера
    },
  ),
);
