-- Menorah Center Mini App identity layer v1
-- PREPARED ONLY. Do not run automatically against remote Supabase.
-- The script is intentionally idempotent and does not invent affiliation/filter answers.

BEGIN;

-- Telegram-first profiles may exist before a Clerk/email identity is linked.
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_instance text NOT NULL DEFAULT 'primary',
  provider_user_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_identities_provider_check') THEN
    ALTER TABLE public.user_identities
      ADD CONSTRAINT user_identities_provider_check
      CHECK (provider IN ('clerk', 'telegram'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS user_identities_provider_subject_idx
  ON public.user_identities(provider, provider_instance, provider_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS user_identities_active_clerk_per_user_idx
  ON public.user_identities(user_id)
  WHERE provider = 'clerk' AND disabled_at IS NULL;

CREATE TABLE IF NOT EXISTS public.telegram_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  telegram_user_id text NOT NULL UNIQUE,
  telegram_chat_id text UNIQUE,
  username text,
  first_name text,
  last_name text,
  language_code text,
  photo_url text,
  allows_write_to_pm boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT true,
  marketing_status text NOT NULL DEFAULT 'unknown',
  marketing_opt_in_at timestamptz,
  unsubscribed_at timestamptz,
  blocked_at timestamptz,
  first_start_param text,
  last_start_param text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_delivery_at timestamptz,
  last_delivery_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'telegram_contacts_marketing_status_check') THEN
    ALTER TABLE public.telegram_contacts
      ADD CONSTRAINT telegram_contacts_marketing_status_check
      CHECK (marketing_status IN ('unknown', 'subscribed', 'unsubscribed', 'blocked'));
  END IF;
END $;

CREATE UNIQUE INDEX IF NOT EXISTS telegram_contacts_one_primary_per_user_idx
  ON public.telegram_contacts(user_id)
  WHERE is_primary = true;

CREATE TABLE IF NOT EXISTS public.user_identity_link_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_instance text NOT NULL DEFAULT 'primary',
  token_hash text NOT NULL UNIQUE,
  return_to text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_identity_link_attempts_provider_check') THEN
    ALTER TABLE public.user_identity_link_attempts
      ADD CONSTRAINT user_identity_link_attempts_provider_check
      CHECK (provider IN ('clerk', 'telegram'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_identity_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id text NOT NULL,
  target_user_id text NOT NULL,
  trigger_provider text NOT NULL,
  trigger_provider_user_id text,
  reason text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Defense in depth: these tables are backend-only.
ALTER TABLE public.user_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identity_link_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identity_merge_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_identities FROM anon, authenticated;
REVOKE ALL ON TABLE public.telegram_contacts FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_identity_link_attempts FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_identity_merge_log FROM anon, authenticated;

-- Existing Clerk profiles: only backfill IDs that are unambiguously Clerk-shaped.
INSERT INTO public.user_identities (
  user_id, provider, provider_instance, provider_user_id, verified_at, last_seen_at, disabled_at
)
SELECT
  u.id, 'clerk', 'primary', u.id, u.created_at, now(), u.identity_disabled_at
FROM public.users u
WHERE u.id LIKE 'user\_%' ESCAPE '\'
ON CONFLICT (provider, provider_instance, provider_user_id)
DO UPDATE SET
  last_seen_at = GREATEST(public.user_identities.last_seen_at, EXCLUDED.last_seen_at),
  disabled_at = EXCLUDED.disabled_at
WHERE public.user_identities.user_id = EXCLUDED.user_id;

-- Existing Telegram rows: old /start stored private chat id. Do not infer any new affiliation.
INSERT INTO public.telegram_contacts (
  user_id, telegram_user_id, telegram_chat_id, username, first_name, last_name,
  marketing_status, first_seen_at, last_seen_at, created_at, updated_at
)
SELECT
  u.id,
  CASE WHEN u.id LIKE 'tg\_%' ESCAPE '\' THEN substring(u.id FROM 4) ELSE u.telegram_chat_id END,
  u.telegram_chat_id,
  NULLIF(u.username, ''),
  NULLIF(u.first_name, ''),
  NULLIF(u.last_name, ''),
  'unknown',
  u.created_at,
  now(),
  u.created_at,
  now()
FROM public.users u
WHERE u.telegram_chat_id IS NOT NULL
ON CONFLICT (telegram_user_id)
DO UPDATE SET
  telegram_chat_id = EXCLUDED.telegram_chat_id,
  username = COALESCE(EXCLUDED.username, public.telegram_contacts.username),
  first_name = COALESCE(EXCLUDED.first_name, public.telegram_contacts.first_name),
  last_name = COALESCE(EXCLUDED.last_name, public.telegram_contacts.last_name),
  last_seen_at = GREATEST(public.telegram_contacts.last_seen_at, EXCLUDED.last_seen_at),
  updated_at = now();

INSERT INTO public.user_identities (
  user_id, provider, provider_instance, provider_user_id, verified_at, last_seen_at
)
SELECT
  tc.user_id, 'telegram', 'primary', tc.telegram_user_id, tc.first_seen_at, tc.last_seen_at
FROM public.telegram_contacts tc
ON CONFLICT (provider, provider_instance, provider_user_id)
DO UPDATE SET
  last_seen_at = GREATEST(public.user_identities.last_seen_at, EXCLUDED.last_seen_at)
WHERE public.user_identities.user_id = EXCLUDED.user_id;

-- Remove only the exact fake email pattern created by the legacy bot.
UPDATE public.users
SET email = NULL
WHERE id LIKE 'tg\_%' ESCAPE '\'
  AND email = id || '@telegram.bot';

COMMIT;

-- Read-only postcheck. Expected: zero duplicate provider subjects and no new filter values invented.
SELECT
  'MENORAH_MINIAPP_IDENTITY_V1_READY' AS result,
  (SELECT count(*) FROM public.user_identities) AS identities,
  (SELECT count(*) FROM public.telegram_contacts) AS telegram_contacts,
  (SELECT count(*) FROM public.users WHERE id LIKE 'tg\_%' ESCAPE '\' AND email = id || '@telegram.bot') AS legacy_fake_emails_remaining;
