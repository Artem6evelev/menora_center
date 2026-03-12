import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ locale: "ru" | "en" | "he" }>;
}) {
  const admin = await requireAdmin();
  const { locale } = await params;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Rabbi Admin Panel</h1>
        <p className="text-sm text-muted-foreground">
          Logged in as: <span className="font-medium">{admin.email}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/${locale}/admin/families`}
          className="rounded-2xl border p-4 transition-colors hover:bg-muted/50"
        >
          <div className="font-medium">Families</div>
          <div className="text-sm text-muted-foreground">
            View all families and members
          </div>
        </Link>
      </div>
    </div>
  );
}
