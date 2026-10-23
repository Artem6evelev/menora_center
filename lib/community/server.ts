import { CommunityError } from "./errors";
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { communityAccess, isStaff, hasFilterProfile } from "./policy";
import { redirect } from "next/navigation";
type CommunityReader = Pick<typeof db, "select">;
export async function currentCommunityUser(connection: CommunityReader = db) {
  const { userId } = await auth();
  if (!userId) return null;
  const [profile] = await connection.select().from(users).where(eq(users.id, userId));
  return profile && !profile.identityDisabledAt ? profile : null;
}
export async function requireCommunityUser(targetId?: string) {
  const profile = await currentCommunityUser();
  if (!profile || (targetId && targetId !== profile.id)) throw new CommunityError("Нет доступа к этому профилю");
  return profile;
}
export async function requireStaff(connection: CommunityReader = db) {
  const profile = await currentCommunityUser(connection);
  if (!isStaff(profile)) throw new CommunityError("Действие доступно только администратору");
  if (!hasFilterProfile(profile)) throw new CommunityError("Сначала пройдите актуальный фильтр");
  return profile!;
}
export async function requirePrivateScope(targetId: string) {
  const profile = await requireCommunityUser();
  if (!hasFilterProfile(profile)) throw new CommunityError("Сначала пройдите актуальный фильтр");
  if (profile.id !== targetId && !isStaff(profile)) throw new CommunityError("Нет доступа к чужим данным");
  return profile;
}
/** Guard each RSC page as well as its layout: child pages may execute in parallel. */
export async function requireDashboardFilter() {
  const profile = await currentCommunityUser();
  if (!profile) redirect("/register");
  if (!hasFilterProfile(profile) || (profile.affiliation !== "none" && !profile.isProfileComplete)) redirect("/register");
  return profile;
}
export async function canReadEvents() {
  return communityAccess(await currentCommunityUser()).canViewEvents;
}
export async function canManageEvents() {
  const profile = await currentCommunityUser();
  return hasFilterProfile(profile) && isStaff(profile);
}
export function requireChildPermission(profile: Parameters<typeof communityAccess>[0]) {
  if (!communityAccess(profile).canManageChildren) throw new CommunityError("Добавление и запись детей доступны с профиля еврейской мамы. Для исключения обратитесь к администратору.");
}
