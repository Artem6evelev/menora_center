import { CommunityError } from "./errors";
// Confirmation and unrelated payment flows remain restricted. Event registration
// may open Shutafim with a server-calculated amount, but remains pending.
// No env flag can enable an unverified webhook or a manual paid status.
export const PAYMENTS_RESTRICTED = true;
export const PAYMENT_UNAVAILABLE_MESSAGE = "Платные операции временно недоступны. Бесплатная запись работает.";
export function requirePaymentConfirmationReady(message = PAYMENT_UNAVAILABLE_MESSAGE) {
  if (PAYMENTS_RESTRICTED) throw new CommunityError(message);
}
