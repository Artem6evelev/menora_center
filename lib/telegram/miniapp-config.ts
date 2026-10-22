import "server-only";

export const TELEGRAM_PROVIDER_INSTANCE = "primary";
export const MINIAPP_BODY_LIMIT = 16 * 1024;
export const MINIAPP_CLOCK_SKEW_SECONDS = 60;

function boundedSeconds(value: string | undefined, fallback: number, min: number, max: number) {
  if (!value || !/^[1-9][0-9]*$/.test(value)) return fallback;
  const result = Number(value);
  return Number.isSafeInteger(result) && result >= min && result <= max ? result : fallback;
}

export const initDataMaxAgeSeconds = () =>
  boundedSeconds(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS, 900, 1, 86400);
export const miniAppSessionTtlSeconds = () =>
  boundedSeconds(process.env.TELEGRAM_MINIAPP_SESSION_TTL_SECONDS, 86400, 60, 604800);

export const miniAppCookieName = () => process.env.NODE_ENV === "production"
  ? "__Host-menorah_miniapp_session" : "menorah_miniapp_session";

export function miniAppCookieOptions(maxAge = miniAppSessionTtlSeconds()) {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, path: "/", maxAge };
}
