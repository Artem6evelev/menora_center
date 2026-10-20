CREATE TABLE "community_registration_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"filter_version" integer NOT NULL,
	"owner_id" text,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_registration_drafts_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "community_registration_drafts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "filter_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "identity_disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "community_registration_drafts" ADD CONSTRAINT "community_registration_drafts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_filter_completion_check" CHECK ("users"."filter_version" IS DISTINCT FROM 2 OR "users"."filter_completed_at" IS NOT NULL);
--> statement-breakpoint
REVOKE ALL ON TABLE "community_registration_drafts" FROM PUBLIC;
