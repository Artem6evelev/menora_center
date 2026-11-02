import { communityAccess, hasFilterProfile, type CommunityProfile } from "@/lib/community/policy";

export const INTAKE_CHOICES = ["maternal", "giyur", "other_giyur", "roots", "none"] as const;
export type IntakeChoice = typeof INTAKE_CHOICES[number];
export interface EventRules {
  status: string;
  isRegistrationClosed?: boolean | null;
  visibility?: string | null;
  admissionPolicy?: string | null;
  audience?: string | null;
}
/** Publication and admission are separate. Missing admission configuration fails closed. */
export function isPublicEvent(event: EventRules | null | undefined): boolean {
  return !!event && event.status === "planned" && !event.isRegistrationClosed &&
    (event.visibility === undefined || event.visibility === "public");
}
export function evaluateEventEligibility(event: EventRules, profile?: CommunityProfile | null, intake?: IntakeChoice | null) {
  const current = hasFilterProfile(profile);
  const access = communityAccess(profile);
  const base = { authenticationRequired: !profile, profileRequired: !profile?.isProfileComplete ||
      (event.admissionPolicy !== "open" && !current) || !["male", "female"].includes(profile?.gender ?? ""),
    needsStatusQuestion: event.admissionPolicy !== "open" && !current && !intake };
  const result = (decision: "eligible" | "needs_review" | "not_eligible", reason: string) => ({ ...base, decision, reason });
  if (!isPublicEvent(event) || profile?.identityDisabledAt) return result("not_eligible", "unavailable");
  if (profile?.gender && ((event.audience === "men" && profile.gender !== "male") ||
    (event.audience === "women" && profile.gender !== "female"))) return result("not_eligible", "audience");
  if (event.audience === "kids" && profile && !access.canRegisterChildren) return result("needs_review", "children");
  if (event.admissionPolicy === "open") return result("eligible", "open");
  // An intake answer is a preliminary self-report, never a replacement for a
  // current canonical filter or a credential accepted by the registration writer.
  const status = current ? profile!.affiliation : intake;
  if (status === "maternal" || status === "giyur") return result("eligible", "restricted_allowed");
  if (status === "none") return result("not_eligible", "religious_status");
  return result("needs_review", status ? "clarification" : "status_required");
}
export function canRegisterEvent(event: EventRules, profile: CommunityProfile | null | undefined) {
  const result = evaluateEventEligibility(event, profile);
  return result.decision === "eligible" && !result.authenticationRequired && !result.profileRequired;
}
