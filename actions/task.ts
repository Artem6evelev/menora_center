// actions/task.ts
"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/community/server";
import { z } from "zod";
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
  await requireStaff();
  // Вытаскиваем все задачи (пока без фильтрации по событиям)
  return await db.select().from(tasks);
}

// В начале файла добавь импорт:

export async function createTask(data: CreateTaskInput) {
  const actor = await requireStaff();
  if (data.creatorId !== actor.id) return { success: false, error: "Нельзя подменять автора задачи" };
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
    await requireStaff();
    await db
      .update(tasks)
      .set({ status: z.enum(["backlog", "todo", "in_progress", "done"]).parse(newStatus) })
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
    await requireStaff();
    await db.delete(tasks).where(eq(tasks.id, taskId));
    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении задачи:", error);
    return { success: false, error: "Не удалось удалить задачу" };
  }
}

export async function updateTaskAction(taskId: string, data: any) {
  try {
    await requireStaff();
    const input = z.object({ title: z.string().trim().min(1).max(300).optional(), description: z.string().max(10000).optional(), status: z.enum(["backlog", "todo", "in_progress", "done"]).optional(), assigneeId: z.string().nullable().optional() }).strict().parse(data);
    await db.update(tasks).set(input).where(eq(tasks.id, taskId));
    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error);
    return { success: false, error: "Не удалось обновить задачу" };
  }
}
