"use server";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";
import { hasFilterProfile, isStaff } from "@/lib/community/policy";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, events, eventParticipants, kidsApplications, communityAudit } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireStaff } from "@/lib/community/server";
import { prepareChildren, profileChildren } from "@/lib/community/children";
import { preserveChildHistory } from "@/lib/community/history";
import { childInput } from "@/lib/community/validation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
const manualInput = z.object({
  requestId: z.string().uuid(), parentId: z.string().min(1).max(150),
  childIds: z.array(z.string().min(1).max(150)).max(20),
  newChild: childInput.omit({ id: true }).optional(),
  kind: z.enum(["event", "program"]), eventId: z.string().max(150).optional(),
  programTitle: z.string().trim().max(200).optional(), reason: z.string().trim().min(10).max(1000),
}).strict();
export async function getManualParent(parentId: string) {
  await requireStaff();
  const [parent] = await db.select().from(users).where(eq(users.id, parentId));
  if (!parent) return null;
  return { id: parent.id, firstName: parent.firstName, lastName: parent.lastName, gender: parent.gender,
    affiliation: parent.affiliation, children: profileChildren(parent.id, parent.childrenData) };
}
export async function registerChildManually(raw: unknown) {
  try {
    const actor = await requireStaff(); const input = manualInput.parse(raw);
    const result = await db.transaction(async tx => {
      // Re-check the role inside the transaction; the payload never supplies authority.
      const [staff] = await tx.select().from(users).where(eq(users.id, actor.id)).for("update");
      if (!isStaff(staff) || !hasFilterProfile(staff)) throw new CommunityError("Недостаточно прав");
      const [existingAudit] = await tx.select().from(communityAudit).where(eq(communityAudit.id, input.requestId));
      if (existingAudit) {
        if (existingAudit.actorId !== actor.id || existingAudit.parentId !== input.parentId) throw new CommunityError("Неверный идентификатор операции");
        return { id: existingAudit.targetId, paymentUrl: (existingAudit.details as { paymentUrl?: string })?.paymentUrl || null, duplicate: true };
      }
      const [parent] = await tx.select().from(users).where(eq(users.id, input.parentId)).for("update");
      if (!parent || parent.gender !== "male") throw new CommunityError("Для этого исключения требуется профиль отца с указанным полом");
      // Owner decision 20.10.2026: the exception never rewrites the father's status or rights.
      const previous = profileChildren(parent.id, parent.childrenData);
      const children = input.newChild ? prepareChildren(parent.id, [
        ...previous.map(({ id, name, dateOfBirth }) => ({ id, name, dateOfBirth })), input.newChild,
      ], parent.childrenData) : previous;
      const ids = [...new Set([...input.childIds, ...(input.newChild ? [children[children.length - 1].id] : [])])];
      if (!ids.length) throw new CommunityError("Выберите ребёнка или добавьте его данные");
      const selected = ids.map(id => {
        const child = children.find(item => item.id === id && item.parentId === parent.id);
        if (!child) throw new CommunityError("Ребёнок не связан с выбранным профилем отца");
        return child;
      });
      let id: string; let paymentUrl: string | null = null;
      if (input.kind === "event") {
        const [event] = await tx.select().from(events).where(eq(events.id, input.eventId || "")).for("update");
        if (!event || event.isRegistrationClosed || event.status !== "planned") throw new CommunityError("Событие недоступно для записи");
        const existing = await tx.select().from(eventParticipants).where(and(eq(eventParticipants.eventId, event.id), eq(eventParticipants.userId, parent.id)));
        if (existing.length) throw new CommunityError("У родителя уже есть запись на событие. Проверьте её перед ручным изменением.");
        id = `part_${randomUUID()}`;
        const amount = event.isFree ? 0 : Number.parseFloat(event.childPrice || "0") * selected.length;
        if (!Number.isFinite(amount) || amount < 0) throw new CommunityError("Уточните стоимость детского участия");
        if (amount > 0) {
          if (!event.paymentUrl) throw new CommunityError("Не настроена ссылка на оплату");
          const url = new URL(event.paymentUrl); if (url.protocol !== "https:") throw new CommunityError("Некорректная ссылка на оплату");
          Object.entries({ price: String(Math.round(amount * 100) / 100), quantity: "1", cur: "ILS", payments: "1", lang: "ru", custom1: id }).forEach(([key, value]) => url.searchParams.set(key, value));
          paymentUrl = url.toString();
        }
        await tx.insert(eventParticipants).values({ id, eventId: event.id, userId: parent.id, phone: parent.phone || "Не указан",
          status: amount > 0 ? "pending" : "confirmed", extraData: { registrationKind: "admin_child_exception", family: { self: false },
            childIds: ids, childrenSnapshot: selected, extraAdults: 0, extraKids: 0 } });
      } else {
        if (!input.programTitle) throw new CommunityError("Укажите детскую программу");
        id = randomUUID();
        await tx.insert(kidsApplications).values({ id, userId: parent.id, programTitle: input.programTitle,
          parentFirstName: parent.firstName || "", parentLastName: parent.lastName || "", email: parent.email,
          phone: parent.phone || "Не указан", children: selected, status: "pending" });
      }
      if (input.newChild) {
        await preserveChildHistory(tx, parent.id, parent.childrenData);
        await tx.update(users).set({ childrenData: children, hasChildren: true }).where(eq(users.id, parent.id));
      }
      await tx.insert(communityAudit).values({ id: input.requestId, actorId: actor.id, parentId: parent.id,
        action: "manual_child_registration", targetId: id, reason: input.reason,
        details: { kind: input.kind, eventId: input.eventId, childIds: ids, fatherAffiliation: parent.affiliation, statusChanged: false, paymentUrl } });
      return { id, paymentUrl, duplicate: false };
    });
    revalidatePath("/dashboard", "layout");
    return { success: true as const, ...result };
  } catch (error) { return { success: false as const, message: communityErrorMessage(error, "Не удалось выполнить ручную запись. Попробуйте ещё раз.") }; }
}
