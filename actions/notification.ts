"use server";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq, or, and, desc, asc, sql, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCommunityUser, requirePrivateScope, requireStaff } from "@/lib/community/server";
import { isStaff } from "@/lib/community/policy";
import { z } from "zod";
const idInput = z.string().min(1).max(200);
const messageInput = z.string().trim().min(1).max(5000);

export async function getUserNotifications(userId: string) {
  await requirePrivateScope(idInput.parse(userId));
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
}
export async function createNotification(userId: string, title: string, message: string, link?: string, senderId?: string, type = "system") {
  try {
    const actor = await requireStaff();
    if (senderId && senderId !== actor.id) throw new Error("Sender mismatch");
    const checked = z.object({ userId: idInput, title: z.string().trim().min(1).max(160), message: messageInput,
      type: z.enum(["system", "crm_personal", "crm_bulk"]), link: z.string().regex(/^\/dashboard(?:\/[A-Za-z0-9_-]+)*$|^\/events\/[A-Za-z0-9_-]+$/).optional(),
    }).strict().parse({ userId, title, message, type, link });
    await db.insert(notifications).values({ id: crypto.randomUUID(), ...checked, link: checked.link || null, senderId: actor.id });
    revalidatePath("/dashboard", "layout"); return { success: true };
  } catch { return { success: false }; }
}
export async function sendBulkCrmMessages(userIds: string[], message: string) {
  try {
    const actor = await requireStaff();
    const ids = [...new Set(z.array(idInput).min(1).max(500).parse(userIds))];
    const text = messageInput.parse(message);
    await db.insert(notifications).values(ids.map(userId => ({ id: crypto.randomUUID(), userId, senderId: actor.id,
      title: "Объявление общины", message: text, link: "/dashboard", type: "crm_bulk", isRead: false })));
    revalidatePath("/dashboard", "layout"); return { success: true };
  } catch { return { success: false }; }
}
async function requireNotification(id: string) {
  const [row] = await db.select().from(notifications).where(eq(notifications.id, idInput.parse(id)));
  if (!row) throw new Error("Notification not found");
  await requirePrivateScope(row.userId); return row;
}
export async function markAsRead(id: string) {
  try { await requireNotification(id); await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)); revalidatePath("/dashboard", "layout"); return { success: true }; }
  catch { return { success: false }; }
}
export async function markAllAsRead(userId: string) {
  try { await requirePrivateScope(idInput.parse(userId)); await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId)); revalidatePath("/dashboard", "layout"); return { success: true }; }
  catch { return { success: false }; }
}
export async function deleteNotification(id: string) {
  try { await requireNotification(id); await db.delete(notifications).where(eq(notifications.id, id)); revalidatePath("/dashboard", "layout"); return { success: true }; }
  catch { return { success: false }; }
}
export async function getNotificationHistory(userId: string) {
  await requireStaff(); idInput.parse(userId);
  return db.select({ id: notifications.id, message: notifications.message, createdAt: notifications.createdAt,
    type: notifications.type, senderId: notifications.senderId }).from(notifications)
    .where(or(eq(notifications.userId, userId), eq(notifications.senderId, userId))).orderBy(desc(notifications.createdAt)).limit(50);
}
export async function getMyChatHistory(userId: string) {
  await requirePrivateScope(idInput.parse(userId));
  return db.select().from(notifications).where(or(eq(notifications.userId, userId), eq(notifications.senderId, userId))).orderBy(asc(notifications.createdAt));
}
export async function sendClientMessage(message: string) {
  try {
    const client = await requireCommunityUser(); await requirePrivateScope(client.id);
    const text = messageInput.parse(message);
    const [admin] = await db.select().from(users).where(and(inArray(users.role, ["admin", "superadmin"]), isNull(users.identityDisabledAt))).limit(1);
    if (!admin) return { success: false };
    await db.insert(notifications).values({ id: crypto.randomUUID(), userId: admin.id, senderId: client.id,
      title: "Ответ клиента", message: text, type: "client_reply", isRead: false });
    revalidatePath("/dashboard/chat"); return { success: true };
  } catch { return { success: false }; }
}
export async function getActiveChats() {
  await requireStaff();
  const result = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, imageUrl: users.imageUrl,
    unreadCount: sql<number>`CAST(SUM(CASE WHEN ${notifications.isRead} = false AND ${notifications.senderId} = ${users.id} THEN 1 ELSE 0 END) AS INTEGER)`,
  }).from(users).innerJoin(notifications, or(eq(notifications.senderId, users.id), eq(notifications.userId, users.id)))
    .where(inArray(notifications.type, ["crm_personal", "client_reply", "crm_bulk"])).groupBy(users.id);
  return result.sort((a, b) => b.unreadCount - a.unreadCount);
}
export async function markChatAsRead(clientId: string) {
  try {
    const actor = await requireStaff(); idInput.parse(clientId);
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.senderId, clientId), eq(notifications.userId, actor.id), eq(notifications.isRead, false)));
    return { success: true };
  } catch { return { success: false }; }
}
export async function getConversation(adminId: string, clientId: string) {
  const actor = await requirePrivateScope(idInput.parse(clientId)); idInput.parse(adminId);
  const [peer] = await db.select().from(users).where(eq(users.id, adminId));
  if (!isStaff(peer) || (!isStaff(actor) && clientId !== actor.id)) throw new Error("Нет доступа к переписке");
  return db.select().from(notifications).where(or(
    and(eq(notifications.senderId, adminId), eq(notifications.userId, clientId)),
    and(eq(notifications.senderId, clientId), eq(notifications.userId, adminId)),
  )).orderBy(asc(notifications.createdAt)).limit(100);
}
