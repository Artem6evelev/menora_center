import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ServiceRegistrationStore {
  pendingServiceId: string | null;
  setPendingService: (id: string) => void;
  clearPendingService: () => void;
}

export const useServiceRegistrationStore = create<ServiceRegistrationStore>()(
  persist(
    (set) => ({
      pendingServiceId: null,
      setPendingService: (id) => set({ pendingServiceId: id }),
      clearPendingService: () => set({ pendingServiceId: null }),
    }),
    { name: "service-intent-storage" },
  ),
);
