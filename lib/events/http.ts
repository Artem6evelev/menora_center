import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EventInterestError, hashInterestToken } from "./interests";
import { MiniAppAuthError } from "@/lib/telegram/miniapp-errors";
import { requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
export const INTEREST_COOKIE = "menorah_event_interest";
export async function interestVisitor(create = false) {
  let token = (await cookies()).get(INTEREST_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) token = create ? randomBytes(32).toString("base64url") : undefined;
  return { token, hash: token ? hashInterestToken(token) : null };
}
export function interestResponse(data: unknown, token?: string) {
  const response = NextResponse.json({ ok: true, ...data as object }, { headers: { "Cache-Control": "private, no-store" } });
  if (token) response.cookies.set(INTEREST_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86_400 });
  return response;
}
export async function interestJson(request: Request) {
  requireMiniAppSameOrigin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new EventInterestError(400, "invalid_request");
  const reader = request.body?.getReader(); if (!reader) throw new EventInterestError(400, "invalid_request");
  const chunks: Uint8Array[] = []; let length = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; length += value.length;
    if (length > 8192) { await reader.cancel(); throw new EventInterestError(413, "invalid_request"); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new EventInterestError(400, "invalid_request"); }
}
export function interestNetwork(request: Request) {
  const secret = process.env.CLERK_SECRET_KEY || process.env.TELEGRAM_BOT_TOKEN;
  if (!secret) throw new EventInterestError(503, "unavailable");
  return createHash("sha256").update(secret).update("event-interest-rate:").update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) || "unknown").digest("hex");
}
export function interestError(error: unknown) {
  const status = error instanceof EventInterestError || error instanceof MiniAppAuthError ? error.status : error instanceof z.ZodError ? 400 : 503;
  return NextResponse.json({ ok: false, error: error instanceof EventInterestError || error instanceof MiniAppAuthError ? error.code : status === 400 ? "invalid_request" : "unavailable" }, { status, headers: { "Cache-Control": "no-store" } });
}
