import "server-only";
import { communityAccess } from "@/lib/community/policy";
import { kidsPrograms } from "@/lib/kids/programs";
import { createKidsApplicationForUser, KidsApplicationError, ownKidsApplications } from "@/lib/kids/applications";
import { MiniAppAuthError } from "./miniapp-errors";
import { miniAppProfileData } from "./miniapp-profile";
import type { MiniAppTransaction, MiniAppUser, LockedTransaction } from "./miniapp-user";

export async function miniAppKids(tx: MiniAppTransaction, user: MiniAppUser) {
  const access = communityAccess(user);
  if (!access.canViewEvents) throw new MiniAppAuthError(403, "kids_access_denied");
  const profile = await miniAppProfileData(tx, user);
  const { childrenData, ...fields } = profile.profile;
  return { profileSnapshot: { ...profile, profile: fields }, profileVersion: profile.profileVersion, children: childrenData,
    permissions: { canManageChildren: access.canManageChildren, canRegisterChildren: access.canRegisterChildren,
      needsGiyurClarification: user.gender === "female" && user.affiliation === "giyur" && user.giyurStage !== "completed", male: user.gender === "male" },
    applications: await ownKidsApplications(tx, user.id), programs: kidsPrograms };
}
export async function applyMiniAppKids(tx: LockedTransaction, user: MiniAppUser, input: unknown) {
  try { return await createKidsApplicationForUser(tx, user, input); }
  catch (error) {
    if (error instanceof KidsApplicationError) throw new MiniAppAuthError(error.code === "kids_access_denied" ? 403 : 400, error.code);
    throw error;
  }
}
export type MiniAppKidsData = Awaited<ReturnType<typeof miniAppKids>>;
