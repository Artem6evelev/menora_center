import { miniAppErrorResponse, miniAppResponse, readMiniAppJson, requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import { applyMiniAppKids, miniAppKids } from "@/lib/telegram/miniapp-kids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const input = await readMiniAppJson(request);
    return await withMiniAppSession(async (tx, user) => {
      const result = await applyMiniAppKids(tx, user, input);
      return miniAppResponse({ ok: true, ...result, ...await miniAppKids(tx, user) });
    });
  } catch (error) { return miniAppErrorResponse(error); }
}
