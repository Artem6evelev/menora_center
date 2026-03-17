"use client";

import { TaskType } from "@/store/useTaskStore";
import KanbanCard from "./kanban-card";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type ColumnProps = {
  id: string;
  title: string;
  colorHint: string;
  tasks: TaskType[];
  userRole: string;
  onOpenModal: () => void;
};

export default function KanbanColumn({
  id,
  title,
  colorHint,
  tasks,
  userRole,
  onOpenModal,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Цветовые схемы для колонок
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    neutral: {
      bg: "bg-neutral-100/50 dark:bg-neutral-800/30",
      text: "text-neutral-500",
      ring: "ring-neutral-400",
    },
    blue: {
      bg: "bg-blue-500/5 dark:bg-blue-500/10",
      text: "text-blue-500",
      ring: "ring-blue-400",
    },
    gold: {
      bg: "bg-[#FFB800]/5 dark:bg-[#FFB800]/10",
      text: "text-[#FFB800]",
      ring: "ring-[#FFB800]",
    },
    emerald: {
      bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
      text: "text-emerald-500",
      ring: "ring-emerald-400",
    },
  };

  const theme = colors[colorHint] || colors.neutral;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-[340px] flex-shrink-0 flex flex-col rounded-[32px] p-5 min-h-[60vh] border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl transition-all duration-300",
        theme.bg,
        isOver ? `ring-2 ${theme.ring} shadow-lg shadow-${theme.text}/10` : "",
      )}
    >
      {/* Шапка колонки */}
      <div className="flex items-center justify-between mb-5 px-2">
        <h3
          className={cn(
            "font-black text-[11px] uppercase tracking-[0.2em]",
            theme.text,
          )}
        >
          {title}
        </h3>
        <span className="flex items-center justify-center min-w-6 h-6 px-2 text-[10px] font-black text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 rounded-full shadow-sm">
          {tasks.length}
        </span>
      </div>

      {/* Список задач */}
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto no-scrollbar pb-4">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[100px] border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl opacity-50">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Перетащите сюда
            </span>
          </div>
        )}
      </div>

      {/* Кнопка "Добавить" (только в Backlog) */}
      {(userRole === "superadmin" || userRole === "admin") &&
        id === "backlog" && (
          <button
            onClick={onOpenModal}
            className="mt-2 w-full py-4 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest text-[10px] hover:border-[#FFB800] hover:text-[#FFB800] hover:bg-[#FFB800]/5 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Plus size={14} strokeWidth={3} /> Создать задачу
          </button>
        )}
    </div>
  );
}
