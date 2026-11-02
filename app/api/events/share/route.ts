import { db } from "@/lib/db";
import { canonicalTelegramEventShareLink } from "@/lib/telegram/event-share-server";
import { eventIntakeInput, EventInterestError, limitInterestRequests } from "@/lib/events/interests";
import { interestError, interestJson, interestNetwork, interestResponse } from "@/lib/events/http";
export async function POST(request: Request) {
  try {
    const body = eventIntakeInput.pick({ eventId: true }).parse(await interestJson(request));
    const shareUrl = await db.transaction(async tx => {
      await limitInterestRequests(tx, "share:" + interestNetwork(request));
      return canonicalTelegramEventShareLink(tx, body.eventId);
    });
    if (!shareUrl) throw new EventInterestError(404, "event_unavailable");
    return interestResponse({ shareUrl });
  } catch (error) { return interestError(error); }
}
