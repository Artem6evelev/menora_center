import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { communityAudit, eventInterests, eventInterestLimits, events, telegramContacts, users } from "@/lib/db/schema";
import type { LockedTransaction, MiniAppUser } from "@/lib/telegram/miniapp-user";
import { evaluateEventEligibility, INTAKE_CHOICES, isPublicEvent } from "./eligibility";

export const INTEREST_POLICY_VERSION = "2026-11-02";
export const hashInterestToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const eventIntakeInput = z.object({ eventId: z.string().regex(/^[A-Za-z0-9_-]{1,150}$/),
  intake: z.enum(INTAKE_CHOICES).nullable().optional() }).strict();
export const eventInterestInput = eventIntakeInput.extend({
  submissionId: z.string().uuid(), name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(25).refine(v => !v || (/^\+?[\d ()-]{7,25}$/.test(v) && v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15)).default(""),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).default(""),
  contactConsent: z.literal(true), invitationConsent: z.boolean().default(false),
  attribution: z.object({ utm_source: z.string().max(100).optional(), utm_medium: z.string().max(100).optional(),
    utm_campaign: z.string().max(100).optional(), utm_content: z.string().max(100).optional(), utm_term: z.string().max(100).optional() }).strict().default({}),
  website: z.literal("").default(""), // Honeypot, never persisted.
}).strict();
export class EventInterestError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export async function limitInterestRequests(tx: LockedTransaction, network: string) {
  const now = new Date(), expires = new Date(now.getTime() + 900_000);
  const [limit] = await tx.insert(eventInterestLimits).values({ key: network, count: 1, expiresAt: expires })
    .onConflictDoUpdate({ target: eventInterestLimits.key, set: {
      count: sql`CASE WHEN ${eventInterestLimits.expiresAt} <= ${now} THEN 1 ELSE ${eventInterestLimits.count} + 1 END`,
      expiresAt: sql`CASE WHEN ${eventInterestLimits.expiresAt} <= ${now} THEN ${expires} ELSE ${eventInterestLimits.expiresAt} END`,
    }, setWhere: or(lt(eventInterestLimits.count, 10), lt(eventInterestLimits.expiresAt, now)) }).returning();
  if (!limit) throw new EventInterestError(429, "rate_limited");
  await tx.delete(eventInterestLimits).where(lt(eventInterestLimits.expiresAt, new Date(now.getTime() - 86_400_000)));
}

/** Proof is a random HttpOnly browser capability plus an authenticated canonical
 * identity, never matching a name, unverified email, phone or Telegram username. */
export async function linkVisitorInterests(tx: LockedTransaction, visitorHash: string | null, user: MiniAppUser | null) {
  if (!visitorHash || !user || user.identityDisabledAt) return;
  const [fresh] = await tx.select({ id: users.id, disabled: users.identityDisabledAt }).from(users).where(eq(users.id, user.id)).for("update");
  if (!fresh || fresh.disabled) return;
  const rows = await tx.select().from(eventInterests).where(and(eq(eventInterests.visitorHash, visitorHash), isNull(eventInterests.userId))).for("update");
  for (const row of rows) {
    const [canonical] = await tx.select().from(eventInterests).where(and(eq(eventInterests.userId, user.id), eq(eventInterests.eventId, row.eventId))).limit(1).for("update");
    if (canonical) {
      // Consolidate only a browser-proven guest enquiry into that same verified
      // person's event enquiry. Original audit entries remain append-only and
      // are discoverable through this merge marker. Never copy consent blindly.
      await tx.insert(communityAudit).values({ actorId: user.id, parentId: user.id, action: "event_interest_merged",
        targetId: canonical.id, reason: "verified_identity_and_browser_capability", details: { mergedInterestId: row.id } });
      await tx.delete(eventInterests).where(eq(eventInterests.id, row.id));
    } else {
      await tx.update(eventInterests).set({ userId: user.id, ownerKey: `user:${user.id}` }).where(eq(eventInterests.id, row.id));
      await tx.insert(communityAudit).values({ actorId: user.id, parentId: user.id, action: "event_interest_linked",
        targetId: row.id, reason: "verified_identity_and_browser_capability", details: {} });
    }
  }
}

export async function saveEventInterest(tx: LockedTransaction, user: MiniAppUser | null, raw: unknown,
  source: "website" | "telegram", visitorHash: string | null) {
  const data = eventInterestInput.parse(raw);
  if (user) {
    const [fresh] = await tx.select().from(users).where(eq(users.id, user.id)).for("update");
    if (!fresh || fresh.identityDisabledAt) throw new EventInterestError(401, "unauthenticated");
    user = fresh;
    await linkVisitorInterests(tx, visitorHash, user);
  }
  const [event] = await tx.select().from(events).where(eq(events.id, data.eventId));
  if (!isPublicEvent(event)) throw new EventInterestError(404, "event_unavailable");
  if (user?.identityDisabledAt) throw new EventInterestError(401, "unauthenticated");
  let chatAvailable = false;
  if (user && source === "telegram") {
    const [contact] = await tx.select().from(telegramContacts).where(and(eq(telegramContacts.userId, user.id), eq(telegramContacts.isPrimary, true)));
    chatAvailable = !!contact?.telegramChatId && !contact.blockedAt && contact.marketingStatus !== "blocked";
  }
  if (!data.phone && !data.email && !chatAvailable) throw new EventInterestError(400, "contact_required");
  const ownerKey = user ? `user:${user.id}` : `guest:${visitorHash}`;
  if (!user && !visitorHash) throw new EventInterestError(400, "visitor_required");
  // A linked guest contact is reused by the proven owner, preserving its history.
  const own = and(eq(eventInterests.eventId, event.id), or(eq(eventInterests.ownerKey, ownerKey),
    ...(user ? [eq(eventInterests.userId, user.id)] : [])));
  let [previous] = await tx.select().from(eventInterests).where(own).orderBy(eventInterests.createdAt).limit(1).for("update");
  const assessment = evaluateEventEligibility(event, user, data.intake), now = new Date();
  const token = randomBytes(32).toString("base64url");
  const fields = { name: data.name, phone: data.phone || null, email: data.email.toLowerCase() || null,
    source, intakeStatus: data.intake ?? null, decision: assessment.decision,
    attribution: data.attribution, contactConsentAt: now, invitationConsent: data.invitationConsent,
    invitationConsentAt: data.invitationConsent ? now : null, invitationWithdrawnAt: data.invitationConsent ? null : now,
    policyVersion: INTEREST_POLICY_VERSION, unsubscribeHash: hashInterestToken(token), updatedAt: now };
  let created = false;
  if (!previous) {
    const [inserted] = await tx.insert(eventInterests).values({ ...fields, eventId: event.id, ownerKey,
      visitorHash, userId: user?.id ?? null, submissionId: data.submissionId }).onConflictDoNothing().returning();
    if (inserted) { previous = inserted; created = true; }
    else [previous] = await tx.select().from(eventInterests).where(own).limit(1).for("update");
    // A foreign idempotency key cannot retrieve or overwrite another contact.
    if (!previous) return { saved: true as const, unsubscribeToken: null };
  }
  if (!created) await tx.update(eventInterests).set(fields).where(eq(eventInterests.id, previous.id));
  await tx.insert(communityAudit).values({ actorId: user?.id ?? "website_guest", parentId: user?.id ?? ownerKey,
    targetId: previous.id, action: created ? "event_interest_created" : "event_interest_updated",
    reason: "explicit_contact_submission", details: { eventId: event.id, decision: assessment.decision,
      invitationConsent: data.invitationConsent, source, policyVersion: INTEREST_POLICY_VERSION } });
  // Explicit optional consent can enable the existing audience only for a proven
  // deliverable chat. A transport block is never undone by this form.
  if (user && source === "telegram" && chatAvailable && data.invitationConsent)
    await tx.update(telegramContacts).set({ marketingStatus: "subscribed", marketingOptInAt: now, unsubscribedAt: null })
      .where(and(eq(telegramContacts.userId, user.id), eq(telegramContacts.isPrimary, true), isNull(telegramContacts.blockedAt)));
  return { saved: true as const, unsubscribeToken: token };
}
export async function unsubscribeEventInterest(tx: LockedTransaction, token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new EventInterestError(400, "invalid_request");
  const [interest] = await tx.select({ id: eventInterests.id, userId: eventInterests.userId }).from(eventInterests)
    .where(eq(eventInterests.unsubscribeHash, hashInterestToken(token))).limit(1);
  if (interest) {
    await tx.update(eventInterests).set({ invitationConsent: false, invitationWithdrawnAt: new Date(), updatedAt: new Date() })
      .where(interest.userId ? eq(eventInterests.userId, interest.userId) : eq(eventInterests.id, interest.id));
    if (interest.userId) await tx.update(telegramContacts).set({ marketingStatus: "unsubscribed", unsubscribedAt: new Date() })
      .where(and(eq(telegramContacts.userId, interest.userId), isNull(telegramContacts.blockedAt), ne(telegramContacts.marketingStatus, "blocked")));
  }
  return { saved: true };
}
