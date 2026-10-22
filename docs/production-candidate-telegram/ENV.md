# Environment contract

All commands use explicitly supplied process environment. Scripts never source project `.env` files and never print values. Do not paste credentials into reports or shell history.

Required production variables:

- `TELEGRAM_BOT_TOKEN`: Bot API token for the configured bot.
- `TELEGRAM_WEBHOOK_SECRET`: random 32–256 characters `[A-Za-z0-9_-]`, independent from bot token.
- `TELEGRAM_BOT_USERNAME`: exact bot username without `@`.
- `NEXT_PUBLIC_APP_URL`: canonical HTTPS origin, no path/query. Used for origin guard, menu, event buttons.
- `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS`: 1–86400, recommended 900 (runtime default).
- `TELEGRAM_MINIAPP_SESSION_TTL_SECONDS`: 60–604800, recommended 86400 (runtime default).
- `CRON_SECRET`: independent random 32–256 characters `[A-Za-z0-9_-]`.
- `DATABASE_URL`: privileged server PostgreSQL connection, never public.
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: existing site storage integration.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`: LIVE website instance; Mini App does not mount Clerk.
- `CLERK_WEBHOOK_SECRET`: existing signed Clerk webhook.

Existing optional capabilities: `EMAIL_USER`, `EMAIL_PASS`, `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`. Do not enable notifications as part of this rollout. Shutafim URL is configured per event in `events.payment_url`; amount parameters remain `price`, `quantity=1`, `cur=ILS`, `payments=1`, `lang=ru`, `custom1=<registration id>`. No new payment confirmation secret/flag is introduced. Existing payment confirmation restriction remains.

`npm run check-production-env` prints only variable name, present/missing, valid/invalid and exits nonzero on missing/invalid required configuration. It validates format, not provider ownership or permissions. TEST Clerk keys fail the production check. `MENORAH_MINIAPP_PREVIEW` is development presentation only and must be unset in production.

`npm run telegram:check`: read-only getMe/getWebhookInfo/getChatMenuButton, checks exact username/origin/menu. Telegram does not return configured secret_token: checking its current value is impossible through getWebhookInfo. `npm run telegram:configure -- --confirm-production`: future explicit apply of webhook secret/menu/commands, preserves pending updates. Never executed in local acceptance.

Queue scheduling: initial release supports an authenticated staff manual drain, maximum 5 deliveries per invocation, and `GET /api/internal/telegram/broadcast-worker` with `Authorization: Bearer <CRON_SECRET>`. Existing `/api/telegram/remind` is a protected alias to this queue, not a source of automatic broadcasts. No Vercel cron is added because the project plan/cadence has not been established. Owner may schedule the bounded route after rollout; manual processing is the supported first-release operation. Every campaign requires an explicit enqueue by staff. Browser preview/enqueue never sends messages.
