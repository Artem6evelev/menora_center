import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { eventParticipants, eventPaymentAttempts, events, users, telegramContacts, userIdentities } from "@/lib/db/schema";
import type { LockedTransaction } from "@/lib/telegram/miniapp-user";
import { TELEGRAM_PROVIDER_INSTANCE } from "@/lib/telegram/miniapp-config";
import { canonicalTelegramEventShareLink } from "@/lib/telegram/event-share-server";
import { telegramApi, TelegramApiError } from "@/lib/telegram/bot-api";
import { CommunityError } from "./errors";
import { paymentReminderText, paymentReminderWhatsApp } from "./payment-intent";

/** Staff action authorizes before entry. Participant/attempt locks keep deleted,
 * paid and cancelled registrations out of reminder delivery. No registration write. */
export async function prepareEventPaymentReminder(tx: LockedTransaction, registrationId: string) {
  const [participant] = await tx.select().from(eventParticipants).where(eq(eventParticipants.id, registrationId)).for("update");
  if (!participant) throw new CommunityError("Запись не найдена");
  const [attempt] = await tx.select().from(eventPaymentAttempts).where(eq(eventPaymentAttempts.registrationId, registrationId)).for("update");
  if (participant.status !== "pending" || !attempt || attempt.status !== "pending" ||
    attempt.userId !== participant.userId || attempt.eventId !== participant.eventId)
    throw new CommunityError("Напоминание доступно только для регистрации, ожидающей оплаты");
  const [user] = await tx.select().from(users).where(eq(users.id, participant.userId));
  const [event] = await tx.select().from(events).where(eq(events.id, participant.eventId));
  if (!user || user.identityDisabledAt || !event || event.isFree) throw new CommunityError("Регистрация недоступна");
  const link = await canonicalTelegramEventShareLink(tx, event.id);
  if (!link) throw new CommunityError("Продолжение регистрации на это событие сейчас недоступно");
  const [contact] = await tx.select({ contact: telegramContacts }).from(telegramContacts)
    .innerJoin(userIdentities, and(eq(userIdentities.userId, telegramContacts.userId),
      eq(userIdentities.providerUserId, telegramContacts.telegramUserId), eq(userIdentities.provider, "telegram"),
      eq(userIdentities.providerInstance, TELEGRAM_PROVIDER_INSTANCE), isNull(userIdentities.disabledAt)))
    .where(and(eq(telegramContacts.userId, user.id), eq(telegramContacts.isPrimary, true))).for("update", { of: telegramContacts });
  const telegram = contact?.contact;
  const telegramAvailable = !!telegram?.telegramChatId && !telegram.blockedAt && telegram.marketingStatus !== "blocked";
  const text = paymentReminderText(user.firstName, event.title);
  // Website-only people resume through their authenticated website account.
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "");
  if (!['https:', 'http:'].includes(appUrl.protocol) || (process.env.NODE_ENV === 'production' && appUrl.protocol !== 'https:'))
    throw new CommunityError("Ссылка на событие недоступна");
  const continuationUrl = telegramAvailable ? link : new URL(`/events/${encodeURIComponent(event.id)}`, appUrl).toString();
  return { telegram, telegramAvailable, text, link,
    whatsappUrl: paymentReminderWhatsApp(participant.phone || user.phone, text, continuationUrl) };
}
export async function sendEventPaymentReminder(tx: LockedTransaction, registrationId: string) {
  const prepared = await prepareEventPaymentReminder(tx, registrationId);
  const contact = prepared.telegram;
  if (!prepared.telegramAvailable || !contact?.telegramChatId) throw new CommunityError("Telegram недоступен: чат не связан или бот заблокирован");
  try {
    await telegramApi("sendMessage", { chat_id: contact.telegramChatId, text: prepared.text,
      reply_markup: { inline_keyboard: [[{ text: "Продолжить регистрацию", url: prepared.link }]] } });
    await tx.update(telegramContacts).set({ lastDeliveryAt: new Date(), lastDeliveryErrorCode: null }).where(eq(telegramContacts.id, contact.id));
    return { success: true as const };
  } catch (error) {
    if (!(error instanceof TelegramApiError)) throw error;
    // Preserve consent exactly, including unsubscribed/unknown. A new transport
    // block is recorded and never cleared by this flow. No automatic send retries.
    await tx.update(telegramContacts).set({ lastDeliveryErrorCode: error.kind,
      ...(error.kind === "blocked" ? { blockedAt: new Date() } : {}) }).where(eq(telegramContacts.id, contact.id));
    return { success: false as const, error: error.kind === "unknown"
      ? "Не удалось подтвердить отправку. Проверьте доставку перед повторной отправкой."
      : error.kind === "blocked" ? "Пользователь заблокировал бота. Напоминание не отправлено."
      : "Не удалось отправить напоминание. Попробуйте позже." };
  }
}
