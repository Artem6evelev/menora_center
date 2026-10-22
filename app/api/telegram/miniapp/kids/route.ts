import { miniAppErrorResponse, miniAppResponse } from "@/lib/telegram/miniapp-http";
import { withMiniAppSessionRead } from "@/lib/telegram/miniapp-session";
import { miniAppKids } from "@/lib/telegram/miniapp-kids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return await withMiniAppSessionRead(async (tx, user) => miniAppResponse({ ok: true, ...await miniAppKids(tx, user) })); }
  catch (error) { return miniAppErrorResponse(error); }
}
