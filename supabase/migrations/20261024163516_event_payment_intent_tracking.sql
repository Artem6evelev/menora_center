-- Additive operational state only. No opening/consent backfill, grants or RLS changes.
ALTER TABLE public.event_payment_attempts
  ADD COLUMN opened_at timestamptz NULL,
  ADD COLUMN last_opened_at timestamptz NULL,
  ADD COLUMN open_count integer NOT NULL DEFAULT 0,
  ADD COLUMN last_opened_source text NULL,
  ADD CONSTRAINT event_payment_attempts_open_count_check CHECK (open_count >= 0),
  ADD CONSTRAINT event_payment_attempts_open_source_check
    CHECK (last_opened_source IS NULL OR last_opened_source IN ('telegram', 'website'));
--> statement-breakpoint
-- Record the ACTUAL application boundary, not file-generation/deploy time.
-- This new column's metadata survives delayed rollout without changing existing rows.
DO $migration$
BEGIN
  EXECUTE format('COMMENT ON COLUMN public.event_payment_attempts.opened_at IS %L',
    json_build_object('trackingStartedAt', clock_timestamp())::text);
END
$migration$;
