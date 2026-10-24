import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { events, eventParticipants, eventPaymentAttempts, users, telegramContacts, userIdentities } from "@/lib/db/schema";
import type { MiniAppTransaction } from "@/lib/telegram/miniapp-user";
import { TELEGRAM_PROVIDER_INSTANCE } from "@/lib/telegram/miniapp-config";
import { primaryContact } from "@/lib/telegram/audience";

/** Actual migration time stored in the new column's catalogue comment. Missing
 * metadata fails neutral, including ORM-only synthetic databases. */
export async function eventPaymentTrackingCutoff(tx: MiniAppTransaction) {
  const [row] = await tx.select({ cutoff: sql<string | null>`col_description('public.event_payment_attempts'::regclass,
    attnum)` }).from(sql`pg_catalog.pg_attribute`).where(sql`attrelid='public.event_payment_attempts'::regclass AND attname='opened_at'`);
  if (!row?.cutoff) return null;
  try {
    const value: unknown = JSON.parse(row.cutoff);
    if (!value || typeof value !== "object" || !("trackingStartedAt" in value) || typeof value.trackingStartedAt !== "string") return null;
    const timestamp = new Date(value.trackingStartedAt);
    return Number.isFinite(timestamp.getTime()) ? timestamp : null;
  } catch { return null; }
}
export async function readEventPaymentParticipants(tx: MiniAppTransaction, eventId: string) {
  const cutoff = await eventPaymentTrackingCutoff(tx);
  const rows = await tx.select({ participant: eventParticipants, user: users,
    paymentAttempt: { status: eventPaymentAttempts.status, amountAgorot: eventPaymentAttempts.amountAgorot,
      createdAt: eventPaymentAttempts.createdAt, openedAt: eventPaymentAttempts.openedAt,
      lastOpenedAt: eventPaymentAttempts.lastOpenedAt, openCount: eventPaymentAttempts.openCount,
      lastOpenedSource: eventPaymentAttempts.lastOpenedSource },
    telegram: { username: telegramContacts.username,
      available: sql<boolean>`${telegramContacts.telegramChatId} IS NOT NULL AND ${telegramContacts.blockedAt} IS NULL AND ${telegramContacts.marketingStatus} <> 'blocked' AND ${userIdentities.id} IS NOT NULL AND ${users.identityDisabledAt} IS NULL` },
  }).from(eventParticipants).leftJoin(users, eq(eventParticipants.userId, users.id))
    .leftJoin(eventPaymentAttempts, and(eq(eventPaymentAttempts.registrationId, eventParticipants.id),
      eq(eventPaymentAttempts.userId, eventParticipants.userId), eq(eventPaymentAttempts.eventId, eventParticipants.eventId)))
    .leftJoin(telegramContacts, primaryContact)
    .leftJoin(userIdentities, and(eq(userIdentities.userId, telegramContacts.userId),
      eq(userIdentities.providerUserId, telegramContacts.telegramUserId), eq(userIdentities.provider, "telegram"),
      eq(userIdentities.providerInstance, TELEGRAM_PROVIDER_INSTANCE), isNull(userIdentities.disabledAt)))
    .where(eq(eventParticipants.eventId, eventId)).orderBy(desc(eventParticipants.createdAt));
  return rows.map(row => ({ ...row,
    paymentAttempt: row.paymentAttempt ? { ...row.paymentAttempt,
      trackingKnown: !!cutoff && row.paymentAttempt.createdAt >= cutoff } : null,
  }));
}
export async function readApplicationEventStats(tx: MiniAppTransaction) {
  return tx.select({ event: events,
    totalParticipants: sql<number>`count(${eventParticipants.id})::integer`,
    pendingParticipants: sql<number>`count(${eventParticipants.id}) filter (where ${eventParticipants.status}='pending')::integer`,
    paymentOpenedParticipants: sql<number>`count(${eventParticipants.id}) filter (where ${eventParticipants.status}='pending' AND ${eventPaymentAttempts.openedAt} IS NOT NULL AND ${eventPaymentAttempts.status}<>'paid')::integer`,
  }).from(events).leftJoin(eventParticipants, eq(eventParticipants.eventId, events.id))
    .leftJoin(eventPaymentAttempts, and(eq(eventPaymentAttempts.registrationId, eventParticipants.id),
      eq(eventPaymentAttempts.userId, eventParticipants.userId), eq(eventPaymentAttempts.eventId, eventParticipants.eventId)))
    .groupBy(events.id).orderBy(desc(events.createdAt));
}
