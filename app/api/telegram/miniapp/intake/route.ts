import { withMiniAppSessionRead } from "@/lib/telegram/miniapp-session";
import { eventIntake } from "@/lib/events/intake";
import { interestError, interestJson, interestResponse } from "@/lib/events/http";
export async function POST(request: Request) {
  try { const body = await interestJson(request); return await withMiniAppSessionRead(async (tx, user) => interestResponse(await eventIntake(tx, user, body))); }
  catch (error) { return interestError(error); }
}
