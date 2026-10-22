import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import {
  miniAppErrorResponse,
  miniAppResponse,
  readMiniAppJson,
  requireMiniAppSameOrigin,
} from "@/lib/telegram/miniapp-http";
import { miniAppProfileData } from "@/lib/telegram/miniapp-profile";
import { clarifyMiniAppGiyur } from "@/lib/telegram/miniapp-events";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const body = await readMiniAppJson(request);
    return await withMiniAppSession(async (tx, user) => {
      const updated = await clarifyMiniAppGiyur(tx, user, body);
      return miniAppResponse({ ok: true, ...await miniAppProfileData(tx, updated) });
    });
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
