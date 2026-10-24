import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { eventParticipants, eventPaymentAttempts } from "@/lib/db/schema";
import type { LockedTransaction, MiniAppUser } from "@/lib/telegram/miniapp-user";
import { CommunityError } from "./errors";

export const eventPaymentOpenInput = z.object({ registrationId: z.string().min(1).max(150) }).strict();
export class EventPaymentOpenError extends CommunityError {
  constructor(public readonly status: 404 | 409, message: string) { super(message); }
}
/** Caller supplies its authenticated canonical user and transaction. Match deletion's
 * participant -> attempt lock order; never return an old client-held handoff. */
export async function openEventPaymentAttempt(tx: LockedTransaction, user: MiniAppUser,
  registrationId: string, source: "telegram" | "website") {
  const missing = () => new EventPaymentOpenError(404, "Регистрация или ссылка на оплату не найдена");
  if (user.identityDisabledAt) throw missing();
  const [participant] = await tx.select().from(eventParticipants)
    .where(and(eq(eventParticipants.id, registrationId), eq(eventParticipants.userId, user.id))).for("update");
  if (!participant) throw missing();
  const [attempt] = await tx.select().from(eventPaymentAttempts)
    .where(eq(eventPaymentAttempts.registrationId, participant.id)).for("update");
  if (!attempt || attempt.userId !== user.id || attempt.eventId !== participant.eventId) throw missing();
  if (participant.status !== "pending" || attempt.status !== "pending")
    throw new EventPaymentOpenError(409, "Оплата этой регистрации сейчас недоступна");
  let url: URL;
  try { url = new URL(attempt.paymentUrl); }
  catch { throw new EventPaymentOpenError(409, "Ссылка на оплату недоступна"); }
  if (url.protocol !== "https:" || url.username || url.password)
    throw new EventPaymentOpenError(409, "Ссылка на оплату недоступна");
  // One DB statement, one wall-clock timestamp, immutable first open and amount.
  await tx.update(eventPaymentAttempts).set({
    openedAt: sql`coalesce(${eventPaymentAttempts.openedAt}, statement_timestamp())`,
    lastOpenedAt: sql`statement_timestamp()`,
    openCount: sql`${eventPaymentAttempts.openCount} + 1`, lastOpenedSource: source,
  }).where(eq(eventPaymentAttempts.id, attempt.id));
  return { paymentUrl: url.toString(), registrationId: participant.id, amountAgorot: attempt.amountAgorot };
}
