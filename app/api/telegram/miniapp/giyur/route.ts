import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import {
  miniAppErrorResponse,
  miniAppResponse,
  readMiniAppJson,
  requireMiniAppSameOrigin,
} from "@/lib/telegram/miniapp-http";
import { clarifyMiniAppGiyur } from "@/lib/telegram/miniapp-events";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const body = await readMiniAppJson(request);
    return await withMiniAppSession(async (tx, user) => {
      await clarifyMiniAppGiyur(tx, user, body);
      return miniAppResponse({ ok: true });
    });
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
