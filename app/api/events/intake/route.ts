import { db } from "@/lib/db";
import { currentCommunityUser } from "@/lib/community/server";
import { eventIntake } from "@/lib/events/intake";
import { interestError, interestJson, interestResponse, interestVisitor } from "@/lib/events/http";
import { linkVisitorInterests } from "@/lib/events/interests";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const body = await interestJson(request), user = await currentCommunityUser();
    const result = await eventIntake(db, user, body);
    if (user) { const visitor = await interestVisitor(); if (visitor.hash) await db.transaction(tx => linkVisitorInterests(tx, visitor.hash, user)); }
    return interestResponse(result);
  } catch (error) { return interestError(error); }
}
