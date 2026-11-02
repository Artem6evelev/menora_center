import "server-only";
import { publicEventCondition } from "@/lib/events/public";
import { and, eq } from "drizzle-orm";
import { events, telegramCampaigns, telegramContacts } from "@/lib/db/schema";
import { miniAppProfile, type MiniAppTransaction, type MiniAppUser } from "./miniapp-user";
import { canonicalTelegramEventShareLink } from "./event-share-server";

/** A navigation hint only. Campaigns take precedence, including disabled mappings.
 * The event_ fallback accepts a public planned event ID, never an identity/permission. */
export async function campaignLaunchEvent(tx: MiniAppTransaction, hint: string | null) {
  if (!hint || !/^[A-Za-z0-9_-]{1,64}$/.test(hint)) return null;
  const [campaign] = await tx.select().from(telegramCampaigns).where(eq(telegramCampaigns.key, hint));
  const id = campaign ? (campaign.active ? campaign.eventId : null) : hint.startsWith("event_") ? hint.slice(6) : null;
  if (!id) return null;
  const [event] = await tx.select().from(events).where(and(eq(events.id, id), publicEventCondition()));
  return event ?? null;
}

export async function miniAppLaunch(tx: MiniAppTransaction, user: MiniAppUser, hints: { event: string | null; campaign: string | null }) {
  let event = null;
  if (hints.event && /^[A-Za-z0-9_-]{1,150}$/.test(hints.event)) {
    const [row] = await tx.select().from(events).where(and(eq(events.id, hints.event), publicEventCondition()));
    event = row ?? null;
  } else {
    const [contact] = await tx.select().from(telegramContacts).where(and(eq(telegramContacts.userId, user.id), eq(telegramContacts.isPrimary, true)));
    event = await campaignLaunchEvent(tx, hints.campaign ?? contact?.lastStartParam ?? null);
  }
  // Public event details only, including the complete description. Families,
  // registrations and payment URLs are loaded only through protected actions.
  return { event: event ? { id: event.id, title: event.title, imageUrl: event.imageUrl,
    shareUrl: await canonicalTelegramEventShareLink(tx, event.id, true),
    date: event.date, time: event.time, location: event.location, isFree: event.isFree,
    price: event.price, isRegistrationClosed: event.isRegistrationClosed || event.status !== "planned",
    description: event.description, childPrice: event.childPrice, admissionPolicy: event.admissionPolicy, audience: event.audience,
    lead: event.description?.replace(/<[^>]*>/g, "").slice(0, 280) ?? "" } : null };
}
export type MiniAppLaunch = Awaited<ReturnType<typeof miniAppLaunch>>;
