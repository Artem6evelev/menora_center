export const BROADCAST_TEXT_LIMIT = 3500;
export const BROADCAST_CAPTION_LIMIT = 1024;
export const BROADCAST_IMAGE_LIMIT = 4 * 1024 * 1024;
/** Only our public image buckets. No arbitrary/internal URLs, signed links or credentials. */
export function isBroadcastImageUrl(
  value: string,
  storageUrl: string | undefined,
) {
  try {
    const url = new URL(value),
      storage = new URL(storageUrl!);
    return (
      url.protocol === "https:" &&
      url.origin === storage.origin &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^\/storage\/v1\/object\/public\/(?:images|events)\/.+/.test(url.pathname)
    );
  } catch {
    return false;
  }
}
