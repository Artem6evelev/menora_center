import { miniAppErrorResponse, miniAppResponse } from "@/lib/telegram/miniapp-http";
import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import { miniAppKids } from "@/lib/telegram/miniapp-kids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return await withMiniAppSession(async (tx, user) => miniAppResponse({ ok: true, ...await miniAppKids(tx, user) })); }
  catch (error) { return miniAppErrorResponse(error); }
}
