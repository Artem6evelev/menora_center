// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";

// Защищаем кабинеты админа и пользователя
const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/dashboard(.*)"]);

const websiteMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
  const response = NextResponse.next();
  if (
    isProtectedRoute(req) ||
    req.nextUrl.pathname === "/register" ||
    req.nextUrl.pathname.startsWith("/auth/")
  ) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
  }
  return response;
});

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const path = request.nextUrl.pathname;
  if (
    path === "/miniapp" ||
    path.startsWith("/miniapp/") ||
    path.startsWith("/api/telegram/miniapp/") ||
    path === "/api/telegram/webhook" ||
    path === "/api/internal/telegram/broadcast-worker" ||
    path === "/api/telegram/remind" ||
    (request.method === "GET" && path === "/api/community/cities")
  ) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  return websiteMiddleware(request, event);
}

export const config = {
  // Защищаем все роуты, кроме статики и вебхуков бота
  matcher: ["/((?!.*\\..*|_next|api/bot).*)", "/", "/(api|trpc)(.*)"],
};
