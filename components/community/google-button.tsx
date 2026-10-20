"use client";
import { useState } from "react";
import { useClerk, useAuth } from "@clerk/nextjs";
import { safeReturnTo, validAttemptId } from "@/lib/community/policy";
export default function GoogleButton({ returnTo = "/dashboard", label = "Войти", registration = false, draftId }: { returnTo?: string; label?: string; registration?: boolean; draftId?: string }) {
  const clerk = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const target = safeReturnTo(returnTo);
  async function start() {
    setPending(true); setError("");
    const suffix = registration ? `&registration=1${validAttemptId(draftId) ? `&draft=${encodeURIComponent(draftId)}` : ""}` : "";
    const destination = `/auth/complete?returnTo=${encodeURIComponent(target)}${suffix}`;
    if (isSignedIn) { window.location.assign(destination); return; }
    try {
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
