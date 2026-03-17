ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_profile_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marital_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_children" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "updated_at";