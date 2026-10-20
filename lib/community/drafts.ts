import "server-only";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { communityRegistrationDrafts as drafts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { FILTER_VERSION, validAttemptId } from "./policy";
export { validAttemptId } from "./policy";

export const draftCookieName = (id: string) => `menora_registration_${id.replaceAll("-", "")}`;
export const hashDraftToken = (token: string) => createHash("sha256").update(token).digest("hex");
export async function registrationAttemptToken(id: string) {
  if (!validAttemptId(id)) return null;
  const token = (await cookies()).get(draftCookieName(id))?.value;
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? hashDraftToken(token) : null;
}
export async function readRegistrationDraft(id: string, userId: string) {
  const tokenHash = await registrationAttemptToken(id);
  if (!tokenHash) return null;
  const [draft] = await db.select().from(drafts).where(and(eq(drafts.id, id), eq(drafts.tokenHash, tokenHash)));
  if (!draft || draft.filterVersion !== FILTER_VERSION || draft.expiresAt <= new Date() || (draft.ownerId && draft.ownerId !== userId)) return null;
  return draft;
}
