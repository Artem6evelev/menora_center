import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { FamiliesCRMClient } from "@/components/admin/families-crm-client";

function calcAge(d?: Date | null) {
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default async function AdminFamiliesCRMPage({
  params,
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  await requireAdmin();

  const { locale } = await Promise.resolve(params);
  const safeLocale = locale || "ru";

  const [families, tags, broadcasts] = await Promise.all([
    prisma.family.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tag: true } },
        members: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
      take: 200,
    }),

    prisma.tag.findMany({
      where: { target: "FAMILY" },
      orderBy: { name: "asc" },
    }),

    prisma.broadcast.findMany({
      where: { channel: "EMAIL" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        subject: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // stats по BroadcastRecipient: SENT/FAILED/QUEUED на каждый broadcast
  const broadcastIds = broadcasts.map((b) => b.id);
  const grouped =
    broadcastIds.length > 0
      ? await prisma.broadcastRecipient.groupBy({
          by: ["broadcastId", "status"],
          where: { broadcastId: { in: broadcastIds } },
          _count: { _all: true },
        })
      : [];

  const statsMap = new Map<
    string,
    { sent: number; failed: number; queued: number }
  >();

  for (const row of grouped) {
    const cur = statsMap.get(row.broadcastId) ?? {
      sent: 0,
      failed: 0,
      queued: 0,
    };
    const n = row._count._all ?? 0;
    if (row.status === "SENT") cur.sent += n;
    if (row.status === "FAILED") cur.failed += n;
    if (row.status === "QUEUED") cur.queued += n;
    statsMap.set(row.broadcastId, cur);
  }

  const familyRows = families.map((f) => {
    const head = f.members.find((m) => m.role === "HEAD")?.fullName ?? null;
    const spouses = f.members
      .filter((m) => m.role === "SPOUSE")
      .map((m) => m.fullName);
    const children = f.members
      .filter((m) => m.role === "CHILD")
      .map((m) => ({
        name: m.fullName,
        age: calcAge(m.birthDateGeorgian),
      }));

    const emailsSet = new Set<string>();
    for (const m of f.members) {
      const email = m.user?.email;
      if (email) emailsSet.add(email);
    }

    return {
      id: f.id,
      name: f.name,
      headName: head,
      spouses,
      children,
      emails: Array.from(emailsSet),
      tags: f.tags.map((ft) => ({
        id: ft.tag.id,
        name: ft.tag.name,
        color: ft.tag.color ?? null,
      })),
    };
  });

  const tagRows = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color ?? null,
  }));

  const broadcastRows = broadcasts.map((b) => {
    const s = statsMap.get(b.id) ?? { sent: 0, failed: 0, queued: 0 };
    return {
      id: b.id,
      subject: (b.subject ?? b.title ?? "(Без темы)") as string,
      status: b.status as any,
      createdAt: b.createdAt.toISOString(),
      sent: s.sent,
      failed: s.failed,
      queued: s.queued,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">CRM: Семьи</h1>
        <div className="text-sm text-neutral-500">
          Фильтры по тегам, быстрый выбор и e-mail рассылка.
        </div>
      </div>

      <FamiliesCRMClient
        locale={safeLocale}
        initialFamilies={familyRows}
        initialTags={tagRows}
        initialBroadcasts={broadcastRows}
      />
    </div>
  );
}
