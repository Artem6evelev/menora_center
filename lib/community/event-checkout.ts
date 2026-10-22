import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  eventParticipants,
  eventPaymentAttempts,
  events,
} from "@/lib/db/schema";
import { prepareEventRegistration } from "./registration";
import { communityAccess } from "./policy";
import { CommunityError } from "./errors";
import type {
  MiniAppTransaction,
  MiniAppUser,
} from "@/lib/telegram/miniapp-user";

export function eventVisible(
  user: MiniAppUser,
  _event: typeof events.$inferSelect,
) {
  return communityAccess(user).canViewEvents;
}
export function shutafimUrl(
  base: string | null,
  amountAgorot: number,
  registrationId: string,
) {
  if (!base)
    throw new CommunityError(
      "Ссылка на оплату пока недоступна. Обратитесь к администратору.",
    );
  const url = new URL(base);
  // Existing DB-configured provider URL, never a client-supplied redirect.
  if (url.protocol !== "https:" || url.username || url.password)
    throw new CommunityError("Ссылка на оплату недоступна");
  Object.entries({
    price: String(amountAgorot / 100),
    quantity: "1",
    cur: "ILS",
    payments: "1",
    lang: "ru",
    custom1: registrationId,
  }).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
export async function calculateEvent(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  eventId: string,
  raw: unknown,
) {
  const [event] = await tx
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .for("update");
  if (!event || !eventVisible(user, event))
    throw new CommunityError("Событие недоступно");
  const prepared = prepareEventRegistration(user, event, raw);
  const amountAgorot = Math.round(prepared.totalAmount * 100);
  if (!Number.isSafeInteger(amountAgorot) || amountAgorot > 2147483647)
    throw new CommunityError("Стоимость уточняется");
  const children = prepared.extraData.childIds.length;
  return {
    event,
    prepared,
    amountAgorot,
    breakdown: {
      adults:
        1 +
        Number(!!prepared.extraData.family.spouse) +
        prepared.extraData.extraAdults,
      children,
      adultPrice: event.isFree ? 0 : event.price,
      childPrice: event.isFree ? 0 : event.childPrice,
      amountAgorot,
      currency: "ILS",
    },
  };
}
/** Caller locks canonical user first. One immutable pending handoff per registration, across channels. */
export async function checkoutEvent(
  tx: MiniAppTransaction,
  user: MiniAppUser,
  eventId: string,
  raw: unknown,
) {
  const { event, prepared, amountAgorot, breakdown } = await calculateEvent(
    tx,
    user,
    eventId,
    raw,
  );
  const previous = await tx
    .select()
    .from(eventParticipants)
    .where(
      and(
        eq(eventParticipants.userId, user.id),
        eq(eventParticipants.eventId, eventId),
      ),
    );
  const settled = previous.find((row) =>
    ["confirmed", "paid"].includes(row.status),
  );
  if (settled)
    return {
      registrationId: settled.id,
      status: settled.status,
      paymentUrl: null,
      amountAgorot: 0,
      breakdown,
      alreadyRegistered: true,
    };
  const selectionHash = createHash("sha256")
    .update(
      JSON.stringify({
        childIds: [...prepared.extraData.childIds].sort(),
        spouse: !!prepared.extraData.family.spouse,
        extraAdults: prepared.extraData.extraAdults,
      }),
    )
    .digest("hex");
  const pending = previous.find((row) => row.status === "pending");
  if (pending) {
    const [attempt] = await tx
      .select()
      .from(eventPaymentAttempts)
      .where(eq(eventPaymentAttempts.registrationId, pending.id));
    if (attempt) {
      if (
        attempt.userId !== user.id ||
        attempt.eventId !== eventId ||
        attempt.status !== "pending" ||
        attempt.selectionHash !== selectionHash
      )
        throw new CommunityError(
          "Уже есть ожидающая оплаты запись с другим составом. Обратитесь к администратору.",
        );
      return {
        registrationId: pending.id,
        status: "pending",
        paymentUrl: attempt.paymentUrl,
        amountAgorot: attempt.amountAgorot,
        breakdown: { ...breakdown, amountAgorot: attempt.amountAgorot },
        alreadyRegistered: true,
      };
    }
  }
  const id = pending?.id ?? `part_${randomUUID()}`;
  const paymentUrl =
    amountAgorot > 0 ? shutafimUrl(event.paymentUrl, amountAgorot, id) : null;
  const participant = {
    eventId,
    userId: user.id,
    phone: user.phone || "Не указан",
    status: amountAgorot > 0 ? "pending" : "confirmed",
    extraData: { ...prepared.extraData, amountAgorot, currency: "ILS" },
  };
  if (pending)
    await tx
      .update(eventParticipants)
      .set(participant)
      .where(eq(eventParticipants.id, id));
  else await tx.insert(eventParticipants).values({ id, ...participant });
  if (paymentUrl)
    await tx
      .insert(eventPaymentAttempts)
      .values({
        registrationId: id,
        userId: user.id,
        eventId,
        amountAgorot,
        selectionHash,
        paymentUrl,
      });
  return {
    registrationId: id,
    status: participant.status,
    paymentUrl,
    amountAgorot,
    breakdown,
    alreadyRegistered: false,
  };
}
