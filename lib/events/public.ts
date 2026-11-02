import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
import { events } from "@/lib/db/schema";
import { isPublicEvent } from "./eligibility";

/** Explicit projection. Never serialize events.*, participant rows or payment URLs publicly. */
export const publicEventFields = {
  id: events.id, title: events.title, description: events.description, imageUrl: events.imageUrl,
  date: events.date, time: events.time, location: events.location, isFree: events.isFree,
  price: events.price, childPrice: events.childPrice, audience: events.audience,
  admissionPolicy: events.admissionPolicy, visibility: events.visibility,
  isRegistrationClosed: events.isRegistrationClosed, status: events.status,
  isRecurring: events.isRecurring, recurringPattern: events.recurringPattern, recurringDays: events.recurringDays,
};
export const publicEventCondition = () => and(eq(events.status, "planned"), eq(events.visibility, "public"), or(isNull(events.isRegistrationClosed), eq(events.isRegistrationClosed, false)));
export const publicEventDto = (event: typeof events.$inferSelect) => isPublicEvent(event) ?
  Object.fromEntries(Object.keys(publicEventFields).map(key => [key, event[key as keyof typeof event]])) : null;
