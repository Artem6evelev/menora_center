import { create } from "zustand";

interface NewsCommentsState {
  comments: any[];
  setComments: (comments: any[]) => void;
  addComment: (comment: any) => void;
  removeComment: (id: string) => void;
}

export const useNewsComments = create<NewsCommentsState>((set) => ({
  comments: [],
  setComments: (comments) => set({ comments }),
  // Оптимистичное добавление (появляется сразу, еще до ответа сервера)
  addComment: (comment) =>
    set((state) => ({ comments: [comment, ...state.comments] })),
  // Мгновенное удаление
  removeComment: (id) =>
    set((state) => ({ comments: state.comments.filter((c) => c.id !== id) })),
}));
