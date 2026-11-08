"use server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/community/server";
import { communityErrorMessage } from "@/lib/community/errors";
import { readAudience } from "@/lib/telegram/audience";
import { events } from "@/lib/db/schema";
import { and, asc, ilike, sql } from "drizzle-orm";
import { publicEventCondition } from "@/lib/events/public";
import { telegramAppUrl } from "@/lib/telegram/safety";
import {
  broadcastRecipients,
  enqueueBroadcast,
  drainBroadcasts,
  broadcastHistory,
  validateBroadcastContent,
} from "@/lib/telegram/broadcast";
export async function getTelegramAudience(filters: unknown, page = 1) {
  await requireStaff();
  return db.transaction((tx) =>
    readAudience(
      tx,
      filters,
      Math.min(10000, Math.max(1, Math.trunc(page) || 1)),
    ),
  );
}
export async function previewTelegramBroadcast(selection: unknown) {
  await requireStaff();
  return db.transaction(async (tx) => ({
    count: (await broadcastRecipients(tx, selection)).length,
  }));
}
export async function getTelegramBroadcastEvents(search = "") {
  await requireStaff();
  if (typeof search !== "string" || search.length > 100)
    throw new Error("Уточните название мероприятия");
  const term = search.trim().replace(/[\\%_]/g, "\\$&");
  return db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      time: events.time,
      imageUrl: events.imageUrl,
    })
    .from(events)
    .where(
      and(
        publicEventCondition(),
        term ? ilike(events.title, `%${term}%`) : undefined,
      ),
    )
    .orderBy(
      sql`${events.date} ASC NULLS LAST`,
      asc(events.title),
      asc(events.id),
    )
    .limit(50);
}
export async function prepareTelegramBroadcastPreview(raw: unknown) {
  try {
    await requireStaff();
    return await db.transaction(async (tx) => {
      const { body, event } = await validateBroadcastContent(tx, raw),
        url = new URL(telegramAppUrl());
      if (event) url.searchParams.set("event", event.id);
      return {
        success: true as const,
        ...body,
        count: (await broadcastRecipients(tx, body.selection, event)).length,
        eventTitle: event?.title ?? null,
        buttonUrl: event ? url.toString() : null,
      };
    });
  } catch (error) {
    return {
      success: false as const,
      error: communityErrorMessage(
        error,
        "Не удалось подготовить предпросмотр. Проверьте сообщение и попробуйте ещё раз.",
      ),
    };
  }
}
export async function queueTelegramBroadcast(raw: unknown) {
  try {
    const actor = await requireStaff();
    return {
      success: true as const,
      ...(await db.transaction((tx) => enqueueBroadcast(tx, actor.id, raw))),
    };
  } catch (error) {
    return {
      success: false as const,
      error: communityErrorMessage(
        error,
        "Не удалось поставить рассылку в очередь",
      ),
    };
  }
}
export async function runTelegramQueue() {
  await requireStaff();
  return drainBroadcasts();
}
export async function getTelegramBroadcastHistory() {
  await requireStaff();
  return broadcastHistory();
}
