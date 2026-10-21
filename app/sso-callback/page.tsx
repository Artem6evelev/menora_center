"use client";

import { Suspense, useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { eventReturnTo, validAttemptId } from "@/lib/community/policy";

function Callback() {
  const params = useSearchParams();
  const [takingLonger, setTakingLonger] = useState(false);
  const target = eventReturnTo(params.get("returnTo"));
  const draft = params.get("draft");
  const suffix = `${params.get("registration") === "1" ? "&registration=1" : ""}${validAttemptId(draft) ? `&draft=${draft}` : ""}`;
  const query = `returnTo=${encodeURIComponent(target)}${suffix}`;
  const destination = `/auth/complete?${query}`;

  useEffect(() => {
    // The SDK can fail to load or leave its callback pending without rejecting.
    // Offer recovery without restarting OAuth or assuming a session is ready.
    const timeout = window.setTimeout(() => setTakingLonger(true), 20_000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <>
      {/* Clerk mounts its handler only after the browser SDK is ready. */}
      <AuthenticateWithRedirectCallback
        key={destination}
        signInUrl={`/sign-in/continue?${query}`}
        signUpUrl={`/sign-up?${query}`}
        signInForceRedirectUrl={destination}
        signUpForceRedirectUrl={destination}
        signInFallbackRedirectUrl={destination}
        signUpFallbackRedirectUrl={destination}
      />
      <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 text-center">
        <p role="status">
          {takingLonger ? "Вход занимает больше времени, чем обычно." : "Завершаем вход…"}
        </p>
        {takingLonger && (
          <>
            <p>Попробуйте продолжить вход или войдите ещё раз.</p>
            <a href={destination} className="underline">Продолжить вход</a>
            <a href={`/sign-in?${query}`} className="underline">Вернуться ко входу</a>
          </>
        )}
      </main>
    </>
  );
}

export default function Page() {
  return <Suspense fallback={<p role="status">Загрузка…</p>}><Callback /></Suspense>;
}
