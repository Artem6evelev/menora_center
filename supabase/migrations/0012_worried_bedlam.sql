CREATE TABLE "bot_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"channel_link" text,
	"tzedakah_link" text,
	"reminder_message" text DEFAULT 'Доброе утро! ☕️ Утренний Хасидут начнется через 10 минут. Ждем вас!',
	"tzedakah_message" text DEFAULT 'Спасибо, что были с нами на эфире! Поддержать общину можно по ссылке ниже:',
	"superadmin_telegram_id" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_chat_id" text;