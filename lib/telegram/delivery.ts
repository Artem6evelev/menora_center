/** A remembered marketing preference is separate from Telegram transport reachability. */
export function telegramDeliveryAvailable(
  contact:
    | {
        telegramChatId: string | null;
        blockedAt: Date | null;
        marketingStatus: string;
        isPrimary: boolean;
      }
    | null
    | undefined,
) {
  return (
    !!contact &&
    contact.isPrimary &&
    !!contact.telegramChatId?.trim() &&
    !contact.blockedAt &&
    contact.marketingStatus !== "blocked"
  );
}
