import { create } from "zustand";

interface EventsDiscoveryState {
  activeCategory: string | null;
  searchQuery: string;
  selectedDate: Date | null;
  priceType: "all" | "free" | "paid";
  womenOnly: boolean;

  setCategory: (id: string | null) => void;
  setSearch: (query: string) => void;
  setDate: (date: Date | null) => void;
  setPriceType: (type: "all" | "free" | "paid") => void;
  setWomenOnly: (val: boolean) => void;
}

export const useEventsDiscovery = create<EventsDiscoveryState>((set) => ({
  activeCategory: null,
  searchQuery: "",
  selectedDate: null,
  priceType: "all",
  womenOnly: false,

  setCategory: (id) => set({ activeCategory: id }),
  setSearch: (query) => set({ searchQuery: query }),
  setDate: (date) => set({ selectedDate: date }),
  setPriceType: (type) => set({ priceType: type }),
  setWomenOnly: (val) => set({ womenOnly: val }),
}));
