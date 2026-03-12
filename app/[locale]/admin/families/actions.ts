"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/sendEmail";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmailHtml(subject: string, bodyText: string) {
  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(bodyText);

  const body = safeBody
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 10px 0;">${line}</p>`
        : `<div style="height:8px;"></div>`,
    )
    .join("");

  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system; background:#f5f5f5; padding:24px;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; padding:20px; border:1px solid #e5e5e5;">
      <div style="font-size:12px; color:#737373; margin-bottom:10px;">Am Olam</div>
      <div style="font-size:20px; font-weight:700; margin-bottom:14px; color:#111827;">${safeSubject}</div>
      <div style="font-size:15px; color:#111827; line-height:1.6;">${body}</div>
      <div style="margin-top:18px; font-size:12px; color:#9ca3af;">
        Это письмо отправлено из системы общины.
      </div>
    </div>
  </div>`;
}

/** Создать FAMILY-тег (если уже есть — обновим цвет) */
export async function createFamilyTagAction(input: {
  locale: string;
  name: string;
  color?: string;
}) {
  await requireAdmin();

  const locale = input.locale || "ru";
  const name = input.name.trim();
  const color = input.color?.trim() || null;

  if (!name) return { ok: false as const, message: "Введите название тега" };

  const existing = await prisma.tag.findFirst({
    where: { target: "FAMILY", name },
  });

  const tag = existing
    ? await prisma.tag.update({
        where: { id: existing.id },
        data: { color },
      })
    : await prisma.tag.create({
        data: { target: "FAMILY", name, color },
      });

  revalidatePath(`/${locale}/admin/families`);
  return {
    ok: true as const,
    tag: { id: tag.id, name: tag.name, color: tag.color },
  };
}

/** Привязать/отвязать тег от семьи */
export async function toggleFamilyTagAction(input: {
  locale: string;
  familyId: string;
  tagId: string;
  enabled: boolean;
}) {
  await requireAdmin();

  const locale = input.locale || "ru";

  if (input.enabled) {
    await prisma.familyTag
      .create({
        data: { familyId: input.familyId, tagId: input.tagId },
      })
      .catch(() => {});
  } else {
    await prisma.familyTag
      .delete({
        where: {
          familyId_tagId: { familyId: input.familyId, tagId: input.tagId },
        },
      })
      .catch(() => {});
  }

  revalidatePath(`/${locale}/admin/families`);
  return { ok: true as const };
}

/** Email-рассылка: по всем членам выбранных семей (у кого есть user + email) */
export async function sendEmailBroadcastAction(input: {
  locale: string;
  familyIds: string[];
  subject: string;
  bodyText: string;
}) {
  const admin = await requireAdmin();

  const locale = input.locale || "ru";
  const familyIds = input.familyIds || [];
  const subject = input.subject.trim();
  const bodyText = input.bodyText.trim();

  if (!familyIds.length)
    return { ok: false as const, message: "Выберите хотя бы одну семью" };
  if (!subject) return { ok: false as const, message: "Введите тему письма" };
  if (!bodyText) return { ok: false as const, message: "Введите текст письма" };

  const families = await prisma.family.findMany({
    where: { id: { in: familyIds } },
    include: {
      members: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
  });

  // unique recipients by userId
  const recipientsMap = new Map<string, { userId: string; email: string }>();

  for (const f of families) {
    for (const m of f.members) {
      const u = m.user;
      if (!u?.id) continue;
      if (!u.email) continue;
      recipientsMap.set(u.id, { userId: u.id, email: u.email });
    }
  }

  const recipients = Array.from(recipientsMap.values());
  if (!recipients.length) {
    return {
      ok: false as const,
      message:
        "У выбранных семей нет email-адресов (нет привязанных пользователей).",
    };
  }

  const broadcast = await prisma.broadcast.create({
    data: {
      channel: "EMAIL",
      subject,
      title: subject,
      bodyText,
      status: "SENDING",
      filters: { familyIds },
      createdByUserId: admin.id,
      recipients: {
        createMany: {
          data: recipients.map((r) => ({
            userId: r.userId,
            email: r.email,
            status: "QUEUED",
          })),
          skipDuplicates: true,
        },
      },
    },
  });

  const html = buildEmailHtml(subject, bodyText);

  let sent = 0;
  let failed = 0;

  // маленькие пачки, чтобы не улететь в лимиты
  const chunkSize = 15;

  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);

    await Promise.all(
      chunk.map(async (r) => {
        try {
          await sendEmail({ to: r.email, subject, html, text: bodyText });
          sent++;

          await prisma.broadcastRecipient.update({
            where: {
              broadcastId_userId: {
                broadcastId: broadcast.id,
                userId: r.userId,
              },
            },
            data: { status: "SENT", sentAt: new Date() },
          });
        } catch (e: any) {
          failed++;
          await prisma.broadcastRecipient.update({
            where: {
              broadcastId_userId: {
                broadcastId: broadcast.id,
                userId: r.userId,
              },
            },
            data: { status: "FAILED", error: String(e?.message || e) },
          });
        }
      }),
    );
  }

  await prisma.broadcast.update({
    where: { id: broadcast.id },
    data: { status: failed === 0 ? "DONE" : "FAILED" },
  });

  revalidatePath(`/${locale}/admin/families`);
  return { ok: true as const, sent, failed, broadcastId: broadcast.id };
}
