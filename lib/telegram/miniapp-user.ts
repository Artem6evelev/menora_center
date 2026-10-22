import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  telegramContacts,
  telegramUpdates,
  userIdentities,
  users,
} from "@/lib/db/schema";
import { hasFilterProfile } from "@/lib/community/policy";
import { TELEGRAM_PROVIDER_INSTANCE } from "./miniapp-config";
import { MiniAppAuthError } from "./miniapp-errors";
import {
  assertValidatedTelegramInitData,
  type ValidatedTelegramInitData,
} from "./miniapp-init-data";

export type MiniAppTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
export type MiniAppUser = typeof users.$inferSelect;
export interface MiniAppPrincipal {
  user: MiniAppUser;
  identity: typeof userIdentities.$inferSelect;
}

const conflict = () => new MiniAppAuthError(409, "account_unavailable");
const unavailable = () => new MiniAppAuthError(403, "account_unavailable");

function retryable(error: unknown) {
  // Drizzle wraps the PostgreSQL error. Never serialize/log query parameters.
  let current = error as
    | {
        code?: string;
        constraint_name?: string;
        constraint?: string;
        cause?: unknown;
      }
    | undefined;
  for (let depth = 0; current && depth < 5; depth++) {
    const constraint = current.constraint_name ?? current.constraint;
    if (
      current.code === "23505" &&
      [
        "user_identities_provider_subject_idx",
        "telegram_contacts_telegram_user_id_unique",
      ].includes(constraint ?? "")
    )
      return true;
    if (current.code === "40001" || current.code === "40P01") return true;
    current = current.cause as typeof current;
  }
  return false;
}

type TelegramIdentityData = Pick<
  ValidatedTelegramInitData,
  "user" | "startParam"
>;
async function bootstrap(
  tx: MiniAppTransaction,
  data: TelegramIdentityData,
  source = "telegram_miniapp",
): Promise<MiniAppPrincipal> {
  const tg = data.user;
  // Serialize our writers for one verified subject; the unique index also covers other writers.
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${`telegram:${TELEGRAM_PROVIDER_INSTANCE}:${tg.id}`}, 0))`,
  );
  let [identity] = await tx
    .select()
    .from(userIdentities)
    .where(
      and(
        eq(userIdentities.provider, "telegram"),
        eq(userIdentities.providerInstance, TELEGRAM_PROVIDER_INSTANCE),
        eq(userIdentities.providerUserId, tg.id),
      ),
    )
    .for("update");
  const [contact] = await tx
    .select()
    .from(telegramContacts)
    .where(eq(telegramContacts.telegramUserId, tg.id))
    .for("update");
  if (identity?.disabledAt) throw unavailable();
  if (identity && contact && identity.userId !== contact.userId)
    throw conflict();
  let owner = identity?.userId ?? contact?.userId;
  // Recognize an exact legacy numeric mapping created by the still-separate bot writer.
  // Never match email, display names or usernames, and never derive a chat ID here.
  if (!owner) {
    const legacy = await tx
      .select()
      .from(users)
      .where(or(eq(users.id, `tg_${tg.id}`), eq(users.telegramChatId, tg.id)))
      .for("update");
    if (
      legacy.length > 1 ||
      legacy.some(
        (user) => user.telegramChatId && user.telegramChatId !== tg.id,
      )
    )
      throw conflict();
    owner = legacy[0]?.id;
  }
  let user: MiniAppUser;
  if (owner) {
    const [existing] = await tx
      .select()
      .from(users)
      .where(eq(users.id, owner))
      .for("update");
    if (!existing) throw conflict();
    user = existing;
  } else {
    [user] = await tx
      .insert(users)
      .values({
        id: `mnr_${randomUUID()}`,
        email: null,
        firstName: tg.firstName,
        lastName: tg.lastName ?? null,
        role: "client",
        isProfileComplete: false,
        source,
        agreedToPrivacy: false,
        affiliation: null,
        gender: null,
        giyurStage: null,
        filterVersion: null,
        filterCompletedAt: null,
      })
      .returning();
  }
  if (user.identityDisabledAt) throw unavailable();
  const now = new Date();
  if (!identity) {
    [identity] = await tx
      .insert(userIdentities)
      .values({
        userId: user.id,
        provider: "telegram",
        providerInstance: TELEGRAM_PROVIDER_INSTANCE,
        providerUserId: tg.id,
        verifiedAt: now,
        lastSeenAt: now,
        metadata: tg.isPremium === undefined ? {} : { isPremium: tg.isPremium },
      })
      .returning();
  } else {
    if (
      !identity.metadata ||
      typeof identity.metadata !== "object" ||
      Array.isArray(identity.metadata)
    )
      throw conflict();
    [identity] = await tx
      .update(userIdentities)
      .set({
        lastSeenAt: now,
        verifiedAt: now,
        ...(tg.isPremium === undefined
          ? {}
          : { metadata: { ...identity.metadata, isPremium: tg.isPremium } }),
      })
      .where(eq(userIdentities.id, identity.id))
      .returning();
  }
  const safeMetadata = {
    firstName: tg.firstName,
    lastName: tg.lastName,
    username: tg.username,
    languageCode: tg.languageCode,
    photoUrl: tg.photoUrl,
    allowsWriteToPm: tg.allowsWriteToPm,
    lastSeenAt: now,
    updatedAt: now,
  };
  if (contact) {
    await tx
      .update(telegramContacts)
      .set({
        ...safeMetadata,
        ...(data.startParam
          ? {
              firstStartParam: contact.firstStartParam ?? data.startParam,
              lastStartParam: data.startParam,
            }
          : {}),
      })
      .where(eq(telegramContacts.id, contact.id));
  } else {
    // The canonical user row is locked, including for distinct Telegram identities of this user.
    const [primary] = await tx
      .select({ id: telegramContacts.id })
      .from(telegramContacts)
      .where(
        and(
          eq(telegramContacts.userId, user.id),
          eq(telegramContacts.isPrimary, true),
        ),
      );
    await tx
      .insert(telegramContacts)
      .values({
        ...safeMetadata,
        userId: user.id,
        telegramUserId: tg.id,
        telegramChatId: null,
        isPrimary: !primary,
        marketingStatus: "unknown",
        firstStartParam: data.startParam,
        lastStartParam: data.startParam,
      });
  }
  return { user, identity };
}

/** finish executes in the same transaction: a failed session insert rolls back the new person too. */
export async function withTelegramMiniAppUser<T>(
  data: ValidatedTelegramInitData,
  finish: (tx: MiniAppTransaction, principal: MiniAppPrincipal) => Promise<T>,
): Promise<T> {
  assertValidatedTelegramInitData(data);
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(async (tx) =>
        finish(tx, await bootstrap(tx, data)),
      );
    } catch (error) {
      if (attempt >= 2 || !retryable(error)) throw error;
    }
  }
}

/** Only the secret-verified webhook calls this server-only adapter. It grants no Mini App session. */
export async function withTelegramBotUser<T>(
  data: TelegramIdentityData,
  finish: (tx: MiniAppTransaction, principal: MiniAppPrincipal) => Promise<T>,
  updateId: string,
): Promise<T | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`telegram-update:${updateId}`},0))`,
        );
        const [seen] = await tx
          .select()
          .from(telegramUpdates)
          .where(eq(telegramUpdates.updateId, updateId));
        if (seen) return null;
        return finish(tx, await bootstrap(tx, data, "telegram_bot"));
      });
    } catch (error) {
      if (attempt >= 2 || !retryable(error)) throw error;
    }
  }
}

export const bootstrapTelegramMiniAppUser = (data: ValidatedTelegramInitData) =>
  withTelegramMiniAppUser(data, async (_tx, principal) => principal.user);

export function miniAppProfile(user: MiniAppUser) {
  const filterCompleted = hasFilterProfile(user);
  const nextStep = !filterCompleted
    ? "filter"
    : user.affiliation === "none"
      ? "resources"
      : !user.isProfileComplete
        ? "profile"
        : "home";
  return {
    firstName: user.firstName,
    filterCompleted,
    profileComplete: user.isProfileComplete,
    affiliation: filterCompleted ? user.affiliation : null,
    nextStep,
  };
}
