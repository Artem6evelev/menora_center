// store/useRegistrationStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RegistrationStore {
  pendingEventId: string | null;
  pendingPhone: string | null;
  pendingExtraData: string | null;
  setPendingEvent: (
    id: string,
    phone: string,
    extraData?: string | null,
  ) => void;
  clearPendingEvent: () => void;
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      pendingEventId: null,
      pendingPhone: null,
      pendingExtraData: null,
      setPendingEvent: (id, phone, extraData) =>
        set({
          pendingEventId: id,
          pendingPhone: phone,
          pendingExtraData: extraData || null,
        }),
      clearPendingEvent: () =>
        set({
          pendingEventId: null,
          pendingPhone: null,
          pendingExtraData: null,
        }),
    }),
    {
      name: "event-registration-storage",
    },
  ),
);
