"use server";

import { db } from "@/lib/db";
import { botSettings } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function updateBotSettings(data: any) {
  try {
    const existing = await db.query.botSettings.findFirst();

    if (existing) {
      await db.update(botSettings).set({
        ...data,
        updatedAt: new Date(),
      });
    } else {
      await db.insert(botSettings).values(data);
    }

    revalidatePath("/dashboard/telegram");
    return { success: true };
  } catch (error) {
    console.error("Ошибка обновления настроек:", error);
    return { success: false, error: "Не удалось сохранить настройки" };
  }
}
