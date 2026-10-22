import { miniAppCookieName, miniAppCookieOptions } from "@/lib/telegram/miniapp-config";
import { miniAppErrorResponse, miniAppResponse, requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { revokeCurrentMiniAppSession } from "@/lib/telegram/miniapp-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    await revokeCurrentMiniAppSession();
    const response = miniAppResponse({ ok: true });
    response.cookies.set(miniAppCookieName(), "", { ...miniAppCookieOptions(0), expires: new Date(0) });
    return response;
  } catch (error) { return miniAppErrorResponse(error); }
}
