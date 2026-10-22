import { miniAppErrorResponse, miniAppResponse } from "@/lib/telegram/miniapp-http";
import { requireMiniAppUser } from "@/lib/telegram/miniapp-session";
import { miniAppProfile } from "@/lib/telegram/miniapp-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return miniAppResponse({ ok: true, profile: miniAppProfile(await requireMiniAppUser()) }); }
  catch (error) { return miniAppErrorResponse(error); }
}
