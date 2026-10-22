-- Read-only preflight for Menorah Mini App identity layer v1.
-- Safe to run before migration. Does not modify data.

SELECT
  count(*) AS total_users,
  count(*) FILTER (WHERE id LIKE 'user\_%' ESCAPE '\') AS clerk_shaped_users,
  count(*) FILTER (WHERE id LIKE 'tg\_%' ESCAPE '\') AS legacy_tg_users,
  count(*) FILTER (WHERE telegram_chat_id IS NOT NULL) AS users_with_telegram_chat,
  count(*) FILTER (
    WHERE id LIKE 'tg\_%' ESCAPE '\'
      AND email = id || '@telegram.bot'
  ) AS exact_legacy_fake_emails,
  count(*) FILTER (
    WHERE id NOT LIKE 'user\_%' ESCAPE '\'
      AND id NOT LIKE 'tg\_%' ESCAPE '\'
  ) AS ambiguous_user_ids,
  count(*) FILTER (WHERE filter_version = 2 AND filter_completed_at IS NOT NULL) AS filter_v2_completed
FROM public.users;

SELECT
  telegram_chat_id,
  count(*) AS rows
FROM public.users
WHERE telegram_chat_id IS NOT NULL
GROUP BY telegram_chat_id
HAVING count(*) > 1;

SELECT
  id,
  source,
  telegram_chat_id IS NOT NULL AS has_telegram,
  email IS NOT NULL AS has_email,
  filter_version,
  affiliation
FROM public.users
WHERE id NOT LIKE 'user\_%' ESCAPE '\'
  AND id NOT LIKE 'tg\_%' ESCAPE '\'
ORDER BY created_at
LIMIT 100;
