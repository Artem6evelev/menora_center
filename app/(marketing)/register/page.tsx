import { SignOutButton } from '@clerk/nextjs';
import OnboardingForm from '@/components/dashboard/main/onboarding-form';
import { currentCommunityUser } from '@/lib/community/server';
import { auth } from '@clerk/nextjs/server';
import { readJourney } from '@/lib/community/journey';
import { draftForm, draftReady } from '@/lib/community/draft-progress';
import { profileChildren } from '@/lib/community/children';
export const metadata = { title: 'Регистрационная анкета', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; resume?: string; draft?: string }> }) {
  const query = await searchParams, { userId } = await auth(), profile = await currentCommunityUser();
  const { draft, target } = await readJourney(query, userId);
  const candidate = draft && !draft.consumedAt ? draftForm(draft.payload) : null;
  const initialDraft = candidate && Object.keys(candidate).length ? candidate : null;
  return <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 pt-32 pb-16"><OnboardingForm key={userId || 'guest'} userId={userId}
    initialProfile={profile ? { ...profile, childrenData: profileChildren(profile.id, profile.childrenData) } : null}
    initialDraft={initialDraft} draftId={draft?.consumedAt ? undefined : draft?.id} returnTo={target} resumeReady={!!userId && !!draft && !draft.consumedAt && draftReady(draft.payload) && query.resume === '1'} />
    {userId && <SignOutButton><button className="block mx-auto mt-6 underline">Выйти из аккаунта</button></SignOutButton>}
  </main>;
}
