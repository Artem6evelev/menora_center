import "server-only";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { users, telegramContacts } from "@/lib/db/schema";
import { communityAccess, FILTER_VERSION, hasFilterProfile } from "@/lib/community/policy";
import { filterInput, fullProfileInput } from "@/lib/community/validation";
import { writeCanonicalCommunityProfile } from "@/lib/community/profile-write";
import { profileChildren } from "@/lib/community/children";
import { CommunityError } from "@/lib/community/errors";
import { miniAppProfile, type MiniAppTransaction, type LockedTransaction, type MiniAppUser } from "./miniapp-user";
import { MiniAppAuthError } from "./miniapp-errors";

const dateOnly = (value: Date | null) => value?.toISOString().slice(0, 10) ?? "";
export const miniAppProfileTag = (user: MiniAppUser) => '"' + createHash("sha256")
  .update(`${user.id}:${user.filterRevision}`).digest("hex") + '"';
const filterFields = filterInput.omit({ expectedRevision: true, returnTo: true });
const profileFields = fullProfileInput.innerType().omit({ affiliation: true, gender: true, expectedRevision: true,
  returnTo: true, giyurStage: true, source: true });

export async function miniAppProfileData(tx: MiniAppTransaction, user: MiniAppUser) {
  const [contact] = await tx.select({ languageCode: telegramContacts.languageCode, marketingStatus: telegramContacts.marketingStatus }).from(telegramContacts)
    .where(and(eq(telegramContacts.userId, user.id), eq(telegramContacts.isPrimary, true)));
  // Keep the optimistic-lock token with the snapshot. HTTP ETag is a cache validator
  // and can be removed or rewritten by compression/proxies before reaching a WebView.
  return { profileVersion: miniAppProfileTag(user), summary: miniAppProfile(user), languageCode: contact?.languageCode ?? null, announcementStatus: (contact?.marketingStatus ?? "unknown") as "unknown" | "subscribed" | "unsubscribed" | "blocked",
    // Presentation permission for the questionnaire; the shared writer independently enforces it.
    permissions: { canEditChildren: communityAccess({ ...user, isProfileComplete: true }).canManageChildren },
    profile: { firstName: user.firstName ?? "", lastName: user.lastName ?? "", phone: user.phone ?? "+972",
      dateOfBirth: dateOnly(user.dateOfBirth), city: user.city ?? "", cityId: user.cityId,
      maritalStatus: user.maritalStatus ?? "", spouseName: user.spouseName ?? "", hasChildren: !!user.hasChildren,
      agreedToPrivacy: user.agreedToPrivacy === true, affiliation: user.affiliation, gender: user.gender,
      childrenData: profileChildren(user.id, user.childrenData).map(child => ({ id: child.id, name: child.name,
        dateOfBirth: child.dateOfBirth, gender: (child.gender === "male" || child.gender === "female" ? child.gender : null) as "male" | "female" | null })) } };
}

export async function saveMiniAppProfile(tx: LockedTransaction, user: MiniAppUser, raw: unknown,
  tag: string | null, filterOnly: boolean) {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.prototype.hasOwnProperty.call(raw, "profileVersion")) {
    const { profileVersion, ...fields } = raw as Record<string, unknown>;
    // An explicit body token is authoritative, even when invalid/stale. Never
    // replace it with a newer header or silently refresh it before saving edits.
    tag = typeof profileVersion === "string" ? profileVersion : null;
    raw = fields;
  }
  // The caller holds the canonical user row lock; legacy If-Match clients still
  // use the same exact comparison, with no wildcard/weak matching or blind retry.
  if (tag !== miniAppProfileTag(user)) throw new MiniAppAuthError(409, "profile_changed");
  try {
    if (filterOnly) {
      const input = filterFields.parse(raw);
      if (input.affiliation !== "none" && !input.gender) throw new MiniAppAuthError(400, "gender_required");
      await tx.update(users).set({ affiliation: input.affiliation, gender: input.affiliation === "none" ? user.gender : input.gender,
        filterVersion: FILTER_VERSION, filterCompletedAt: new Date(), filterRevision: user.filterRevision + 1 })
        .where(eq(users.id, user.id));
    } else {
      if (!hasFilterProfile(user) || user.affiliation === "none") throw new MiniAppAuthError(403, "filter_required");
      const input = profileFields.parse(raw);
      // Identity, category, gender, revision and stage come from the locked server profile.
      await writeCanonicalCommunityProfile(tx, user.id, { ...input, affiliation: user.affiliation, gender: user.gender,
        expectedRevision: user.filterRevision, ...(user.affiliation === "giyur" ? { giyurStage: user.giyurStage } : {}) });
    }
  } catch (error) {
    if (error instanceof z.ZodError) throw new MiniAppAuthError(400, "invalid_profile");
    if (error instanceof CommunityError) throw new MiniAppAuthError(400, "invalid_profile");
    throw error;
  }
  const [updated] = await tx.select().from(users).where(eq(users.id, user.id));
  return updated;
}
export type MiniAppProfileData = Awaited<ReturnType<typeof miniAppProfileData>>;
