import { NextResponse } from "next/server";
import { redis } from "@/lib/redis/client"; // Проверь, чтобы путь импорта совпадал с твоим алиасом

export async function GET() {
  try {
    // Пробуем записать данные в Redis на 60 секунд
    await redis.set("system:status", "online", "EX", 60);

    // Пробуем прочитать эти данные
    const status = await redis.get("system:status");

    return NextResponse.json({
      success: true,
      message: "Redis is working perfectly!",
      redis_status: status,
    });
  } catch (error) {
    console.error("Redis Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to Redis",
      },
      { status: 500 },
    );
  }
}
