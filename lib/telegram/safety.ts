import "server-only";
import { timingSafeEqual } from "node:crypto";
export const escapeTelegramHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function secretMatches(
  actual: string | null,
  expected: string | undefined,
) {
  if (!expected || !actual) return false;
  const a = Buffer.from(actual),
    b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Fixed event names/classes and numeric counts only. Never pass payloads or exception objects. */
export function telegramLog(
  event: "bootstrap_failure" | "webhook_failure" | "worker" | "payment_handoff",
  values: {
    class?: string;
    processed?: number;
    delivered?: number;
    failed?: number;
    amountAgorot?: number;
  } = {},
) {
  const data: Record<string, string | number> = { event };
  if (values.class && /^[a-z_]{1,50}$/.test(values.class))
    data.class = values.class;
  for (const key of [
    "processed",
    "delivered",
    "failed",
    "amountAgorot",
  ] as const)
    if (Number.isSafeInteger(values[key])) data[key] = values[key]!;
  console.info?.(JSON.stringify(data));
}
export function telegramAppUrl() {
  const url = new URL(process.env.NEXT_PUBLIC_APP_URL || "");
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("app_url_unavailable");
  return new URL("/miniapp", url).toString();
}
