CREATE TABLE public."event_interest_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "event_interest_limits_count_check" CHECK ("event_interest_limits"."count" BETWEEN 1 AND 10)
);
--> statement-breakpoint
ALTER TABLE public."event_interest_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE public."event_interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text,
	"owner_key" text NOT NULL,
	"visitor_hash" text,
	"submission_id" uuid NOT NULL,
	"source" text NOT NULL,
	"intake_status" text,
	"decision" text NOT NULL,
	"processing_status" text DEFAULT 'new' NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"attribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contact_consent_at" timestamp with time zone NOT NULL,
	"invitation_consent" boolean DEFAULT false NOT NULL,
	"invitation_consent_at" timestamp with time zone,
	"invitation_withdrawn_at" timestamp with time zone,
	"policy_version" text NOT NULL,
	"unsubscribe_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_interests_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "event_interests_source_check" CHECK ("event_interests"."source" IN ('website','telegram')),
	CONSTRAINT "event_interests_intake_check" CHECK ("event_interests"."intake_status" IS NULL OR "event_interests"."intake_status" IN ('maternal','giyur','other_giyur','roots','none')),
	CONSTRAINT "event_interests_decision_check" CHECK ("event_interests"."decision" IN ('eligible','needs_review','not_eligible')),
	CONSTRAINT "event_interests_processing_check" CHECK ("event_interests"."processing_status" IN ('new','contacted','reviewing','closed')),
	CONSTRAINT "event_interests_consent_check" CHECK (NOT "event_interests"."invitation_consent" OR "event_interests"."invitation_consent_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE public."event_interests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "admission_policy" text DEFAULT 'restricted' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "visibility" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE public."event_interests" ADD CONSTRAINT "event_interests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE public."event_interests" ADD CONSTRAINT "event_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_interest_limits_expiry_idx" ON public."event_interest_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_interests_owner_event_idx" ON public."event_interests" USING btree ("event_id","owner_key");--> statement-breakpoint
CREATE INDEX "event_interests_user_idx" ON public."event_interests" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "event_interests_visitor_idx" ON public."event_interests" USING btree ("visitor_hash");--> statement-breakpoint
CREATE INDEX "event_interests_crm_idx" ON public."event_interests" USING btree ("processing_status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "event_interests_unsubscribe_idx" ON public."event_interests" USING btree ("unsubscribe_hash");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_admission_policy_check" CHECK ("events"."admission_policy" IN ('restricted','open'));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_visibility_check" CHECK ("events"."visibility" IN ('public','invite_only'));
--> statement-breakpoint
REVOKE ALL ON TABLE public.event_interests, public.event_interest_limits FROM PUBLIC;
--> statement-breakpoint
DO $secure$ DECLARE r text; BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE public.event_interests, public.event_interest_limits FROM %I',r); END IF; END LOOP; END $secure$;
