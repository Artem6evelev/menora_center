import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// 1. Строго типизируем LayoutProps
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminLayout({ children, params }: LayoutProps) {
  await requireAdmin();

  // 2. Распаковываем параметры через await
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const safeLocale = locale || "ru";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${safeLocale}/admin`} className="font-semibold">
              Admin CRM
            </Link>

            <Link
              href={`/${safeLocale}/admin/families`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Families
            </Link>
          </div>

          <Link
            href={`/${safeLocale}/dashboard/family`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Go to User Dashboard →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
