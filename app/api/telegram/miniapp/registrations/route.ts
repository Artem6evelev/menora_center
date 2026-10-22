import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import {
  miniAppErrorResponse,
  miniAppResponse,
} from "@/lib/telegram/miniapp-http";
import { miniAppRegistrations } from "@/lib/telegram/miniapp-events";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    return await withMiniAppSession(async (tx, user) =>
      miniAppResponse({
        ok: true,
        ...(await miniAppRegistrations(
          tx,
          user,
          Math.min(
            1000,
            Math.max(
              1,
              Number(new URL(request.url).searchParams.get("page")) || 1,
            ),
          ),
        )),
      }),
    );
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
