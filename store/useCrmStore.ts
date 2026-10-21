import { create } from "zustand";

interface CrmStore {
  selectedUserIds: string[];
  toggleUserSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  activeUserId: string | null;
  openSlider: (id: string) => void;
  closeSlider: () => void;

  isBulkModalOpen: boolean;
  openBulkModal: () => void;
  closeBulkModal: () => void;

  // НОВЫЕ СТЕЙТЫ ДЛЯ ФИЛЬТРОВ
  isFiltersOpen: boolean;
  toggleFilters: () => void;
  activeFilters: {
    affiliation: string;
    filterCompletion: string;
    cityId: string;
    maritalStatus: string;
    hasChildren: string;
  };
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
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

  // ФИЛЬТРЫ
  isFiltersOpen: false,
  toggleFilters: () =>
    set((state) => ({ isFiltersOpen: !state.isFiltersOpen })),
  activeFilters: {
    affiliation: "", filterCompletion: "", cityId: "",
    maritalStatus: "",
    hasChildren: "",
  },
  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    })),
  clearFilters: () =>
    set({
      activeFilters: { affiliation: "", filterCompletion: "", cityId: "", maritalStatus: "", hasChildren: "" },
      isFiltersOpen: false,
    }),
}));
