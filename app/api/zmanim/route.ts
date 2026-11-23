import { NextResponse } from "next/server";
import { getChabadZmanim } from "@/lib/zmanim/chabad";
import { isZmanimDate, israelDate } from "@/lib/zmanim/shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? israelDate();
  if (!isZmanimDate(date))
    return NextResponse.json(
      { error: "Укажите корректную дату." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await getChabadZmanim(date), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error: "Не удалось обновить время Chabad.org. Повторяем автоматически.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "30" },
      },
    );
  }
}
