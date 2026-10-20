-- Menorah Center / filter version 2 / 20.10.2026
-- OWNER-RUN ONLY in Supabase SQL Editor, after project + backup confirmation.
-- Local configuration points to gwuzekpkfrkmgluzblty; production designation is unconfirmed.
-- One transaction. No participant/profile UPDATE, DELETE, status mapping or ledger backfill.
-- Activation occurs when the compatible application version is released, not by this SQL alone.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL search_path = public, pg_temp;
SELECT pg_advisory_xact_lock(20461020, 2);

CREATE TEMP TABLE menora_expected_user_checks (
 gender text, affiliation text, giyur_stage text, filter_version integer,
 filter_completed_at timestamptz,
 CONSTRAINT users_gender_check CHECK (gender IS NULL OR gender IN ('male','female')),
 CONSTRAINT users_affiliation_check CHECK (affiliation IS NULL OR affiliation IN ('maternal','giyur','none')),
 CONSTRAINT users_giyur_stage_check CHECK (giyur_stage IS NULL OR giyur_stage IN ('advanced','completed')),
 CONSTRAINT users_filter_completion_check CHECK (filter_version IS DISTINCT FROM 2 OR filter_completed_at IS NOT NULL)
) ON COMMIT DROP;

CREATE OR REPLACE FUNCTION pg_temp.menora_column(
 p_table text, p_name text, p_type text, p_required boolean,
 p_add boolean, p_default text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_rel regclass; v_type text; v_required boolean; v_default text;
BEGIN
 v_rel := to_regclass(format('public.%I',p_table));
 IF v_rel IS NULL THEN RAISE EXCEPTION 'Missing required application table public.%',p_table; END IF;
 SELECT format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid)
 INTO v_type,v_required,v_default FROM pg_attribute a
 LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE a.attrelid=v_rel AND a.attname=p_name AND NOT a.attisdropped;
 IF NOT FOUND THEN
  IF NOT p_add THEN RAISE EXCEPTION 'Missing baseline column %.%; this script requires the existing family/application schema',p_table,p_name; END IF;
  EXECUTE format('ALTER TABLE %s ADD COLUMN %I %s%s%s',v_rel,p_name,p_type,
   CASE WHEN p_default IS NULL THEN '' ELSE ' DEFAULT '||p_default END,
   CASE WHEN p_required THEN ' NOT NULL' ELSE '' END);
  SELECT format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid)
  INTO v_type,v_required,v_default FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
  WHERE a.attrelid=v_rel AND a.attname=p_name AND NOT a.attisdropped;
 END IF;
 IF v_type IS DISTINCT FROM p_type OR v_required IS DISTINCT FROM p_required
 OR regexp_replace(v_default,'\s','','g') IS DISTINCT FROM regexp_replace(p_default,'\s','','g') THEN
  RAISE EXCEPTION 'Incompatible definition of %.% (type/nullability/default). No changes committed.',p_table,p_name;
 END IF;
END $$;

-- Existing, data-bearing baseline. Do not fabricate missing family data.
SELECT pg_temp.menora_column(t,c,typ,required,false,def) FROM (VALUES
 ('users','id','text',true,NULL::text), ('users','email','text',true,NULL),
 ('users','first_name','text',false,NULL), ('users','last_name','text',false,NULL),
 ('users','image_url','text',false,NULL), ('users','role','text',true,'''client''::text'),
 ('users','is_profile_complete','boolean',true,'false'), ('users','phone','text',false,NULL),
 ('users','date_of_birth','timestamp with time zone',false,NULL), ('users','city','text',false,NULL),
 ('users','marital_status','text',false,NULL), ('users','spouse_name','text',false,NULL),
 ('users','has_children','boolean',false,'false'), ('users','children_data','jsonb',true,'''[]''::jsonb'),
 ('users','source','text',false,NULL), ('users','tags','text',false,'''[]''::text'),
 ('users','telegram_chat_id','text',false,NULL), ('users','username','text',false,NULL),
 ('users','jewish_status','text',false,NULL), ('users','agreed_to_privacy','boolean',false,'false'),
 ('users','created_at','timestamp with time zone',true,'now()'),
 ('event_participants','user_id','text',true,NULL), ('event_participants','event_id','text',true,NULL),
 ('event_participants','extra_data','jsonb',false,NULL), ('event_participants','status','text',true,'''pending''::text'),
 ('kids_applications','user_id','text',false,NULL), ('kids_applications','children','jsonb',true,'''[]''::jsonb')
) AS expected(t,c,typ,required,def);

DO $$ DECLARE f record; BEGIN
 IF to_regprocedure('gen_random_uuid()') IS NULL THEN RAISE EXCEPTION 'gen_random_uuid() is required'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND contype='p'
  AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.users'::regclass AND attname='id')]::smallint[])
 THEN RAISE EXCEPTION 'users.id must be the existing primary key'; END IF;
 IF EXISTS (SELECT 1 FROM public.users WHERE jsonb_typeof(children_data)<>'array')
 THEN RAISE EXCEPTION 'Existing children_data contains non-array values. Review without deleting data.'; END IF;
 IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename IN ('users','community_audit','community_registration_drafts'))
 THEN RAISE EXCEPTION 'Existing public policies need review for Clerk/server-only access; this script will not replace them'; END IF;
 IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname IN ('users','event_participants','kids_applications') AND NOT c.relrowsecurity)
 THEN RAISE EXCEPTION 'The inspected server-only baseline requires RLS on users, event_participants and kids_applications'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid='public.users'::regclass AND i.indisunique AND i.indisvalid
  AND i.indnatts=1 AND i.indpred IS NULL AND i.indkey[0]=(SELECT attnum FROM pg_attribute WHERE attrelid='public.users'::regclass AND attname='telegram_chat_id'))
 THEN RAISE EXCEPTION 'Expected valid unique index on users.telegram_chat_id is missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.kids_applications'::regclass AND contype='f'
  AND confrelid='public.users'::regclass AND confdeltype='n'
  AND confupdtype='a' AND convalidated AND NOT condeferrable
  AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.kids_applications'::regclass AND attname='user_id')]::smallint[]
  AND confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.users'::regclass AND attname='id')]::smallint[])
 THEN RAISE EXCEPTION 'Expected child-application ownership FK is missing or incompatible'; END IF;
 FOR f IN SELECT * FROM (VALUES ('user_id','users'),('event_id','events')) AS expected(colname,parent_table) LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.event_participants'::regclass
   AND contype='f' AND confrelid=to_regclass(format('public.%I',f.parent_table))
   AND confdeltype='c' AND confupdtype='a' AND convalidated AND NOT condeferrable
   AND conkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid='public.event_participants'::regclass AND attname=f.colname)]::smallint[]
   AND confkey=ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid=to_regclass(format('public.%I',f.parent_table)) AND attname='id')]::smallint[])
  THEN RAISE EXCEPTION 'Expected event-participant FK for % is missing or incompatible',f.colname; END IF;
 END LOOP;
 IF EXISTS (SELECT 1 FROM public.event_participants p LEFT JOIN public.users u ON u.id=p.user_id
  LEFT JOIN public.events e ON e.id=p.event_id WHERE u.id IS NULL OR e.id IS NULL)
 THEN RAISE EXCEPTION 'Existing registrations have missing owners or events. Review without deleting history.'; END IF;
END $$;

-- Strict, additive reconciliation of 0004/0005 effects; no blind reapplication.
SELECT pg_temp.menora_column('users',c,typ,required,true,def) FROM (VALUES
 ('gender','text',false,NULL::text), ('affiliation','text',false,NULL),
 ('filter_version','integer',false,NULL), ('filter_revision','integer',true,'0'),
 ('giyur_stage','text',false,NULL), ('filter_completed_at','timestamp with time zone',false,NULL),
 ('identity_disabled_at','timestamp with time zone',false,NULL)
) AS expected(c,typ,required,def);

DO $$ DECLARE e record; actual text;
BEGIN
 FOR e IN SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint
  WHERE conrelid='pg_temp.menora_expected_user_checks'::regclass LOOP
  SELECT pg_get_constraintdef(oid) INTO actual FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname=e.conname;
  IF FOUND THEN
   IF actual IS DISTINCT FROM e.definition THEN RAISE EXCEPTION 'Incompatible constraint users.%',e.conname; END IF;
  ELSE EXECUTE format('ALTER TABLE public.users ADD CONSTRAINT %I %s',e.conname,e.definition);
  END IF;
 END LOOP;
 FOR e IN SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint
  WHERE conrelid='public.users'::regclass AND contype='c'
  AND conkey && ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid='public.users'::regclass
   AND attname IN ('gender','affiliation','giyur_stage','filter_version','filter_completed_at'))::smallint[] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_constraint p WHERE p.conrelid='pg_temp.menora_expected_user_checks'::regclass
   AND pg_get_constraintdef(p.oid)=e.definition)
  THEN RAISE EXCEPTION 'Unexpected incompatible filter constraint users.%',e.conname; END IF;
 END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.community_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, actor_id text NOT NULL,
 parent_id text NOT NULL, action text NOT NULL, target_id text NOT NULL, reason text NOT NULL,
 details jsonb NOT NULL, created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.community_registration_drafts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, token_hash text NOT NULL,
 payload jsonb NOT NULL, filter_version integer NOT NULL, owner_id text,
 consumed_at timestamptz, expires_at timestamptz NOT NULL, created_at timestamptz DEFAULT now() NOT NULL
);
SELECT pg_temp.menora_column(t,c,typ,required,true,def) FROM (VALUES
 ('community_audit','id','uuid',true,'gen_random_uuid()'),
 ('community_audit','actor_id','text',true,NULL), ('community_audit','parent_id','text',true,NULL),
 ('community_audit','action','text',true,NULL), ('community_audit','target_id','text',true,NULL),
 ('community_audit','reason','text',true,NULL), ('community_audit','details','jsonb',true,NULL),
 ('community_audit','created_at','timestamp with time zone',true,'now()'),
 ('community_registration_drafts','id','uuid',true,'gen_random_uuid()'),
 ('community_registration_drafts','token_hash','text',true,NULL), ('community_registration_drafts','payload','jsonb',true,NULL),
 ('community_registration_drafts','filter_version','integer',true,NULL), ('community_registration_drafts','owner_id','text',false,NULL),
 ('community_registration_drafts','consumed_at','timestamp with time zone',false,NULL),
 ('community_registration_drafts','expires_at','timestamp with time zone',true,NULL),
 ('community_registration_drafts','created_at','timestamp with time zone',true,'now()')
) AS expected(t,c,typ,required,def);

DO $$ DECLARE e record; actual text;
BEGIN
 FOR e IN SELECT * FROM (VALUES
  ('community_audit','community_audit_pkey','PRIMARY KEY (id)'),
  ('community_registration_drafts','community_registration_drafts_pkey','PRIMARY KEY (id)'),
  ('community_registration_drafts','community_registration_drafts_token_hash_unique','UNIQUE (token_hash)'),
  ('community_registration_drafts','community_registration_drafts_owner_id_users_id_fk','FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL')
 ) AS expected(t,n,definition) LOOP
  SELECT pg_get_constraintdef(oid) INTO actual FROM pg_constraint WHERE conrelid=to_regclass(format('public.%I',e.t)) AND conname=e.n;
  IF FOUND THEN
   IF actual IS DISTINCT FROM e.definition THEN RAISE EXCEPTION 'Incompatible constraint %.%',e.t,e.n; END IF;
  ELSE EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s',e.t,e.n,e.definition);
  END IF;
 END LOOP;
END $$;
ALTER TABLE public.community_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_registration_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_audit,public.community_registration_drafts FROM PUBLIC;
DO $$ DECLARE r text;
BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON public.community_audit,public.community_registration_drafts FROM %I',r);
  END IF;
 END LOOP;
 IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname IN
  ('users_gender_check','users_affiliation_check','users_giyur_stage_check','users_filter_completion_check') AND NOT convalidated)
 THEN RAISE EXCEPTION 'Filter constraints must be validated'; END IF;
END $$;

-- Deliberately no writes to either historic migration journal.
-- The application/build/deploy does not run migrations. Canonical native 0007
-- records itself only when run natively on a compatible canonical isolated DB.
SELECT 'MENORA_FILTER_V2_SCHEMA_READY' AS result, 2 AS target_filter_version,
 count(*) AS existing_users_preserved,
 count(*) FILTER (WHERE filter_version=2 AND filter_completed_at IS NOT NULL) AS already_completed_v2
FROM public.users;
COMMIT;
