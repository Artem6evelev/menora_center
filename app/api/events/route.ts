import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { publicEventCondition, publicEventFields } from "@/lib/events/public";
import { interestResponse, interestError } from "@/lib/events/http";
import { EventInterestError } from "@/lib/events/interests";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams, id = params.get("id");
    if (id && !/^[A-Za-z0-9_-]{1,150}$/.test(id)) throw new EventInterestError(400, "invalid_request");
    const page = Math.min(1000, Math.max(1, Math.floor(Number(params.get("page")) || 1)));
    const rows = await db.select(publicEventFields).from(events).where(and(publicEventCondition(),
      id ? eq(events.id, id) : undefined, params.get("open") === "1" ? eq(events.admissionPolicy, "open") : undefined))
      .orderBy(desc(events.createdAt), events.id).limit(id ? 1 : 21).offset(id ? 0 : (page - 1) * 20);
    if (id && !rows[0]) throw new EventInterestError(404, "event_unavailable");
    return interestResponse(id ? { event: rows[0] } : { events: rows.slice(0, 20), hasMore: rows.length > 20 });
  } catch (error) { return interestError(error); }
}
