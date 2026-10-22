import "server-only";
import { NextResponse } from "next/server";
import { MINIAPP_BODY_LIMIT } from "./miniapp-config";
import { MiniAppAuthError, miniAppFailure } from "./miniapp-errors";

export function miniAppResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    "Cache-Control": "no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff",
  } });
}
export function miniAppErrorResponse(error: unknown) {
  const failure = miniAppFailure(error);
  return miniAppResponse(failure.body, failure.status);
}

export function requireMiniAppSameOrigin(request: Request) {
  let expected: URL;
  try {
    expected = new URL(process.env.NEXT_PUBLIC_APP_URL || request.url);
    if (process.env.NODE_ENV === "production" && (!process.env.NEXT_PUBLIC_APP_URL || expected.protocol !== "https:")) throw new Error();
    if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_APP_URL &&
      !["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname)) throw new Error();
  } catch { throw new MiniAppAuthError(503, "telegram_auth_unavailable"); }
  if (request.headers.get("origin") !== expected.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new MiniAppAuthError(403, "invalid_origin");
  }
}

export async function readMiniAppInitData(request: Request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") ?? "")) {
    throw new MiniAppAuthError(415, "json_required");
  }
  const length = request.headers.get("content-length");
  if (length && (!/^[0-9]+$/.test(length) || Number(length) > MINIAPP_BODY_LIMIT)) throw new MiniAppAuthError(413, "body_too_large");
  if (!request.body) throw new MiniAppAuthError(400, "malformed_request");
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MINIAPP_BODY_LIMIT) {
        await reader.cancel();
        throw new MiniAppAuthError(413, "body_too_large");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let value: unknown;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))); }
  catch { throw new MiniAppAuthError(400, "malformed_request"); }
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1 ||
    !("initData" in value) || typeof value.initData !== "string") throw new MiniAppAuthError(400, "malformed_request");
  return value.initData;
}
