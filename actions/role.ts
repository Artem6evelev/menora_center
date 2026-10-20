"use server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasFilterProfile } from "@/lib/community/policy";
import { z } from "zod";
export async function updateUserRole(targetUserId: string, newRole: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Не авторизован" };
    const role = z.enum(["client", "author", "admin", "superadmin"]).parse(newRole);
    await db.transaction(async tx => {
      // Serialize superadmin changes so concurrent demotions cannot remove all authority.
      const administrators = await tx.select().from(users).where(eq(users.role, "superadmin")).orderBy(asc(users.id)).for("update");
      const caller = administrators.find(row => row.id === userId);
      if (!caller || !hasFilterProfile(caller)) throw new Error("Только superadmin с актуальным фильтром может назначать роли");
      const [target] = await tx.select().from(users).where(eq(users.id, targetUserId)).for("update");
      if (!target) throw new Error("Пользователь не найден");
      if (target.id === userId && role !== "superadmin") throw new Error("Нельзя понизить собственную роль");
      await tx.update(users).set({ role }).where(eq(users.id, targetUserId));
    });
    revalidatePath("/dashboard/users"); return { success: true };
  } catch { return { error: "Изменение роли не разрешено или данные некорректны" }; }
}
