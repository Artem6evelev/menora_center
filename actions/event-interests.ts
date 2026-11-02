"use server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { communityAudit, eventInterests, eventParticipants, events } from "@/lib/db/schema";
import { requireStaff } from "@/lib/community/server";
import { revalidatePath } from "next/cache";
import { INTAKE_CHOICES } from "@/lib/events/eligibility";
const filtersInput = z.object({ page: z.number().int().min(1).max(10000).default(1), search: z.string().max(100).default(""),
  source: z.enum(["website", "telegram"]).optional(), decision: z.enum(["eligible", "needs_review", "not_eligible"]).optional(),
  intake: z.enum(INTAKE_CHOICES).optional(), processing: z.enum(["new", "contacted", "reviewing", "closed"]).optional(),
  invitations: z.enum(["yes", "no"]).optional(), registered: z.enum(["yes", "no"]).optional(),
  eventId: z.string().max(150).optional(), userId: z.string().max(150).optional() }).strict();
export type InterestCrmFilters = z.input<typeof filtersInput>;
export async function getEventInterests(raw: InterestCrmFilters = {}) {
  await requireStaff();
  const f = filtersInput.parse(raw);
  const registered = sql<boolean>`exists(select 1 from ${eventParticipants} p where p.user_id = ${eventInterests.userId} and p.event_id = ${eventInterests.eventId} and p.status in ('pending','paid','confirmed'))`;
  const where = and(f.search ? or(ilike(eventInterests.name, `%${f.search}%`), ilike(eventInterests.phone, `%${f.search}%`), ilike(eventInterests.email, `%${f.search}%`), ilike(events.title, `%${f.search}%`)) : undefined,
    f.source ? eq(eventInterests.source, f.source) : undefined, f.decision ? eq(eventInterests.decision, f.decision) : undefined,
    f.intake ? eq(eventInterests.intakeStatus, f.intake) : undefined, f.processing ? eq(eventInterests.processingStatus, f.processing) : undefined,
    f.invitations ? eq(eventInterests.invitationConsent, f.invitations === "yes") : undefined,
    f.registered ? sql`${registered} = ${f.registered === "yes"}` : undefined,
    f.eventId ? eq(eventInterests.eventId, f.eventId) : undefined, f.userId ? eq(eventInterests.userId, f.userId) : undefined);
  const [rows, count] = await Promise.all([
    db.select({ id: eventInterests.id, eventId: eventInterests.eventId, title: events.title, userId: eventInterests.userId,
      source: eventInterests.source, intakeStatus: eventInterests.intakeStatus, decision: eventInterests.decision,
      processingStatus: eventInterests.processingStatus, name: eventInterests.name, phone: eventInterests.phone, email: eventInterests.email,
      invitationConsent: eventInterests.invitationConsent, contactConsentAt: eventInterests.contactConsentAt,
      invitationConsentAt: eventInterests.invitationConsentAt, invitationWithdrawnAt: eventInterests.invitationWithdrawnAt,
      policyVersion: eventInterests.policyVersion, attribution: eventInterests.attribution,
      createdAt: eventInterests.createdAt, updatedAt: eventInterests.updatedAt, registered })
      .from(eventInterests).innerJoin(events, eq(events.id, eventInterests.eventId)).where(where)
      .orderBy(desc(eventInterests.updatedAt), eventInterests.id).limit(20).offset((f.page - 1) * 20),
    db.select({ count: sql<number>`count(*)` }).from(eventInterests).innerJoin(events, eq(events.id, eventInterests.eventId)).where(where),
  ]);
  return { rows, total: Number(count[0].count), page: f.page };
}
export async function updateEventInterestProcessing(raw: unknown) {
  const input = z.object({ id: z.string().uuid(), processingStatus: z.enum(["new", "contacted", "reviewing", "closed"]) }).strict().parse(raw);
  await db.transaction(async tx => {
    const staff = await requireStaff(tx);
    const [previous] = await tx.select().from(eventInterests).where(eq(eventInterests.id, input.id)).for("update");
    if (!previous) throw new Error("Обращение не найдено");
    if (previous.processingStatus === input.processingStatus) return;
    await tx.update(eventInterests).set({ processingStatus: input.processingStatus, updatedAt: new Date() }).where(eq(eventInterests.id, input.id));
    await tx.insert(communityAudit).values({ actorId: staff.id, parentId: previous.userId ?? "guest", targetId: previous.id,
      action: "event_interest_processing", reason: "staff_review", details: { previous: previous.processingStatus, current: input.processingStatus } });
  });
  revalidatePath("/dashboard/users");
  return { saved: true };
}
export async function getEventInterestHistory(id: string) {
  await requireStaff(); z.string().uuid().parse(id);
  return db.select({ action: communityAudit.action, actor: communityAudit.actorId, details: communityAudit.details, createdAt: communityAudit.createdAt })
    .from(communityAudit).where(or(eq(communityAudit.targetId, id), sql`${communityAudit.targetId} IN (SELECT details->>'mergedInterestId' FROM community_audit WHERE target_id=${id} AND action='event_interest_merged')`))
    .orderBy(desc(communityAudit.createdAt)).limit(100);
}
