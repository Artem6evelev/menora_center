import { NextResponse } from "next/server";
import { getChabadZmanim } from "@/lib/zmanim/chabad";
import { isZmanimDate, israelDate } from "@/lib/zmanim/shared";
import { holidayCalendarForDate } from "@/lib/zmanim/holiday-calendar";
import type { HolidayCalendar } from "@/lib/zmanim/holiday-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? israelDate();
  if (!isZmanimDate(date))
    return NextResponse.json(
      { error: "Укажите корректную дату." },
      { status: 400 },
    );
  let calendar: HolidayCalendar | null = null;
  try {
    calendar = await holidayCalendarForDate(date);
  } catch {
    console.warn("[zmanim] calendar-unavailable");
  }
  try {
    return NextResponse.json(
      { ...(await getChabadZmanim(date)), calendar },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Не удалось обновить время Chabad.org. Повторяем автоматически.",
        calendar,
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "30" },
      },
    );
  }
}
