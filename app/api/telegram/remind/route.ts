// Compatibility cron URL: only drains explicitly enqueued, consent-filtered deliveries.
export { GET } from "@/app/api/internal/telegram/broadcast-worker/route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
