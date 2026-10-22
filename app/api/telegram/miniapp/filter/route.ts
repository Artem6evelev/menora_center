import { miniAppErrorResponse, miniAppResponse, readMiniAppJson, requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import { miniAppProfileData, miniAppProfileTag, saveMiniAppProfile } from "@/lib/telegram/miniapp-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const input = await readMiniAppJson(request);
    return await withMiniAppSession(async (tx, user) => {
      const updated = await saveMiniAppProfile(tx, user, input, request.headers.get("if-match"), true);
      const response = miniAppResponse({ ok: true, ...await miniAppProfileData(tx, updated) });
      response.headers.set("ETag", miniAppProfileTag(updated));
      return response;
    });
  } catch (error) { return miniAppErrorResponse(error); }
}
