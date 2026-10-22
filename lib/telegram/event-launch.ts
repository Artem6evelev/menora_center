import "server-only";
import { and, eq } from "drizzle-orm";
import { events, telegramCampaigns, telegramContacts } from "@/lib/db/schema";
import { miniAppProfile, type MiniAppTransaction, type MiniAppUser } from "./miniapp-user";

/** A navigation hint only. Campaigns take precedence, including disabled mappings.
 * The event_ fallback accepts a public planned event ID, never an identity/permission. */
export async function campaignLaunchEvent(tx: MiniAppTransaction, hint: string | null) {
  if (!hint || !/^[A-Za-z0-9_-]{1,64}$/.test(hint)) return null;
  const [campaign] = await tx.select().from(telegramCampaigns).where(eq(telegramCampaigns.key, hint));
  const id = campaign ? (campaign.active ? campaign.eventId : null) : hint.startsWith("event_") ? hint.slice(6) : null;
  if (!id) return null;
  const [event] = await tx.select().from(events).where(and(eq(events.id, id), eq(events.status, "planned")));
  return event ?? null;
}

export async function miniAppLaunch(tx: MiniAppTransaction, user: MiniAppUser, hints: { event: string | null; campaign: string | null }) {
  // A completed third-category filter still stays on resources, even with an ad link.
  if (miniAppProfile(user).nextStep === "resources") return { event: null };
  let event = null;
  if (hints.event && /^[A-Za-z0-9_-]{1,150}$/.test(hints.event)) {
    const [row] = await tx.select().from(events).where(and(eq(events.id, hints.event), eq(events.status, "planned")));
    event = row ?? null;
  } else {
    const [contact] = await tx.select().from(telegramContacts).where(and(eq(telegramContacts.userId, user.id), eq(telegramContacts.isPrimary, true)));
    event = await campaignLaunchEvent(tx, hints.campaign ?? contact?.lastStartParam ?? null);
  }
  // Deliberately bounded public preview: no full description, children, payments,
  // registration or contact data. Full detail/checkout keep their existing guards.
  return { event: event ? { id: event.id, title: event.title, imageUrl: event.imageUrl,
    date: event.date, time: event.time, location: event.location, isFree: event.isFree,
    price: event.price, isRegistrationClosed: event.isRegistrationClosed || event.status !== "planned",
    lead: event.description?.replace(/<[^>]*>/g, "").slice(0, 280) ?? "" } : null };
}
export type MiniAppLaunch = Awaited<ReturnType<typeof miniAppLaunch>>;
