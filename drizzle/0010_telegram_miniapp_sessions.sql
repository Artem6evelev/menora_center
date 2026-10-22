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
