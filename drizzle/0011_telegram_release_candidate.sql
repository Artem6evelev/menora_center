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
