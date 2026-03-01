import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET)
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env",
    );

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", { status: 400 });
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
    return new Response("Error occured", { status: 400 });
  }

  const eventType = evt.type;

  // ЛОГИКА СОЗДАНИЯ ПОЛЬЗОВАТЕЛЯ И ЕГО "ОДИНОЧНОЙ" СЕМЬИ
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;
    const fullName =
      `${first_name || ""} ${last_name || ""}`.trim() || "Новый прихожанин";

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Создаем юзера
        const user = await tx.user.create({
          data: {
            id: id,
            email: primaryEmail,
          },
        });

        // 2. Создаем дефолтную семью
        const family = await tx.family.create({
          data: {
            name: `Семья ${last_name || first_name || ""}`.trim(),
          },
        });

        // 3. Делаем его Главой (HEAD) этой новой семьи
        await tx.familyMember.create({
          data: {
            userId: user.id,
            familyId: family.id,
            role: "HEAD",
            fullName: fullName,
          },
        });
      });
      console.log(`✅ User ${id} and default family created`);
    } catch (error) {
      console.error("❌ Database error during user creation:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
