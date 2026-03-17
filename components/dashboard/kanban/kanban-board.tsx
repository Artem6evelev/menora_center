"use client";

import { useEffect, useState } from "react";
import { useTaskStore, TaskType, TeamMemberType } from "@/store/useTaskStore";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import KanbanColumn from "./kanban-column";
import TaskModal from "./task-modal";
import KanbanCard from "./kanban-card";

const COLUMNS = [
  { id: "backlog", title: "Планы (Backlog)", colorHint: "neutral" },
  { id: "todo", title: "К исполнению", colorHint: "blue" },
  { id: "in_progress", title: "В работе", colorHint: "gold" },
  { id: "done", title: "Готово", colorHint: "emerald" },
];

export default function KanbanBoard({
  initialTasks,
  currentUserId,
  userRole,
  initialTeamMembers,
}: {
  initialTasks: TaskType[];
  currentUserId: string;
  userRole: string;
  initialTeamMembers: TeamMemberType[];
}) {
  const {
    tasks,
    setTasks,
    addTask,
    moveTask,
    setTeamMembers,
    editingTask,
    setEditingTask,
    updateTask,
  } = useTaskStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskType | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
    setTeamMembers(initialTeamMembers);
  }, [initialTasks, initialTeamMembers, setTasks, setTeamMembers]);

  useEffect(() => {
    if (editingTask) setIsModalOpen(true);
  }, [editingTask]);

  const handleCreateOrUpdateTask = async (
    title: string,
    description: string,
    assigneeId: string | null,
  ) => {
    setIsModalOpen(false);

    if (editingTask) {
      await updateTask(editingTask.id, { title, description, assigneeId });
      setEditingTask(null);
    } else {
      await addTask({
        title,
        description,
        status: "backlog",
        assigneeId,
        creatorId: currentUserId,
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingTask(null), 300); // Сбрасываем после окончания анимации
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  // Плавная анимация возврата карточки, если её бросили мимо
  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.4" } },
    }),
  };

  return (
    <div className="relative h-full flex flex-col">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 h-full items-start min-w-max pb-6 overflow-x-auto no-scrollbar">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              colorHint={column.colorHint}
              tasks={tasks.filter((task) => task.status === column.id)}
              userRole={userRole}
              onOpenModal={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>

        {/* Оверлей при перетаскивании (карточка летит за курсором) */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateOrUpdateTask}
      />
    </div>
  );
}
