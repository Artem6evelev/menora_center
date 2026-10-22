"use server";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCommunityUser, requireChildPermission } from "@/lib/community/server";
import { prepareChildren } from "@/lib/community/children";
import { preserveChildHistory } from "@/lib/community/history";
export async function saveOwnChildren(input: unknown, targetId?: string, spouseName?: string | null) {
  try {
    const actor = await requireCommunityUser(targetId);
    const children = await db.transaction(async tx => {
      const [profile] = await tx.select().from(users).where(eq(users.id, actor.id)).for("update");
      requireChildPermission(profile);
      const normalized = prepareChildren(profile.id, input, profile.childrenData);
      await preserveChildHistory(tx, profile.id, profile.childrenData);
      await tx.update(users).set({ childrenData: normalized, hasChildren: normalized.length > 0, filterRevision: profile.filterRevision + 1,
        ...(spouseName !== undefined ? { spouseName: spouseName?.trim().slice(0, 150) || null } : {}) }).where(eq(users.id, profile.id));
      return normalized;
    });
    revalidatePath("/dashboard", "layout"); revalidatePath("/events", "layout");
    return { success: true as const, children };
  } catch (error) { return { success: false as const, error: communityErrorMessage(error, "Не удалось сохранить данные детей") }; }
}
