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
  const { pendingEventId, clearPendingEvent } = useRegistrationStore();
  const router = useRouter();

  // Используем useRef, чтобы гарантировать только ОДИН вызов функции
  const isProcessing = useRef(false);

  useEffect(() => {
    // Если нет ID ожидающего события, нет юзера или процесс уже идет - отбой
    if (!pendingEventId || !userId || isProcessing.current) return;

    const processAutoRegistration = async () => {
      isProcessing.current = true; // Блокируем повторные запуски

      try {
        console.log(
          "⏳ Пытаемся автоматически записать на событие:",
          pendingEventId,
        );
        const res = await registerForEvent(
          pendingEventId,
          userId,
          userPhone || "Не указан",
        );

        if (res.success) {
          console.log("✅ Авто-регистрация успешна!");
          clearPendingEvent(); // Очищаем хранилище

          // 🔥 САМОЕ ВАЖНОЕ: Принудительно обновляем серверные данные на странице!
          // Это заставит страницу "Мои билеты" перезагрузить список из БД и показать новый билет.
          router.refresh();
        }
      } catch (error) {
        console.error("❌ Ошибка при авто-регистрации:", error);
        clearPendingEvent(); // В случае системной ошибки тоже чистим кэш
      }
    };

    processAutoRegistration();
  }, [pendingEventId, userId, userPhone, clearPendingEvent, router]);

  return null; // Компонент работает исключительно в фоне
}
