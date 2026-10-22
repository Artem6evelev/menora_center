import { withMiniAppSessionRead } from "@/lib/telegram/miniapp-session";
import { miniAppErrorResponse, miniAppResponse } from "@/lib/telegram/miniapp-http";
import { miniAppLaunch } from "@/lib/telegram/event-launch";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    return await withMiniAppSessionRead(async (tx, user) => miniAppResponse({ ok: true,
      ...await miniAppLaunch(tx, user, { event: params.get("event"), campaign: params.get("campaign") }) }));
  } catch (error) { return miniAppErrorResponse(error); }
}
