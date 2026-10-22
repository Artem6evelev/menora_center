import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { telegramContacts } from "@/lib/db/schema";
import type { MiniAppTransaction, MiniAppUser } from "./miniapp-user";
import { MiniAppAuthError } from "./miniapp-errors";
export async function miniAppSubscription(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  raw?: unknown,
) {
  const [contact] = await tx
    .select()
    .from(telegramContacts)
    .where(
      and(
        eq(telegramContacts.userId, user.id),
        eq(telegramContacts.isPrimary, true),
      ),
    )
    .for("update");
  if (!contact) throw new MiniAppAuthError(409, "account_unavailable");
  if (raw !== undefined) {
    const input = z.object({ subscribed: z.boolean() }).strict().safeParse(raw);
    if (!input.success) throw new MiniAppAuthError(400, "malformed_request");
    const now = new Date(),
      status = input.data.subscribed ? "subscribed" : "unsubscribed";
    // A known transport block cannot be cleared just by opening Mini App.
    const values = {
      marketingStatus:
        input.data.subscribed && contact.blockedAt ? "blocked" : status,
      updatedAt: now,
      ...(input.data.subscribed
        ? { marketingOptInAt: now }
        : { unsubscribedAt: now }),
    };
    await tx
      .update(telegramContacts)
      .set(values)
      .where(eq(telegramContacts.id, contact.id));
    return { status: values.marketingStatus };
  }
  return { status: contact.marketingStatus };
}
