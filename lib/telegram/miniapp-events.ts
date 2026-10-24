import "server-only";
import { and, desc, eq } from "drizzle-orm";
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
import { registrationInput } from "@/lib/community/validation";
import {
  calculateEvent,
  checkoutEvent,
  eventVisible,
  EventSelectionConflictError,
} from "@/lib/community/event-checkout";
import { CommunityError } from "@/lib/community/errors";
import { telegramLog } from "./safety";
import { MiniAppAuthError } from "./miniapp-errors";
import type { MiniAppTransaction, MiniAppUser, LockedTransaction } from "./miniapp-user";
import { canonicalTelegramEventShareLink, canonicalTelegramEventShareLinks } from "./event-share-server";

const input = z
  .object({
    action: z.enum(["quote", "register"]),
    eventId: z.string().min(1).max(150),
    spouse: z.boolean().default(false),
    childIds: registrationInput.shape.childIds.unwrap().default([])
      .refine(ids => new Set(ids).size === ids.length),
    extraAdults: registrationInput.shape.extraAdults,
  })
  .strict();
export type MiniAppEventSelection = Pick<z.output<typeof input>, "spouse" | "childIds" | "extraAdults">;
export type MiniAppEventQuote = Awaited<ReturnType<typeof calculateEvent>>["breakdown"];
const previewFields = { id: events.id, title: events.title, imageUrl: events.imageUrl, date: events.date, time: events.time, location: events.location, isFree: events.isFree, price: events.price, isRegistrationClosed: events.isRegistrationClosed, status: events.status };
type PreviewSource = Pick<typeof events.$inferSelect, keyof typeof previewFields>;
export const eventPreviewDto = (event: PreviewSource, shareUrl: string | null = null) => ({
  id: event.id, title: event.title, imageUrl: event.imageUrl, date: event.date, time: event.time, location: event.location,
  isFree: event.isFree, price: event.price, isRegistrationClosed: event.isRegistrationClosed || event.status !== "planned", shareUrl,
});
export const eventDetailDto = (event: typeof events.$inferSelect, shareUrl: string | null = null) => ({
  ...eventPreviewDto(event, shareUrl), description: event.description, childPrice: event.childPrice, status: event.status,
});
export const eventDto = eventDetailDto;
export async function homeMiniAppEvents(tx: MiniAppTransaction, user: MiniAppUser) {
  admitted(user);
  const rows = await tx.select(previewFields).from(events).where(eq(events.status, "planned")).orderBy(desc(events.createdAt), events.id).limit(2);
  const links = await canonicalTelegramEventShareLinks(tx, rows.map(e => e.id));
  return rows.map(e => eventPreviewDto(e, links.get(e.id) ?? null));
}

function admitted(user: MiniAppUser) {
  if (!communityAccess(user).canViewEvents)
    throw new MiniAppAuthError(403, "event_access_denied");
}
function paymentLink(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}
function storedRegistration(
  row: typeof eventParticipants.$inferSelect,
  attempt: typeof eventPaymentAttempts.$inferSelect | null,
) {
  const extra = row.extraData as { amountAgorot?: unknown } | null;
  const amount = attempt?.amountAgorot ?? extra?.amountAgorot;
  return {
    registrationId: row.id,
    status: row.status,
    amountAgorot: typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0 ? amount : null,
    // Resume only an existing immutable handoff, never invent a legacy price/URL.
    paymentUrl: row.status === "pending" && attempt?.status === "pending" ? paymentLink(attempt.paymentUrl) : null,
  };
}
export async function listMiniAppEvents(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  page: number,
) {
  admitted(user);
  const rows = await tx
    .select(previewFields)
    .from(events)
    .where(eq(events.status, "planned"))
    .orderBy(desc(events.createdAt), events.id)
    .limit(21)
    .offset((page - 1) * 20);
  const shareLinks = await canonicalTelegramEventShareLinks(tx, rows.slice(0, 20).map(event => event.id));
  return {
    events: rows.slice(0, 20).map(event => eventPreviewDto(event, shareLinks.get(event.id) ?? null)),
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
      and(
        eq(eventPaymentAttempts.registrationId, eventParticipants.id),
        eq(eventPaymentAttempts.userId, eventParticipants.userId),
        eq(eventPaymentAttempts.eventId, eventParticipants.eventId),
      ),
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
      ? storedRegistration(existing.row, existing.attempt)
      : null;

  return {
    event: eventDto(event, await canonicalTelegramEventShareLink(tx, event.id)),
    registration,
    firstName: user.firstName,
    spouseName: user.spouseName,
    extraAdultsLimit: registrationInput.shape.extraAdults.removeDefault().maxValue ?? 0,
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
  tx: LockedTransaction,
  user: MiniAppUser,
  raw: unknown,
) {
  const parsed = input.safeParse(raw);
  if (!parsed.success) throw new MiniAppAuthError(400, "invalid_selection");
  const body = parsed.data,
    selection = {
      family: { self: true, ...(body.spouse ? { spouse: true } : {}) },
      childIds: body.childIds,
      extraAdults: body.extraAdults,
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
    return { registration: { ...registration, paymentUrl: paymentLink(registration.paymentUrl) } };
  } catch (error) {
    if (error instanceof EventSelectionConflictError)
      throw new MiniAppAuthError(409, "pending_selection_conflict");
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
      attempt: eventPaymentAttempts,
    })
    .from(eventParticipants)
    .innerJoin(events, eq(events.id, eventParticipants.eventId))
    .leftJoin(eventPaymentAttempts, and(
      eq(eventPaymentAttempts.registrationId, eventParticipants.id),
      eq(eventPaymentAttempts.userId, eventParticipants.userId),
      eq(eventPaymentAttempts.eventId, eventParticipants.eventId),
    ))
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
        event: eventPreviewDto(row.event),
        ...storedRegistration(row.registration, row.attempt),
      })),
    hasMore: rows.length > 20,
    page,
  };
}
export async function clarifyMiniAppGiyur(
  tx: LockedTransaction,
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
  const [updated] = await tx
    .update(users)
    .set({
      giyurStage: body.data.stage,
      filterRevision: user.filterRevision + 1,
    })
    .where(eq(users.id, user.id)).returning();
  return updated;
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
