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

The schema treats `users.id` as an opaque canonical key, not as a provider ID. Existing website lookup remains direct-Clerk in Step 2; the resolver and opaque-ID bootstrap are a separate stage. No existing IDs or FKs are rewritten here.

### `user_identities`
Maps authentication subjects to a canonical profile.

Unique key:
`(provider, provider_instance, provider_user_id)`.

`primary` is the imported legacy deployment namespace, not an assertion of a particular Clerk instance ID or bot. The later resolver must choose the namespace from trusted server configuration, never a client-supplied field, and reconcile it with the configured TEST/LIVE instance before activation. Step 2 does not mix environments or fetch private provider records to guess this mapping.

Initial providers:
- `clerk`
- `telegram`

The same `users.id` can have one active Clerk identity and multiple Telegram identities if the person genuinely uses more than one Telegram account. One Telegram contact is marked primary for navigation and broadcasts.

`verified_at` is nullable with no automatic default. Backfilled rows record their legacy provenance in metadata and leave this field NULL: an ID shape or historic chat record is not a fresh OAuth/initData verification. Future server authentication must verify the provider proof independently, including when an imported identity already exists. Import never reactivates a disabled identity.

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

The v1 storage contract is a unique lowercase SHA-256 hex digest (64 characters). The token itself is high-entropy and never persisted. Expiry must follow creation; a consumption timestamp must be within that interval. Future linking must consume with one conditional transactional `UPDATE ... WHERE consumed_at IS NULL AND expires_at > now() RETURNING ...`; a timestamp column alone is not an implementation of replay protection. Token issuance, authentication and consumption services are not included in this step.

### `user_identity_merge_log`
Append-only audit record of automatic merges. It intentionally stores source/target IDs as text evidence rather than cascading foreign keys.

A SQL trigger rejects UPDATE, DELETE and TRUNCATE; INSERT remains available to the trusted server. This protects normal application writes, not a malicious database owner who can disable/drop triggers. The trigger function is SECURITY INVOKER with a fixed search path and no public execution grant. Source and target must differ; a nonblank reason and known triggering provider are required.

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

- Clerk identity is backfilled only for strict `^user_[A-Za-z0-9]{27}$` IDs. Other IDs, including nonconforming `user_...`, remain unchanged and are reported by PRECHECK. No claim that ID shape alone authenticates an account is made.
- Telegram contact/identity is backfilled from a positive canonical private-chat ID already stored in `telegram_chat_id`, or an unambiguous positive legacy `tg_<id>` even if the chat field is missing. A missing chat field stays NULL; PM permission stays false.
- Negative/group IDs, malformed IDs, `tg_` suffix/chat mismatches and unresolved duplicate subjects stop the entire SQL transaction. PRECHECK lists them without repairing data.
- Telegram display names/username are imported only from legacy `tg_` rows marked `source=telegram_bot`; website profile names are not asserted to be Telegram metadata.
- Legacy fake email is cleared only when it exactly equals `<users.id>@telegram.bot`.
- No affiliation, gender, giyur stage, filter completion or marketing consent is invented.
- Existing IDs, registrations, children and history are untouched.
- Existing Telegram contacts start with marketing status `unknown`, not subscribed.

All subject conflicts use DO NOTHING. Existing identity/contact ownership, disabled state, metadata, consent, attribution and timestamps are never refreshed from stale `users` fields on rerun. Contacts missing after a proven ownership move are created for the current identity owner, not the old profile. An existing contact/identity owner mismatch stops the transaction. Existing authoritative mappings may resolve duplicate legacy caches; a fresh unresolved duplicate is never merged by this migration.

For multiple new contacts belonging to one owner, a deterministic ordering assigns only one primary; existing primary contacts remain authoritative. A future merge must demote the source primary before reassigning it, in the same transaction, then preserve/select one primary for the survivor. The unique partial index is immediate. The SQL validates exactly one primary for every owner with contacts.

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
- user_identity_link_attempts.user_id (consume/reassign the linking attempt before deleting its source)
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
- PUBLIC, direct column grants and inherited effective grants are checked too; incompatible inherited access fails the transaction rather than silently changing shared role membership.
- no public policies are created.
- service/DB credentials remain server-only.

This avoids exposing identity-link tokens, Telegram identifiers or merge history through Supabase Data API.

RLS and grants are separate controls, as documented by [Supabase](https://supabase.com/docs/guides/api/securing-your-api). No `auth.uid()` policy, permissive public policy, role provisioning or global default-privilege changes are introduced. Partial unique indexes enforce active Clerk/primary contact invariants; FK lookup columns have supporting indexes.

## SQL artifacts and existing Drizzle workflow

The canonical repository uses Drizzle, not a parallel Supabase migration chain. `npm run db:generate -- --name=miniapp_identity_v1` created `drizzle/0009_miniapp_identity_v1.sql`, its snapshot and journal entry. The reviewed SQL adds backfill, backend ACLs and the append-only audit trigger. Old migrations remain immutable.

`MANUAL_SQL.sql` wraps the exact same body in BEGIN/COMMIT for the owner's later manual execution. `PRECHECK.sql` and `POSTCHECK.sql` explicitly run READ ONLY. A local test asserts body parity. The native migration is tested on an empty database and after the old chain, including a second no-op native run. Idempotent manual reruns preserve all imported records and future merged mappings. Catalog validation rejects incompatible existing column/default/FK/check/index definitions or public policies instead of assuming IF NOT EXISTS proves compatibility.

Do not run both paths as unrelated migration systems. Manual SQL does not invent Drizzle ledger entries or adopt an existing untracked deployment. The existing runner's history validation stays in place; any future remote history reconciliation is a separate explicit operation. No remote SQL is executed in Step 2.

Nullable email required small compatibility changes in existing consumers. The canonical profile persists NULL. Legacy NOT NULL application snapshots use an empty string for absent email, matching existing service snapshot behavior; no fake mailbox is generated and absence does not change eligibility. The role-list store type now accepts NULL. Existing child/event permission and pricing rules are unchanged.

## Rollout order

1. Apply schema migration.
2. Run postcheck and identity coverage report.
3. Deploy resolver that supports BOTH legacy direct-Clerk lookup and `user_identities`.
4. Backfill/observe until every active Clerk account resolves through identity layer.
5. Deploy Mini App Telegram bootstrap.
6. Only then remove legacy assumptions such as `users.id === Clerk userId` and direct use of `users.telegram_chat_id`.

The existing Telegram webhook is intentionally unchanged in Step 2 and still writes its old `tg_...@telegram.bot` address for new legacy /start rows. This staged schema migration does not claim that writer or the resolver has already been replaced. Coordinate that replacement in a separately authorized server rollout; until then, PRECHECK/POSTCHECK may reveal newly created legacy rows. No marketing behavior is changed here.

No flag day migration.

## Step 2 scope

Included now:
- schema definitions in `lib/db/schema.ts`;
- canonical Drizzle migration 0009, snapshot/journal and isolated migration/schema regression tests;
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
