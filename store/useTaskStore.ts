import { create } from "zustand";
import {
  createTask,
  updateTaskStatusAction,
  deleteTaskAction,
  updateTaskAction,
} from "@/actions/task";

export type TaskType = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  creatorId: string | null;
};

export type TeamMemberType = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: string | null;
};

interface TaskStore {
  tasks: TaskType[];
  teamMembers: TeamMemberType[];
  editingTask: TaskType | null; // Стейт для редактируемой задачи

  setTasks: (tasks: TaskType[]) => void;
  setTeamMembers: (members: TeamMemberType[]) => void;
  setEditingTask: (task: TaskType | null) => void;

  addTask: (taskData: Omit<TaskType, "id">) => Promise<void>;
  moveTask: (taskId: string, newStatus: string) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, data: Partial<TaskType>) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  teamMembers: [],
  editingTask: null,

  setTasks: (tasks) => set({ tasks }),
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  setEditingTask: (task) => set({ editingTask: task }),

  addTask: async (taskData) => {
    const tempId = `temp_${Date.now()}`;
    const optimisticTask = { ...taskData, id: tempId } as TaskType;
    set((state) => ({ tasks: [...state.tasks, optimisticTask] }));
    const res = await createTask(taskData as any);
    if (!res.success) {
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== tempId) }));
    }
  },

  moveTask: async (taskId, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    }));
    await updateTaskStatusAction(taskId, newStatus);
  },

  // Мгновенное удаление
  removeTask: async (taskId) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
    await deleteTaskAction(taskId);
  },

  // Мгновенное обновление (редактирование)
  updateTask: async (taskId, data) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...data } : task,
      ),
    }));
    await updateTaskAction(taskId, data);
  },
}));
