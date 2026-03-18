import { create } from "zustand";

interface NewsAdminState {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const useNewsAdmin = create<NewsAdminState>((set) => ({
  isModalOpen: false,
  setModalOpen: (open) => set({ isModalOpen: open }),
}));
