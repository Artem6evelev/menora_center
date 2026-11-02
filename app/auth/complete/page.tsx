import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { currentCommunityUser } from '@/lib/community/server';
import { hasFilterProfile, registrationUrl } from '@/lib/community/policy';
import { readJourney } from '@/lib/community/journey';
import { eventDestination } from '@/lib/community/event-return';
import { draftReady } from '@/lib/community/draft-progress';
import { bindRegistrationAttempt } from '@/lib/community/drafts';
import { interestVisitor } from '@/lib/events/http';
import { linkVisitorInterests } from '@/lib/events/interests';
import { db } from '@/lib/db';
import { openProfileEvent } from '@/lib/events/open-profile';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string; registration?: string; draft?: string }> }) {
  const query = await searchParams, { userId } = await auth();
  const { draft, target } = await readJourney(query, userId);
  const suffix = draft ? `&draft=${draft.id}` : '';
  if (!userId) redirect(`/sign-in?returnTo=${encodeURIComponent(target)}${suffix}`);
  if (draft && !await bindRegistrationAttempt(draft.id, userId)) redirect('/register?notice=attempt-unavailable');
  const profile = await currentCommunityUser();
  const visitor = await interestVisitor();
  if (profile && visitor.hash) await db.transaction(tx => linkVisitorInterests(tx, visitor.hash, profile));
  if (draft && !draft.consumedAt && draftReady(draft.payload)) redirect(`/register?resume=1&draft=${draft.id}`);
  if (profile?.isProfileComplete && (target === '/dashboard/events' || await openProfileEvent({}, target))) redirect(await eventDestination(target));
  if (!hasFilterProfile(profile) || (profile?.affiliation !== 'none' && !profile?.isProfileComplete)) redirect(`${registrationUrl(target)}${suffix}`);
  if (profile?.affiliation === 'none' && !target.startsWith('/events/')) redirect('/events');
  redirect(await eventDestination(target));
}
