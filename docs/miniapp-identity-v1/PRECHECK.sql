-- READ ONLY. Run privately as the schema owner; do not publish account identifiers.
-- Clerk-shaped is deliberately strict; it is routing evidence, not an OAuth proof.
BEGIN TRANSACTION READ ONLY;
SELECT count(*) AS total_users,
 count(*) FILTER(WHERE id ~ '^user_[A-Za-z0-9]{27}$') AS clerk_shaped_users,
 count(*) FILTER(WHERE id LIKE 'tg\_%' ESCAPE '\') AS legacy_tg_users,
 count(*) FILTER(WHERE telegram_chat_id IS NOT NULL) AS users_with_telegram_chat,
 count(*) FILTER(WHERE id LIKE 'tg\_%' ESCAPE '\' AND email=id||'@telegram.bot') AS exact_legacy_fake_emails,
 count(*) FILTER(WHERE id !~ '^user_[A-Za-z0-9]{27}$' AND id !~ '^tg_[1-9][0-9]{0,15}$') AS ambiguous_user_ids,
 count(*) FILTER(WHERE filter_version=2 AND filter_completed_at IS NOT NULL) AS filter_v2_completed
FROM public.users;

-- This must be empty. Never turn a group/channel/chat string into a human identity.
SELECT id,source,
 CASE WHEN id LIKE 'tg\_%' ESCAPE '\' AND NOT(id ~ '^tg_[1-9][0-9]{0,15}$' AND (length(id)<19 OR substring(id FROM 4)<='9007199254740991' COLLATE "C")) THEN 'invalid_legacy_tg_id'
 WHEN id LIKE 'tg\_%' ESCAPE '\' AND telegram_chat_id IS NOT NULL AND telegram_chat_id<>substring(id FROM 4) THEN 'tg_id_chat_mismatch'
 ELSE 'non_private_or_invalid_chat_id' END AS issue
FROM public.users WHERE
 (id LIKE 'tg\_%' ESCAPE '\' AND (NOT(id ~ '^tg_[1-9][0-9]{0,15}$' AND (length(id)<19 OR substring(id FROM 4)<='9007199254740991' COLLATE "C")) OR (telegram_chat_id IS NOT NULL AND telegram_chat_id<>substring(id FROM 4))))
 OR (telegram_chat_id IS NOT NULL AND NOT(telegram_chat_id ~ '^[1-9][0-9]{0,15}$' AND (length(telegram_chat_id)<16 OR telegram_chat_id<='9007199254740991' COLLATE "C")))
ORDER BY id;

SELECT telegram_chat_id,count(*) AS rows FROM public.users
WHERE telegram_chat_id IS NOT NULL GROUP BY telegram_chat_id HAVING count(*)>1;

-- Also detects tg_<id> without a chat field colliding with another profile's chat.
WITH candidates AS (
 SELECT id,CASE WHEN id ~ '^tg_[1-9][0-9]{0,15}$' THEN substring(id FROM 4) ELSE telegram_chat_id END AS subject
 FROM public.users WHERE id ~ '^tg_[1-9][0-9]{0,15}$' OR telegram_chat_id IS NOT NULL
)
SELECT subject,count(*) AS candidate_profiles FROM candidates GROUP BY subject HAVING count(*)>1;

-- Unmapped IDs are kept unchanged, never guessed to be Clerk identities.
SELECT id,source,telegram_chat_id IS NOT NULL AS has_telegram,email IS NOT NULL AS has_email,
 filter_version,filter_completed_at IS NOT NULL AS has_filter_stamp
FROM public.users WHERE id !~ '^user_[A-Za-z0-9]{27}$' AND id !~ '^tg_[1-9][0-9]{0,15}$'
ORDER BY created_at,id;

-- Existing partial rollout/schema or policies need review; MANUAL_SQL validates definitions.
SELECT c.relname,c.relrowsecurity,(SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid) AS policies
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN('user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log');
SELECT table_name,grantee,privilege_type FROM information_schema.table_privileges
WHERE table_schema='public' AND table_name IN('user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log')
 AND grantee IN('PUBLIC','anon','authenticated') ORDER BY table_name,grantee,privilege_type;
COMMIT;
