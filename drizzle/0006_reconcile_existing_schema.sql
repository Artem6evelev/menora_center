-- Reconcile pre-existing ORM drift additively. Existing columns, rows and statuses are retained.
-- Preflight must confirm compatible definitions before this migration is used on an adopted database.
CREATE TABLE IF NOT EXISTS "kids_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_title" text NOT NULL,
	"parent_first_name" text NOT NULL,
	"parent_last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"children" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kids_applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "author_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "news" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "news_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "news_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "service_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "service_participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bot_settings" ADD COLUMN IF NOT EXISTS "notification_group_id" text;--> statement-breakpoint
ALTER TABLE "bot_settings" ADD COLUMN IF NOT EXISTS "events_topic_id" text;--> statement-breakpoint
ALTER TABLE "bot_settings" ADD COLUMN IF NOT EXISTS "services_topic_id" text;--> statement-breakpoint
ALTER TABLE "event_participants" ADD COLUMN IF NOT EXISTS "extra_data" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "child_price" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "payment_url" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "spouse_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "children_data" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "category" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_constraint
  WHERE conrelid = 'public.kids_applications'::regclass AND contype = 'f'
   AND confrelid = 'public.users'::regclass AND confdeltype = 'n' AND confupdtype = 'a'
   AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.kids_applications'::regclass AND attname = 'user_id')]::smallint[]
   AND confkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.users'::regclass AND attname = 'id')]::smallint[]
 ) THEN
  ALTER TABLE "kids_applications" ADD CONSTRAINT "kids_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
 END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_chat_id_idx" ON "users" USING btree ("telegram_chat_id");
