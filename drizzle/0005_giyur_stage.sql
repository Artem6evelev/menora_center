-- Owner decision 20.10.2026. Unknown/combined answers stay NULL; no inferred completion.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "giyur_stage" text;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_giyur_stage_check' AND conrelid = 'public.users'::regclass) THEN
  ALTER TABLE "users" ADD CONSTRAINT "users_giyur_stage_check" CHECK (giyur_stage IS NULL OR giyur_stage IN ('advanced', 'completed'));
 END IF;
END $$;
