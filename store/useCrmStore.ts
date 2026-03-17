import { create } from "zustand";

interface CrmStore {
  // Выделение (чекбоксы)
  selectedUserIds: string[];
  toggleUserSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // Индивидуальная шторка (слайдер)
  activeUserId: string | null;
  openSlider: (id: string) => void;
  closeSlider: () => void;

  // Модалка массовой рассылки
  isBulkModalOpen: boolean;
  openBulkModal: () => void;
  closeBulkModal: () => void;
}

export const useCrmStore = create<CrmStore>((set) => ({
  selectedUserIds: [],
  toggleUserSelection: (id) =>
    set((state) => ({
      selectedUserIds: state.selectedUserIds.includes(id)
        ? state.selectedUserIds.filter((userId) => userId !== id)
        : [...state.selectedUserIds, id],
    })),
  selectAll: (ids) => set({ selectedUserIds: ids }),
  clearSelection: () => set({ selectedUserIds: [] }),

  activeUserId: null,
  openSlider: (id) => set({ activeUserId: id }),
  closeSlider: () => set({ activeUserId: null }),

  isBulkModalOpen: false,
  openBulkModal: () => set({ isBulkModalOpen: true }),
  closeBulkModal: () => set({ isBulkModalOpen: false }),
}));
