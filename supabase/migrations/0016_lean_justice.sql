ALTER TABLE "events" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recurring_pattern" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recurring_days" text;