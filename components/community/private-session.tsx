"use client";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PrivateSession({ expectedUserId, children }: { expectedUserId: string; children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isLoaded && userId !== expectedUserId) {
      router.replace(userId ? "/auth/complete" : "/sign-in");
      router.refresh();
    }
  }, [isLoaded, userId, expectedUserId, router]);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => { if (event.persisted) window.location.reload(); };
    const refresh = () => router.refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", restore);
    return () => { window.removeEventListener("pageshow", restore); window.removeEventListener("focus", refresh); };
  }, [router]);
  if (!isLoaded || userId !== expectedUserId) return <main className="p-8" role="status">Проверяем вход…</main>;
  return children;
}
