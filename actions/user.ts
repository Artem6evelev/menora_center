"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { AFFILIATIONS, FILTER_VERSION } from "@/lib/community/policy";
import { z } from "zod";
import { localityById } from "@/lib/community/cities";
import { saveCommunityProfile } from "./community";
import { saveOwnChildren } from "./community-children";
import { updateUserRole } from "./role";
import { requireStaff } from "@/lib/community/server";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { desc, ilike, or, sql } from "drizzle-orm";

export async function getAllUsers() {
  await requireStaff();
  return await db.select().from(users);
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  const result = await updateUserRole(userId, newRole);
  return result.error ? { success: false, error: result.error } : { success: true };
}
export async function completeUserProfile(userId: string, data: unknown) {
  return saveCommunityProfile(userId, data);
}

export async function getUsersPaginated(
  page = 1,
  limit = 20,
  searchQuery = "",
  filters?: {
    affiliation?: string;
    filterCompletion?: string;
    cityId?: string;
    maritalStatus?: string;
    hasChildren?: string;
  },
) {
  await requireStaff();
  try {
    const offset = (page - 1) * limit;

    // Собираем все условия в массив
    let allConditions: any[] = [];

    // 1. Условие текстового поиска
    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      allConditions.push(
        or(
          ilike(users.firstName, q),
          ilike(users.lastName, q),
          ilike(users.phone, q),
          ilike(users.email, q),
          ilike(users.city, q),
        ),
      );
    }

    // 2. Условия из фильтров (выпадающих списков)
    if (filters?.cityId) {
      const id = z.string().regex(/^\d{4}$/).refine(value => !!localityById(value)).parse(filters.cityId);
      allConditions.push(eq(users.cityId, id));
    }
    if (filters?.affiliation) {
      const value = z.enum(AFFILIATIONS).parse(filters.affiliation);
      allConditions.push(eq(users.affiliation, value));
    }
    if (filters?.filterCompletion) {
      const value = z.enum(["passed", "required"]).parse(filters.filterCompletion);
      const passed = sql`coalesce((${users.filterVersion} = ${FILTER_VERSION} and ${users.filterCompletedAt} is not null and ${users.affiliation} in ('maternal','giyur','none') and (${users.affiliation} = 'none' or ${users.gender} in ('male','female'))),false)`;
      allConditions.push(value === "passed" ? passed : sql`not (${passed})`);
    }
    if (filters?.maritalStatus) {
      allConditions.push(eq(users.maritalStatus, filters.maritalStatus));
    }
    if (filters?.hasChildren) {
      const booleanValue = filters.hasChildren === "yes";
      allConditions.push(eq(users.hasChildren, booleanValue));
    }

    // Объединяем все условия через AND (чтобы работали все вместе)
    const finalCondition =
      allConditions.length > 0 ? and(...allConditions) : undefined;

    const data = await db
      .select()
      .from(users)
      .where(finalCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(finalCondition);

    const totalUsers = Number(totalCountResult[0].count);

    return {
      users: data,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    };
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
    return { users: [], totalPages: 0, totalUsers: 0 };
  }
}

export async function updateUserTags(userId: string, tags: string[]) {
  try {
    await requireStaff();
    tags = z.array(z.string().trim().min(1).max(64)).max(50).parse(tags);
    await db
      .update(users)
      .set({ tags: JSON.stringify(tags) })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// actions/user.ts (в самый конец файла)

export async function updateFamilyProfile(userId: string, spouseName: string | null, childrenData: unknown[]) {
  return saveOwnChildren(childrenData, userId, spouseName);
}
export async function updateUserProfile(userId: string, data: unknown) {
  return saveCommunityProfile(userId, data);
}
