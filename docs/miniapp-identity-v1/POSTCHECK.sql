-- Read-only postcheck for Menorah Mini App identity layer v1.

SELECT
  'MENORAH_MINIAPP_IDENTITY_V1_POSTCHECK' AS check_name,
  (SELECT count(*) FROM public.user_identities) AS identity_count,
  (SELECT count(*) FROM public.telegram_contacts) AS telegram_contact_count,
  (SELECT count(*) FROM public.users WHERE id LIKE 'tg\_%' ESCAPE '\' AND email = id || '@telegram.bot') AS fake_emails_remaining,
  (SELECT count(*) FROM public.user_identities WHERE provider = 'telegram') AS telegram_identity_count,
  (SELECT count(*) FROM public.user_identities WHERE provider = 'clerk') AS clerk_identity_count;

SELECT provider, provider_instance, provider_user_id, count(*) AS rows
FROM public.user_identities
GROUP BY provider, provider_instance, provider_user_id
HAVING count(*) > 1;

SELECT user_id, count(*) AS primary_contacts
FROM public.telegram_contacts
WHERE is_primary = true
GROUP BY user_id
HAVING count(*) > 1;

SELECT count(*) AS missing_telegram_identity
FROM public.telegram_contacts tc
LEFT JOIN public.user_identities ui
  ON ui.provider = 'telegram'
 AND ui.provider_instance = 'primary'
 AND ui.provider_user_id = tc.telegram_user_id
WHERE ui.id IS NULL;

SELECT count(*) AS legacy_telegram_rows_without_contact
FROM public.users u
LEFT JOIN public.telegram_contacts tc
  ON tc.telegram_chat_id = u.telegram_chat_id
WHERE u.telegram_chat_id IS NOT NULL
  AND tc.id IS NULL;

-- Identity tables must stay backend-only.
SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'user_identities',
    'telegram_contacts',
    'user_identity_link_attempts',
    'user_identity_merge_log'
  )
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
