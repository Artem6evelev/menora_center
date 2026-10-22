import "server-only";
export class TelegramApiError extends Error {
  constructor(
    public kind:
      | "rate_limit"
      | "blocked"
      | "permanent"
      | "temporary"
      | "unknown",
    public retryAfter = 0,
  ) {
    super(kind);
  }
}
/** No automatic HTTP retries: network/invalid responses have uncertain delivery outcome. */
export async function telegramApi(
  method: string,
  body: Record<string, unknown>,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new TelegramApiError("permanent");
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
  } catch {
    throw new TelegramApiError("unknown");
  }
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new TelegramApiError("unknown");
  }
  if (data?.ok === true) return data.result;
  if (data?.ok !== false) throw new TelegramApiError("unknown");
  const code = Number(data.error_code || response.status);
  if (code === 429)
    throw new TelegramApiError(
      "rate_limit",
      Math.min(86400, Math.max(1, Number(data.parameters?.retry_after) || 60)),
    );
  if (code === 403) throw new TelegramApiError("blocked");
  if (code >= 500) throw new TelegramApiError("temporary");
  throw new TelegramApiError("permanent");
}
