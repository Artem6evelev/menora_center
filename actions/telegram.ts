"use server";
import { requireStaff } from "@/lib/community/server";
// Retained compatibility entry point; all broadcasts use the consent-filtered queue.
export async function sendBroadcastMessage(_message: string) {
  await requireStaff();
  return {
    success: false,
    message: undefined as string | undefined,
    error: "Используйте выбор аудитории и очередь в разделе Telegram",
  };
}
