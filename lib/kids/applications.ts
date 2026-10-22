import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { kidsApplications, users } from "@/lib/db/schema";
import { communityAccess } from "@/lib/community/policy";
import { profileChildren } from "@/lib/community/children";
import { CommunityError } from "@/lib/community/errors";
import { kidsProgramTitles } from "./programs";

type KidsTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const input = z.object({
  programTitle: z.string().max(200).refine(title => kidsProgramTitles.has(title)),
  childIds: z.array(z.string().min(1).max(150)).min(1).max(20).refine(ids => new Set(ids).size === ids.length),
}).strict();
export class KidsApplicationError extends CommunityError {
  constructor(public readonly code: "invalid_kids_application" | "kids_access_denied" | "child_not_owned", message: string) { super(message); }
}
/** The surface authenticates actor; this helper independently locks/rechecks the
 * canonical user. Website and Telegram share validation, policy and insertion. */
export async function createKidsApplicationForUser(tx: KidsTransaction, actor: { id: string }, raw: unknown) {
  const parsed = input.safeParse(raw);
  if (!parsed.success) throw new KidsApplicationError("invalid_kids_application", "Выберите программу и сохранённых детей из своего профиля");
  const [fresh] = await tx.select().from(users).where(eq(users.id, actor.id)).for("update");
  const access = communityAccess(fresh);
  if (!fresh || !access.canRegisterChildren || !access.canManageChildren) throw new KidsApplicationError("kids_access_denied", "Запись детей доступна через профиль мамы с заполненной анкетой");
  const normalized = profileChildren(fresh.id, fresh.childrenData);
  const stored = Array.isArray(fresh.childrenData) ? fresh.childrenData : [];
  const selected = parsed.data.childIds.map(id => {
    const index = normalized.findIndex(child => child.id === id && child.parentId === fresh.id);
    const child = normalized[index], original = stored[index];
    if (!child || original?.parentId !== undefined && original.parentId !== fresh.id) throw new KidsApplicationError("child_not_owned", "Ребёнок не связан с вашим профилем. Обновите данные семьи.");
    return child;
  });
  // One user row serializes both surfaces. Do not duplicate a child/program pair
  // after double taps, retries, changed selection or a previous rejected request.
  // Existing snapshots/status/history are never overwritten.
  const previous = await tx.select().from(kidsApplications).where(and(eq(kidsApplications.userId, fresh.id), eq(kidsApplications.programTitle, parsed.data.programTitle)));
  const covered = new Set(previous.flatMap(row => Array.isArray(row.children) ? row.children.map(child => child?.id).filter((id): id is string => typeof id === "string") : []));
  const additions = selected.filter(child => !covered.has(child.id));
  if (additions.length) await tx.insert(kidsApplications).values({
    programTitle: parsed.data.programTitle, userId: fresh.id,
    parentFirstName: fresh.firstName || "", parentLastName: fresh.lastName || "",
    email: fresh.email ?? "", phone: fresh.phone || "", children: additions,
  });
  return { created: additions.length > 0 };
}

export async function ownKidsApplications(tx: Pick<KidsTransaction, "select">, userId: string) {
  const rows = await tx.select().from(kidsApplications).where(eq(kidsApplications.userId, userId)).orderBy(desc(kidsApplications.createdAt), kidsApplications.id);
  return rows.map(row => ({ id: row.id, programTitle: row.programTitle, status: row.status, createdAt: row.createdAt,
    children: (Array.isArray(row.children) ? row.children : []).map(child => ({ id: typeof child?.id === "string" ? child.id : null,
      name: typeof child?.name === "string" ? child.name : "", dateOfBirth: typeof child?.dateOfBirth === "string" ? child.dateOfBirth : "",
      gender: child?.gender === "male" || child?.gender === "female" ? child.gender : null })) }));
}
