import { ZodError } from "zod";
/** Only deliberately public domain errors may cross a server action boundary. */
export class CommunityError extends Error {}
export function communityErrorMessage(error: unknown, fallback: string) {
  if (error instanceof CommunityError) return error.message;
  if (error instanceof ZodError) return "Проверьте обязательные поля и данные формы";
  return fallback;
}
