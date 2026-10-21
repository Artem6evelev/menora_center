"use client";
import { useState } from "react";
import { useClerk, useAuth } from "@clerk/nextjs";
import { eventReturnTo, validAttemptId } from "@/lib/community/policy";
import { ensureRegistrationAttempt } from "@/actions/community-progress";
import { useAttempt } from "./attempt-context";
export default function GoogleButton({ returnTo = "/dashboard", label = "Войти", registration = false, draftId }: { returnTo?: string; label?: string; registration?: boolean; draftId?: string }) {
  const clerk = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const target = eventReturnTo(returnTo); const attempt = useAttempt();
  async function start() {
    setPending(true); setError("");
    try {
      const preparedId = await attempt.prepare();
      const id = preparedId || (validAttemptId(draftId) ? draftId : crypto.randomUUID());
      let saved = await ensureRegistrationAttempt(id, target);
      if (!saved.success && !preparedId) saved = await ensureRegistrationAttempt(crypto.randomUUID(), target);
      if (!saved.success) throw new Error(saved.message);
      const suffix = `&draft=${encodeURIComponent(saved.draftId)}${registration ? '&registration=1' : ''}`;
      const destination = `/auth/complete?returnTo=${encodeURIComponent(target)}${suffix}`;
      if (isSignedIn) { window.location.assign(destination); return; }
      if (!clerk.client) throw new Error("Вход ещё загружается");
      // The installed Clerk v7 still supports this low-level redirect API used by this project.
      // Callback handling stays in Clerk, including OAuth state/nonce and sign-in/sign-up transfer.
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: "oauth_google", redirectUrl: `/sso-callback?returnTo=${encodeURIComponent(target)}${suffix}`,
        redirectUrlComplete: destination,
      });
    } catch { setError("Не удалось открыть вход Google. Попробуйте ещё раз."); setPending(false); }
  }
  return <div className="w-full"><button type="button" onClick={start} disabled={!isLoaded || pending} className="w-full rounded-2xl bg-gradient-to-r from-[#FFB800] to-orange-500 px-5 py-4 font-bold text-black shadow-lg shadow-amber-400/15 disabled:opacity-60 hover:brightness-105 transition">
    {pending ? "Открываем Google…" : label}
  </button>{error && <p role="alert" className="text-sm text-red-600 mt-3">{error}</p>}</div>;
}
