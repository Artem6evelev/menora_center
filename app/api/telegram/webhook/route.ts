import { secretMatches, telegramLog } from "@/lib/telegram/safety";
import {
  readMiniAppJson,
  miniAppResponse,
  miniAppErrorResponse,
} from "@/lib/telegram/miniapp-http";
import { handleTelegramUpdate } from "@/lib/telegram/bot";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  return miniAppResponse({ ok: true, route: "telegram_webhook" });
}
export async function POST(request: Request) {
  if (
    !secretMatches(
      request.headers.get("x-telegram-bot-api-secret-token"),
      process.env.TELEGRAM_WEBHOOK_SECRET,
    )
  )
    return miniAppResponse({ ok: false, error: "unauthorized" }, 401);
  try {
    await handleTelegramUpdate(await readMiniAppJson(request));
    return miniAppResponse({ ok: true });
  } catch (error) {
    telegramLog("webhook_failure", { class: "processing_failed" });
    return miniAppErrorResponse(error);
  }
}
