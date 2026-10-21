import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { currentCommunityUser } from '@/lib/community/server';
import { hasFilterProfile, registrationUrl } from '@/lib/community/policy';
import { readJourney } from '@/lib/community/journey';
import { eventDestination } from '@/lib/community/event-return';
import { draftReady } from '@/lib/community/draft-progress';
import { bindRegistrationAttempt } from '@/lib/community/drafts';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string; registration?: string; draft?: string }> }) {
  const query = await searchParams, { userId } = await auth();
  const { draft, target } = await readJourney(query, userId);
  const suffix = draft ? `&draft=${draft.id}` : '';
  if (!userId) redirect(`/sign-in?returnTo=${encodeURIComponent(target)}${suffix}`);
  if (draft && !await bindRegistrationAttempt(draft.id, userId)) redirect('/register?notice=attempt-unavailable');
  const profile = await currentCommunityUser();
  if (draft && !draft.consumedAt && draftReady(draft.payload)) redirect(`/register?resume=1&draft=${draft.id}`);
  if (!hasFilterProfile(profile) || (profile?.affiliation !== 'none' && !profile?.isProfileComplete)) redirect(`${registrationUrl(target)}${suffix}`);
  if (profile?.affiliation === 'none') redirect('/register?result=resources');
  redirect(await eventDestination(target));
}
