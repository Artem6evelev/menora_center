import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import { miniAppErrorResponse, miniAppResponse, readMiniAppJson, requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { MiniAppAuthError } from "@/lib/telegram/miniapp-errors";
import { EventPaymentOpenError, eventPaymentOpenInput, openEventPaymentAttempt } from "@/lib/community/event-payment-open";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const body = eventPaymentOpenInput.safeParse(await readMiniAppJson(request));
    if (!body.success) throw new MiniAppAuthError(400, "malformed_request");
    const payment = await withMiniAppSession((tx, user) => openEventPaymentAttempt(tx, user, body.data.registrationId, "telegram"));
    // Return only after the tracking transaction commits.
    return miniAppResponse({ ok: true, ...payment });
  } catch (error) {
    return miniAppErrorResponse(error instanceof EventPaymentOpenError
      ? new MiniAppAuthError(error.status, "payment_unavailable") : error);
  }
}
