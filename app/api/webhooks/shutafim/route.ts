import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventParticipants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("=== SHUTAFIM WEBHOOK RECEIVED ===", body);

    const participantId =
      body.custom1 || body.custom_1 || body.reference || body.order_id;
    const status = body.status || body.payment_status;

    // Если это тестовый запрос из админки (он обычно прилетает без ID)
    if (!participantId) {
      console.log(
        "⚠️ Получен вебхук без ID (вероятно, тестовый сигнал от Shutafim).",
      );
      // Возвращаем 200 OK, чтобы админка Shutafim светилась зеленым
      return NextResponse.json(
        { message: "Test webhook or missing ID received" },
        { status: 200 },
      );
    }

    if (
      status === "success" ||
      status === "paid" ||
      status === "approved" ||
      status === "completed"
    ) {
      await db
        .update(eventParticipants)
        .set({ status: "paid" })
        .where(eq(eventParticipants.id, participantId));
      console.log(
        `✅ Status updated to PAID for participant: ${participantId}`,
      );
      return NextResponse.json({ message: "Status updated to paid" });
    }

    if (
      status === "failed" ||
      status === "abandoned" ||
      status === "canceled"
    ) {
      await db
        .update(eventParticipants)
        .set({ status: "abandoned" })
        .where(eq(eventParticipants.id, participantId));
      console.log(
        `❌ Status updated to ABANDONED for participant: ${participantId}`,
      );
      return NextResponse.json({ message: "Status updated to abandoned" });
    }

    return NextResponse.json({
      message: "Webhook received but status unhandled",
    });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Shutafim Webhook API is running." });
}
