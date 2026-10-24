"use server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/community/server";
import { communityErrorMessage } from "@/lib/community/errors";
import { eventPaymentOpenInput } from "@/lib/community/event-payment-open";
import { prepareEventPaymentReminder, sendEventPaymentReminder } from "@/lib/community/event-payment-reminder";
export async function getEventPaymentReminderOptions(registrationId: unknown) {
  try {
    const input = eventPaymentOpenInput.parse({ registrationId });
    const result = await db.transaction(async tx => {
      await requireStaff(tx);
      const prepared = await prepareEventPaymentReminder(tx, input.registrationId);
      return { telegramAvailable: prepared.telegramAvailable, whatsappUrl: prepared.whatsappUrl };
    });
    return { success: true as const, ...result };
  } catch (error) { return { success: false as const, error: communityErrorMessage(error, "Не удалось подготовить напоминание") }; }
}
export async function remindEventPaymentByTelegram(registrationId: unknown) {
  try {
    const input = eventPaymentOpenInput.parse({ registrationId });
    return await db.transaction(async tx => {
      await requireStaff(tx);
      return sendEventPaymentReminder(tx, input.registrationId);
    });
  } catch (error) { return { success: false as const, error: communityErrorMessage(error, "Не удалось отправить напоминание") }; }
}
