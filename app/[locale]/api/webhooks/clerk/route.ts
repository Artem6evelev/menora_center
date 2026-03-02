import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // --- user.created ---
  if (evt.type === "user.created") {
    const data = evt.data as any;

    const clerkUserId: string = data.id;

    const primaryEmail: string | undefined =
      data.email_addresses?.find(
        (e: any) => e.id === data.primary_email_address_id,
      )?.email_address ?? data.email_addresses?.[0]?.email_address;

    if (!primaryEmail) {
      // email в твоей схеме обязательный -> без него не создаём пользователя
      console.error("No primary email in Clerk payload for user:", clerkUserId);
      return new Response("No primary email", { status: 400 });
    }

    const firstName: string = data.first_name ?? "";
    const lastName: string = data.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim() || "Новый прихожанин";

    try {
      await prisma.$transaction(async (tx) => {
        // 1) upsert user по clerkUserId
        const user = await tx.user.upsert({
          where: { clerkUserId },
          update: {
            email: primaryEmail,
          },
          create: {
            clerkUserId,
            email: primaryEmail,
          },
          select: { id: true },
        });

        // 2) Если уже есть familyMember — не создаём “одиночную семью” повторно
        const existingMember = await tx.familyMember.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });

        if (!existingMember) {
          const family = await tx.family.create({
            data: {
              name: `Семья ${lastName || firstName || ""}`.trim() || "Семья",
            },
            select: { id: true },
          });

          await tx.familyMember.create({
            data: {
              userId: user.id, // ✅ DB user id
              familyId: family.id,
              role: "HEAD",
              fullName,
            },
          });
        }
      });

      console.log(`✅ Clerk user ${clerkUserId} synced`);
    } catch (error) {
      console.error("❌ Database error during user.created:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  // --- user.updated (рекомендую тоже обрабатывать) ---
  if (evt.type === "user.updated") {
    const data = evt.data as any;

    const clerkUserId: string = data.id;

    const primaryEmail: string | undefined =
      data.email_addresses?.find(
        (e: any) => e.id === data.primary_email_address_id,
      )?.email_address ?? data.email_addresses?.[0]?.email_address;

    if (!primaryEmail) {
      return NextResponse.json({ success: true });
    }

    try {
      await prisma.user.upsert({
        where: { clerkUserId },
        update: { email: primaryEmail },
        create: { clerkUserId, email: primaryEmail },
      });
    } catch (error) {
      console.error("❌ Database error during user.updated:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
