import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "ru", "he"],
  defaultLocale: "ru",
});

const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)",
  "/:locale/admin(.*)",
  "/dashboard(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // 1. Проверяем, защищен ли маршрут
  if (isProtectedRoute(req)) {
    // 2. Ждем получения данных аутентификации
    const authObj = await auth();

    // 3. Ручная защита: Если нет userId — перенаправляем на вход
    if (!authObj.userId) {
      return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
    }
  }

  // --- НОВОЕ ПРАВИЛО ---
  // Если это запрос к нашему API (например, /api/redis-test или вебхук бота),
  // мы просто выходим из middleware и позволяем Next.js обработать его как есть.
  if (req.nextUrl.pathname.startsWith("/api")) {
    return;
  }

  // 4. Если это обычная страница — отдаем управление локализации
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
