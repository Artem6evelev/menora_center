-- Menorah Center 21.10.2026. One owner-run block; never resets filter version or answers.
-- Target: owner's confirmed Supabase project, after backup. No migration journal writes.
BEGIN;
DO $$
DECLARE kind text; expected record;
BEGIN
  IF to_regclass('public.users') IS NULL OR to_regclass('public.community_registration_drafts') IS NULL THEN
    RAISE EXCEPTION 'Existing users/registration drafts schema is required; inspect earlier migrations, do not rerun blindly';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='children_data' AND data_type='jsonb')
    OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='filter_completed_at') THEN
    RAISE EXCEPTION 'Incompatible base schema: children_data JSONB/current filter expected';
  END IF;
  FOR expected IN SELECT * FROM (VALUES
    ('users','city','text'), ('users','gender','text'), ('users','affiliation','text'),
    ('users','giyur_stage','text'), ('users','filter_version','integer'), ('users','filter_revision','integer'),
    ('users','filter_completed_at','timestamp with time zone'), ('users','is_profile_complete','boolean'),
    ('community_registration_drafts','id','uuid'), ('community_registration_drafts','token_hash','text'),
    ('community_registration_drafts','payload','jsonb'), ('community_registration_drafts','filter_version','integer'),
    ('community_registration_drafts','owner_id','text'), ('community_registration_drafts','expires_at','timestamp with time zone'),
    ('community_registration_drafts','consumed_at','timestamp with time zone'), ('community_registration_drafts','created_at','timestamp with time zone')
  ) AS required(table_name,column_name,data_type)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public'
      AND c.table_name=expected.table_name AND c.column_name=expected.column_name AND c.data_type=expected.data_type) THEN
      RAISE EXCEPTION 'Incompatible base column %.% (expected %). Inspect prior migrations without rerunning blindly', expected.table_name, expected.column_name, expected.data_type;
    END IF;
  END LOOP;
  SELECT data_type INTO kind FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='city_id';
  IF kind IS NOT NULL AND kind <> 'text' THEN RAISE EXCEPTION 'users.city_id exists with incompatible type %', kind; END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city_id text;
COMMENT ON COLUMN public.users.city_id IS 'Nullable CBS locality code from the versioned Israeli government catalogue. Legacy city strings remain unchanged.';
-- Child gender is optional historical JSONB metadata: male/female. No backfill, no inferred gender.
-- No UPDATE/DELETE, no foreign-key changes, no filter stamp reset or migration history changes.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='city_id' AND data_type='text' AND is_nullable='YES') THEN
    RAISE EXCEPTION 'city_id result is incompatible';
  END IF;
END $$;
SELECT column_name, data_type, is_nullable FROM information_schema.columns
 WHERE table_schema='public' AND table_name='users' AND column_name IN ('city','city_id','children_data','filter_version','filter_completed_at') ORDER BY column_name;
COMMIT;
