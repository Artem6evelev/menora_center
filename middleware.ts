// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Защищаем кабинеты админа и пользователя
const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // <- Теперь это асинхронный вызов
  }
});

export const config = {
  // Защищаем все роуты, кроме статики и вебхуков бота
  matcher: ["/((?!.*\\..*|_next|api/bot).*)", "/", "/(api|trpc)(.*)"],
};
