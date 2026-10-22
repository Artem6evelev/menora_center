import { withMiniAppSession, withMiniAppSessionRead } from "@/lib/telegram/miniapp-session";
import {
  miniAppErrorResponse,
  miniAppResponse,
  readMiniAppJson,
  requireMiniAppSameOrigin,
} from "@/lib/telegram/miniapp-http";
import {
  listMiniAppEvents,
  miniAppEventDetail,
  miniAppEventAction,
  campaignEvent, homeMiniAppEvents,
} from "@/lib/telegram/miniapp-events";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url),
      id = url.searchParams.get("id");
    return await withMiniAppSessionRead(async (tx, user) =>
      miniAppResponse({
        ok: true,
        ...(url.searchParams.get("preview") === "home" ? { events: await homeMiniAppEvents(tx, user) } : id
          ? await miniAppEventDetail(tx, user, id)
          : {
              ...(await listMiniAppEvents(
                tx,
                user,
                Math.min(
                  1000,
                  Math.max(1, Number(url.searchParams.get("page")) || 1),
                ),
              )),
              campaignEventId: await campaignEvent(tx, user),
            }),
      }),
    );
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const body = await readMiniAppJson(request);
    return await withMiniAppSession(async (tx, user) =>
      miniAppResponse({
        ok: true,
        ...(await miniAppEventAction(tx, user, body)),
      }),
    );
  } catch (error) {
    return miniAppErrorResponse(error);
  }
}
