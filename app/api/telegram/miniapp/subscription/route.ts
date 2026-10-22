import { withMiniAppSession, withMiniAppSessionRead } from "@/lib/telegram/miniapp-session";
import { miniAppSubscription } from "@/lib/telegram/subscription";
import {
  miniAppErrorResponse,
  miniAppResponse,
  readMiniAppJson,
  requireMiniAppSameOrigin,
} from "@/lib/telegram/miniapp-http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return await withMiniAppSessionRead(async (tx, user) =>
      miniAppResponse({ ok: true, ...(await miniAppSubscription(tx, user)) }),
    );
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const body = await readMiniAppJson(request);
    return await withMiniAppSession(async (tx, user) =>
      miniAppResponse({
        ok: true,
        ...(await miniAppSubscription(tx, user, body)),
      }),
    );
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
