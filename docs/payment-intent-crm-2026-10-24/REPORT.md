# Payment Intent Tracking + CRM — 24 October 2026

Base: `5d0911827ed36c00d8e9e97703459aff64fc185f`.
Branch: `feat/payment-intent-crm-20261023`.

## DATA MODEL

The existing `event_payment_attempts` gains nullable `opened_at`, `last_opened_at`,
`last_opened_source`, and `open_count integer NOT NULL DEFAULT 0`. Checks enforce
nonnegative counts and telegram/website/null source. No new payment/user model,
table, grants, policies, pricing input or confirmation state was introduced.
Existing RESTRICT FKs, paid protections and confirmation-readiness guard remain.

## MIGRATION

Created with Supabase CLI 2.122.0 using the requested
`supabase migration new event_payment_intent_tracking` command:
`supabase/migrations/20261024163516_event_payment_intent_tracking.sql`.
The canonical Drizzle history references an identical copy at
`drizzle/20261024163516_event_payment_intent_tracking.sql`, preserving the generated
basename. A dedicated test compares bytes. Historical SQL/checksums/owner adoption
artifacts are unchanged. Migration discovery follows journal order, supporting the
timestamped suffix. No production database was connected or modified.

Existing rows retain NULL opening fields and zero counts; there is no opening
backfill. The migration records its actual application time in the new column's
catalogue COMMENT as `trackingStartedAt`. This remains truthful even if production
rollout is delayed. PostgreSQL17/18 tests verify columns/defaults/constraints,
legacy preservation, cutoff, unchanged RLS/grants and RESTRICT. Native PostgreSQL
also applies the canonical migration chain and verifies independent connections.

Rollout requires applying the reviewed migration once before deploying the app.
Do not apply both mirrored copies to the same DB. The normal canonical Drizzle
runner retains the adopted-legacy ledger guard and applies the common suffix.
Recovery is an app rollback with additive columns retained; do not erase recorded
intent data or rewrite historical migrations. No destructive rollback was run.

## PAYMENT OPEN TRACKING

A shared server-only `openEventPaymentAttempt(tx,user,registrationId,source)` locks
the owned participant and attempt in the same order as staff deletion. It checks
canonical ownership, matching registration/user/event, both pending statuses and
HTTPS URL without credentials. One SQL update preserves the first timestamp,
updates the latest timestamp/source and increments the server count. The response
is returned after commit; client URL/amount/status/counter fields are never accepted.
The helper neither creates registrations nor changes immutable payment totals.

## TELEGRAM FLOW

The pay buttons in event receipts and My registrations call the same-origin,
strict-input `POST /api/telegram/miniapp/payments/open` with registrationId only.
`withMiniAppSession` locks/revalidates the principal. Only a successful response
reaches the existing SDK HTTPS bridge and safe browser fallback. Double clicks are
blocked while pending; errors retain the pending receipt and expose retry. Cached
URLs are never used as the navigation target. Resume returns the same saved ID.

## WEBSITE FLOW

Initial website checkout now creates the same canonical immutable payment attempt
as Mini App; the previous website-only creation path had no attempt for a new
paid registration. Existing family updates and child-history preservation remain
inside the checkout transaction, followed by canonical recalculation. Client totals
are ignored; pending selection changes fail safely. The website iframe and the
older redirect component call authenticated `openCurrentUserEventPayment` before
using its server-returned URL. Closing the iframe does not alter payment status.

## CRM WARM LEADS

`getEventParticipantsList` uses an ownership-matched LEFT JOIN and a narrow attempt
DTO without paymentUrl. Canonical primary Telegram contact and active identity
supply channel availability; the event's configured payment URL is also removed
from CRM client props. The page uses centralized requireStaff. A grouped server
query supplies total, pending and payment-opened selector counts.

The existing table now shows waiting/opened/paid/confirmed derived states, server
amount, first/last transition and count, contacts, known channel, registration date
and an immutable participant-composition summary. Filters include All/New/Waiting/
Opened/Paid/Confirmed with counts. Pending alone never produces a nonpayment or
abandonment claim. Paid attempts take precedence over a stale participant status.
Row removal retains the existing safe deletion action, confirms with its existing
messages, removes the row only on success and updates the warm selector count.
Loading/transport/server errors remain visible; stale event-list responses are ignored.

## LEGACY RECORDS

Unopened attempts older than the actual migration cutoff show
`Нет данных об открытии оплаты`; they are still grouped under `Ожидает оплаты`.
Newer unopened attempts show `Ссылка на оплату ещё не открывалась`. Missing cutoff
metadata fails neutral. An observed opening is evidence even for an older attempt.
No timestamp is inferred from checkout creation or elapsed time.

## REMINDER FLOW

An accessible native dialog fetches fresh staff-authorized options. Telegram sends
the requested RU transactional text through the existing Bot API with the existing
canonical event/campaign deep link and `Продолжить регистрацию` inline button.
The sender checks pending participant/attempt and the primary canonical contact's
active identity, chat, blocked timestamp and blocked status. Consent may remain
unknown/unsubscribed: this is the explicitly requested registration follow-up.
No marketing status/opt-in/unsubscribe field is changed. A provider403 records a
transport block without changing consent. There are no automatic delivery retries;
unknown delivery warns the admin to verify before resending. Successful dialogs
block repeated sends. Sending never writes a registration.

WhatsApp is a manually opened, normalized and encoded wa.me link, without an API.
Linked Telegram users resume via the same event deep link; website-only users
receive the authenticated website event route. No payment URL is shared in CRM
reminders. Blocked/unlinked users do not receive Telegram sends.

## SHUTAFIM CORRELATION

The registration ID remains Shutafim `custom1` from the canonical checkout. Staff
can expand technical registration details and Copy that ID. It is not displayed
as user-facing Mini App text. Tracking and reminders do not change it.

## SECURITY

Clerk website actions derive their canonical user and lock/recheck the current
profile. Mini App requires the existing signed-session and same-origin policy.
Staff actions reauthorize at execution. Arbitrary user/price/URL/status/counter
injection is rejected, cross-account attempts are inaccessible, and deleted IDs
cannot retrieve old URLs or be resurrected by open/reminder/return hints. The
unverified callback remains disabled; a click never marks a payment confirmed.
No real credentials, storage states, payment, message delivery or production
Supabase/Vercel/Telegram configuration is used by validation.

## VALIDATION

Final exact counts, gate exits and proof hashes are recorded in
[evidence/checks.json](evidence/checks.json). Browser screenshots show synthetic
accounts only. Failed/intermediate development runs are excluded from totals.
Final recheck commands/exits are retained in [final-rechecks.json](evidence/final-rechecks.json).
Production OAuth, native Telegram WebView and actual provider confirmation are
outside these local synthetic-service tests.


**1074/1074 PASS in 39 groups**: the966 supported baseline checks plus108 new
executions (42 shared payment-intent cases on each SQL engine,8 PG17/18 migration
cases,14 new UI flow cases and2 historical-to-current migration checks).

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
| telegram-migrations | 12 |
| telegram-tools | 5 |
| spec-update | 17 |
| telegram-release | 211 |
| telegram-native | 213 |
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
| payment-intent-migrations | 8 |
| payment-intent-browser | 14 |

LINT: PASS, exit0,0 errors and30 existing image warnings.
TYPECHECK: PASS, actual `npm run typecheck`, exit0.
BUILD: PASS, actual `npm run build`, exit0, isolated current-source copy with
synthetic env and unavailable loopback DB. Existing middleware/images warnings and
expected sitemap fallback remain. All318 product source files match the build copy.
ADVISORS: PASS, CLI2.122.0 `db advisors` on a fresh disposable native PostgreSQL
with the current canonical schema, exit0, `No issues found`. This is a local
schema check, not a production Supabase assessment.

[Desktop CRM](evidence/1280-crm.png) · [390px CRM](evidence/390-crm.png).
The existing mobile table scrolls within its container without page overflow.

Development corrections: initial historical SQL repeat tests encountered the
intended frozen-ledger rejection after adding a future migration. Historical tests
now exercise the exact frozen prefix; current tests assert rejection and unchanged
business data. A new browser filter test now waits for the existing exit animation
before counting rows. Existing payment browser checks await the new asynchronous
server-open result. These corrections preserve their security/payment assertions.
The final totals exclude intermediate failures. Archived targeted-browser remains
excluded by the existing supported-test policy; no product was changed for it.

The single local commit SHA and final worktree status are reported in the delivery
message after committing. No push, deploy, production migration or real delivery
was performed.

Selector warmth statistics match the derived filter for pending cancelled attempts
with a recorded opening as well; paid attempts are excluded. This final alignment
was verified by both SQL engines, the final14-case browser run, typecheck, lint and
a fresh successful build.
