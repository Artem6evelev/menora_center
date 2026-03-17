import { create } from "zustand";

interface ChatMessage {
  id: string;
  senderId: string;
  userId: string;
  message: string;
  createdAt: Date;
}

interface ChatUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  unreadCount?: number; // <-- НОВОЕ ПОЛЕ
}

interface ChatStore {
  chats: ChatUser[];
  setChats: (chats: ChatUser[]) => void;

  activeChatId: string | null;
  setActiveChat: (id: string | null) => void;

  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;

  isLoading: boolean;
  setIsLoading: (val: boolean) => void;

  // <-- НОВАЯ ФУНКЦИЯ ДЛЯ СБРОСА СЧЕТЧИКА
  markAsReadInStore: (userId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  setChats: (chats) => set({ chats }),

  activeChatId: null,
  setActiveChat: (id) => set({ activeChatId: id, messages: [] }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // Мгновенно убираем красный кружок в интерфейсе
  markAsReadInStore: (userId) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === userId ? { ...chat, unreadCount: 0 } : chat,
      ),
    })),
}));
