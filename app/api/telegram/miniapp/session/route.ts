import { and, eq, isNull } from "drizzle-orm";
import { miniAppErrorResponse, miniAppResponse, readMiniAppInitData, requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { requireMiniAppUser, withMiniAppSession } from "@/lib/telegram/miniapp-session";
import { miniAppProfile } from "@/lib/telegram/miniapp-user";
import { userIdentities } from "@/lib/db/schema";
import { TELEGRAM_PROVIDER_INSTANCE } from "@/lib/telegram/miniapp-config";
import { telegramMiniAppSessionSubject } from "@/lib/telegram/miniapp-init-data";
import { MiniAppAuthError } from "@/lib/telegram/miniapp-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return miniAppResponse({ ok: true, profile: miniAppProfile(await requireMiniAppUser()) }); }
  catch (error) { return miniAppErrorResponse(error); }
}

/** Resume only the session belonging to this signed Telegram launch. */
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const raw = await readMiniAppInitData(request);
    return await withMiniAppSession(async (tx, user) => {
      const subject = telegramMiniAppSessionSubject(raw);
      const [identity] = await tx.select({ id: userIdentities.id }).from(userIdentities).where(and(
        eq(userIdentities.userId, user.id), eq(userIdentities.provider, "telegram"),
        eq(userIdentities.providerInstance, TELEGRAM_PROVIDER_INSTANCE), eq(userIdentities.providerUserId, subject), isNull(userIdentities.disabledAt)));
      if (!identity) throw new MiniAppAuthError(401, "session_mismatch");
      return miniAppResponse({ ok: true, profile: miniAppProfile(user) });
    });
  } catch (error) { return miniAppErrorResponse(error); }
}
