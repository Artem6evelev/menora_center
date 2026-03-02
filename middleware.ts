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

// ✅ Защищаем ТОЛЬКО закрытые зоны
const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)",
  "/:locale/admin(.*)",
]);

function getLocaleFromPath(pathname: string) {
  const maybe = pathname.split("/")[1];
  return (locales as readonly string[]).includes(maybe as any)
    ? maybe
    : defaultLocale;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname, search } = req.nextUrl;

  // API/TRPC не трогаем
  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
    return NextResponse.next();
  }

  // i18n first
  const intlResponse = intlMiddleware(req);

  // если next-intl уже редиректит (/ -> /ru), отдаём редирект
  if (intlResponse.headers.get("location")) return intlResponse;

  // protect dashboard/admin only
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const locale = getLocaleFromPath(pathname);
      const signInUrl = new URL(`/${locale}/sign-in`, req.url);

      // ✅ return back after login
      signInUrl.searchParams.set("redirect_url", pathname + search);

      return NextResponse.redirect(signInUrl);
    }
  }

  return intlResponse;
});

export const config = {
  matcher: ["/((?!api|trpc|_next|.*\\..*).*)"],
};
