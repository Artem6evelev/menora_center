import "server-only";
import { eq } from "drizzle-orm";
import { events } from "@/lib/db/schema";
import type { MiniAppTransaction, MiniAppUser } from "@/lib/telegram/miniapp-user";
import { eventIntakeInput, EventInterestError } from "./interests";
import { evaluateEventEligibility, isPublicEvent } from "./eligibility";
export async function eventIntake(tx: MiniAppTransaction, user: MiniAppUser | null, raw: unknown) {
  const data = eventIntakeInput.parse(raw);
  const [event] = await tx.select().from(events).where(eq(events.id, data.eventId));
  if (!isPublicEvent(event)) throw new EventInterestError(404, "event_unavailable");
  return { assessment: evaluateEventEligibility(event, user, data.intake) };
}
