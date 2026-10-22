# Menorah Center Mini App — Identity Layer v1

## Goal

One person = one canonical `users` profile. Clerk and Telegram are authentication identities attached to that profile.

No administrator should manually:
- create Telegram users;
- copy questionnaire answers;
- link Telegram to Clerk;
- resolve ordinary duplicates;
- re-subscribe people after `/start`.

The only human interaction allowed in identity linking is proof of ownership by the user (Telegram Mini App identity and, when linking an existing website account, normal Clerk/Google sign-in).

## Canonical model

### `users`
Existing community profile and source of truth for:
- affiliation / filter version;
- gender and giyur stage;
- profile fields;
- family / children;
- event registrations;
- permissions.

`email` becomes nullable because a Telegram-first person may not have a verified email yet.

Existing IDs are preserved. No mass re-key:
- existing Clerk-first rows keep their current IDs;
- legacy `tg_...` rows keep their IDs;
- future Telegram-first rows may use an opaque generated text ID.

Code must treat `users.id` as an opaque canonical key, not as a provider ID.

### `user_identities`
Maps authentication subjects to a canonical profile.

Unique key:
`(provider, provider_instance, provider_user_id)`.

Initial providers:
- `clerk`
- `telegram`

The same `users.id` can have one active Clerk identity and multiple Telegram identities if the person genuinely uses more than one Telegram account. One Telegram contact is marked primary for navigation and broadcasts.

### `telegram_contacts`
Telegram channel state for the canonical user:
- Telegram user/chat ids;
- display metadata;
- marketing consent;
- blocked/delivery state;
- first/last acquisition start parameter.

The questionnaire is NOT duplicated here. The current questionnaire remains in `users`.

A user may have multiple Telegram contacts, but only one primary contact. This prevents an automatic profile merge from failing merely because both source profiles already had Telegram accounts.

### `user_identity_link_attempts`
Short-lived, single-use hashed tokens for linking an authenticated website identity to a Telegram-first profile.

Never store raw link tokens.

### `user_identity_merge_log`
Append-only audit record of automatic merges. It intentionally stores source/target IDs as text evidence rather than cascading foreign keys.

## Telegram Mini App authentication

Every server request from the Mini App must validate raw `Telegram.WebApp.initData` before trusting Telegram user data.

Validation rules:
1. Verify Telegram signature/hash on the server.
2. Validate `auth_date` freshness.
3. Use the validated Telegram `user.id` as the identity subject.
4. Never trust `initDataUnsafe` as authorization input.
5. Never accept a Telegram user id supplied only by JSON/body/query parameters.

## Automatic bootstrap

On first valid Mini App request, in one transaction:

1. Find `user_identities(provider='telegram', provider_user_id=<telegram id>)`.
2. If found:
   - load its canonical `users` row;
   - update `last_seen_at` and Telegram contact metadata;
   - return that user.
3. If not found, look for a legacy `telegram_contacts` backfill / old `users.telegram_chat_id` match produced by the migration.
4. If still not found:
   - create one canonical `users` row with nullable email and no invented affiliation;
   - create Telegram identity;
   - create Telegram contact.
5. Continue onboarding from the user's actual `filter_version` and profile completeness.

The process is idempotent under concurrent requests. Provider subject uniqueness is the final database guard against duplicates.

## Existing users migration

The prepared SQL is deliberately conservative:

- Clerk identity is backfilled only for clearly Clerk-shaped `user_...` IDs.
- Telegram contact/identity is backfilled only from rows that already contain `telegram_chat_id`.
- Legacy fake email is cleared only when it exactly equals `<users.id>@telegram.bot`.
- No affiliation, gender, giyur stage, filter completion or marketing consent is invented.
- Existing IDs, registrations, children and history are untouched.
- Existing Telegram contacts start with marketing status `unknown`, not subscribed.

Before identity resolver activation, any remaining website profiles without a Clerk identity must be reported by a coverage check and handled by deterministic repository-specific evidence, never by guessing.

## Linking Telegram-first user to website/Clerk

### Case A — Clerk identity does not exist yet

After normal Clerk sign-in:
1. Validate the one-time link attempt.
2. Lock the Telegram-first `users` row.
3. Add `user_identities(provider='clerk', provider_user_id=<Clerk ID>)` to the SAME canonical user.
4. Fill verified email/name/image only where appropriate.
5. Consume the attempt.

No merge occurs.

### Case B — Clerk identity already belongs to the same user

No-op except metadata refresh and attempt consumption.

### Case C — Clerk identity belongs to another canonical user

Automatic transactional merge.

Default survivor: the existing Clerk-backed profile, because the current website, roles and historical server code are already anchored to it.

The merge service must:
1. Lock both users and their identities.
2. Re-check that neither identity changed while waiting.
3. Never reduce staff roles.
4. Preserve the existing completed v2 website filter when both profiles have conflicting completed answers.
5. Fill missing non-sensitive profile fields from the Telegram profile only when the survivor field is empty.
6. Reassign all dependent rows to the survivor with table-specific de-duplication.
7. Move Telegram identity/contact to the survivor.
8. Write `user_identity_merge_log`.
9. Remove or disable the source profile only after all references are accounted for.
10. Consume the link attempt.

### Filter conflict

No administrator is asked to resolve it.

If both profiles have completed current filters and the answers conflict:
- the merge succeeds without granting additional permissions;
- existing survivor access remains authoritative;
- Mini App marks the filter as needing user confirmation;
- the user explicitly confirms/updates through the normal questionnaire;
- access is recalculated only after that save.

This is fail-closed and self-service.

## Dependent data that merge tests must cover

At minimum:
- event_participants.user_id
- service_participants.user_id
- kids_applications.user_id
- author_profiles.user_id
- news.author_id
- news_comments.user_id
- tasks.creator_id / assignee_id
- notifications.user_id / sender_id
- community_registration_drafts.owner_id
- family/child references represented in users.children_data
- future Telegram broadcast/contact rows

Do not implement merge by blind dynamic SQL over every foreign key: each table has its own duplicate/history semantics.

## Marketing consent

`/start`, Mini App open, or account linking does NOT imply marketing consent.

State machine:
- `unknown`
- `subscribed`
- `unsubscribed`
- `blocked`

A later `/start` never changes `unsubscribed` back to `subscribed`.

Telegram delivery errors may move the state to `blocked`; a valid later interaction can clear delivery-blocked state according to the bot API result, but does not recreate marketing consent.

## Acquisition

`first_start_param` is immutable after first attribution.
`last_start_param` may update on later campaign entries.

Do not put PII into Telegram start parameters. Start parameters should be opaque campaign/event keys resolved server-side.

## Security / Supabase

The identity tables are backend-only:
- RLS enabled.
- `anon` and `authenticated` table grants revoked.
- no public policies are created.
- service/DB credentials remain server-only.

This avoids exposing identity-link tokens, Telegram identifiers or merge history through Supabase Data API.

## Rollout order

1. Apply schema migration.
2. Run postcheck and identity coverage report.
3. Deploy resolver that supports BOTH legacy direct-Clerk lookup and `user_identities`.
4. Backfill/observe until every active Clerk account resolves through identity layer.
5. Deploy Mini App Telegram bootstrap.
6. Only then remove legacy assumptions such as `users.id === Clerk userId` and direct use of `users.telegram_chat_id`.

No flag day migration.

## Step 2 scope

Included now:
- schema definitions in `lib/db/schema.ts`;
- safe/manual SQL artifact for isolated verification and eventual deployment;
- identity invariants and merge plan.

Not included yet:
- Mini App UI;
- Telegram initData verifier implementation;
- resolver changes in current website;
- automatic merge service;
- broadcasts;
- Shutafim/payment changes;
- production database execution.
