"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { eventReturnTo, validAttemptId } from "@/lib/community/policy";
function Callback() {
  const clerk = useClerk(); const params = useSearchParams();
  const started = useRef(false); const [error, setError] = useState(false);
  useEffect(() => {
    if (!clerk.loaded || started.current) return;
    started.current = true;
    const target = eventReturnTo(params.get("returnTo"));
    const draft = params.get("draft");
    const suffix = `${params.get("registration") === "1" ? "&registration=1" : ""}${validAttemptId(draft) ? `&draft=${draft}` : ""}`;
    const destination = `/auth/complete?returnTo=${encodeURIComponent(target)}${suffix}`;
    void clerk.handleRedirectCallback({ signInUrl: `/sign-in/continue?returnTo=${encodeURIComponent(target)}${suffix}`, signUpUrl: `/sign-up?returnTo=${encodeURIComponent(target)}${suffix}`,
      signInForceRedirectUrl: destination, signUpForceRedirectUrl: destination,
      signInFallbackRedirectUrl: destination, signUpFallbackRedirectUrl: destination,
    }).catch(() => setError(true));
  }, [clerk, params]);
  return <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4"><p role="status">{error ? "Вход не завершён. Попробуйте ещё раз." : "Завершаем вход…"}</p>{error && <a href={`/sign-in?returnTo=${encodeURIComponent(eventReturnTo(params.get("returnTo")))}${validAttemptId(params.get("draft")) ? `&draft=${params.get("draft")}` : ""}`} className="underline">Вернуться ко входу</a>}</main>;
}
export default function Page() { return <Suspense fallback={<p>Загрузка…</p>}><Callback /></Suspense>; }
