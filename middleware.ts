// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Защищаем кабинеты админа и пользователя
const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
  const response = NextResponse.next();
  if (isProtectedRoute(req) || req.nextUrl.pathname === "/register" || req.nextUrl.pathname.startsWith("/auth/")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }
  return response;
});

export const config = {
  // Защищаем все роуты, кроме статики и вебхуков бота
  matcher: ["/((?!.*\\..*|_next|api/bot).*)", "/", "/(api|trpc)(.*)"],
};
