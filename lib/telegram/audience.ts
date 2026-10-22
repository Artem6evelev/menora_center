import "server-only";
import {
  and,
  eq,
  ilike,
  isNull,
  isNotNull,
  or,
  sql,
  inArray,
  notInArray,
} from "drizzle-orm";
import { z } from "zod";
import { users, telegramContacts } from "@/lib/db/schema";
import { FILTER_VERSION } from "@/lib/community/policy";
import type { MiniAppTransaction } from "./miniapp-user";
export const audienceFilter = z
  .object({
    search: z.string().trim().max(100).default(""),
    affiliation: z.enum(["maternal", "giyur", "none"]).optional(),
    gender: z.enum(["male", "female"]).optional(),
    cityId: z.string().max(30).optional(),
    linked: z.boolean().optional(),
    marketing: z
      .enum(["unknown", "subscribed", "unsubscribed", "blocked"])
      .optional(),
    profileComplete: z.boolean().optional(),
    filterComplete: z.boolean().optional(),
  })
  .strict();
export const audienceSelection = z
  .object({
    filters: audienceFilter,
    allFiltered: z.boolean(),
    selected: z.array(z.string().max(150)).max(5000).default([]),
    excluded: z.array(z.string().max(150)).max(5000).default([]),
  })
  .strict();
export type AudienceFilter = z.input<typeof audienceFilter>;
export type AudienceSelection = z.input<typeof audienceSelection>;
export function audienceWhere(
  raw: unknown,
  selection?: z.output<typeof audienceSelection>,
  eligible = false,
) {
  const f = audienceFilter.parse(raw),
    conditions = [isNull(users.identityDisabledAt)];
  if (f.search) {
    const term = `%${f.search.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(sql`concat_ws(' ',${users.firstName},${users.lastName})`, term),
        ilike(users.lastName, term),
        ilike(telegramContacts.username, term),
      )!,
    );
  }
  if (f.affiliation) conditions.push(eq(users.affiliation, f.affiliation));
  if (f.gender) conditions.push(eq(users.gender, f.gender));
  if (f.cityId) conditions.push(eq(users.cityId, f.cityId));
  if (f.linked !== undefined)
    conditions.push(
      f.linked ? isNotNull(telegramContacts.id) : isNull(telegramContacts.id),
    );
  if (f.marketing)
    conditions.push(
      sql`coalesce(${telegramContacts.marketingStatus},'unknown')=${f.marketing}`,
    );
  if (f.profileComplete !== undefined)
    conditions.push(eq(users.isProfileComplete, f.profileComplete));
  if (f.filterComplete !== undefined) {
    const complete = sql`(${users.filterVersion}=${FILTER_VERSION} AND ${users.filterCompletedAt} IS NOT NULL AND (${users.affiliation}='none' OR (${users.affiliation} IN ('maternal','giyur') AND ${users.gender} IN ('female','male'))))`;
    conditions.push(
      f.filterComplete
        ? sql`coalesce(${complete},false)`
        : sql`NOT coalesce(${complete},false)`,
    );
  }
  if (selection) {
    if (!selection.allFiltered)
      conditions.push(
        selection.selected.length
          ? inArray(users.id, selection.selected)
          : sql`false`,
      );
    if (selection.excluded.length)
      conditions.push(notInArray(users.id, selection.excluded));
  }
  if (eligible)
    conditions.push(
      eq(telegramContacts.marketingStatus, "subscribed"),
      isNotNull(telegramContacts.telegramChatId),
      isNull(telegramContacts.blockedAt),
    );
  return and(...conditions);
}
export const primaryContact = and(
  eq(users.id, telegramContacts.userId),
  eq(telegramContacts.isPrimary, true),
);
export async function readAudience(
  tx: MiniAppTransaction,
  raw: unknown,
  page = 1,
) {
  const where = audienceWhere(raw);
  const [total] = await tx
    .select({ count: sql<number>`count(*)::integer` })
    .from(users)
    .leftJoin(telegramContacts, primaryContact)
    .where(where);
  const rows = await tx
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      city: users.city,
      username: telegramContacts.username,
      linked: sql<boolean>`${telegramContacts.id} IS NOT NULL`,
      marketing: sql<string>`coalesce(${telegramContacts.marketingStatus},'unknown')`,
      reachable: sql<boolean>`${telegramContacts.telegramChatId} IS NOT NULL AND ${telegramContacts.blockedAt} IS NULL`,
      profileComplete: users.isProfileComplete,
      filterComplete: sql<boolean>`coalesce(${users.filterVersion}=${FILTER_VERSION} AND ${users.filterCompletedAt} IS NOT NULL,false)`,
    })
    .from(users)
    .leftJoin(telegramContacts, primaryContact)
    .where(where)
    .orderBy(users.id)
    .limit(20)
    .offset((page - 1) * 20);
  return { rows, total: total.count, page };
}
