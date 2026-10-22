import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { events, telegramCampaigns } from "@/lib/db/schema";
import type { MiniAppTransaction } from "./miniapp-user";

const botLink = (key: string) => `https://t.me/menorah_center_rishon_bot?start=${key}`;
/** One canonical policy, also usable by future CRM callers. Only planned DB
 * events qualify. Alias metadata is prepared with the DTO so native share keeps
 * the user's click activation; there is no network await in the click handler. */
export async function canonicalTelegramEventShareLinks(tx: MiniAppTransaction, eventIds: readonly string[]) {
  const ids = [...new Set(eventIds)];
  const result = new Map<string, string | null>(ids.map(id => [id, null]));
  if (!ids.length) return result;
  // A read snapshot suffices: launch/checkout revalidate planned status and access.
  const rows = await tx.select({ id: events.id }).from(events)
    .where(and(inArray(events.id, ids), eq(events.status, "planned")))
    .orderBy(events.id);
  const targets = rows.map(({ id }) => {
    const direct = /^[A-Za-z0-9_-]{1,58}$/.test(id);
    const key = direct ? `event_${id}` : `evs_${createHash("sha256").update(id).digest("hex").slice(0, 40)}`;
    return { id, key, direct };
  });
  const aliases = targets.filter(target => !target.direct);
  if (aliases.length) await tx.insert(telegramCampaigns)
    .values(aliases.map(({ id, key }) => ({ key, eventId: id, active: true })))
    .onConflictDoNothing();
  if (!targets.length) return result;
  const campaigns = await tx.select().from(telegramCampaigns)
    .where(inArray(telegramCampaigns.key, targets.map(target => target.key)));
  const byKey = new Map(campaigns.map(campaign => [campaign.key, campaign]));
  for (const target of targets) {
    const campaign = byKey.get(target.key);
    // Never revive a disabled alias, overwrite a collision, or redirect a direct
    // event_<ID> key already mapped to a different event by an existing campaign.
    if (campaign && (!campaign.active || campaign.eventId !== target.id)) continue;
    if (!target.direct && !campaign) continue;
    result.set(target.id, botLink(target.key));
  }
  return result;
}
export async function canonicalTelegramEventShareLink(tx: MiniAppTransaction, eventId: string) {
  return (await canonicalTelegramEventShareLinks(tx, [eventId])).get(eventId) ?? null;
}
