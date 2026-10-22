import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramMiniappSessions as sessions, userIdentities, users } from "@/lib/db/schema";
import { miniAppCookieName, miniAppSessionTtlSeconds, TELEGRAM_PROVIDER_INSTANCE } from "./miniapp-config";
import { MiniAppAuthError } from "./miniapp-errors";
import { withTelegramMiniAppUser, type MiniAppTransaction, type MiniAppUser } from "./miniapp-user";
import type { ValidatedTelegramInitData } from "./miniapp-init-data";

function tokenHash(token: string | undefined) {
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? createHash("sha256").update(token).digest("hex") : null;
}

/** The raw token is server-internal and must only be put into an HttpOnly cookie. */
export async function openMiniAppSession(data: ValidatedTelegramInitData) {
  return withTelegramMiniAppUser(data, async (tx, { user, identity }) => {
    const token = randomBytes(32).toString("base64url"), now = new Date(), ttl = miniAppSessionTtlSeconds();
    await tx.insert(sessions).values({ userId: user.id, identityId: identity.id, tokenHash: tokenHash(token)!,
      createdAt: now, lastSeenAt: now, expiresAt: new Date(now.getTime() + ttl * 1000) });
    return { user, token, ttl };
  });
}

/** Mutations can authorize and write under the same identity/user/session locks. */
export async function withMiniAppSession<T>(finish: (tx: MiniAppTransaction, user: MiniAppUser) => Promise<T>) {
  const unauthenticated = () => new MiniAppAuthError(401, "unauthenticated");
  const hash = tokenHash((await cookies()).get(miniAppCookieName())?.value);
  if (!hash) throw unauthenticated();
  return db.transaction(async tx => {
    const [initial] = await tx.select().from(sessions).where(eq(sessions.tokenHash, hash));
    if (!initial || initial.revokedAt || initial.expiresAt <= new Date()) throw unauthenticated();
    // Same identity -> user lock order as bootstrap; recheck session after taking locks.
    const [identity] = await tx.select().from(userIdentities).where(eq(userIdentities.id, initial.identityId)).for("update");
    if (!identity || identity.disabledAt || identity.provider !== "telegram" ||
      identity.providerInstance !== TELEGRAM_PROVIDER_INSTANCE || identity.userId !== initial.userId) throw unauthenticated();
    const [user] = await tx.select().from(users).where(eq(users.id, identity.userId)).for("update");
    if (!user || user.identityDisabledAt) throw unauthenticated();
    const [session] = await tx.select().from(sessions).where(eq(sessions.id, initial.id)).for("update");
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now || session.identityId !== identity.id || session.userId !== user.id) throw unauthenticated();
    await tx.update(sessions).set({ lastSeenAt: now }).where(eq(sessions.id, session.id));
    return finish(tx, user);
  });
}

export async function currentMiniAppUser() {
  try { return await withMiniAppSession(async (_tx, user) => user); }
  catch (error) { if (error instanceof MiniAppAuthError && error.status === 401) return null; throw error; }
}

export async function requireMiniAppUser() {
  const user = await currentMiniAppUser();
  if (!user) throw new MiniAppAuthError(401, "unauthenticated");
  return user;
}

export async function revokeCurrentMiniAppSession() {
  const hash = tokenHash((await cookies()).get(miniAppCookieName())?.value);
  if (hash) await db.update(sessions).set({ revokedAt: new Date() })
    .where(and(eq(sessions.tokenHash, hash), isNull(sessions.revokedAt)));
}
