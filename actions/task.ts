// actions/task.ts
"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification";

// Тип для создания задачи
type CreateTaskInput = {
  title: string;
  description?: string;
  status?: "backlog" | "todo" | "in_progress" | "done";
  assigneeId?: string; // ID админа, которому поручили
  creatorId: string; // ID раввина
};

export async function getAllTasks() {
  // Вытаскиваем все задачи (пока без фильтрации по событиям)
  return await db.select().from(tasks);
}

// В начале файла добавь импорт:

export async function createTask(data: CreateTaskInput) {
  // Внутри функции createTask, ПОСЛЕ вставки задачи в базу (db.insert):
  if (data.assigneeId) {
    await createNotification(
      data.assigneeId,
      "Назначена задача 📋",
      `Вам поручена новая задача: "${data.title}"`,
      "/dashboard/kanban",
    );
  }

  try {
    // Генерируем простой ID (в реальном проекте лучше использовать crypto.randomUUID)
    const newId = `task_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(tasks).values({
      id: newId,
      title: data.title,
      description: data.description || "",
      status: data.status || "backlog",
      assigneeId: data.assigneeId || null,
      creatorId: data.creatorId,
    });

    // Обновляем страницу доски
    revalidatePath("/dashboard/kanban");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при создании задачи:", error);
    return { success: false, error: "Не удалось создать задачу" };
  }
}

// Позже добавим сюда функцию для смены статуса (при перетаскивании)
// Добавь это в конец файла actions/task.ts
export async function updateTaskStatusAction(
  taskId: string,
  newStatus: string,
) {
  try {
    await db
      .update(tasks)
      .set({ status: newStatus })
      .where(eq(tasks.id, taskId));

    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении статуса:", error);
    return { success: false, error: "Не удалось обновить статус" };
  }
}

// Добавь это в конец файла actions/task.ts

export async function deleteTaskAction(taskId: string) {
  try {
    await db.delete(tasks).where(eq(tasks.id, taskId));
    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении задачи:", error);
    return { success: false, error: "Не удалось удалить задачу" };
  }
}

export async function updateTaskAction(taskId: string, data: any) {
  try {
    await db.update(tasks).set(data).where(eq(tasks.id, taskId));
    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error);
    return { success: false, error: "Не удалось обновить задачу" };
  }
}
