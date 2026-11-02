import { withMiniAppSession } from "@/lib/telegram/miniapp-session";
import { eventInterestInput, limitInterestRequests, saveEventInterest } from "@/lib/events/interests";
import { interestError, interestJson, interestNetwork, interestResponse } from "@/lib/events/http";
export async function POST(request: Request) {
  try {
    const body = eventInterestInput.parse(await interestJson(request));
    return await withMiniAppSession(async (tx, user) => {
      await limitInterestRequests(tx, interestNetwork(request));
      return interestResponse(await saveEventInterest(tx, user, body, "telegram", null));
    });
  } catch (error) { return interestError(error); }
}
