"use server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/community/server";
import { communityErrorMessage } from "@/lib/community/errors";
import { readAudience } from "@/lib/telegram/audience";
import {
  broadcastRecipients,
  enqueueBroadcast,
  drainBroadcasts,
  broadcastHistory,
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
