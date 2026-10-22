import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, isNull, lt, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramMiniappSessions as sessions, userIdentities, users } from "@/lib/db/schema";
import { miniAppCookieName, miniAppSessionTtlSeconds, TELEGRAM_PROVIDER_INSTANCE } from "./miniapp-config";
import { MiniAppAuthError } from "./miniapp-errors";
import { withTelegramMiniAppUser, type MiniAppTransaction, type LockedTransaction, type MiniAppUser } from "./miniapp-user";
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
export async function withMiniAppSession<T>(finish: (tx: LockedTransaction, user: MiniAppUser) => Promise<T>) {
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


/** One statement snapshot for reads. No locks, session writes, or identity inference. */
export async function readMiniAppSession(subject?: string) {
  const hash = tokenHash((await cookies()).get(miniAppCookieName())?.value);
  if (!hash) throw new MiniAppAuthError(401, "session_missing");
  const [row] = await db.select({
    session: { id: sessions.id, userId: sessions.userId, identityId: sessions.identityId,
      expiresAt: sessions.expiresAt, revokedAt: sessions.revokedAt, lastSeenAt: sessions.lastSeenAt },
    identity: { id: userIdentities.id, userId: userIdentities.userId, provider: userIdentities.provider,
      providerInstance: userIdentities.providerInstance, providerUserId: userIdentities.providerUserId, disabledAt: userIdentities.disabledAt },
    user: users,
  })
    .from(sessions).innerJoin(userIdentities, eq(userIdentities.id, sessions.identityId))
    .innerJoin(users, eq(users.id, sessions.userId)).where(eq(sessions.tokenHash, hash)).limit(1);
  if (!row) throw new MiniAppAuthError(401, "session_missing");
  const { session, identity, user } = row;
  if (subject && identity.providerUserId !== subject) throw new MiniAppAuthError(401, "session_mismatch");
  if (session.revokedAt || identity.disabledAt || user.identityDisabledAt || identity.provider !== "telegram" ||
    identity.providerInstance !== TELEGRAM_PROVIDER_INSTANCE || identity.userId !== session.userId || user.id !== identity.userId)
    throw new MiniAppAuthError(401, "unauthenticated");
  if (session.expiresAt <= new Date()) throw new MiniAppAuthError(401, "session_expired");
  return row;
}
export async function withMiniAppSessionRead<T>(finish: (query: MiniAppTransaction, user: MiniAppUser) => Promise<T>) {
  const { user } = await readMiniAppSession();
  return finish(db, user);
}
/** Startup-only throttled telemetry. Expiry is never extended and authorization never depends on lastSeenAt. */
export async function touchMiniAppSession(id: string) {
  const now = new Date();
  await db.update(sessions).set({ lastSeenAt: now }).where(and(eq(sessions.id, id), isNull(sessions.revokedAt),
    gt(sessions.expiresAt, now), lt(sessions.lastSeenAt, new Date(now.getTime() - 300_000))));
}

export async function currentMiniAppUser() {
  try { return await withMiniAppSessionRead(async (_tx, user) => user); }
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
