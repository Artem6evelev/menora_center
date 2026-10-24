"use server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireCommunityUser } from "@/lib/community/server";
import { CommunityError, communityErrorMessage } from "@/lib/community/errors";
import { eventPaymentOpenInput, openEventPaymentAttempt } from "@/lib/community/event-payment-open";

export async function openCurrentUserEventPayment(registrationId: unknown) {
  try {
    const input = eventPaymentOpenInput.parse({ registrationId });
    const principal = await requireCommunityUser();
    const payment = await db.transaction(async tx => {
      const [user] = await tx.select().from(users).where(eq(users.id, principal.id)).for("update");
      if (!user || user.identityDisabledAt) throw new CommunityError("Нет доступа к этому профилю");
      return openEventPaymentAttempt(tx, user, input.registrationId, "website");
    });
    return { success: true as const, ...payment };
  } catch (error) {
    return { success: false as const, error: communityErrorMessage(error, "Не удалось открыть оплату. Попробуйте ещё раз.") };
  }
}
