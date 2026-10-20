import { CommunityError } from "./errors";
// Release candidate restriction. Provider verification/order reconciliation is
// deliberately a separate stage; no env flag can enable an unverified webhook.
export const PAYMENTS_RESTRICTED = true;
export const PAYMENT_UNAVAILABLE_MESSAGE = "Платные операции временно недоступны. Бесплатная запись работает.";
export function requirePaymentConfirmationReady() {
  if (PAYMENTS_RESTRICTED) throw new CommunityError(PAYMENT_UNAVAILABLE_MESSAGE);
}
