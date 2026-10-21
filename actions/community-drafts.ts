"use server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { and, eq, gt, lt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { communityRegistrationDrafts as drafts, users } from "@/lib/db/schema";
import { fullProfileInput } from "@/lib/community/validation";
import { FILTER_VERSION, communityAccess, eventReturnTo } from "@/lib/community/policy";
import { draftForm, draftReady } from "@/lib/community/draft-progress";
import { eventDestination } from "@/lib/community/event-return";
import { draftCookieName, hashDraftToken, registrationAttemptToken, validAttemptId } from "@/lib/community/drafts";
import { writeCommunityProfile } from "@/lib/community/profile-write";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sendCommunityWelcome } from "@/lib/community/welcome";

export async function prepareRegistrationDraft(raw: unknown, attemptId: string, returnTo?: string) {
  try {
    if ((await auth()).userId) throw new CommunityError("Вы уже вошли. Обновите страницу перед сохранением.");
    if (!validAttemptId(attemptId)) throw new CommunityError("Повторите отправку анкеты");
    const payload = fullProfileInput.parse(raw);
    if (payload.childrenData?.some(child => child.id || !child.gender)) throw new CommunityError("Для нового ребёнка укажите пол. Существующие дети доступны только после входа в свой профиль");
    if (JSON.stringify(payload).length > 25000) throw new CommunityError("Анкета слишком велика");
    const existingHash = await registrationAttemptToken(attemptId);
    const [existing] = await db.select().from(drafts).where(eq(drafts.id, attemptId));
    if (existing) {
      if (existingHash !== existing.tokenHash || existing.consumedAt || existing.expiresAt <= new Date() || existing.filterVersion !== FILTER_VERSION || existing.ownerId || (existing.payload as any)?.identityId) throw new CommunityError("Создайте новую попытку отправки анкеты");
      // A callback may bind or consume this draft after the read above. Update only
      // the same unclaimed payload, so final preparation cannot remove that binding.
      const updated = await db.update(drafts).set({ payload: { form: payload, returnTo: (existing.payload as any)?.returnTo || eventReturnTo(returnTo ?? payload.returnTo), ready: true } })
        .where(and(eq(drafts.id, attemptId), eq(drafts.tokenHash, existingHash), isNull(drafts.ownerId), isNull(drafts.consumedAt),
          eq(drafts.filterVersion, FILTER_VERSION), gt(drafts.expiresAt, new Date()), eq(drafts.payload, existing.payload)))
        .returning({ id: drafts.id });
      if (!updated.length) throw new CommunityError("Черновик уже изменён. Проверьте анкету и повторите сохранение.");
      return { success: true as const, draftId: existing.id };
    }
    // Expired temporary payloads are not participant/family history.
    await db.delete(drafts).where(lt(drafts.expiresAt, new Date()));
    const token = randomBytes(32).toString("base64url");
    const inserted = await db.insert(drafts).values({ id: attemptId, tokenHash: hashDraftToken(token), payload: { form: payload, returnTo: eventReturnTo(returnTo ?? payload.returnTo), ready: true },
      filterVersion: FILTER_VERSION, expiresAt: new Date(Date.now() + 30 * 60_000) }).onConflictDoNothing().returning({ id: drafts.id });
    if (!inserted.length) throw new CommunityError("Анкета уже отправляется. Дождитесь завершения первой попытки.");
    (await cookies()).set(draftCookieName(attemptId), token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 60 });
    return { success: true as const, draftId: attemptId };
  } catch (error) { return { success: false as const, message: communityErrorMessage(error, "Не удалось сохранить анкету перед входом. Попробуйте снова.") }; }
}

export async function completeRegistrationDraft(id: string, reviewedInput?: unknown) {
  try {
    const { userId } = await auth();
    const identity = await currentUser();
    if (!userId || !identity || identity.id !== userId) throw new CommunityError("Войдите в свой аккаунт");
    const tokenHash = await registrationAttemptToken(id);
    if (!tokenHash) throw new CommunityError("Попытка входа истекла. Проверьте анкету и отправьте её снова.");
    const result = await db.transaction(async tx => {
      const [draft] = await tx.select().from(drafts).where(and(eq(drafts.id, id), eq(drafts.tokenHash, tokenHash))).for("update");
      if (!draft || draft.expiresAt <= new Date() || draft.filterVersion !== FILTER_VERSION || (draft.ownerId && draft.ownerId !== userId) || ((draft.payload as any)?.identityId && (draft.payload as any).identityId !== userId)) throw new CommunityError("Анкета не относится к этой попытке входа");
      if (draft.consumedAt) {
        const [profile] = await tx.select().from(users).where(eq(users.id, userId));
        const access = communityAccess(profile);
        return { revision: profile?.filterRevision || 0, access, welcome: false, email: "",
          redirectTo: access.canViewEvents ? await eventDestination((draft.payload as any)?.returnTo, tx) : "/register?result=resources" };
      }
      const resourceOnly = typeof reviewedInput === "object" && reviewedInput !== null && "affiliation" in reviewedInput && reviewedInput.affiliation === "none";
      if (reviewedInput === undefined && !draftReady(draft.payload)) throw new CommunityError("Проверьте обязательные поля и сохраните анкету");
      const form = reviewedInput === undefined ? draftForm(draft.payload) : reviewedInput;
      const saved = await writeCommunityProfile(tx, identity, { ...(form as object), returnTo: eventReturnTo((draft.payload as any)?.returnTo) }, resourceOnly, reviewedInput === undefined ? draft.createdAt : undefined);
      // Claim, profile/children/history and the server completion stamp commit together.
      await tx.update(drafts).set({ ownerId: userId, consumedAt: new Date(), payload: { returnTo: (draft.payload as any)?.returnTo } }).where(eq(drafts.id, id));
      return saved;
    });
    (await cookies()).set(draftCookieName(id), "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    if (result.welcome) after(() => sendCommunityWelcome(result.email, identity.firstName || ""));
    revalidatePath("/", "layout"); revalidatePath("/dashboard", "layout");
    return { success: true as const, revision: result.revision, access: result.access, redirectTo: result.redirectTo };
  } catch (error) { return { success: false as const, message: communityErrorMessage(error, "Не удалось завершить сохранение анкеты. Попробуйте снова.") }; }
}

export async function discardRegistrationDraft(id: string) {
  const tokenHash = await registrationAttemptToken(id);
  if (!tokenHash) return;
  await db.delete(drafts).where(and(eq(drafts.id, id), eq(drafts.tokenHash, tokenHash), isNull(drafts.ownerId), isNull(drafts.consumedAt)));
  (await cookies()).set(draftCookieName(id), "", { path: "/", maxAge: 0, httpOnly: true });
}
