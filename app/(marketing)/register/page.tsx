import { SignOutButton } from "@clerk/nextjs";
import OnboardingForm from "@/components/dashboard/main/onboarding-form";
import { currentCommunityUser } from "@/lib/community/server";
import { auth } from "@clerk/nextjs/server";
import { communityAccess, hasFilterProfile } from "@/lib/community/policy";
import { readRegistrationDraft, validAttemptId } from "@/lib/community/drafts";
import { fullProfileInput } from "@/lib/community/validation";
import { redirect } from "next/navigation";
import { profileChildren } from "@/lib/community/children";
export const metadata = { title: "Регистрационная анкета", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; resume?: string; draft?: string }> }) {
  const query = await searchParams; const { userId } = await auth(); const profile = await currentCommunityUser();
  const draft = userId && validAttemptId(query.draft) ? await readRegistrationDraft(query.draft, userId) : null;
  if (query.resume === "1" && !draft && hasFilterProfile(profile) && communityAccess(profile).canViewEvents) redirect("/dashboard/events");
  const initialDraft = draft && !draft.consumedAt ? fullProfileInput.safeParse(draft.payload) : null;
  return <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 pt-32 pb-16"><OnboardingForm key={userId || "guest"} userId={userId}
    initialProfile={profile ? { ...profile, childrenData: profileChildren(profile.id, profile.childrenData) } : null}
    initialDraft={initialDraft?.success ? initialDraft.data : null} draftId={draft?.id} />{userId && <SignOutButton><button className="block mx-auto mt-6 underline">Выйти из аккаунта</button></SignOutButton>}</main>;
}
