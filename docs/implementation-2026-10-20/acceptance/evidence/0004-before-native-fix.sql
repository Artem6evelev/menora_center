-- Additive only. Run against the reconciled existing schema, not both historical chains.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "affiliation" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "filter_version" integer;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "filter_revision" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_gender_check' AND conrelid = 'public.users'::regclass) THEN
  ALTER TABLE "users" ADD CONSTRAINT "users_gender_check" CHECK (gender IS NULL OR gender IN ('male', 'female'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_affiliation_check' AND conrelid = 'public.users'::regclass) THEN
  ALTER TABLE "users" ADD CONSTRAINT "users_affiliation_check" CHECK (affiliation IS NULL OR affiliation IN ('maternal', 'giyur', 'none'));
 END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_audit" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "actor_id" text NOT NULL,
 "parent_id" text NOT NULL,
 "action" text NOT NULL,
 "target_id" text NOT NULL,
 "reason" text NOT NULL,
 "details" jsonb NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_audit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "community_audit" FROM PUBLIC;
-- No anon/authenticated policies: audit is accessed through authorized server handlers only.
-- No UPDATE of old affiliation, gender, children, registrations or payments.
