import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminFamilyPage({
  params,
}: {
  params: { locale: string; familyId: string };
}) {
  await requireAdmin();

  const family = await prisma.family.findUnique({
    where: { id: params.familyId },
    include: {
      members: {
        include: {
          user: {
            select: { email: true, telegramChatId: true, clerkUserId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!family) notFound();

  // сортировка: HEAD первым, затем остальные
  const members = [...family.members].sort((a, b) => {
    if (a.role === "HEAD" && b.role !== "HEAD") return -1;
    if (a.role !== "HEAD" && b.role === "HEAD") return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{family.name}</h1>
          <div className="text-xs text-muted-foreground">
            Created: {family.createdAt.toLocaleString()}
          </div>
        </div>

        <Link
          href={`/${params.locale}/admin/families`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
      </div>

      <div className="rounded-2xl border">
        <div className="border-b px-4 py-3 font-medium">Members</div>

        <div className="divide-y">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/${params.locale}/admin/families/${family.id}/members/${m.id}`}
              className="block px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {m.fullName}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({m.role})
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.user?.email
                      ? `Linked: ${m.user.email}`
                      : "Not linked to a user"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Edit →</div>
              </div>
            </Link>
          ))}

          {members.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No members.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
