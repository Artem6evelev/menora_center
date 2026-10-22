import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  users,
  events,
  telegramContacts,
  telegramBroadcasts as broadcasts,
  telegramBroadcastDeliveries as deliveries,
} from "@/lib/db/schema";
import { hasFilterProfile, isStaff } from "@/lib/community/policy";
import { eventVisible } from "@/lib/community/event-checkout";
import { CommunityError } from "@/lib/community/errors";
import { audienceSelection, audienceWhere, primaryContact } from "./audience";
import type { MiniAppTransaction, MiniAppUser } from "./miniapp-user";
import { telegramApi, TelegramApiError } from "./bot-api";
import { telegramAppUrl, telegramLog } from "./safety";
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((key) => [key, item[key]]),
        )
      : item,
  );
export const broadcastInput = z
  .object({
    requestKey: z.string().uuid(),
    message: z.string().trim().min(1).max(3500),
    selection: audienceSelection,
    eventId: z.string().min(1).max(150).optional(),
    buttonLabel: z.string().trim().min(1).max(60).optional(),
  })
  .strict();
export async function broadcastRecipients(
  tx: MiniAppTransaction,
  raw: unknown,
) {
  const selection = audienceSelection.parse(raw);
  const rows = await tx
    .select({ id: telegramContacts.id })
    .from(users)
    .innerJoin(telegramContacts, primaryContact)
    .where(audienceWhere(selection.filters, selection, true))
    .orderBy(telegramContacts.id)
    .limit(5001);
  if (rows.length > 5000)
    throw new CommunityError(
      "Разделите аудиторию: максимум 5000 получателей на рассылку",
    );
  return rows;
}
export async function enqueueBroadcast(
  tx: MiniAppTransaction,
  actorId: string,
  raw: unknown,
) {
  const body = broadcastInput.parse(raw),
    [actor] = await tx
      .select()
      .from(users)
      .where(eq(users.id, actorId))
      .for("update");
  if (!isStaff(actor) || !hasFilterProfile(actor))
    throw new CommunityError("Недостаточно прав");
  const [existing] = await tx
    .select()
    .from(broadcasts)
    .where(eq(broadcasts.requestKey, body.requestKey));
  if (existing) {
    if (
      existing.createdBy !== actorId ||
      existing.message !== body.message ||
      canonical(existing.audience) !== canonical(body.selection) ||
      existing.eventId !== (body.eventId ?? null) ||
      existing.buttonLabel !== (body.buttonLabel ?? null)
    )
      throw new CommunityError("Неверный ключ операции");
    return { id: existing.id, count: existing.recipientCount, duplicate: true };
  }
  if (body.eventId) {
    const [event] = await tx
      .select()
      .from(events)
      .where(eq(events.id, body.eventId));
    if (!event) throw new CommunityError("Событие не найдено");
  }
  const recipients = await broadcastRecipients(tx, body.selection);
  if (!recipients.length)
    throw new CommunityError("Нет подписанных получателей с доступным чатом");
  const id = randomUUID();
  await tx
    .insert(broadcasts)
    .values({
      id,
      requestKey: body.requestKey,
      createdBy: actorId,
      message: body.message,
      eventId: body.eventId ?? null,
      buttonLabel: body.buttonLabel ?? null,
      audience: body.selection,
      recipientCount: recipients.length,
    });
  for (let i = 0; i < recipients.length; i += 250)
    await tx
      .insert(deliveries)
      .values(
        recipients
          .slice(i, i + 250)
          .map((row) => ({ broadcastId: id, contactId: row.id })),
      );
  return { id, count: recipients.length, duplicate: false };
}
async function claim() {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(72834021)`);
    const now = new Date();
    await tx
      .update(deliveries)
      .set({ status: "unknown", errorClass: "interrupted" })
      .where(
        and(
          eq(deliveries.status, "sending"),
          lte(deliveries.claimedAt, new Date(now.getTime() - 120000)),
        ),
      );
    const [active] = await tx
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(eq(deliveries.status, "sending"))
      .limit(1);
    if (active) return null;
    const [recent] = await tx
      .select({ id: deliveries.id })
      .from(deliveries)
      .where(gt(deliveries.claimedAt, new Date(now.getTime() - 80)))
      .limit(1);
    if (recent) return null;
    const [row] = await tx
      .select()
      .from(deliveries)
      .where(
        and(
          eq(deliveries.status, "queued"),
          lte(deliveries.nextAttemptAt, now),
        ),
      )
      .orderBy(deliveries.nextAttemptAt, deliveries.id)
      .limit(1)
      .for("update");
    if (!row) return null;
    const [contact] = await tx
      .select()
      .from(telegramContacts)
      .where(eq(telegramContacts.id, row.contactId))
      .for("update");
    const [broadcast] = await tx
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, row.broadcastId));
    const [user] = contact
      ? await tx.select().from(users).where(eq(users.id, contact.userId))
      : [];
    let permitted =
      !!contact &&
      !!user &&
      !user.identityDisabledAt &&
      contact.isPrimary &&
      contact.marketingStatus === "subscribed" &&
      !!contact.telegramChatId &&
      !contact.blockedAt &&
      broadcast?.status === "queued";
    let eventId: string | null = null;
    if (permitted && broadcast.eventId) {
      const [event] = await tx
        .select()
        .from(events)
        .where(eq(events.id, broadcast.eventId));
      permitted = !!event && eventVisible(user as MiniAppUser, event);
      eventId = event?.id ?? null;
    }
    if (!permitted) {
      await tx
        .update(deliveries)
        .set({ status: "skipped", errorClass: "not_eligible" })
        .where(eq(deliveries.id, row.id));
      return { skipped: true as const };
    }
    await tx
      .update(deliveries)
      .set({ status: "sending", claimedAt: now, attempts: row.attempts + 1 })
      .where(eq(deliveries.id, row.id));
    return { skipped: false as const, row, contact, broadcast, eventId };
  });
}
/** At most one in-flight message globally. An uncertain send is never automatically retried. */
export async function drainBroadcasts() {
  const counts = { processed: 0, delivered: 0, failed: 0 };
  if (!process.env.TELEGRAM_BOT_TOKEN)
    throw new CommunityError("Telegram не настроен");
  const deadline = Date.now() + 24000;
  for (let i = 0; i < 5 && Date.now() < deadline; i++) {
    const claimed = await claim();
    if (!claimed) break;
    counts.processed++;
    if (claimed.skipped) continue;
    const { row, contact, broadcast, eventId } = claimed;
    try {
      // Recheck unsubscribe/block immediately before outbound HTTP, after durable claim.
      const [fresh] = await db
        .select()
        .from(telegramContacts)
        .where(eq(telegramContacts.id, contact.id));
      if (
        fresh.marketingStatus !== "subscribed" ||
        fresh.blockedAt ||
        fresh.telegramChatId !== contact.telegramChatId
      ) {
        await db
          .update(deliveries)
          .set({ status: "skipped", errorClass: "not_eligible" })
          .where(eq(deliveries.id, row.id));
        continue;
      }
      const url = new URL(telegramAppUrl());
      if (eventId) url.searchParams.set("event", eventId);
      await telegramApi("sendMessage", {
        chat_id: contact.telegramChatId,
        text: broadcast.message,
        ...(eventId
          ? {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: broadcast.buttonLabel || "Открыть мероприятие",
                      web_app: { url: url.toString() },
                    },
                  ],
                ],
              },
            }
          : {}),
      });
      await db.transaction(async (tx) => {
        await tx
          .update(deliveries)
          .set({
            status: "delivered",
            deliveredAt: new Date(),
            errorClass: null,
          })
          .where(eq(deliveries.id, row.id));
        await tx
          .update(telegramContacts)
          .set({ lastDeliveryAt: new Date(), lastDeliveryErrorCode: null })
          .where(eq(telegramContacts.id, contact.id));
      });
      counts.delivered++;
    } catch (error) {
      const failure =
          error instanceof TelegramApiError
            ? error
            : new TelegramApiError("unknown"),
        attempt = row.attempts + 1;
      const retry =
        ["rate_limit", "temporary"].includes(failure.kind) && attempt < 5;
      const wait =
        failure.kind === "rate_limit"
          ? failure.retryAfter
          : Math.min(3600, 30 * 2 ** attempt);
      await db.transaction(async (tx) => {
        await tx
          .update(deliveries)
          .set({
            status: retry
              ? "queued"
              : failure.kind === "unknown"
                ? "unknown"
                : "failed",
            errorClass: failure.kind,
            nextAttemptAt: new Date(Date.now() + wait * 1000),
          })
          .where(eq(deliveries.id, row.id));
        if (failure.kind === "rate_limit")
          await tx
            .update(deliveries)
            .set({ nextAttemptAt: new Date(Date.now() + wait * 1000) })
            .where(
              and(
                eq(deliveries.status, "queued"),
                lte(
                  deliveries.nextAttemptAt,
                  new Date(Date.now() + wait * 1000),
                ),
              ),
            );
        if (failure.kind === "blocked")
          await tx
            .update(telegramContacts)
            .set({
              marketingStatus: "blocked",
              blockedAt: new Date(),
              lastDeliveryErrorCode: "blocked",
            })
            .where(eq(telegramContacts.id, contact.id));
      });
      counts.failed++;
      if (failure.kind === "rate_limit") break;
    }
    await new Promise((resolve) => setTimeout(resolve, 85));
  }
  await db.execute(
    sql`update telegram_broadcasts b set status='completed' where b.status='queued' and not exists(select 1 from telegram_broadcast_deliveries d where d.broadcast_id=b.id and d.status in ('queued','sending'))`,
  );
  telegramLog("worker", counts);
  return counts;
}
export async function broadcastHistory() {
  return db
    .select({
      id: broadcasts.id,
      status: broadcasts.status,
      count: broadcasts.recipientCount,
      createdAt: broadcasts.createdAt,
      delivered: sql<number>`(select count(*)::integer from telegram_broadcast_deliveries d where d.broadcast_id=${broadcasts.id} and d.status='delivered')`,
      failed: sql<number>`(select count(*)::integer from telegram_broadcast_deliveries d where d.broadcast_id=${broadcasts.id} and d.status in ('failed','unknown'))`,
    })
    .from(broadcasts)
    .orderBy(desc(broadcasts.createdAt))
    .limit(20);
}
