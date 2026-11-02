import { db } from "@/lib/db";
import { z } from "zod";
import { unsubscribeEventInterest } from "@/lib/events/interests";
import { interestError, interestJson, interestResponse } from "@/lib/events/http";
export async function POST(request: Request) {
  try {
    const body = z.object({ token: z.string().max(64) }).strict().parse(await interestJson(request));
    return interestResponse(await db.transaction(tx => unsubscribeEventInterest(tx, body.token)));
  } catch (error) { return interestError(error); }
}
