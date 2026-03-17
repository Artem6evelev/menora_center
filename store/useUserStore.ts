import { create } from "zustand";
import { updateUserRoleAction } from "@/actions/user";

// Типизируем нашего пользователя (чтобы TypeScript помогал)
export type UserType = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: string | null;
};

interface UserStore {
  users: UserType[];
  setUsers: (users: UserType[]) => void;
  updateRole: (userId: string, newRole: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],

  // Инициализация юзеров при загрузке
  setUsers: (users) => set({ users }),

  // Мгновенное обновление роли (Optimistic UI)
  updateRole: async (userId, newRole) => {
    // 1. Мгновенно меняем UI для скорости
    set((state) => ({
      users: state.users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user,
      ),
    }));

    // 2. В фоне отправляем запрос в базу
    const res = await updateUserRoleAction(userId, newRole);

    // Если база ответила ошибкой, можно добавить логику отката (Rollback),
    // но для начала оставим так
    if (!res.success) {
      console.error("Ошибка сохранения в БД");
    }
  },
}));
