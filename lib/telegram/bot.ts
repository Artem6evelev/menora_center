import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { telegramContacts, telegramUpdates } from "@/lib/db/schema";
import { withTelegramBotUser } from "./miniapp-user";
import { telegramApi, TelegramApiError } from "./bot-api";
import { telegramLog } from "./safety";
import { botLanguage, botWelcome, botWelcomeCopy } from "./bot-welcome";
import { campaignLaunchEvent } from "./event-launch";
const person = z.object({
  id: z
    .number()
    .int()
    .positive()
    .max(2 ** 52 - 1),
  is_bot: z.literal(false).optional(),
  first_name: z.string().min(1).max(256),
  last_name: z.string().max(256).optional(),
  username: z.string().max(64).optional(),
  language_code: z.string().max(64).optional(),
});
const chat = z.object({
  id: z
    .number()
    .int()
    .positive()
    .max(2 ** 52 - 1),
  type: z.literal("private"),
});
const message = z.object({
  from: person,
  chat,
  text: z.string().max(4096).optional(),
});
const update = z.object({
  update_id: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  message: message.optional(),
  callback_query: z
    .object({
      id: z.string().max(256),
      from: person,
      data: z.string().max(64).optional(),
      message: z.object({ chat }).optional(),
    })
    .optional(),
});
export async function handleTelegramUpdate(raw: unknown) {
  const parsed = update.safeParse(raw);
  if (!parsed.success) return { ignored: true };
  const u = parsed.data,
    m = u.message,
    callback = u.callback_query,
    tg = m?.from ?? callback?.from,
    ch = m?.chat ?? callback?.message?.chat;
  if (!tg || !ch || tg.id !== ch.id) {
    await db
      .insert(telegramUpdates)
      .values({ updateId: String(u.update_id) })
      .onConflictDoNothing();
    return { ignored: true };
  }
  const text = m?.text || "",
    start = /^\/start(?:@[A-Za-z0-9_]+)?(?:\s+([A-Za-z0-9_-]{1,64}))?\s*$/.exec(
      text,
    ),
    startParam = start?.[1] ?? null;
  const command =
    callback?.data || text.split(/\s/)[0].replace(/@[A-Za-z0-9_]+$/, "");
  const action =
    command === "announcements_on" || command === "/subscribe"
      ? "subscribed"
      : command === "announcements_off" || command === "/unsubscribe"
        ? "unsubscribed"
        : null;
  const result = await withTelegramBotUser(
    {
      user: {
        id: String(tg.id),
        firstName: tg.first_name,
        lastName: tg.last_name,
        username: tg.username,
        languageCode: tg.language_code,
      },
      startParam,
    },
    async (tx, { user }) => {
      const inserted = await tx
        .insert(telegramUpdates)
        .values({ updateId: String(u.update_id) })
        .onConflictDoNothing()
        .returning();
      if (!inserted.length) return null;
      const [contact] = await tx
        .select()
        .from(telegramContacts)
        .where(
          and(
            eq(telegramContacts.userId, user.id),
            eq(telegramContacts.telegramUserId, String(tg.id)),
          ),
        )
        .for("update");
      const now = new Date();
      await tx
        .update(telegramContacts)
        .set({
          telegramChatId: String(ch.id),
          updatedAt: now,
          ...(action
            ? {
                marketingStatus: action,
                ...(action === "subscribed"
                  // Explicit /subscribe (or a legacy subscribe callback) may
                  // restore delivery. /start and bootstrap never clear a block.
                  ? { marketingOptInAt: now, blockedAt: null, lastDeliveryErrorCode: null }
                  : { unsubscribedAt: now }),
              }
            : {}),
        })
        .where(eq(telegramContacts.id, contact.id));
      return {
        contactId: contact.id,
        status: action === "subscribed" ? "subscribed" : contact.marketingStatus === "blocked" || contact.blockedAt ? "blocked" : action ?? contact.marketingStatus,
        event: startParam ? await campaignLaunchEvent(tx, startParam) : null,
      };
    },
    String(u.update_id),
    !!start,
  );
  if (!result) return { duplicate: true };
  // A persisted block is never cleared by /start/bootstrap or a welcome retry.
  if (result.status === "blocked") return { processed: true };
  const language = botLanguage(), c = botWelcomeCopy.ru;
  const welcome = botWelcome({ firstName: tg.first_name, language, campaign: startParam, event: result.event, status: result.status });
  const response = action === "subscribed" ? c.subscribed : action === "unsubscribed" ? c.unsubscribed : welcome.caption;
  try {
    if (callback)
      await telegramApi("answerCallbackQuery", {
        callback_query_id: callback.id,
      });
    const message = { chat_id: String(ch.id), parse_mode: "HTML", reply_markup: welcome.keyboard };
    if (start) {
      try {
        await telegramApi("sendPhoto", { ...message, photo: welcome.photo, caption: response });
      } catch (error) {
        // Retry only a definite rejection, never an uncertain delivery (timeout,
        // network, 5xx, 429). The update ledger prevents duplicate webhook sends.
        if (!(error instanceof TelegramApiError) || error.kind !== "permanent") throw error;
        if (welcome.photo !== welcome.brandedPhoto) {
          try { await telegramApi("sendPhoto", { ...message, photo: welcome.brandedPhoto, caption: response }); }
          catch (fallbackError) {
            if (!(fallbackError instanceof TelegramApiError) || fallbackError.kind !== "permanent") throw fallbackError;
            await telegramApi("sendMessage", { ...message, text: response });
          }
        } else await telegramApi("sendMessage", { ...message, text: response });
      }
    } else await telegramApi("sendMessage", { ...message, text: response });
  } catch (error) {
    if (error instanceof TelegramApiError && error.kind === "blocked")
      await db
        .update(telegramContacts)
        .set({
          marketingStatus: "blocked",
          blockedAt: new Date(),
          lastDeliveryErrorCode: "blocked",
        })
        .where(eq(telegramContacts.id, result.contactId));
    telegramLog("webhook_failure", {
      class: error instanceof TelegramApiError ? error.kind : "unknown",
    });
  }
  return { processed: true };
}
