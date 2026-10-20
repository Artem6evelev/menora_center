"use server";
import { db } from "@/lib/db";
import { botSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/community/server";
import { z } from "zod";

const settingsInput = z.object({
  notificationGroupId: z.string().max(30).regex(/^$|^-?\d+$/),
  eventsTopicId: z.string().max(30).regex(/^$|^\d+$/),
  servicesTopicId: z.string().max(30).regex(/^$|^\d+$/),
}).strict();
export async function updateBotSettings(data: unknown) {
  try {
    await requireStaff();
    const input = settingsInput.parse(data);
    await db.transaction(async tx => {
      const existing = await tx.select().from(botSettings).for("update");
      if (existing.length > 1) throw new Error("Ambiguous settings rows require explicit reconciliation");
      if (existing[0]) await tx.update(botSettings).set({ ...input, updatedAt: new Date() }).where(eq(botSettings.id, existing[0].id));
      else await tx.insert(botSettings).values({ id: "main", ...input }).onConflictDoUpdate({ target: botSettings.id, set: { ...input, updatedAt: new Date() } });
    });
    revalidatePath("/dashboard/telegram");
    return { success: true as const };
  } catch { return { success: false as const, error: "Не удалось сохранить настройки: проверьте права, формат ID и единственную запись настроек" }; }
}
