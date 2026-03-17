"use client";

import { useEffect } from "react";
import { useUserStore, UserType } from "@/store/useUserStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TeamTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserType[];
  currentUserId: string;
}) {
  const { users, setUsers, updateRole } = useUserStore();

  // Добавили : any, чтобы убить ошибку TypeScript
  const springTransition: any = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };

  // Загружаем данные в Zustand при первом рендере
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers, setUsers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[32px] shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 relative overflow-hidden"
    >
      {/* Декоративное свечение */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFB800]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50">
            <tr>
              <th className="px-8 py-5 font-black text-xs uppercase tracking-widest text-neutral-400">
                Пользователь
              </th>
              <th className="px-8 py-5 font-black text-xs uppercase tracking-widest text-neutral-400">
                Email
              </th>
              <th className="px-8 py-5 font-black text-xs uppercase tracking-widest text-neutral-400 text-right">
                Роль
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
            <AnimatePresence>
              {users.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, ...springTransition }}
                  className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  {/* ИМЯ И АВАТАР */}
                  <td className="px-8 py-5 flex items-center gap-4">
                    <div className="relative w-12 h-12 shrink-0">
                      <img
                        src={user.imageUrl || "/default-avatar.png"}
                        alt="avatar"
                        className="w-full h-full rounded-full bg-neutral-100 dark:bg-neutral-800 object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm"
                      />
                      {/* Индикатор онлайна */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-white text-base tracking-tight">
                      {user.firstName} {user.lastName}
                    </span>
                  </td>

                  {/* EMAIL */}
                  <td className="px-8 py-5 text-neutral-500 dark:text-neutral-400 font-medium text-sm">
                    {user.email}
                  </td>

                  {/* РОЛЬ */}
                  <td className="px-8 py-5 text-right">
                    {user.id !== currentUserId ? (
                      <select
                        value={user.role || "client"}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className={cn(
                          "appearance-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer outline-none transition-all border shadow-sm active:scale-95",
                          user.role === "superadmin"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
                            : user.role === "admin"
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                              : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700",
                        )}
                        style={{ textAlignLast: "center" }}
                      >
                        <option value="client" className="text-black bg-white">
                          Прихожанин
                        </option>
                        <option value="admin" className="text-black bg-white">
                          Администратор
                        </option>
                        <option
                          value="superadmin"
                          className="text-black bg-white"
                        >
                          Раввин
                        </option>
                      </select>
                    ) : (
                      <div className="inline-flex items-center px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          Это вы
                        </span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
