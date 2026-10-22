-- Unified Identity + Mini App + Telegram release candidate. Review READ ONLY PRECHECK before owner execution.
-- Transactional, repeatable artifact; native migration DDL is preserved; catalog-only compatibility correction is documented.
BEGIN;
-- Identity v1: reviewed Drizzle 0009 body; no remote execution by the agent.
-- Run the separate READ ONLY PRECHECK first. This body is transactional.
SET LOCAL search_path = pg_catalog, public;
--> statement-breakpoint
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
DO $base$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='email' AND data_type='text')
 OR NOT EXISTS(SELECT 1 FROM pg_constraint c WHERE c.conrelid='public.users'::regclass AND c.contype='p' AND pg_get_constraintdef(c.oid)='PRIMARY KEY (id)') THEN
  RAISE EXCEPTION 'Identity v1 requires the existing users text email and unchanged id primary key.';
 END IF;
 IF EXISTS(SELECT 1 FROM public.users WHERE
  (id LIKE 'tg\_%' ESCAPE '\' AND (NOT (id ~ '^tg_[1-9][0-9]{0,15}$' AND (length(id)<19 OR substring(id FROM 4)<='9007199254740991' COLLATE "C")) OR (telegram_chat_id IS NOT NULL AND telegram_chat_id<>substring(id FROM 4))))
  OR (telegram_chat_id IS NOT NULL AND NOT (telegram_chat_id ~ '^[1-9][0-9]{0,15}$' AND (length(telegram_chat_id)<16 OR telegram_chat_id<='9007199254740991' COLLATE "C")))) THEN
  RAISE EXCEPTION 'Identity v1 ambiguous Telegram legacy data; run PRECHECK. No automatic repair.';
 END IF;
END $base$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."telegram_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"telegram_user_id" text NOT NULL,
	"telegram_chat_id" text,
	"username" text,
	"first_name" text,
	"last_name" text,
	"language_code" text,
	"photo_url" text,
	"allows_write_to_pm" boolean DEFAULT false NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"marketing_status" text DEFAULT 'unknown' NOT NULL,
	"marketing_opt_in_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"blocked_at" timestamp with time zone,
	"first_start_param" text,
	"last_start_param" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_delivery_at" timestamp with time zone,
	"last_delivery_error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_contacts_telegram_user_id_unique" UNIQUE("telegram_user_id"),
	CONSTRAINT "telegram_contacts_telegram_chat_id_unique" UNIQUE("telegram_chat_id"),
	CONSTRAINT "telegram_contacts_marketing_status_check" CHECK ("telegram_contacts"."marketing_status" IN ('unknown', 'subscribed', 'unsubscribed', 'blocked'))
);
--> statement-breakpoint
ALTER TABLE public."telegram_contacts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."user_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_instance" text DEFAULT 'primary' NOT NULL,
	"provider_user_id" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verified_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_identities_provider_check" CHECK ("user_identities"."provider" IN ('clerk', 'telegram')),
	CONSTRAINT "user_identities_subject_check" CHECK (length(btrim("user_identities"."provider_instance")) > 0 AND length(btrim("user_identities"."provider_user_id")) > 0)
);
--> statement-breakpoint
ALTER TABLE public."user_identities" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."user_identity_link_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_instance" text DEFAULT 'primary' NOT NULL,
	"token_hash" text NOT NULL,
	"return_to" text,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_identity_link_attempts_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "user_identity_link_attempts_provider_check" CHECK ("user_identity_link_attempts"."provider" IN ('clerk', 'telegram')),
	CONSTRAINT "user_identity_link_attempts_hash_check" CHECK ("user_identity_link_attempts"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "user_identity_link_attempts_lifetime_check" CHECK ("user_identity_link_attempts"."expires_at" > "user_identity_link_attempts"."created_at" AND ("user_identity_link_attempts"."consumed_at" IS NULL OR ("user_identity_link_attempts"."consumed_at" >= "user_identity_link_attempts"."created_at" AND "user_identity_link_attempts"."consumed_at" <= "user_identity_link_attempts"."expires_at")))
);
--> statement-breakpoint
ALTER TABLE public."user_identity_link_attempts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."user_identity_merge_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_user_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"trigger_provider" text NOT NULL,
	"trigger_provider_user_id" text,
	"reason" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_identity_merge_log_provider_check" CHECK ("user_identity_merge_log"."trigger_provider" IN ('clerk', 'telegram')),
	CONSTRAINT "user_identity_merge_log_users_check" CHECK ("user_identity_merge_log"."source_user_id" <> "user_identity_merge_log"."target_user_id" AND length(btrim("user_identity_merge_log"."reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE public."user_identity_merge_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public."users" ALTER COLUMN "email" DROP NOT NULL;
--> statement-breakpoint
DO $fk$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_contacts'::regclass AND conname='telegram_contacts_user_id_users_id_fk') THEN
  ALTER TABLE public."telegram_contacts" ADD CONSTRAINT "telegram_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $fk$;
--> statement-breakpoint
DO $fk$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_identities'::regclass AND conname='user_identities_user_id_users_id_fk') THEN
  ALTER TABLE public."user_identities" ADD CONSTRAINT "user_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $fk$;
--> statement-breakpoint
DO $fk$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.user_identity_link_attempts'::regclass AND conname='user_identity_link_attempts_user_id_users_id_fk') THEN
  ALTER TABLE public."user_identity_link_attempts" ADD CONSTRAINT "user_identity_link_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $fk$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_contacts_one_primary_per_user_idx" ON public."telegram_contacts" USING btree ("user_id") WHERE "telegram_contacts"."is_primary" = true;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_contacts_user_id_idx" ON public."telegram_contacts" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_identities_provider_subject_idx" ON public."user_identities" USING btree ("provider","provider_instance","provider_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_identities_user_id_idx" ON public."user_identities" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_identities_active_clerk_per_user_idx" ON public."user_identities" USING btree ("user_id") WHERE "user_identities"."provider" = 'clerk' AND "user_identities"."disabled_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_identity_link_attempts_user_id_idx" ON public."user_identity_link_attempts" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_identity_link_attempts_open_expiry_idx" ON public."user_identity_link_attempts" USING btree ("expires_at") WHERE "user_identity_link_attempts"."consumed_at" IS NULL;
--> statement-breakpoint
-- Fail atomically on an incompatible pre-existing object; IF NOT EXISTS is not validation.
DO $schema$
DECLARE expected jsonb := $expected${"telegram_contacts":{"columns":[{"name":"allows_write_to_pm","type":"boolean","default":"false","not_null":true},{"name":"blocked_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"created_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"first_name","type":"text","default":null,"not_null":false},{"name":"first_seen_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"first_start_param","type":"text","default":null,"not_null":false},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"is_primary","type":"boolean","default":"true","not_null":true},{"name":"language_code","type":"text","default":null,"not_null":false},{"name":"last_delivery_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"last_delivery_error_code","type":"text","default":null,"not_null":false},{"name":"last_name","type":"text","default":null,"not_null":false},{"name":"last_seen_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"last_start_param","type":"text","default":null,"not_null":false},{"name":"marketing_opt_in_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"marketing_status","type":"text","default":"'unknown'::text","not_null":true},{"name":"photo_url","type":"text","default":null,"not_null":false},{"name":"telegram_chat_id","type":"text","default":null,"not_null":false},{"name":"telegram_user_id","type":"text","default":null,"not_null":true},{"name":"unsubscribed_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"updated_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"user_id","type":"text","default":null,"not_null":true},{"name":"username","type":"text","default":null,"not_null":false}],"indexes":[{"name":"telegram_contacts_one_primary_per_user_idx","valid":true,"definition":"CREATE UNIQUE INDEX telegram_contacts_one_primary_per_user_idx ON public.telegram_contacts USING btree (user_id) WHERE (is_primary = true)"},{"name":"telegram_contacts_pkey","valid":true,"definition":"CREATE UNIQUE INDEX telegram_contacts_pkey ON public.telegram_contacts USING btree (id)"},{"name":"telegram_contacts_telegram_chat_id_unique","valid":true,"definition":"CREATE UNIQUE INDEX telegram_contacts_telegram_chat_id_unique ON public.telegram_contacts USING btree (telegram_chat_id)"},{"name":"telegram_contacts_telegram_user_id_unique","valid":true,"definition":"CREATE UNIQUE INDEX telegram_contacts_telegram_user_id_unique ON public.telegram_contacts USING btree (telegram_user_id)"},{"name":"telegram_contacts_user_id_idx","valid":true,"definition":"CREATE INDEX telegram_contacts_user_id_idx ON public.telegram_contacts USING btree (user_id)"}],"constraints":[{"name":"telegram_contacts_allows_write_to_pm_not_null","type":"n","validated":true,"definition":"NOT NULL allows_write_to_pm"},{"name":"telegram_contacts_created_at_not_null","type":"n","validated":true,"definition":"NOT NULL created_at"},{"name":"telegram_contacts_first_seen_at_not_null","type":"n","validated":true,"definition":"NOT NULL first_seen_at"},{"name":"telegram_contacts_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"telegram_contacts_is_primary_not_null","type":"n","validated":true,"definition":"NOT NULL is_primary"},{"name":"telegram_contacts_last_seen_at_not_null","type":"n","validated":true,"definition":"NOT NULL last_seen_at"},{"name":"telegram_contacts_marketing_status_check","type":"c","validated":true,"definition":"CHECK ((marketing_status = ANY (ARRAY['unknown'::text, 'subscribed'::text, 'unsubscribed'::text, 'blocked'::text])))"},{"name":"telegram_contacts_marketing_status_not_null","type":"n","validated":true,"definition":"NOT NULL marketing_status"},{"name":"telegram_contacts_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"telegram_contacts_telegram_chat_id_unique","type":"u","validated":true,"definition":"UNIQUE (telegram_chat_id)"},{"name":"telegram_contacts_telegram_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL telegram_user_id"},{"name":"telegram_contacts_telegram_user_id_unique","type":"u","validated":true,"definition":"UNIQUE (telegram_user_id)"},{"name":"telegram_contacts_updated_at_not_null","type":"n","validated":true,"definition":"NOT NULL updated_at"},{"name":"telegram_contacts_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL user_id"},{"name":"telegram_contacts_user_id_users_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"}]},"user_identities":{"columns":[{"name":"created_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"disabled_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"last_seen_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"metadata","type":"jsonb","default":"'{}'::jsonb","not_null":true},{"name":"provider","type":"text","default":null,"not_null":true},{"name":"provider_instance","type":"text","default":"'primary'::text","not_null":true},{"name":"provider_user_id","type":"text","default":null,"not_null":true},{"name":"user_id","type":"text","default":null,"not_null":true},{"name":"verified_at","type":"timestamp with time zone","default":null,"not_null":false}],"indexes":[{"name":"user_identities_active_clerk_per_user_idx","valid":true,"definition":"CREATE UNIQUE INDEX user_identities_active_clerk_per_user_idx ON public.user_identities USING btree (user_id) WHERE ((provider = 'clerk'::text) AND (disabled_at IS NULL))"},{"name":"user_identities_pkey","valid":true,"definition":"CREATE UNIQUE INDEX user_identities_pkey ON public.user_identities USING btree (id)"},{"name":"user_identities_provider_subject_idx","valid":true,"definition":"CREATE UNIQUE INDEX user_identities_provider_subject_idx ON public.user_identities USING btree (provider, provider_instance, provider_user_id)"},{"name":"user_identities_user_id_idx","valid":true,"definition":"CREATE INDEX user_identities_user_id_idx ON public.user_identities USING btree (user_id)"}],"constraints":[{"name":"user_identities_created_at_not_null","type":"n","validated":true,"definition":"NOT NULL created_at"},{"name":"user_identities_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"user_identities_last_seen_at_not_null","type":"n","validated":true,"definition":"NOT NULL last_seen_at"},{"name":"user_identities_metadata_not_null","type":"n","validated":true,"definition":"NOT NULL metadata"},{"name":"user_identities_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"user_identities_provider_check","type":"c","validated":true,"definition":"CHECK ((provider = ANY (ARRAY['clerk'::text, 'telegram'::text])))"},{"name":"user_identities_provider_instance_not_null","type":"n","validated":true,"definition":"NOT NULL provider_instance"},{"name":"user_identities_provider_not_null","type":"n","validated":true,"definition":"NOT NULL provider"},{"name":"user_identities_provider_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL provider_user_id"},{"name":"user_identities_subject_check","type":"c","validated":true,"definition":"CHECK (((length(btrim(provider_instance)) > 0) AND (length(btrim(provider_user_id)) > 0)))"},{"name":"user_identities_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL user_id"},{"name":"user_identities_user_id_users_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"}]},"user_identity_link_attempts":{"columns":[{"name":"consumed_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"created_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"expires_at","type":"timestamp with time zone","default":null,"not_null":true},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"provider","type":"text","default":null,"not_null":true},{"name":"provider_instance","type":"text","default":"'primary'::text","not_null":true},{"name":"return_to","type":"text","default":null,"not_null":false},{"name":"token_hash","type":"text","default":null,"not_null":true},{"name":"user_id","type":"text","default":null,"not_null":true}],"indexes":[{"name":"user_identity_link_attempts_open_expiry_idx","valid":true,"definition":"CREATE INDEX user_identity_link_attempts_open_expiry_idx ON public.user_identity_link_attempts USING btree (expires_at) WHERE (consumed_at IS NULL)"},{"name":"user_identity_link_attempts_pkey","valid":true,"definition":"CREATE UNIQUE INDEX user_identity_link_attempts_pkey ON public.user_identity_link_attempts USING btree (id)"},{"name":"user_identity_link_attempts_token_hash_unique","valid":true,"definition":"CREATE UNIQUE INDEX user_identity_link_attempts_token_hash_unique ON public.user_identity_link_attempts USING btree (token_hash)"},{"name":"user_identity_link_attempts_user_id_idx","valid":true,"definition":"CREATE INDEX user_identity_link_attempts_user_id_idx ON public.user_identity_link_attempts USING btree (user_id)"}],"constraints":[{"name":"user_identity_link_attempts_created_at_not_null","type":"n","validated":true,"definition":"NOT NULL created_at"},{"name":"user_identity_link_attempts_expires_at_not_null","type":"n","validated":true,"definition":"NOT NULL expires_at"},{"name":"user_identity_link_attempts_hash_check","type":"c","validated":true,"definition":"CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))"},{"name":"user_identity_link_attempts_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"user_identity_link_attempts_lifetime_check","type":"c","validated":true,"definition":"CHECK (((expires_at > created_at) AND ((consumed_at IS NULL) OR ((consumed_at >= created_at) AND (consumed_at <= expires_at)))))"},{"name":"user_identity_link_attempts_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"user_identity_link_attempts_provider_check","type":"c","validated":true,"definition":"CHECK ((provider = ANY (ARRAY['clerk'::text, 'telegram'::text])))"},{"name":"user_identity_link_attempts_provider_instance_not_null","type":"n","validated":true,"definition":"NOT NULL provider_instance"},{"name":"user_identity_link_attempts_provider_not_null","type":"n","validated":true,"definition":"NOT NULL provider"},{"name":"user_identity_link_attempts_token_hash_not_null","type":"n","validated":true,"definition":"NOT NULL token_hash"},{"name":"user_identity_link_attempts_token_hash_unique","type":"u","validated":true,"definition":"UNIQUE (token_hash)"},{"name":"user_identity_link_attempts_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL user_id"},{"name":"user_identity_link_attempts_user_id_users_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"}]},"user_identity_merge_log":{"columns":[{"name":"created_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"details","type":"jsonb","default":"'{}'::jsonb","not_null":true},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"reason","type":"text","default":null,"not_null":true},{"name":"source_user_id","type":"text","default":null,"not_null":true},{"name":"target_user_id","type":"text","default":null,"not_null":true},{"name":"trigger_provider","type":"text","default":null,"not_null":true},{"name":"trigger_provider_user_id","type":"text","default":null,"not_null":false}],"indexes":[{"name":"user_identity_merge_log_pkey","valid":true,"definition":"CREATE UNIQUE INDEX user_identity_merge_log_pkey ON public.user_identity_merge_log USING btree (id)"}],"constraints":[{"name":"user_identity_merge_log_created_at_not_null","type":"n","validated":true,"definition":"NOT NULL created_at"},{"name":"user_identity_merge_log_details_not_null","type":"n","validated":true,"definition":"NOT NULL details"},{"name":"user_identity_merge_log_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"user_identity_merge_log_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"user_identity_merge_log_provider_check","type":"c","validated":true,"definition":"CHECK ((trigger_provider = ANY (ARRAY['clerk'::text, 'telegram'::text])))"},{"name":"user_identity_merge_log_reason_not_null","type":"n","validated":true,"definition":"NOT NULL reason"},{"name":"user_identity_merge_log_source_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL source_user_id"},{"name":"user_identity_merge_log_target_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL target_user_id"},{"name":"user_identity_merge_log_trigger_provider_not_null","type":"n","validated":true,"definition":"NOT NULL trigger_provider"},{"name":"user_identity_merge_log_users_check","type":"c","validated":true,"definition":"CHECK (((source_user_id <> target_user_id) AND (length(btrim(reason)) > 0)))"}]}}$expected$::jsonb; table_name text; actual jsonb;
BEGIN
 FOR table_name IN SELECT jsonb_object_keys(expected) LOOP
  SELECT jsonb_build_object(
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attname) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass('public.' || table_name) AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',c.conname,'type',c.contype,'definition',pg_get_constraintdef(c.oid),'validated',c.convalidated) ORDER BY c.conname) FROM pg_constraint c WHERE c.conrelid=to_regclass('public.' || table_name)),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('name',i.indexname,'definition',i.indexdef,'valid',x.indisvalid) ORDER BY i.indexname) FROM pg_indexes i JOIN pg_class c ON c.relname=i.indexname JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public' JOIN pg_index x ON x.indexrelid=c.oid WHERE i.schemaname='public' AND i.tablename=table_name)
 ) AS definition INTO actual;
  -- PostgreSQL 17 stores relation NOT NULL in pg_attribute; 18 also emits contype=n.
  -- Column attnotnull is already compared above, so normalize this redundant catalog representation.
  actual := jsonb_set(actual,'{constraints}',(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(actual->'constraints') item WHERE item->>'type'<>'n'));
  expected := jsonb_set(expected,ARRAY[table_name,'constraints'],(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(expected->table_name->'constraints') item WHERE item->>'type'<>'n'));
  IF table_name='user_identities' THEN
   actual := jsonb_set(actual,'{indexes}',(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(actual->'indexes') item WHERE item->>'name'<>'user_identities_id_user_id_idx'));
  END IF;
  IF actual IS DISTINCT FROM expected->table_name THEN
   RAISE EXCEPTION 'Identity v1 incompatible table: %. Run PRECHECK and inspect schema; no automatic repair.',table_name;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_policy WHERE polrelid=to_regclass('public.'||table_name)) THEN
   RAISE EXCEPTION 'Identity v1 backend-only table has unexpected RLS policies: %',table_name;
  END IF;
 END LOOP;
END $schema$;
--> statement-breakpoint
-- Serialize identity/contact import with later merges without changing ownership.
LOCK TABLE public.user_identities, public.telegram_contacts IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
CREATE TEMP TABLE menora_identity_v1_candidates ON COMMIT DROP AS
SELECT u.id AS source_user_id,
 CASE WHEN u.id ~ '^tg_[1-9][0-9]{0,15}$' THEN substring(u.id FROM 4) ELSE u.telegram_chat_id END AS subject,
 u.telegram_chat_id, u.created_at, u.identity_disabled_at,
 CASE WHEN u.id ~ '^tg_[1-9][0-9]{0,15}$' AND u.source='telegram_bot' THEN NULLIF(u.username,'') END AS username,
 CASE WHEN u.id ~ '^tg_[1-9][0-9]{0,15}$' AND u.source='telegram_bot' THEN NULLIF(u.first_name,'') END AS first_name,
 CASE WHEN u.id ~ '^tg_[1-9][0-9]{0,15}$' AND u.source='telegram_bot' THEN NULLIF(u.last_name,'') END AS last_name
FROM public.users u
WHERE u.id ~ '^tg_[1-9][0-9]{0,15}$' OR u.telegram_chat_id IS NOT NULL;
--> statement-breakpoint
DO $coverage$
BEGIN
 IF EXISTS(SELECT 1 FROM menora_identity_v1_candidates c
  WHERE NOT EXISTS(SELECT 1 FROM public.user_identities i WHERE i.provider='telegram' AND i.provider_instance='primary' AND i.provider_user_id=c.subject)
  GROUP BY c.subject HAVING count(*)>1) THEN
  RAISE EXCEPTION 'Identity v1 duplicate legacy Telegram subject without a proven mapping; run PRECHECK.';
 END IF;
 IF EXISTS(SELECT 1 FROM public.telegram_contacts c LEFT JOIN public.user_identities i
  ON i.provider='telegram' AND i.provider_instance='primary' AND i.provider_user_id=c.telegram_user_id
  WHERE i.id IS NULL OR i.user_id<>c.user_id) THEN
  RAISE EXCEPTION 'Identity v1 contact/identity ownership mismatch. No automatic relinking.';
 END IF;
END $coverage$;
--> statement-breakpoint
-- Strict Clerk-shaped IDs only. An import is not a fresh OAuth verification.
-- DO NOTHING is intentional: never reactivate/reassign a linked or merged subject.
INSERT INTO public.user_identities(user_id,provider,provider_instance,provider_user_id,metadata,verified_at,last_seen_at,disabled_at,created_at)
SELECT id,'clerk','primary',id,'{"legacyImport":"clerk_shaped_id","proofRequired":true}'::jsonb,NULL,created_at,identity_disabled_at,created_at
FROM public.users WHERE id ~ '^user_[A-Za-z0-9]{27}$'
ON CONFLICT(provider,provider_instance,provider_user_id) DO NOTHING;
--> statement-breakpoint
INSERT INTO public.user_identities(user_id,provider,provider_instance,provider_user_id,metadata,verified_at,last_seen_at,disabled_at,created_at)
SELECT DISTINCT ON(subject) source_user_id,'telegram','primary',subject,'{"legacyImport":"telegram_private_chat_or_tg_id","proofRequired":true}'::jsonb,NULL,created_at,identity_disabled_at,created_at
FROM menora_identity_v1_candidates ORDER BY subject,created_at,source_user_id
ON CONFLICT(provider,provider_instance,provider_user_id) DO NOTHING;
--> statement-breakpoint
-- Resolve the owner from the identity, not the stale users.telegram_chat_id cache.
-- Existing contact metadata, consent, attribution, disabled state and ownership are untouched.
WITH source AS (
 SELECT DISTINCT ON(c.subject) c.*,i.user_id AS owner_id
 FROM menora_identity_v1_candidates c JOIN public.user_identities i
 ON i.provider='telegram' AND i.provider_instance='primary' AND i.provider_user_id=c.subject
 ORDER BY c.subject,(c.telegram_chat_id IS NOT NULL) DESC,c.created_at,c.source_user_id
), ranked AS (
 SELECT source.*,row_number() OVER(PARTITION BY owner_id ORDER BY created_at,subject) AS position
 FROM source WHERE NOT EXISTS(SELECT 1 FROM public.telegram_contacts tc WHERE tc.telegram_user_id=source.subject)
)
INSERT INTO public.telegram_contacts(user_id,telegram_user_id,telegram_chat_id,username,first_name,last_name,is_primary,marketing_status,first_seen_at,last_seen_at,created_at,updated_at)
SELECT owner_id,subject,telegram_chat_id,username,first_name,last_name,
 position=1 AND NOT EXISTS(SELECT 1 FROM public.telegram_contacts tc WHERE tc.user_id=ranked.owner_id AND tc.is_primary),
 'unknown',created_at,created_at,created_at,created_at
FROM ranked ON CONFLICT(telegram_user_id) DO NOTHING;
--> statement-breakpoint
-- The sole existing-profile data change: exact legacy bot address to NULL.
UPDATE public.users SET email=NULL
WHERE id ~ '^tg_[1-9][0-9]{0,15}$' AND email=id||'@telegram.bot';
--> statement-breakpoint
DO $consistent$
BEGIN
 IF EXISTS(SELECT 1 FROM public.telegram_contacts c LEFT JOIN public.user_identities i
 ON i.provider='telegram' AND i.provider_instance='primary' AND i.provider_user_id=c.telegram_user_id
 WHERE i.id IS NULL OR i.user_id<>c.user_id) THEN
  RAISE EXCEPTION 'Identity v1 contact/identity ownership mismatch after import.';
 END IF;
 IF EXISTS(SELECT 1 FROM public.telegram_contacts GROUP BY user_id HAVING count(*) FILTER(WHERE is_primary)<>1) THEN
  RAISE EXCEPTION 'Identity v1 each contact owner must have exactly one primary contact.';
 END IF;
END $consistent$;
--> statement-breakpoint
-- An audit log survives source profile deletion and rejects normal mutation.
CREATE OR REPLACE FUNCTION public.menora_identity_merge_log_append_only()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $audit$
BEGIN
 RAISE EXCEPTION 'user_identity_merge_log is append-only';
END $audit$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER user_identity_merge_log_no_mutation
BEFORE UPDATE OR DELETE OR TRUNCATE ON public.user_identity_merge_log
FOR EACH STATEMENT EXECUTE FUNCTION public.menora_identity_merge_log_append_only();
--> statement-breakpoint
ALTER TABLE public.user_identity_merge_log ENABLE TRIGGER user_identity_merge_log_no_mutation;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.menora_identity_merge_log_append_only() FROM PUBLIC;
--> statement-breakpoint
-- Revoke both table and column grants; PUBLIC and inherited grants matter too.
-- Never add a public policy or substitute Supabase auth.uid() for our identity model.
DO $security$
DECLARE t text; r text; cols text; oid_table oid; priv text;
BEGIN
 FOREACH t IN ARRAY ARRAY['user_identities','telegram_contacts','user_identity_link_attempts','user_identity_merge_log'] LOOP
  oid_table:=to_regclass('public.'||t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid=oid_table AND attnum>0 AND NOT attisdropped;
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM PUBLIC',cols,t);
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',t,r);
    EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM %I',cols,t,r);
    EXECUTE format('REVOKE ALL ON FUNCTION public.menora_identity_merge_log_append_only() FROM %I',r);
    IF has_function_privilege(r,'public.menora_identity_merge_log_append_only()','EXECUTE') THEN RAISE EXCEPTION 'Identity v1 inherited function privilege remains: %',r; END IF;
    FOREACH priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
     IF has_table_privilege(r,oid_table,priv) THEN RAISE EXCEPTION 'Identity v1 inherited/owner privilege remains: %.%',r,t; END IF;
    END LOOP;
    IF EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=oid_table AND a.attnum>0 AND NOT a.attisdropped
     AND (has_column_privilege(r,oid_table,a.attnum,'SELECT') OR has_column_privilege(r,oid_table,a.attnum,'INSERT') OR has_column_privilege(r,oid_table,a.attnum,'UPDATE') OR has_column_privilege(r,oid_table,a.attnum,'REFERENCES'))) THEN
     RAISE EXCEPTION 'Identity v1 inherited column privilege remains: %.%',r,t;
    END IF;
   END IF;
  END LOOP;
 END LOOP;
END $security$;

--> statement-breakpoint
-- Mini App auth v1. Native runner supplies the transaction; no remote execution.
SET LOCAL search_path = pg_catalog, public;
--> statement-breakpoint
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
LOCK TABLE public.user_identities IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_identities_id_user_id_idx" ON public."user_identities" USING btree ("id","user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."telegram_miniapp_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"identity_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_miniapp_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "telegram_miniapp_sessions_hash_check" CHECK ("telegram_miniapp_sessions"."token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "telegram_miniapp_sessions_lifetime_check" CHECK ("telegram_miniapp_sessions"."expires_at" > "telegram_miniapp_sessions"."created_at" AND "telegram_miniapp_sessions"."last_seen_at" >= "telegram_miniapp_sessions"."created_at" AND ("telegram_miniapp_sessions"."revoked_at" IS NULL OR "telegram_miniapp_sessions"."revoked_at" >= "telegram_miniapp_sessions"."created_at"))
);
--> statement-breakpoint
ALTER TABLE public."telegram_miniapp_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $fk$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_miniapp_sessions'::regclass AND conname='telegram_miniapp_sessions_user_id_users_id_fk') THEN
  ALTER TABLE public."telegram_miniapp_sessions" ADD CONSTRAINT "telegram_miniapp_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
 END IF;
END $fk$;
--> statement-breakpoint
DO $fk$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_miniapp_sessions'::regclass AND conname='telegram_miniapp_sessions_identity_owner_fk') THEN
  ALTER TABLE public."telegram_miniapp_sessions" ADD CONSTRAINT "telegram_miniapp_sessions_identity_owner_fk" FOREIGN KEY ("identity_id","user_id") REFERENCES "public"."user_identities"("id","user_id") ON DELETE cascade ON UPDATE cascade;
 END IF;
END $fk$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_miniapp_sessions_user_id_idx" ON public."telegram_miniapp_sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_miniapp_sessions_identity_id_idx" ON public."telegram_miniapp_sessions" USING btree ("identity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_miniapp_sessions_open_expiry_idx" ON public."telegram_miniapp_sessions" USING btree ("expires_at") WHERE "telegram_miniapp_sessions"."revoked_at" IS NULL;
--> statement-breakpoint
-- Fail atomically on an incompatible pre-existing object; IF NOT EXISTS is not validation.
DO $schema$
DECLARE expected jsonb := $expected${"telegram_miniapp_sessions":{"columns":[{"name":"created_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"expires_at","type":"timestamp with time zone","default":null,"not_null":true},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"identity_id","type":"uuid","default":null,"not_null":true},{"name":"last_seen_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"revoked_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"token_hash","type":"text","default":null,"not_null":true},{"name":"user_id","type":"text","default":null,"not_null":true}],"indexes":[{"name":"telegram_miniapp_sessions_identity_id_idx","valid":true,"definition":"CREATE INDEX telegram_miniapp_sessions_identity_id_idx ON public.telegram_miniapp_sessions USING btree (identity_id)"},{"name":"telegram_miniapp_sessions_open_expiry_idx","valid":true,"definition":"CREATE INDEX telegram_miniapp_sessions_open_expiry_idx ON public.telegram_miniapp_sessions USING btree (expires_at) WHERE (revoked_at IS NULL)"},{"name":"telegram_miniapp_sessions_pkey","valid":true,"definition":"CREATE UNIQUE INDEX telegram_miniapp_sessions_pkey ON public.telegram_miniapp_sessions USING btree (id)"},{"name":"telegram_miniapp_sessions_token_hash_unique","valid":true,"definition":"CREATE UNIQUE INDEX telegram_miniapp_sessions_token_hash_unique ON public.telegram_miniapp_sessions USING btree (token_hash)"},{"name":"telegram_miniapp_sessions_user_id_idx","valid":true,"definition":"CREATE INDEX telegram_miniapp_sessions_user_id_idx ON public.telegram_miniapp_sessions USING btree (user_id)"}],"constraints":[{"name":"telegram_miniapp_sessions_created_at_not_null","type":"n","validated":true,"definition":"NOT NULL created_at"},{"name":"telegram_miniapp_sessions_expires_at_not_null","type":"n","validated":true,"definition":"NOT NULL expires_at"},{"name":"telegram_miniapp_sessions_hash_check","type":"c","validated":true,"definition":"CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))"},{"name":"telegram_miniapp_sessions_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"telegram_miniapp_sessions_identity_id_not_null","type":"n","validated":true,"definition":"NOT NULL identity_id"},{"name":"telegram_miniapp_sessions_identity_owner_fk","type":"f","validated":true,"definition":"FOREIGN KEY (identity_id, user_id) REFERENCES user_identities(id, user_id) ON UPDATE CASCADE ON DELETE CASCADE"},{"name":"telegram_miniapp_sessions_last_seen_at_not_null","type":"n","validated":true,"definition":"NOT NULL last_seen_at"},{"name":"telegram_miniapp_sessions_lifetime_check","type":"c","validated":true,"definition":"CHECK (((expires_at > created_at) AND (last_seen_at >= created_at) AND ((revoked_at IS NULL) OR (revoked_at >= created_at))))"},{"name":"telegram_miniapp_sessions_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"telegram_miniapp_sessions_token_hash_not_null","type":"n","validated":true,"definition":"NOT NULL token_hash"},{"name":"telegram_miniapp_sessions_token_hash_unique","type":"u","validated":true,"definition":"UNIQUE (token_hash)"},{"name":"telegram_miniapp_sessions_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL user_id"},{"name":"telegram_miniapp_sessions_user_id_users_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"}]}}$expected$::jsonb; table_name text; actual jsonb;
BEGIN
 FOR table_name IN SELECT jsonb_object_keys(expected) LOOP
  SELECT jsonb_build_object(
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attname) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass('public.' || table_name) AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',c.conname,'type',c.contype,'definition',pg_get_constraintdef(c.oid),'validated',c.convalidated) ORDER BY c.conname) FROM pg_constraint c WHERE c.conrelid=to_regclass('public.' || table_name)),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('name',i.indexname,'definition',i.indexdef,'valid',x.indisvalid) ORDER BY i.indexname) FROM pg_indexes i JOIN pg_class c ON c.relname=i.indexname JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public' JOIN pg_index x ON x.indexrelid=c.oid WHERE i.schemaname='public' AND i.tablename=table_name)
 ) AS definition INTO actual;
  -- PostgreSQL 17 stores relation NOT NULL in pg_attribute; 18 also emits contype=n.
  -- Column attnotnull is already compared above, so normalize this redundant catalog representation.
  actual := jsonb_set(actual,'{constraints}',(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(actual->'constraints') item WHERE item->>'type'<>'n'));
  expected := jsonb_set(expected,ARRAY[table_name,'constraints'],(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(expected->table_name->'constraints') item WHERE item->>'type'<>'n'));
  IF actual IS DISTINCT FROM expected->table_name THEN
   RAISE EXCEPTION 'Mini App sessions v1 incompatible table: %. Run PRECHECK and inspect schema; no automatic repair.',table_name;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_policy WHERE polrelid=to_regclass('public.'||table_name)) THEN
   RAISE EXCEPTION 'Mini App sessions v1 backend-only table has unexpected RLS policies: %',table_name;
  END IF;
 END LOOP;
END $schema$;
--> statement-breakpoint
-- The composite FK prevents a session from naming a different canonical owner.
DO $owner_index$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_indexes i JOIN pg_class c ON c.relname=i.indexname
 JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public' JOIN pg_index x ON x.indexrelid=c.oid
 WHERE i.schemaname='public' AND i.tablename='user_identities' AND i.indexname='user_identities_id_user_id_idx'
 AND i.indexdef='CREATE UNIQUE INDEX user_identities_id_user_id_idx ON public.user_identities USING btree (id, user_id)' AND x.indisvalid AND x.indisunique) THEN
 RAISE EXCEPTION 'Mini App sessions v1 incompatible identity owner index';
 END IF;
END $owner_index$;
--> statement-breakpoint
-- Revoke both table and column grants; PUBLIC and inherited grants matter too.
-- Never add a public policy or substitute Supabase auth.uid() for our identity model.
DO $security$
DECLARE t text; r text; cols text; oid_table oid; priv text;
BEGIN
 FOREACH t IN ARRAY ARRAY['telegram_miniapp_sessions'] LOOP
  oid_table:=to_regclass('public.'||t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid=oid_table AND attnum>0 AND NOT attisdropped;
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM PUBLIC',cols,t);
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',t,r);
    EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM %I',cols,t,r);
    FOREACH priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
     IF has_table_privilege(r,oid_table,priv) THEN RAISE EXCEPTION 'Identity v1 inherited/owner privilege remains: %.%',r,t; END IF;
    END LOOP;
    IF EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=oid_table AND a.attnum>0 AND NOT a.attisdropped
     AND (has_column_privilege(r,oid_table,a.attnum,'SELECT') OR has_column_privilege(r,oid_table,a.attnum,'INSERT') OR has_column_privilege(r,oid_table,a.attnum,'UPDATE') OR has_column_privilege(r,oid_table,a.attnum,'REFERENCES'))) THEN
     RAISE EXCEPTION 'Identity v1 inherited column privilege remains: %.%',r,t;
    END IF;
   END IF;
  END LOOP;
 END LOOP;
END $security$;

--> statement-breakpoint
-- Additive Telegram release candidate; native runner owns transaction.
SET LOCAL search_path=pg_catalog,public;
--> statement-breakpoint
SET LOCAL lock_timeout='5s';
--> statement-breakpoint
-- Additive Telegram release candidate; native runner owns transaction.
SET LOCAL search_path=pg_catalog,public;
--> statement-breakpoint
SET LOCAL lock_timeout='5s';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."event_payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" text NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"amount_agorot" integer NOT NULL,
	"currency" text DEFAULT 'ILS' NOT NULL,
	"provider" text DEFAULT 'shutafim' NOT NULL,
	"selection_hash" text NOT NULL,
	"payment_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "event_payment_attempts_registration_id_unique" UNIQUE("registration_id"),
	CONSTRAINT "event_payment_attempts_amount_check" CHECK ("event_payment_attempts"."amount_agorot">0 AND "event_payment_attempts"."currency"='ILS' AND "event_payment_attempts"."provider"='shutafim'),
	CONSTRAINT "event_payment_attempts_status_check" CHECK ("event_payment_attempts"."status" IN ('pending','paid','cancelled') AND "event_payment_attempts"."selection_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "event_payment_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."telegram_broadcast_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broadcast_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"error_class" text,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "telegram_delivery_status_check" CHECK ("telegram_broadcast_deliveries"."status" IN ('queued','sending','delivered','skipped','failed','unknown') AND "telegram_broadcast_deliveries"."attempts" BETWEEN 0 AND 5)
);
--> statement-breakpoint
ALTER TABLE "telegram_broadcast_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."telegram_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_key" uuid NOT NULL,
	"created_by" text NOT NULL,
	"message" text NOT NULL,
	"event_id" text,
	"button_label" text,
	"audience" jsonb NOT NULL,
	"recipient_count" integer NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_broadcasts_request_key_unique" UNIQUE("request_key"),
	CONSTRAINT "telegram_broadcasts_status_check" CHECK ("telegram_broadcasts"."status" IN ('queued','completed','cancelled') AND "telegram_broadcasts"."recipient_count">=0 AND length("telegram_broadcasts"."message") BETWEEN 1 AND 3500)
);
--> statement-breakpoint
ALTER TABLE "telegram_broadcasts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."telegram_campaigns" (
	"key" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "telegram_campaigns_key_check" CHECK ("telegram_campaigns"."key" ~ '^[A-Za-z0-9_-]{1,64}$')
);
--> statement-breakpoint
ALTER TABLE "telegram_campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS public."telegram_updates" (
	"update_id" text PRIMARY KEY NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_updates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.event_payment_attempts'::regclass AND conname='event_payment_attempts_registration_id_event_participants_id_fk') THEN ALTER TABLE public."event_payment_attempts" ADD CONSTRAINT "event_payment_attempts_registration_id_event_participants_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."event_participants"("id") ON DELETE restrict ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.event_payment_attempts'::regclass AND conname='event_payment_attempts_user_id_users_id_fk') THEN ALTER TABLE public."event_payment_attempts" ADD CONSTRAINT "event_payment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.event_payment_attempts'::regclass AND conname='event_payment_attempts_event_id_events_id_fk') THEN ALTER TABLE public."event_payment_attempts" ADD CONSTRAINT "event_payment_attempts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_broadcast_deliveries'::regclass AND conname='telegram_broadcast_deliveries_broadcast_id_telegram_broadcasts_id_fk') THEN ALTER TABLE public."telegram_broadcast_deliveries" ADD CONSTRAINT "telegram_broadcast_deliveries_broadcast_id_telegram_broadcasts_id_fk" FOREIGN KEY ("broadcast_id") REFERENCES "public"."telegram_broadcasts"("id") ON DELETE cascade ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_broadcast_deliveries'::regclass AND conname='telegram_broadcast_deliveries_contact_id_telegram_contacts_id_fk') THEN ALTER TABLE public."telegram_broadcast_deliveries" ADD CONSTRAINT "telegram_broadcast_deliveries_contact_id_telegram_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."telegram_contacts"("id") ON DELETE restrict ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_broadcasts'::regclass AND conname='telegram_broadcasts_created_by_users_id_fk') THEN ALTER TABLE public."telegram_broadcasts" ADD CONSTRAINT "telegram_broadcasts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_broadcasts'::regclass AND conname='telegram_broadcasts_event_id_events_id_fk') THEN ALTER TABLE public."telegram_broadcasts" ADD CONSTRAINT "telegram_broadcasts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
DO $fk$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.telegram_campaigns'::regclass AND conname='telegram_campaigns_event_id_events_id_fk') THEN ALTER TABLE public."telegram_campaigns" ADD CONSTRAINT "telegram_campaigns_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action; END IF; END $fk$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_payment_attempts_owner_idx" ON "event_payment_attempts" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_delivery_recipient_idx" ON "telegram_broadcast_deliveries" USING btree ("broadcast_id","contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_delivery_due_idx" ON "telegram_broadcast_deliveries" USING btree ("status","next_attempt_at","id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_broadcasts_created_idx" ON "telegram_broadcasts" USING btree ("created_at");
--> statement-breakpoint

--> statement-breakpoint
DO $schema$
DECLARE expected jsonb := $expected${"event_payment_attempts":{"columns":[{"name":"amount_agorot","type":"integer","default":null,"not_null":true},{"name":"confirmed_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"created_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"currency","type":"text","default":"'ILS'::text","not_null":true},{"name":"event_id","type":"text","default":null,"not_null":true},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"payment_url","type":"text","default":null,"not_null":true},{"name":"provider","type":"text","default":"'shutafim'::text","not_null":true},{"name":"registration_id","type":"text","default":null,"not_null":true},{"name":"selection_hash","type":"text","default":null,"not_null":true},{"name":"status","type":"text","default":"'pending'::text","not_null":true},{"name":"user_id","type":"text","default":null,"not_null":true}],"indexes":[{"name":"event_payment_attempts_owner_idx","valid":true,"definition":"CREATE INDEX event_payment_attempts_owner_idx ON public.event_payment_attempts USING btree (user_id, event_id)"},{"name":"event_payment_attempts_pkey","valid":true,"definition":"CREATE UNIQUE INDEX event_payment_attempts_pkey ON public.event_payment_attempts USING btree (id)"},{"name":"event_payment_attempts_registration_id_unique","valid":true,"definition":"CREATE UNIQUE INDEX event_payment_attempts_registration_id_unique ON public.event_payment_attempts USING btree (registration_id)"}],"constraints":[{"name":"event_payment_attempts_amount_agorot_not_null","type":"n","validated":true,"definition":"NOT NULL amount_agorot"},{"name":"event_payment_attempts_amount_check","type":"c","validated":true,"definition":"CHECK (((amount_agorot > 0) AND (currency = 'ILS'::text) AND (provider = 'shutafim'::text)))"},{"name":"event_payment_attempts_created_at_not_null","type":"n","validated":true,"definition":"NOT NULL created_at"},{"name":"event_payment_attempts_currency_not_null","type":"n","validated":true,"definition":"NOT NULL currency"},{"name":"event_payment_attempts_event_id_events_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT"},{"name":"event_payment_attempts_event_id_not_null","type":"n","validated":true,"definition":"NOT NULL event_id"},{"name":"event_payment_attempts_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"event_payment_attempts_payment_url_not_null","type":"n","validated":true,"definition":"NOT NULL payment_url"},{"name":"event_payment_attempts_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"event_payment_attempts_provider_not_null","type":"n","validated":true,"definition":"NOT NULL provider"},{"name":"event_payment_attempts_registration_id_event_participants_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (registration_id) REFERENCES event_participants(id) ON DELETE RESTRICT"},{"name":"event_payment_attempts_registration_id_not_null","type":"n","validated":true,"definition":"NOT NULL registration_id"},{"name":"event_payment_attempts_registration_id_unique","type":"u","validated":true,"definition":"UNIQUE (registration_id)"},{"name":"event_payment_attempts_selection_hash_not_null","type":"n","validated":true,"definition":"NOT NULL selection_hash"},{"name":"event_payment_attempts_status_check","type":"c","validated":true,"definition":"CHECK (((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])) AND (selection_hash ~ '^[0-9a-f]{64}$'::text)))"},{"name":"event_payment_attempts_status_not_null","type":"n","validated":true,"definition":"NOT NULL status"},{"name":"event_payment_attempts_user_id_not_null","type":"n","validated":true,"definition":"NOT NULL user_id"},{"name":"event_payment_attempts_user_id_users_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT"}]},"telegram_broadcast_deliveries":{"columns":[{"name":"attempts","type":"integer","default":"0","not_null":true},{"name":"broadcast_id","type":"uuid","default":null,"not_null":true},{"name":"claimed_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"contact_id","type":"uuid","default":null,"not_null":true},{"name":"delivered_at","type":"timestamp with time zone","default":null,"not_null":false},{"name":"error_class","type":"text","default":null,"not_null":false},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"next_attempt_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"status","type":"text","default":"'queued'::text","not_null":true}],"indexes":[{"name":"telegram_broadcast_deliveries_pkey","valid":true,"definition":"CREATE UNIQUE INDEX telegram_broadcast_deliveries_pkey ON public.telegram_broadcast_deliveries USING btree (id)"},{"name":"telegram_delivery_due_idx","valid":true,"definition":"CREATE INDEX telegram_delivery_due_idx ON public.telegram_broadcast_deliveries USING btree (status, next_attempt_at, id)"},{"name":"telegram_delivery_recipient_idx","valid":true,"definition":"CREATE UNIQUE INDEX telegram_delivery_recipient_idx ON public.telegram_broadcast_deliveries USING btree (broadcast_id, contact_id)"}],"constraints":[{"name":"telegram_broadcast_deliveries_attempts_not_null","type":"n","validated":true,"definition":"NOT NULL attempts"},{"name":"telegram_broadcast_deliveries_broadcast_id_not_null","type":"n","validated":true,"definition":"NOT NULL broadcast_id"},{"name":"telegram_broadcast_deliveries_broadcast_id_telegram_broadcasts_","type":"f","validated":true,"definition":"FOREIGN KEY (broadcast_id) REFERENCES telegram_broadcasts(id) ON DELETE CASCADE"},{"name":"telegram_broadcast_deliveries_contact_id_not_null","type":"n","validated":true,"definition":"NOT NULL contact_id"},{"name":"telegram_broadcast_deliveries_contact_id_telegram_contacts_id_f","type":"f","validated":true,"definition":"FOREIGN KEY (contact_id) REFERENCES telegram_contacts(id) ON DELETE RESTRICT"},{"name":"telegram_broadcast_deliveries_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"telegram_broadcast_deliveries_next_attempt_at_not_null","type":"n","validated":true,"definition":"NOT NULL next_attempt_at"},{"name":"telegram_broadcast_deliveries_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"telegram_broadcast_deliveries_status_not_null","type":"n","validated":true,"definition":"NOT NULL status"},{"name":"telegram_delivery_status_check","type":"c","validated":true,"definition":"CHECK (((status = ANY (ARRAY['queued'::text, 'sending'::text, 'delivered'::text, 'skipped'::text, 'failed'::text, 'unknown'::text])) AND ((attempts >= 0) AND (attempts <= 5))))"}]},"telegram_broadcasts":{"columns":[{"name":"audience","type":"jsonb","default":null,"not_null":true},{"name":"button_label","type":"text","default":null,"not_null":false},{"name":"created_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"created_by","type":"text","default":null,"not_null":true},{"name":"event_id","type":"text","default":null,"not_null":false},{"name":"id","type":"uuid","default":"gen_random_uuid()","not_null":true},{"name":"message","type":"text","default":null,"not_null":true},{"name":"recipient_count","type":"integer","default":null,"not_null":true},{"name":"request_key","type":"uuid","default":null,"not_null":true},{"name":"status","type":"text","default":"'queued'::text","not_null":true}],"indexes":[{"name":"telegram_broadcasts_created_idx","valid":true,"definition":"CREATE INDEX telegram_broadcasts_created_idx ON public.telegram_broadcasts USING btree (created_at)"},{"name":"telegram_broadcasts_pkey","valid":true,"definition":"CREATE UNIQUE INDEX telegram_broadcasts_pkey ON public.telegram_broadcasts USING btree (id)"},{"name":"telegram_broadcasts_request_key_unique","valid":true,"definition":"CREATE UNIQUE INDEX telegram_broadcasts_request_key_unique ON public.telegram_broadcasts USING btree (request_key)"}],"constraints":[{"name":"telegram_broadcasts_audience_not_null","type":"n","validated":true,"definition":"NOT NULL audience"},{"name":"telegram_broadcasts_created_at_not_null","type":"n","validated":true,"definition":"NOT NULL created_at"},{"name":"telegram_broadcasts_created_by_not_null","type":"n","validated":true,"definition":"NOT NULL created_by"},{"name":"telegram_broadcasts_created_by_users_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT"},{"name":"telegram_broadcasts_event_id_events_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL"},{"name":"telegram_broadcasts_id_not_null","type":"n","validated":true,"definition":"NOT NULL id"},{"name":"telegram_broadcasts_message_not_null","type":"n","validated":true,"definition":"NOT NULL message"},{"name":"telegram_broadcasts_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (id)"},{"name":"telegram_broadcasts_recipient_count_not_null","type":"n","validated":true,"definition":"NOT NULL recipient_count"},{"name":"telegram_broadcasts_request_key_not_null","type":"n","validated":true,"definition":"NOT NULL request_key"},{"name":"telegram_broadcasts_request_key_unique","type":"u","validated":true,"definition":"UNIQUE (request_key)"},{"name":"telegram_broadcasts_status_check","type":"c","validated":true,"definition":"CHECK (((status = ANY (ARRAY['queued'::text, 'completed'::text, 'cancelled'::text])) AND (recipient_count >= 0) AND ((length(message) >= 1) AND (length(message) <= 3500))))"},{"name":"telegram_broadcasts_status_not_null","type":"n","validated":true,"definition":"NOT NULL status"}]},"telegram_campaigns":{"columns":[{"name":"active","type":"boolean","default":"true","not_null":true},{"name":"event_id","type":"text","default":null,"not_null":false},{"name":"key","type":"text","default":null,"not_null":true}],"indexes":[{"name":"telegram_campaigns_pkey","valid":true,"definition":"CREATE UNIQUE INDEX telegram_campaigns_pkey ON public.telegram_campaigns USING btree (key)"}],"constraints":[{"name":"telegram_campaigns_active_not_null","type":"n","validated":true,"definition":"NOT NULL active"},{"name":"telegram_campaigns_event_id_events_id_fk","type":"f","validated":true,"definition":"FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL"},{"name":"telegram_campaigns_key_check","type":"c","validated":true,"definition":"CHECK ((key ~ '^[A-Za-z0-9_-]{1,64}$'::text))"},{"name":"telegram_campaigns_key_not_null","type":"n","validated":true,"definition":"NOT NULL key"},{"name":"telegram_campaigns_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (key)"}]},"telegram_updates":{"columns":[{"name":"processed_at","type":"timestamp with time zone","default":"now()","not_null":true},{"name":"update_id","type":"text","default":null,"not_null":true}],"indexes":[{"name":"telegram_updates_pkey","valid":true,"definition":"CREATE UNIQUE INDEX telegram_updates_pkey ON public.telegram_updates USING btree (update_id)"}],"constraints":[{"name":"telegram_updates_pkey","type":"p","validated":true,"definition":"PRIMARY KEY (update_id)"},{"name":"telegram_updates_processed_at_not_null","type":"n","validated":true,"definition":"NOT NULL processed_at"},{"name":"telegram_updates_update_id_not_null","type":"n","validated":true,"definition":"NOT NULL update_id"}]}}$expected$::jsonb; table_name text; actual jsonb;
BEGIN
 FOR table_name IN SELECT jsonb_object_keys(expected) LOOP
  SELECT jsonb_build_object(
 'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attname) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=to_regclass('public.' || table_name) AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',c.conname,'type',c.contype,'definition',pg_get_constraintdef(c.oid),'validated',c.convalidated) ORDER BY c.conname) FROM pg_constraint c WHERE c.conrelid=to_regclass('public.' || table_name)),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('name',i.indexname,'definition',i.indexdef,'valid',x.indisvalid) ORDER BY i.indexname) FROM pg_indexes i JOIN pg_class c ON c.relname=i.indexname JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public' JOIN pg_index x ON x.indexrelid=c.oid WHERE i.schemaname='public' AND i.tablename=table_name)
 ) AS definition INTO actual;
  -- PostgreSQL 17 stores relation NOT NULL in pg_attribute; 18 also emits contype=n.
  -- Column attnotnull is already compared above, so normalize this redundant catalog representation.
  actual := jsonb_set(actual,'{constraints}',(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(actual->'constraints') item WHERE item->>'type'<>'n'));
  expected := jsonb_set(expected,ARRAY[table_name,'constraints'],(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(expected->table_name->'constraints') item WHERE item->>'type'<>'n'));
  IF actual IS DISTINCT FROM expected->table_name THEN
   RAISE EXCEPTION 'Telegram release candidate incompatible table: %. Run PRECHECK and inspect schema; no automatic repair.',table_name;
  END IF;
  IF EXISTS(SELECT 1 FROM pg_policy WHERE polrelid=to_regclass('public.'||table_name)) THEN
   RAISE EXCEPTION 'Telegram release candidate backend-only table has unexpected RLS policies: %',table_name;
  END IF;
 END LOOP;
END $schema$;
--> statement-breakpoint
DO $security$
DECLARE t text; r text; cols text; oid_table oid; priv text;
BEGIN
 FOREACH t IN ARRAY ARRAY['event_payment_attempts','telegram_broadcast_deliveries','telegram_broadcasts','telegram_campaigns','telegram_updates'] LOOP
  oid_table:=to_regclass('public.'||t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  SELECT string_agg(quote_ident(attname),',') INTO cols FROM pg_attribute WHERE attrelid=oid_table AND attnum>0 AND NOT attisdropped;
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',t);
  EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM PUBLIC',cols,t);
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',t,r);
    EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM %I',cols,t,r);
    FOREACH priv IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
     IF has_table_privilege(r,oid_table,priv) THEN RAISE EXCEPTION 'Identity v1 inherited/owner privilege remains: %.%',r,t; END IF;
    END LOOP;
    IF EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=oid_table AND a.attnum>0 AND NOT a.attisdropped
     AND (has_column_privilege(r,oid_table,a.attnum,'SELECT') OR has_column_privilege(r,oid_table,a.attnum,'INSERT') OR has_column_privilege(r,oid_table,a.attnum,'UPDATE') OR has_column_privilege(r,oid_table,a.attnum,'REFERENCES'))) THEN
     RAISE EXCEPTION 'Identity v1 inherited column privilege remains: %.%',r,t;
    END IF;
   END IF;
  END LOOP;
 END LOOP;
END $security$;

--> statement-breakpoint
-- Additive indexes for bounded Mini App list and ownership queries.
SET LOCAL search_path=pg_catalog,public;
--> statement-breakpoint
SET LOCAL lock_timeout='5s';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_participants_owner_event_idx" ON "event_participants" USING btree ("user_id","event_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_status_created_idx" ON "events" USING btree ("status","created_at","id");
--> statement-breakpoint
DO $indexes$ DECLARE item record; BEGIN
 FOR item IN SELECT * FROM (VALUES
 ('events_status_created_idx','CREATE INDEX events_status_created_idx ON public.events USING btree (status, created_at, id)'),
 ('event_participants_owner_event_idx','CREATE INDEX event_participants_owner_event_idx ON public.event_participants USING btree (user_id, event_id, created_at)')) AS expected(name,definition) LOOP
 IF NOT EXISTS(SELECT 1 FROM pg_indexes i JOIN pg_class c ON c.relname=i.indexname JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public' JOIN pg_index x ON x.indexrelid=c.oid
 WHERE i.schemaname='public' AND i.indexname=item.name AND i.indexdef=item.definition AND x.indisvalid) THEN
 RAISE EXCEPTION 'Telegram release incompatible query index: %',item.name;
 END IF; END LOOP;
END $indexes$;
COMMIT;
