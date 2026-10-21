import 'server-only';
import { eventReturnTo, validAttemptId } from './policy';
import { readRegistrationDraft } from './drafts';
export async function readJourney(query: { returnTo?: string; draft?: string }, userId: string | null) {
  const draft = validAttemptId(query.draft) ? await readRegistrationDraft(query.draft, userId) : null;
  return { draft, target: eventReturnTo(draft ? (draft.payload as any)?.returnTo : query.returnTo) };
}
