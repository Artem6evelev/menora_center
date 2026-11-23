import type { Metadata } from "next";
import ZmanimBoard from "@/components/zmanim/zmanim-board";
import { getChabadZmanim } from "@/lib/zmanim/chabad";
import { israelDate, type ZmanimData } from "@/lib/zmanim/shared";
import { holidayCalendarForDate } from "@/lib/zmanim/holiday-calendar";
import type { HolidayCalendar } from "@/lib/zmanim/holiday-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Зманим — Ришон ле-Цион",
  description:
    "Табло зманим для Ришон ле-Циона по расчётам Chabad.org: время молитвы, зажигание свечей и исход Шаббата. Местное время Израиля.",
  alternates: { canonical: "/zmanim" },
  openGraph: {
    title: "Зманим — Ришон ле-Цион | Menorah Center",
    url: "/zmanim",
  },
};

export default async function ZmanimPage() {
  const now = Date.now();
  let data: ZmanimData | null = null;
  let calendar: HolidayCalendar | null = null;
  try {
    calendar = await holidayCalendarForDate(israelDate(now));
  } catch {
    console.warn("[zmanim] calendar-unavailable");
  }
  try {
    data = await getChabadZmanim(israelDate(now));
  } catch {
    /* Board retries without inventing or reusing another day's times. */
  }
  return (
    <ZmanimBoard
      initialData={data}
      initialCalendar={calendar}
      initialNow={Date.now()}
    />
  );
}
