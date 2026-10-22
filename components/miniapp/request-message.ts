import { MiniAppRequestError } from "@/lib/telegram/miniapp-client";
import type { MiniAppCopy } from "@/lib/telegram/miniapp-i18n";
export function requestMessage(error: unknown, copy: MiniAppCopy) {
  const code = error instanceof MiniAppRequestError ? error.code : "generic";
  return copy.errors[code as keyof typeof copy.errors] ?? copy.errors.generic;
}
