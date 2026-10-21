'use server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { eq, and, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, communityRegistrationDrafts as drafts } from '@/lib/db/schema';
import { communityAccess, eventReturnTo, FILTER_VERSION, validAttemptId } from '@/lib/community/policy';
import { draftProgressInput } from '@/lib/community/draft-progress';
import { draftCookieName, hashDraftToken, registrationAttemptToken, readRegistrationDraft } from '@/lib/community/drafts';
import { CommunityError, communityErrorMessage } from '@/lib/community/errors';
import { profileChildren } from '@/lib/community/children';
export async function saveRegistrationProgress(raw: unknown, id: string, returnTo?: string) {
  try {
    if (!validAttemptId(id)) throw new CommunityError('Обновите страницу анкеты');
    const form = draftProgressInput.parse(raw);
    if (JSON.stringify(form).length > 25000) throw new CommunityError('Анкета слишком велика');
    if (form.childrenData?.some(child => !child.id && !child.gender)) throw new CommunityError("Укажите пол ребёнка");
    const { userId } = await auth();
    const [profile] = userId ? await db.select().from(users).where(eq(users.id, userId)) : [];
    if (profile?.identityDisabledAt) throw new CommunityError('Идентификация аккаунта отключена');
    if (form.childrenData?.length && !communityAccess({ ...form, giyurStage: profile?.giyurStage, isProfileComplete: true, filterVersion: FILTER_VERSION, filterCompletedAt: new Date() }).canManageChildren) throw new CommunityError('Добавление детей недоступно для выбранной категории');
    // Existing child IDs are accepted only from this authenticated parent's current list.
    if (form.childrenData?.some(child => child.id && !profileChildren(userId || '', profile?.childrenData).some(item => item.id === child.id))) throw new CommunityError('Ребёнок не связан с Вашим профилем');
    const tokenHash = await registrationAttemptToken(id);
    const token = randomBytes(32).toString('base64url');
    await db.transaction(async tx => {
      const [previous] = await tx.select().from(drafts).where(eq(drafts.id, id)).for('update');
      if (previous) {
        if (previous.tokenHash !== tokenHash || previous.consumedAt || previous.expiresAt <= new Date() || (previous.ownerId && previous.ownerId !== userId) || ((previous.payload as any)?.identityId && (previous.payload as any).identityId !== userId)) throw new CommunityError('Черновик недоступен. Откройте новую анкету');
        const target = (previous.payload as any)?.returnTo || eventReturnTo(returnTo);
        await tx.update(drafts).set({ payload: { form, returnTo: target, ready: false, identityId: (previous.payload as any)?.identityId || userId } }).where(eq(drafts.id, id));
      } else {
        await tx.delete(drafts).where(lt(drafts.expiresAt, new Date()));
        const inserted = await tx.insert(drafts).values({ id, tokenHash: hashDraftToken(token), ownerId: profile ? userId : null, payload: { form, returnTo: eventReturnTo(returnTo), ready: false, identityId: userId }, filterVersion: FILTER_VERSION, expiresAt: new Date(Date.now() + 30 * 60_000) }).onConflictDoNothing().returning({ id: drafts.id });
        if (!inserted.length) throw new CommunityError('Дождитесь сохранения черновика');
      }
    });
    if (!tokenHash) (await cookies()).set(draftCookieName(id), token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 1800 });
    return { success: true as const, draftId: id };
  } catch (error) { return { success: false as const, message: communityErrorMessage(error, 'Не удалось сохранить черновик') }; }
}
export async function ensureRegistrationAttempt(id: string, returnTo?: string) {
  const hash = await registrationAttemptToken(id);
  if (hash) {
    const { userId } = await auth();
    const [draft] = await db.select().from(drafts).where(and(eq(drafts.id, id), eq(drafts.tokenHash, hash)));
    if (draft && !draft.consumedAt && draft.expiresAt > new Date() && (!draft.ownerId || draft.ownerId === userId) && (!(draft.payload as any)?.identityId || (draft.payload as any).identityId === userId)) return { success: true as const, draftId: id };
  }
  return saveRegistrationProgress({}, id, returnTo);
}
export async function canResumeRegistrationAttempt(id: string, returnTo?: string) {
  const { userId } = await auth();
  const draft = await readRegistrationDraft(id, userId);
  return !!draft && !draft.consumedAt && eventReturnTo((draft.payload as any)?.returnTo) === eventReturnTo(returnTo);
}
