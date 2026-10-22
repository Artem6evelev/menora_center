import { secretMatches } from "@/lib/telegram/safety";
import { drainBroadcasts } from "@/lib/telegram/broadcast";
import {
  miniAppResponse,
  miniAppErrorResponse,
} from "@/lib/telegram/miniapp-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    !secretMatches(
      request.headers.get("authorization"),
      `Bearer ${process.env.CRON_SECRET}`,
    )
  )
    return miniAppResponse({ ok: false, error: "unauthorized" }, 401);
  try {
    return miniAppResponse({ ok: true, ...(await drainBroadcasts()) });
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
