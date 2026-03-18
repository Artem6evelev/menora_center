CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"is_published" boolean DEFAULT true,
	"is_pinned" boolean DEFAULT false,
	"views" integer DEFAULT 0,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "news_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;