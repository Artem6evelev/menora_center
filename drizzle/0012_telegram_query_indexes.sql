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
