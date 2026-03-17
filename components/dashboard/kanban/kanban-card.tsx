"use client";

import { useTaskStore, TaskType } from "@/store/useTaskStore";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Edit2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KanbanCard({
  task,
  isOverlay,
}: {
  task: TaskType;
  isOverlay?: boolean;
}) {
  const { teamMembers, removeTask, setEditingTask } = useTaskStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, data: { task } });

  const style =
    transform && !isOverlay
      ? {
          transform: CSS.Translate.toString(transform),
          opacity: isDragging ? 0.3 : 1,
        }
      : undefined;

  const assignee = teamMembers.find((m) => m.id === task.assigneeId);

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white dark:bg-neutral-900 p-5 rounded-2xl border transition-all duration-300 outline-none",
        isOverlay
          ? "shadow-2xl shadow-[#FFB800]/20 border-[#FFB800] ring-2 ring-[#FFB800]/50 scale-105 rotate-2 z-50 cursor-grabbing"
          : "shadow-sm border-neutral-200/50 dark:border-neutral-800/50 hover:shadow-xl hover:shadow-[#FFB800]/5 hover:border-[#FFB800]/30",
      )}
    >
      {/* Кнопки управления (Появляются при наведении) */}
      {!isOverlay && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1 z-20">
          <button
            onClick={() => setEditingTask(task)}
            className="p-2 bg-neutral-100 hover:bg-white dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl text-neutral-500 hover:text-blue-500 transition-colors shadow-sm active:scale-95"
            title="Редактировать"
          >
            <Edit2 size={12} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => removeTask(task.id)}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors shadow-sm active:scale-95"
            title="Удалить"
          >
            <Trash2 size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Зона захвата (Drag handle) и контент */}
      <div
        {...(isOverlay ? {} : listeners)}
        {...(isOverlay ? {} : attributes)}
        className={cn(
          "w-full h-full flex flex-col outline-none",
          !isOverlay && "cursor-grab active:cursor-grabbing",
        )}
      >
        <div className="flex items-start gap-2 mb-2 pr-16">
          <GripVertical
            size={14}
            className="text-neutral-300 dark:text-neutral-700 mt-1 shrink-0"
          />
          <h4 className="font-bold text-neutral-900 dark:text-white text-sm leading-snug">
            {task.title}
          </h4>
        </div>

        {task.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4 pl-6">
            {task.description}
          </p>
        )}

        {/* Футер карточки (Исполнитель и ID) */}
        <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center pl-6">
          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">
            #{task.id.slice(0, 6)}
          </span>

          {assignee ? (
            <div
              className="flex items-center gap-2"
              title={`${assignee.firstName} ${assignee.lastName}`}
            >
              <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 hidden sm:block">
                {assignee.firstName}
              </span>
              <img
                src={assignee.imageUrl || "/default-avatar.png"}
                alt="assignee"
                className="w-7 h-7 rounded-full object-cover border-2 border-white dark:border-neutral-900 shadow-sm"
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-900 shadow-sm text-neutral-400 text-[10px] font-black"
              title="Не назначен"
            >
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
