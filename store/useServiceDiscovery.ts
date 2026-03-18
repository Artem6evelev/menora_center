import { create } from "zustand";

interface ServicesDiscoveryState {
  activeCategory: string | null;
  searchQuery: string;
  priceType: "all" | "free" | "paid";

  setCategory: (id: string | null) => void;
  setSearch: (query: string) => void;
  setPriceType: (type: "all" | "free" | "paid") => void;
  resetFilters: () => void;
}

export const useServicesDiscovery = create<ServicesDiscoveryState>((set) => ({
  activeCategory: null,
  searchQuery: "",
  priceType: "all",

  setCategory: (id) => set({ activeCategory: id }),
  setSearch: (query) => set({ searchQuery: query }),
  setPriceType: (type) => set({ priceType: type }),

  resetFilters: () =>
    set({
      activeCategory: null,
      searchQuery: "",
      priceType: "all",
    }),
}));
