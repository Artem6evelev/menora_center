import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  events,
  eventParticipants,
  eventPaymentAttempts,
  users,
  telegramContacts,
  telegramCampaigns,
} from "@/lib/db/schema";
import { communityAccess } from "@/lib/community/policy";
import { profileChildren } from "@/lib/community/children";
import {
  calculateEvent,
  checkoutEvent,
  eventVisible,
} from "@/lib/community/event-checkout";
import { CommunityError } from "@/lib/community/errors";
import { telegramLog } from "./safety";
import { MiniAppAuthError } from "./miniapp-errors";
import type { MiniAppTransaction, MiniAppUser } from "./miniapp-user";

const input = z
  .object({
    action: z.enum(["quote", "register"]),
    eventId: z.string().min(1).max(150),
    childIds: z.array(z.string().max(150)).max(30).default([]),
  })
  .strict();
export const eventDto = (event: typeof events.$inferSelect) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  imageUrl: event.imageUrl,
  date: event.date,
  time: event.time,
  location: event.location,
  isFree: event.isFree,
  price: event.price,
  childPrice: event.childPrice,
  isRegistrationClosed:
    event.isRegistrationClosed || event.status !== "planned",
  status: event.status,
});
function admitted(user: MiniAppUser) {
  if (!communityAccess(user).canViewEvents)
    throw new MiniAppAuthError(403, "event_access_denied");
}
export async function listMiniAppEvents(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  page: number,
) {
  admitted(user);
  const rows = await tx
    .select()
    .from(events)
    .where(eq(events.status, "planned"))
    .orderBy(desc(events.createdAt), events.id)
    .limit(21)
    .offset((page - 1) * 20);
  return {
    events: rows.slice(0, 20).map(eventDto),
    hasMore: rows.length > 20,
    page,
  };
}
export async function miniAppEventDetail(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  id: string,
) {
  admitted(user);
  const [event] = await tx.select().from(events).where(eq(events.id, id));
  if (!event || !eventVisible(user, event))
    throw new MiniAppAuthError(404, "event_unavailable");
  const access = communityAccess(user);
  const [existing] = await tx
    .select({ row: eventParticipants, attempt: eventPaymentAttempts })
    .from(eventParticipants)
    .leftJoin(
      eventPaymentAttempts,
      eq(eventPaymentAttempts.registrationId, eventParticipants.id),
    )
    .where(
      and(
        eq(eventParticipants.userId, user.id),
        eq(eventParticipants.eventId, id),
      ),
    )
    .orderBy(desc(eventParticipants.createdAt))
    .limit(1);
  const registration =
    existing && ["pending", "paid", "confirmed"].includes(existing.row.status)
      ? {
          status: existing.row.status,
          amountAgorot: existing.attempt?.amountAgorot ?? 0,
          paymentUrl:
            existing.row.status === "pending"
              ? (existing.attempt?.paymentUrl ?? null)
              : null,
        }
      : null;

  return {
    event: eventDto(event),
    registration,
    children: access.canRegisterChildren
      ? profileChildren(user.id, user.childrenData).map((c) => ({
          id: c.id,
          name: c.name,
        }))
      : [],
    canRegisterChildren: access.canRegisterChildren,
    needsGiyurClarification:
      user.affiliation === "giyur" &&
      user.gender === "female" &&
      user.giyurStage !== "completed",
  };
}
export async function miniAppEventAction(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  raw: unknown,
) {
  const parsed = input.safeParse(raw);
  if (!parsed.success) throw new MiniAppAuthError(400, "invalid_selection");
  const body = parsed.data,
    selection = {
      family: { self: true },
      childIds: body.childIds,
      extraAdults: 0,
      extraKids: 0,
    };
  try {
    if (body.action === "quote") {
      const result = await calculateEvent(tx, user, body.eventId, selection);
      return { quote: result.breakdown };
    }
    const registration = await checkoutEvent(tx, user, body.eventId, selection);
    if (registration.paymentUrl)
      telegramLog("payment_handoff", {
        amountAgorot: registration.amountAgorot,
      });
    return { registration };
  } catch (error) {
    if (error instanceof CommunityError)
      throw new MiniAppAuthError(409, "registration_unavailable");
    throw error;
  }
}
export async function miniAppRegistrations(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  page: number,
) {
  admitted(user);
  const rows = await tx
    .select({
      registration: eventParticipants,
      event: events,
      amount: sql<number>`CASE WHEN ${eventParticipants.extraData}->>'amountAgorot' ~ '^[0-9]{1,9}$' THEN (${eventParticipants.extraData}->>'amountAgorot')::integer ELSE 0 END`,
    })
    .from(eventParticipants)
    .innerJoin(events, eq(events.id, eventParticipants.eventId))
    .where(eq(eventParticipants.userId, user.id))
    .orderBy(desc(eventParticipants.createdAt), eventParticipants.id)
    .limit(21)
    .offset((page - 1) * 20);
  return {
    registrations: rows
      .slice(0, 20)
      .filter((row) => eventVisible(user, row.event))
      .map((row) => ({
        id: row.registration.id,
        event: eventDto(row.event),
        status: row.registration.status,
        amountAgorot: row.amount,
      })),
    hasMore: rows.length > 20,
    page,
  };
}
export async function clarifyMiniAppGiyur(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  raw: unknown,
) {
  const body = z
    .object({ stage: z.enum(["advanced", "completed"]) })
    .strict()
    .safeParse(raw);
  if (!body.success) throw new MiniAppAuthError(400, "invalid_profile");
  if (
    !communityAccess(user).canRegisterSelf ||
    user.affiliation !== "giyur" ||
    user.gender !== "female"
  )
    throw new MiniAppAuthError(403, "event_access_denied");
  await tx
    .update(users)
    .set({
      giyurStage: body.data.stage,
      filterRevision: user.filterRevision + 1,
    })
    .where(eq(users.id, user.id));
}
export async function campaignEvent(tx: MiniAppTransaction, user: MiniAppUser) {
  if (!communityAccess(user).canViewEvents) return null;
  const [contact] = await tx
    .select()
    .from(telegramContacts)
    .where(
      and(
        eq(telegramContacts.userId, user.id),
        eq(telegramContacts.isPrimary, true),
      ),
    );
  if (!contact?.lastStartParam) return null;
  const [row] = await tx
    .select({ event: events })
    .from(telegramCampaigns)
    .innerJoin(events, eq(events.id, telegramCampaigns.eventId))
    .where(
      and(
        eq(telegramCampaigns.key, contact.lastStartParam),
        eq(telegramCampaigns.active, true),
      ),
    );
  return row && eventVisible(user, row.event) ? row.event.id : null;
}
