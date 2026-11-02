import { db } from "@/lib/db";
import { currentCommunityUser } from "@/lib/community/server";
import { eventInterestInput, limitInterestRequests, saveEventInterest } from "@/lib/events/interests";
import { interestError, interestJson, interestNetwork, interestResponse, interestVisitor } from "@/lib/events/http";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = eventInterestInput.parse(await interestJson(request)), user = await currentCommunityUser();
    const visitor = await interestVisitor(true);
    await db.transaction(tx => limitInterestRequests(tx, interestNetwork(request)));
    const result = await db.transaction(tx => saveEventInterest(tx, user, body, "website", visitor.hash));
    return interestResponse(result, visitor.token);
  } catch (error) { return interestError(error); }
}
