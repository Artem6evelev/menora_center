ALTER TABLE "events" ALTER COLUMN "date" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "time" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_free" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "audience" text DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "is_paid";