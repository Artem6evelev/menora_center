-- READ ONLY. Run after the transaction committed; expected exceptions below are empty/zero.
BEGIN TRANSACTION READ ONLY;
SELECT 'MENORAH_MINIAPP_IDENTITY_V1_POSTCHECK' AS check_name,
 (SELECT count(*) FROM public.users) AS total_users,
 (SELECT count(*) FROM public.user_identities) AS identity_count,
 (SELECT count(*) FROM public.telegram_contacts) AS telegram_contact_count,
 (SELECT count(*) FROM public.users WHERE id LIKE 'tg\_%' ESCAPE '\' AND email=id||'@telegram.bot') AS fake_emails_remaining,
 (SELECT count(*) FROM public.user_identities WHERE provider='telegram') AS telegram_identity_count,
 (SELECT count(*) FROM public.user_identities WHERE provider='clerk') AS clerk_identity_count;

SELECT provider,provider_instance,provider_user_id,count(*) AS rows FROM public.user_identities
GROUP BY provider,provider_instance,provider_user_id HAVING count(*)>1;
SELECT user_id,count(*) AS active_clerk_identities FROM public.user_identities
WHERE provider='clerk' AND disabled_at IS NULL GROUP BY user_id HAVING count(*)>1;
SELECT user_id,count(*) FILTER(WHERE is_primary) AS primary_contacts FROM public.telegram_contacts
GROUP BY user_id HAVING count(*) FILTER(WHERE is_primary)<>1;
SELECT count(*) AS missing_or_wrong_owner_telegram_identity FROM public.telegram_contacts tc
LEFT JOIN public.user_identities ui ON ui.provider='telegram' AND ui.provider_instance='primary' AND ui.provider_user_id=tc.telegram_user_id
WHERE ui.id IS NULL OR ui.user_id<>tc.user_id;
WITH legacy AS (
 SELECT CASE WHEN id ~ '^tg_[1-9][0-9]{0,15}$' THEN substring(id FROM 4) ELSE telegram_chat_id END AS subject
 FROM public.users WHERE id ~ '^tg_[1-9][0-9]{0,15}$' OR telegram_chat_id IS NOT NULL
)
SELECT count(*) AS legacy_telegram_rows_without_contact FROM legacy l
LEFT JOIN public.telegram_contacts tc ON tc.telegram_user_id=l.subject WHERE tc.id IS NULL;

SELECT table_name,grantee,privilege_type FROM information_schema.table_privileges
WHERE table_schema='public' AND table_name IN('user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log','telegram_miniapp_sessions')
 AND grantee IN('PUBLIC','anon','authenticated') ORDER BY table_name,grantee,privilege_type;
SELECT table_name,column_name,grantee,privilege_type FROM information_schema.column_privileges
WHERE table_schema='public' AND table_name IN('user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log','telegram_miniapp_sessions')
 AND grantee IN('PUBLIC','anon','authenticated') ORDER BY table_name,column_name,grantee,privilege_type;

-- Includes inherited privileges; direct grant checks alone are insufficient.
SELECT r.rolname,c.relname,p.privilege FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN pg_roles r CROSS JOIN (VALUES('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) AS p(privilege)
WHERE n.nspname='public' AND c.relname IN('user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log','telegram_miniapp_sessions')
 AND r.rolname IN('anon','authenticated') AND has_table_privilege(r.rolname,c.oid,p.privilege);
SELECT r.rolname,c.relname,a.attname,p.privilege FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped
CROSS JOIN pg_roles r CROSS JOIN (VALUES('SELECT'),('INSERT'),('UPDATE'),('REFERENCES')) AS p(privilege)
WHERE n.nspname='public' AND c.relname IN('user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log','telegram_miniapp_sessions')
 AND r.rolname IN('anon','authenticated') AND has_column_privilege(r.rolname,c.oid,a.attnum,p.privilege);
SELECT c.relname,c.relrowsecurity,(SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid) AS policies
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN('user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log','telegram_miniapp_sessions')
ORDER BY c.relname;
SELECT t.tgname,t.tgenabled FROM pg_trigger t WHERE t.tgrelid='public.user_identity_merge_log'::regclass AND NOT t.tgisinternal;
-- Expired/revoked are normal inactive sessions, not integrity failures.
SELECT count(*) AS total_sessions,
 count(*) FILTER(WHERE revoked_at IS NULL AND expires_at>now()) AS active_sessions,
 count(*) FILTER(WHERE revoked_at IS NOT NULL) AS revoked_sessions,
 count(*) FILTER(WHERE expires_at<=now()) AS expired_sessions
FROM public.telegram_miniapp_sessions;
SELECT token_hash,count(*) AS rows FROM public.telegram_miniapp_sessions GROUP BY token_hash HAVING count(*)>1;
SELECT count(*) AS invalid_sessions FROM public.telegram_miniapp_sessions s
LEFT JOIN public.user_identities i ON i.id=s.identity_id LEFT JOIN public.users u ON u.id=s.user_id
WHERE i.id IS NULL OR u.id IS NULL OR i.user_id<>s.user_id OR i.provider<>'telegram' OR i.provider_instance<>'primary'
 OR s.token_hash !~ '^[0-9a-f]{64}$' OR s.expires_at<=s.created_at OR s.last_seen_at<s.created_at OR s.revoked_at<s.created_at;
SELECT conname,pg_get_constraintdef(oid) AS definition,convalidated FROM pg_constraint
WHERE conrelid='public.telegram_miniapp_sessions'::regclass AND contype='f' ORDER BY conname;
COMMIT;
