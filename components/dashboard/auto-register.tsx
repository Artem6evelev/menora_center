// components/dashboard/auto-register.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import { registerForEvent } from "@/actions/event";
import { useRouter } from "next/navigation";

export default function AutoRegister({
  userId,
  userPhone,
}: {
  userId: string;
  userPhone: string;
}) {
  const { pendingEventId, pendingPhone, pendingExtraData, clearPendingEvent } =
    useRegistrationStore();
  const router = useRouter();
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!pendingEventId || !userId || isProcessing.current) return;

    const processAutoRegistration = async () => {
      isProcessing.current = true;

      try {
        const phoneToUse = pendingPhone || userPhone || "Не указан";
        const res = await registerForEvent(
          pendingEventId,
          userId,
          phoneToUse,
          pendingExtraData,
        );

        if (res.success) {
          clearPendingEvent();
          router.refresh();
        }
      } catch (error) {
        console.error("❌ Ошибка при авто-регистрации:", error);
        clearPendingEvent();
      }
    };

    processAutoRegistration();
  }, [
    pendingEventId,
    pendingPhone,
    pendingExtraData,
    userId,
    userPhone,
    clearPendingEvent,
    router,
  ]);

  return null;
}
