CREATE TABLE "news_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"slug" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_category_id_news_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."news_categories"("id") ON DELETE set null ON UPDATE no action;