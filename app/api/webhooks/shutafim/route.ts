// app/api/webhooks/shutafim/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventParticipants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
// Если у тебя настроена функция уведомлений, импортируй её. Иначе можно закомментировать.
// import { sendPaymentSuccessNotification } from '@/actions/telegram';

export async function POST(request: Request) {
  try {
    // Читаем данные, которые прислал Shutafim
    const body = await request.json();

    console.log("=== SHUTAFIM WEBHOOK RECEIVED ===", body);

    // 1. Ищем ID заявки
    // Обычно Shutafim возвращает кастомные параметры в поле, которое мы передавали.
    // Допустим, мы передали ?custom1=part_12345. В вебхуке это может быть body.custom1, body.custom_1 или body.transaction.custom1.
    // Для страховки проверим несколько возможных полей (уточни в доках Shutafim, как они возвращают custom поля).
    const participantId =
      body.custom1 || body.custom_1 || body.reference || body.order_id;

    // 2. Ищем статус оплаты
    // Статус тоже может называться по-разному в зависимости от платформы (success, completed, paid)
    const status = body.status || body.payment_status;

    if (!participantId) {
      console.error("Webhook Error: Missing participant ID in custom1");
      return NextResponse.json(
        { error: "Missing participant ID" },
        { status: 400 },
      );
    }

    // 3. Обработка УСПЕШНОЙ оплаты
    // Подстрой под точный статус, который шлет Shutafim (напимер, "success" или "approved")
    if (
      status === "success" ||
      status === "paid" ||
      status === "approved" ||
      status === "completed"
    ) {
      // Обновляем статус в нашей базе
      await db
        .update(eventParticipants)
        .set({ status: "paid" })
        .where(eq(eventParticipants.id, participantId));

      console.log(
        `✅ Status updated to PAID for participant: ${participantId}`,
      );

      // Опционально: Отправка уведомления админам
      // await sendPaymentSuccessNotification(participantId, body.amount);

      return NextResponse.json({ message: "Status updated to paid" });
    }

    // 4. Обработка ОТКАЗА или ОШИБКИ
    if (
      status === "failed" ||
      status === "abandoned" ||
      status === "canceled"
    ) {
      await db
        .update(eventParticipants)
        .set({ status: "abandoned" }) // Или 'failed'
        .where(eq(eventParticipants.id, participantId));

      console.log(
        `❌ Status updated to ABANDONED for participant: ${participantId}`,
      );
      return NextResponse.json({
        message: "Status updated to failed/abandoned",
      });
    }

    // Если статус незнаком
    console.log(`⚠️ Unhandled status received: ${status}`);
    return NextResponse.json({
      message: "Webhook received but status unhandled",
    });
  } catch (error) {
    console.error("Webhook Error (Internal):", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Отвечаем на GET-запросы, чтобы можно было проверить, что роут жив (введя URL в браузере)
export async function GET() {
  return NextResponse.json({ message: "Shutafim Webhook API is running." });
}
