import { z } from "zod";
import { db } from "@/lib/db";
import { miniAppErrorResponse, miniAppResponse, readMiniAppJson, requireMiniAppSameOrigin } from "@/lib/telegram/miniapp-http";
import { miniAppCookieName, miniAppCookieOptions } from "@/lib/telegram/miniapp-config";
import { telegramMiniAppSessionSubject, validateTelegramMiniAppInitData } from "@/lib/telegram/miniapp-init-data";
import { readMiniAppSession, openMiniAppSession, touchMiniAppSession } from "@/lib/telegram/miniapp-session";
import { miniAppProfileData } from "@/lib/telegram/miniapp-profile";
import { miniAppLaunch } from "@/lib/telegram/event-launch";
import { homeMiniAppEvents } from "@/lib/telegram/miniapp-events";
import { MiniAppAuthError } from "@/lib/telegram/miniapp-errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const input = z.object({initData:z.string(),event:z.string().max(150).optional(),campaign:z.string().max(64).optional(),section:z.enum(["kids"]).optional(),view:z.enum(["events"]).optional()}).strict();
export async function POST(request: Request) {
  try {
    requireMiniAppSameOrigin(request);
    const parsed=input.safeParse(await readMiniAppJson(request));
    if(!parsed.success) throw new MiniAppAuthError(400,"malformed_request");
    const body=parsed.data, subject=telegramMiniAppSessionSubject(body.initData);
    let user, opened: Awaited<ReturnType<typeof openMiniAppSession>> | undefined;
    try { const row=await readMiniAppSession(subject); user=row.user; if(Date.now()-row.session.lastSeenAt.getTime()>300_000)await touchMiniAppSession(row.session.id); }
    catch(error) {
      // A revoked/disabled own session never silently becomes a new session. An
      // absent/expired/mismatched cookie can bootstrap only with a fresh HMAC proof.
      if(!(error instanceof MiniAppAuthError)||!["session_missing","session_expired","session_mismatch"].includes(error.code)) throw error;
      opened=await openMiniAppSession(validateTelegramMiniAppInitData(body.initData)); user=opened.user;
    }
    const profile=await miniAppProfileData(db,user);
    const signedStart=new URLSearchParams(body.initData).get("start_param");
    const hasLaunch=!!body.event||!!body.campaign||body.section!=="kids"&&!!signedStart;
    const launch=hasLaunch ? await miniAppLaunch(db,user,{event:body.event??null,campaign:body.campaign??signedStart??null}) : {event:null};
    const destination=launch.event?"events":body.section??body.view??"home";
    const homeEvents=profile.summary.nextStep==="home"&&destination==="home"?await homeMiniAppEvents(db,user):[];
    const response=miniAppResponse({ok:true,...profile,launchEvent:launch.event,homeEvents,destination,sessionCreated:!!opened,
      eventUnavailable:hasLaunch&&!launch.event&&(!!body.event||(body.campaign??signedStart??"").startsWith("event_"))&&profile.summary.nextStep!=="resources"});
    if(opened)response.cookies.set(miniAppCookieName(),opened.token,miniAppCookieOptions(opened.ttl));
    return response;
  } catch(error) {return miniAppErrorResponse(error);}
}
