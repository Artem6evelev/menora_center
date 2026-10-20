import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { currentCommunityUser } from "@/lib/community/server";
import { hasFilterProfile, registrationUrl, safeReturnTo } from "@/lib/community/policy";
import { validAttemptId } from "@/lib/community/drafts";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string; registration?: string; draft?: string }> }) {
  const query = await searchParams; const target = safeReturnTo(query.returnTo);
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?returnTo=${encodeURIComponent(target)}`);
  const profile = await currentCommunityUser();
  if (query.registration === "1" && validAttemptId(query.draft)) redirect(`/register?resume=1&draft=${encodeURIComponent(query.draft)}`);
  if (!hasFilterProfile(profile) || (profile?.affiliation !== "none" && !profile?.isProfileComplete)) redirect(registrationUrl(target));
  if (profile?.affiliation === "none") redirect("/register?result=resources");
  if (query.registration === "1") redirect("/dashboard/events");
  redirect(target);
}
