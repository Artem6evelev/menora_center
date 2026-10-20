"use server";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";

import { z } from "zod";
import { after } from "next/server";
import { sendCommunityWelcome } from "@/lib/community/welcome";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeCommunityProfile } from "@/lib/community/profile-write";
import { hasFilterProfile } from "@/lib/community/policy";

export async function saveCommunityProfile(targetId: string, raw: unknown) {
  return saveProfile(targetId, raw, false);
}
export async function saveResourceChoice(targetId: string, raw: unknown) {
  return saveProfile(targetId, raw, true);
}
async function saveProfile(targetId: string, raw: unknown, resourceOnly: boolean) {
  try {
    const { userId } = await auth();
    if (!userId || targetId !== userId) return { success: false as const, message: "Войдите в свой аккаунт" };
    const identity = await currentUser();
    if (!identity || identity.id !== userId) throw new CommunityError("Повторите вход в аккаунт");
    const result = await db.transaction(tx => writeCommunityProfile(tx, identity, raw, resourceOnly));
    if (result.welcome) after(() => sendCommunityWelcome(result.email, identity.firstName || ""));
    revalidatePath("/", "layout"); revalidatePath("/dashboard", "layout");
    return { success: true as const, revision: result.revision, access: result.access, redirectTo: result.redirectTo };
  } catch (error) {
    return { success: false as const, message: communityErrorMessage(error, "Не удалось сохранить анкету. Попробуйте ещё раз.") };
  }
}

/** Existing combined answers can clarify one fact without resubmitting a full questionnaire. */
export async function saveGiyurStage(raw: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) throw new CommunityError("Войдите в свой аккаунт");
    const input = z.object({ stage: z.enum(["advanced", "completed"]), expectedRevision: z.number().int().nonnegative() }).strict().parse(raw);
    const revision = await db.transaction(async tx => {
      const [profile] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
      if (!hasFilterProfile(profile) || !profile || profile.affiliation !== "giyur" || profile.gender !== "female") throw new CommunityError("Уточнение доступно для женского профиля с выбранным гиюром");
      if (profile.filterRevision !== input.expectedRevision) throw new CommunityError("Профиль уже изменён. Обновите страницу.");
      const revision = profile.filterRevision + 1;
      await tx.update(users).set({ giyurStage: input.stage, filterRevision: revision }).where(eq(users.id, userId));
      return revision;
    });
    revalidatePath("/", "layout"); revalidatePath("/dashboard", "layout");
    return { success: true as const, revision };
  } catch (error) { return { success: false as const, message: communityErrorMessage(error, "Не удалось сохранить уточнение") }; }
}
