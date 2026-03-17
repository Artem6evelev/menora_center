"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    title: string,
    description: string,
    assigneeId: string | null,
  ) => void;
}) {
  const teamMembers = useTaskStore((state) => state.teamMembers);
  const editingTask = useTaskStore((state) => state.editingTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const springTransition = {
    duration: 0.4,
    ease: cubicBezier(0.22, 1, 0.36, 1),
  };

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || "");
      setAssigneeId(editingTask.assigneeId || "");
    } else {
      setTitle("");
      setDescription("");
      setAssigneeId("");
    }
  }, [editingTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title, description, assigneeId ? assigneeId : null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springTransition}
            className="bg-white dark:bg-neutral-900 rounded-[40px] p-8 md:p-10 w-full max-w-md shadow-2xl relative z-10 border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden"
          >
            {/* Декоративное свечение */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB800]/10 rounded-full blur-[60px] pointer-events-none" />

            <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-8 tracking-tight relative z-10">
              {editingTask ? "Редактировать" : "Новая задача"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 relative z-10"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-2">
                  Название
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-5 py-4 bg-neutral-100/50 dark:bg-neutral-950/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/30 outline-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                  placeholder="Что нужно сделать?"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-2">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-neutral-100/50 dark:bg-neutral-950/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/30 outline-none min-h-[100px] resize-none transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                  placeholder="Добавьте детали..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2 pl-2">
                  Исполнитель
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-5 py-4 bg-neutral-100/50 dark:bg-neutral-950/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 focus:border-[#FFB800] focus:ring-2 focus:ring-[#FFB800]/30 outline-none transition-all font-medium text-neutral-900 dark:text-white cursor-pointer appearance-none"
                >
                  <option value="" className="text-neutral-400">
                    Без исполнителя
                  </option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-neutral-500 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors active:scale-95"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-black bg-[#FFB800] hover:bg-[#E5A600] shadow-xl shadow-[#FFB800]/20 transition-all active:scale-95"
                >
                  {editingTask ? "Сохранить" : "Создать"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
