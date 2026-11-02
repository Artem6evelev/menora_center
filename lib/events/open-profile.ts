import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { publicEventCondition } from "./public";
/** Context is checked against the DB, never trusted as a client permission. */
export async function openProfileEvent(raw: unknown, returnTo: unknown, connection: Pick<typeof db, "select"> = db) {
  if (!raw || typeof raw !== "object" || "affiliation" in raw || typeof returnTo !== "string" || !/^\/events\/[A-Za-z0-9_-]{1,150}$/.test(returnTo)) return undefined;
  const [event] = await connection.select({ id: events.id }).from(events).where(and(eq(events.id, returnTo.slice(8)), eq(events.admissionPolicy, "open"), publicEventCondition()));
  return event?.id;
}
