/** One policy for UI and server. Pending items are owner decisions, never automatic grants. */
export const AFFILIATIONS = ["maternal", "giyur", "none"] as const;
export type Affiliation = (typeof AFFILIATIONS)[number];
export type Gender = "male" | "female";
export const AFFILIATION_LABELS: Record<Affiliation, string> = {
  maternal: "Еврейство по материнской линии (мама или бабушка по маме — еврейка)",
  giyur: "Гиюр завершён или нахожусь на продвинутом этапе",
  none: "Нет галахического еврейства",
};
// Owner decision 21.10.2026: both admitted categories may register themselves,
// regardless of gender or giyur clarification. Child rights still require an eligible mother.
export interface CommunityProfile {
  id?: string;
  role?: string | null;
  isProfileComplete?: boolean;
  affiliation?: string | null;
  gender?: string | null;
  giyurStage?: string | null;
  filterVersion?: number | null;
  filterCompletedAt?: Date | string | null;
  identityDisabledAt?: Date | string | null;
}
// Fixed release version, never incremented by a migration rerun.
export const FILTER_VERSION = 2;
export const validAttemptId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function isStaff(profile: CommunityProfile | null | undefined) {
  return !profile?.identityDisabledAt && (profile?.role === "admin" || profile?.role === "superadmin");
}
export function hasFilterProfile(profile: CommunityProfile | null | undefined) {
  return !!profile && !profile.identityDisabledAt && profile.filterVersion === FILTER_VERSION && !!profile.filterCompletedAt &&
    AFFILIATIONS.includes(profile.affiliation as Affiliation) &&
    (profile.gender === "male" || profile.gender === "female");
}
export function communityAccess(profile: CommunityProfile | null | undefined) {
  const complete = hasFilterProfile(profile) && !!profile?.isProfileComplete;
  const maternal = complete && profile?.affiliation === "maternal";
  const giyur = complete && profile?.affiliation === "giyur";
  const adult = maternal || giyur;
  const children = complete && profile?.gender === "female" &&
    (maternal || (giyur && profile?.giyurStage === "completed"));
  const reason = !hasFilterProfile(profile) ? "profile_required" : profile?.affiliation === "none" ? "resources" : !profile?.isProfileComplete
    ? "profile_required" :
      adult ? "allowed" : "restricted";
  return { canViewEvents: adult, canRegisterSelf: adult,
    canManageChildren: children, canRegisterChildren: children, reason };
}
export function safeReturnTo(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || value.length > 500 || [...value].some(char => char.charCodeAt(0) <= 32 || char === "\\")) return fallback;
  // Only known application destinations; never protocol-relative or nested OAuth callbacks.
  if (/^\/events\/[A-Za-z0-9_-]+$/.test(value) ||
      ["/events", "/dashboard", "/dashboard/events", "/dashboard/kids", "/dashboard/my-events"].includes(value)) return value;
  return fallback;
}
export function registrationUrl(returnTo: unknown = "/dashboard") {
  return `/register?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}
