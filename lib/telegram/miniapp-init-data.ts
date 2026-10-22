import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { MINIAPP_BODY_LIMIT, MINIAPP_CLOCK_SKEW_SECONDS, initDataMaxAgeSeconds } from "./miniapp-config";
import { MiniAppAuthError } from "./miniapp-errors";

export interface ValidatedTelegramUser {
  readonly id: string;
  readonly firstName: string;
  readonly lastName?: string | null;
  readonly username?: string | null;
  readonly languageCode?: string | null;
  readonly photoUrl?: string | null;
  readonly allowsWriteToPm?: boolean;
  readonly isPremium?: boolean;
}
const proof = Symbol("validated Telegram Mini App data");
export interface ValidatedTelegramInitData {
  readonly [proof]: true;
  readonly user: Readonly<ValidatedTelegramUser>;
  readonly authDate: number;
  readonly startParam: string | null;
}
const verified = new WeakSet<object>();
const malformed = () => new MiniAppAuthError(400, "malformed_init_data");

function text(value: unknown, max: number, required = false): string | null | undefined {
  if (value === undefined) { if (required) throw malformed(); return undefined; }
  if (typeof value !== "string" || value.length > max ||
    [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw malformed();
  if (required && !value.trim()) throw malformed();
  return value || null;
}
function optionalBoolean(value: unknown) {
  if (value !== undefined && typeof value !== "boolean") throw malformed();
  return value as boolean | undefined;
}
function telegramUser(raw: string | undefined): ValidatedTelegramUser {
  if (!raw) throw malformed();
  let value: any;
  try { value = JSON.parse(raw); } catch { throw malformed(); }
  if (!value || Array.isArray(value) || typeof value !== "object" ||
    !Number.isSafeInteger(value.id) || value.id <= 0 || value.id > 2 ** 52 - 1 || value.is_bot === true) throw malformed();
  const photoUrl = text(value.photo_url, 2048);
  if (photoUrl) {
    try { const url = new URL(photoUrl); if (url.protocol !== "https:" || url.username || url.password) throw malformed(); }
    catch { throw malformed(); }
  }
  return { id: String(value.id), firstName: text(value.first_name, 256, true)!,
    lastName: text(value.last_name, 256), username: text(value.username, 64),
    languageCode: text(value.language_code, 64), photoUrl,
    allowsWriteToPm: optionalBoolean(value.allows_write_to_pm), isPremium: optionalBoolean(value.is_premium) };
}

/** Bot-token validation, not Telegram Login Widget or third-party Ed25519.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * Keep the original decoded values. In particular, never reserialize user JSON.
 */
function signedTelegramData(raw: unknown, requireFresh: boolean) {
  if (typeof raw !== "string" || !raw || Buffer.byteLength(raw, "utf8") > MINIAPP_BODY_LIMIT) throw malformed();
  const fields = new Map<string, string>();
  for (const pair of raw.split("&")) {
    const separator = pair.indexOf("=");
    if (separator < 1 || fields.size >= 64) throw malformed();
    let key: string, value: string;
    try {
      key = decodeURIComponent(pair.slice(0, separator).replace(/\+/g, " "));
      value = decodeURIComponent(pair.slice(separator + 1).replace(/\+/g, " "));
    } catch { throw malformed(); }
    if (!/^[A-Za-z0-9_]{1,64}$/.test(key) || fields.has(key) ||
      ["\r", "\n", "\0"].some(char => value.includes(char))) throw malformed();
    fields.set(key, value);
  }
  const hash = fields.get("hash"), date = fields.get("auth_date");
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash) || !date || !/^(0|[1-9][0-9]{0,10})$/.test(date)) throw malformed();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token?.trim()) throw new MiniAppAuthError(503, "telegram_auth_unavailable");
  // For bot-token HMAC only hash is excluded. signature, when present, is signed too.
  const checkString = [...fields].filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => `${key}=${value}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const expected = createHmac("sha256", secret).update(checkString).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex"))) throw new MiniAppAuthError(401, "invalid_init_data");
  const authDate = Number(date), now = Math.floor(Date.now() / 1000);
  if (authDate > now + MINIAPP_CLOCK_SKEW_SECONDS || (requireFresh && now - authDate > initDataMaxAgeSeconds())) {
    throw new MiniAppAuthError(401, "expired_init_data");
  }
  const start = fields.get("start_param");
  return { user: Object.freeze(telegramUser(fields.get("user"))), authDate,
    startParam: start && /^[A-Za-z0-9_-]{1,64}$/.test(start) ? start : null };
}

export function validateTelegramMiniAppInitData(raw: unknown): ValidatedTelegramInitData {
  const data = signedTelegramData(raw, true);
  const result: ValidatedTelegramInitData = Object.freeze({ [proof]: true as const,
    ...data });
  verified.add(result);
  return result;
}

/** Only binds an already-valid cookie to the current Telegram launch. This is NOT
 * a bootstrap proof: old signed data cannot create/renew a session or a person.
 * Reloading an older WebView may reuse its still-valid 24h session. */
export function telegramMiniAppSessionSubject(raw: unknown): string {
  return signedTelegramData(raw, false).user.id;
}

export function assertValidatedTelegramInitData(value: ValidatedTelegramInitData) {
  if (!value || !verified.has(value)) throw new MiniAppAuthError(401, "invalid_init_data");
  const now = Math.floor(Date.now() / 1000);
  if (value.authDate > now + MINIAPP_CLOCK_SKEW_SECONDS || now - value.authDate > initDataMaxAgeSeconds()) {
    throw new MiniAppAuthError(401, "expired_init_data");
  }
}
