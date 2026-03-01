import type { Metadata } from "next";
import { Inter, Noto_Sans_Hebrew } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/context/theme-provider";
import "../globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin", "cyrillic"] });
const hebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-hebrew",
});

export const metadata: Metadata = {
  title: "Menorah - Chabad Community OS",
  description: "Единая платформа для управления общиной",
};

// ВАЖНО: Обновляем типизацию для Next.js 15
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Теперь это Promise!
}) {
  // 1. Ждем параметры (Breaking Change Fix)
  const { locale } = await params;

  // 2. Получаем переводы
  const messages = await getMessages();

  const direction = locale === "he" ? "rtl" : "ltr";
  const fontClass = locale === "he" ? hebrew.className : inter.className;

  return (
    <ClerkProvider>
      <html lang={locale} dir={direction} suppressHydrationWarning>
        <body
          className={cn(
            "min-h-screen bg-background text-foreground antialiased",
            fontClass,
          )}
        >
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
