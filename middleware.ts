// middleware.ts
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";

const locales = ["en", "ru", "he"] as const;
const defaultLocale = "ru" as const;

const intlMiddleware = createIntlMiddleware({
  locales: ["en", "ru", "he"],
  defaultLocale: "ru",
  localePrefix: "always",
  localeDetection: true,
});

// защищаем только локализованные роуты
const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)",
  "/:locale/admin(.*)",
  "/:locale/invite(.*)",
]);

function getLocaleFromPath(pathname: string) {
  const maybe = pathname.split("/")[1];
  return (locales as readonly string[]).includes(maybe) ? maybe : defaultLocale;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // 1) Пропускаем API / TRPC сразу
  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
    return NextResponse.next();
  }

  // 2) Сначала i18n: добавит /ru, /en, /he если их нет
  const intlResponse = intlMiddleware(req);

  // Если next-intl уже решил сделать redirect (например, / -> /ru),
  // возвращаем его сразу, а защита сработает на следующем запросе.
  const location = intlResponse.headers.get("location");
  if (location) return intlResponse;

  // 3) Затем защита Clerk
  if (isProtectedRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      const locale = getLocaleFromPath(pathname);

      // Локализованный sign-in + возврат назад
      const signInUrl = new URL(`/${locale}/sign-in`, req.url);
      signInUrl.searchParams.set("redirect_url", req.url);

      return NextResponse.redirect(signInUrl);
    }
  }

  // 4) Обычная страница — отдаём intl-ответ (rewrite/next)
  return intlResponse;
});

// Важно: не матчим статику, _next, файлы, api/trpc
export const config = {
  matcher: ["/((?!api|trpc|_next|.*\\..*).*)"],
};
