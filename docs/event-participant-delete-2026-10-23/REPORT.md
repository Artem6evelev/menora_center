# Event participant deletion — 23 October 2026

Base: `18112cfaa8d65336342f4d72a086f8b1f535f0aa`. Local branch: `fix/event-registration-delete-20261023`.

## ROOT CAUSE

`event_payment_attempts.registration_id` uses `ON DELETE RESTRICT`. The previous staff action deleted only `event_participants`; the dashboard removed its row before awaiting and ignored the action result. Before changing production code, a real Mini App checkout fixture reproduced the failed action: SQLSTATE `23001` (`restrict_violation`), one participant and one attempt remained. [Frozen reproduction](evidence/root-cause-before.json). The same regression passes after the fix on both SQL engines.

## DELETE ORDER

One transaction now performs `requireStaff(tx)`, locks the participant, locks all matching payment attempts, checks payment states, deletes attempts, then deletes the participant. The central authorization helper accepts a typed optional reader so staff lookup uses the same transaction; existing callers retain their default executor and policy. Missing records return `Запись не найдена`. Both dependent-delete and participant-delete failures roll back all writes. The existing schema/FK/migrations are unchanged.

## PAYMENT SAFETY

A paid participant OR any paid attempt rejects deletion with `Оплаченную регистрацию нельзя удалить. Сначала необходимо корректно обработать платёж.` The existing confirmation readiness guard still runs with this safe contextual message; its restricted flag/default behavior stay unchanged. An unconditional rejection also protects paid history if readiness later becomes available. Only pending/cancelled attempts may be deleted; unknown states fail closed. No source/channel condition is used. Website-created pending records and Mini App checkout records use the same action.

Deleted IDs disappear from event detail and registration lists. Return hints and the unchanged disabled callback cannot recreate them; an orphan attempt still violates its FK. A deliberate later checkout creates a new registration ID. The external provider page itself is not revoked by this action; its old custom1 no longer identifies an active registration in the application. No real payment/provider operation was performed.

## UI RESULT

The dashboard asks the requested generic/pending confirmation, blocks repeated clicks while pending, and removes the row/updates the correct event counters only after server success. Rejection keeps row/counters and displays `Не удалось удалить заявку` plus a safe server message; thrown transport errors show the generic message and allow retry. Both390/1280 flows make no document navigation/hard reload. [Paid rejection retains both rows](evidence/paid-rejection.png). Participant rows and event props now use inferred schema/action types.

## TEST COUNT

**966/966 PASS in37 groups**, preserving the923 previous current checks and adding43:16 shared SQL deletion cases on each engine, one additional native concurrency case, and10 dashboard browser cases. No partial/failed/repeated run is counted. [Exact manifest and raw proof hashes](evidence/checks.json).

| Suite | PASS |
|---|---:|
| regression | 36 |
| render | 21 |
| migrations | 8 |
| production | 28 |
| sso-callback | 10 |
| identity-schema | 23 |
| miniapp-auth | 87 |
| miniapp-ui-server | 57 |
| miniapp-ui-bridge | 8 |
| miniapp-cache | 6 |
| miniapp-query-plans | 2 |
| event-share | 3 |
| telegram-migrations | 10 |
| telegram-tools | 5 |
| spec-update | 17 |
| telegram-release | 169 |
| telegram-native | 171 |
| adoption-native | 28 |
| event-participant-delete-browser | 10 |
| telegram-release-browser | 32 |
| miniapp-payment-ux-browser | 15 |
| miniapp-performance-browser | 14 |
| miniapp-ui-browser | 39 |
| miniapp-polish-browser | 14 |
| miniapp-image-share-browser | 21 |
| miniapp-russian-ux-browser | 10 |
| miniapp-onboarding-browser | 4 |
| miniapp-kids-browser | 21 |
| miniapp-kids-entry-browser | 16 |
| miniapp-bottom-nav-browser | 15 |
| miniapp-images-browser | 4 |
| callback-browser | 10 |
| spec-browser | 32 |
| miniapp-participant-parity-browser | 11 |
| miniapp-ui-production | 2 |
| telegram-bundle | 1 |
| miniapp-performance-bundle | 6 |


Coverage includes no-attempt/free and actual website pending registrations, pending/cancelled attempts, both paid guards, confirmation-readiness defense, unrelated rows, staff/filter/disabled-identity checks, rollback at both delete steps, not-found, stale URLs, new checkout IDs, and independent-connection paid-writer serialization. Browser cases cover both confirms/cancel, disabled/busy actions, success, paid rejection, network error/retry, permission loss and a stale record.

During test development, native result-array prototypes were normalized and badge assertions made case-insensitive to match existing CSS. Initial website runs exposed the existing mock SDK reporting readiness during SSR; the test-only adapter now waits until client mount. The original website spec and product sign-in code are unchanged, and the whole browser matrix was replayed with the corrected fixture. Screenshots wait for existing row layout animation to settle. Intermediate failures remain in the private evidence directory; none are presented as PASS. Archived targeted-browser was not run under the existing README exclusion.

## LINT

PASS, exit0:0 errors,30 existing image warnings. Final changed test helpers were linted as well.

## TYPECHECK

PASS, `npm run typecheck`, exit0. Production source did not change after that check; all295 product files match the successful build copy.

## BUILD

PASS, `npm run build`, exit0;42/42 static pages. Used a current isolated copy with synthetic env, no real env copied. Expected sitemap fallback against unavailable synthetic127.0.0.1:1 and existing middleware/images warnings are unchanged. [Source/unchanged-file audit](evidence/source-audit.json).

## Repository and runtime scope

No migrations, new dependencies, canonical pricing/checkout edits, live Supabase operation, Vercel env or Telegram config changes. No push/deploy. Temporary fixture routes/rollback triggers exist only in disposable local runtimes. Browser identity/SDK are synthetic; real OAuth/WebView/payment acceptance was outside this local regression task. The requested single local commit SHA and final clean status are reported after committing. Raw commands/logs/results remain at `/tmp/menora-event-delete-evidence-20261023`.
