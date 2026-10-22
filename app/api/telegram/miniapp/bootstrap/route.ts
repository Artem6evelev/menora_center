import { miniAppCookieName, miniAppCookieOptions } from "@/lib/telegram/miniapp-config";
import { miniAppErrorResponse, miniAppResponse, readMiniAppInitData, requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { validateTelegramMiniAppInitData } from "@/lib/telegram/miniapp-init-data";
import { openMiniAppSession } from "@/lib/telegram/miniapp-session";
import { miniAppProfile } from "@/lib/telegram/miniapp-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const data = validateTelegramMiniAppInitData(await readMiniAppInitData(request));
    const { user, token, ttl } = await openMiniAppSession(data);
    const response = miniAppResponse({ ok: true, profile: miniAppProfile(user) });
    response.cookies.set(miniAppCookieName(), token, miniAppCookieOptions(ttl));
    return response;
  } catch (error) { return miniAppErrorResponse(error); }
}
