"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { desc, ilike, or, sql } from "drizzle-orm";
import nodemailer from "nodemailer";

export async function getAllUsers() {
  return await db.select().from(users);
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    return { success: true };
  } catch (error) {
    console.error("Ошибка при обновлении роли:", error);
    return { success: false, error: "Не удалось обновить роль" };
  }
}

export async function completeUserProfile(userId: string, data: any) {
  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "";
    const firstName = clerkUser?.firstName || "друг";

    const fullPhone = `${data.phoneCode}${data.phone}`;

    // === СОХРАНЕНИЕ В БАЗУ (Upsert) ===
    await db
      .insert(users)
      .values({
        id: userId,
        email: email,
        firstName: clerkUser?.firstName || "",
        lastName: clerkUser?.lastName || "",
        imageUrl: clerkUser?.imageUrl || "",
        role: "client",
        isProfileComplete: true,
        phone: fullPhone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        city: data.city,
        maritalStatus: data.maritalStatus,
        hasChildren: data.hasChildren === "yes",
        source: data.source || null,
        jewishStatus: data.jewishStatus,
        agreedToPrivacy: true,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          isProfileComplete: true,
          phone: fullPhone,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          city: data.city,
          maritalStatus: data.maritalStatus,
          hasChildren: data.hasChildren === "yes",
          source: data.source || null,
          jewishStatus: data.jewishStatus,
          agreedToPrivacy: true,
        },
      });

    // ==========================================
    // ✉️ БЕСПЛАТНАЯ ОТПРАВКА ЧЕРЕЗ GMAIL + NODEMAILER
    // ==========================================
    if (email) {
      console.log(`Отправляем письмо через Gmail на ${email}...`);

      console.log("Моя почта:", process.env.EMAIL_USER);
      console.log(
        "Пароль загрузился?:",
        process.env.EMAIL_PASS ? "ДА!" : "НЕТ!",
      );

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true для порта 465
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: `"Menora Center" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Добро пожаловать в общину Менора! 🕎",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h1 style="color: #FFB800;">Шалом, ${firstName}!</h1>
            <p style="font-size: 16px; line-height: 1.5;">
              Мы очень рады приветствовать вас в цифровом пространстве общины <b>Менора</b>. 
              Ваша регистрация успешно завершена!
            </p>
            <p style="font-size: 16px; line-height: 1.5;">
              Теперь в вашем Личном кабинете вам доступна запись на уроки Торы, фарбренгены, праздники и другие мероприятия общины.
            </p>
            <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 10px; border-left: 4px solid #FFB800;">
              <p style="margin: 0; font-size: 14px; color: #555;">
                <i>«Духовный рост. В единой общине.»</i>
              </p>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #888;">
              С уважением,<br/>Команда Menora Center
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Письмо успешно отправлено!");
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("🔥 ОШИБКА БД ПРИ ОНБОРДИНГЕ:", error);
    return {
      success: false,
      message: error.message || "Неизвестная ошибка БД",
    };
  }
}

export async function getUsersPaginated(
  page = 1,
  limit = 20,
  searchQuery = "",
  filters?: {
    jewishStatus?: string;
    maritalStatus?: string;
    hasChildren?: string;
  },
) {
  try {
    const offset = (page - 1) * limit;

    // Собираем все условия в массив
    let allConditions: any[] = [];

    // 1. Условие текстового поиска
    if (searchQuery.trim()) {
      const q = `%${searchQuery.trim()}%`;
      allConditions.push(
        or(
          ilike(users.firstName, q),
          ilike(users.lastName, q),
          ilike(users.phone, q),
          ilike(users.email, q),
          ilike(users.city, q),
        ),
      );
    }

    // 2. Условия из фильтров (выпадающих списков)
    if (filters?.jewishStatus) {
      allConditions.push(eq(users.jewishStatus, filters.jewishStatus));
    }
    if (filters?.maritalStatus) {
      allConditions.push(eq(users.maritalStatus, filters.maritalStatus));
    }
    if (filters?.hasChildren) {
      const booleanValue = filters.hasChildren === "yes";
      allConditions.push(eq(users.hasChildren, booleanValue));
    }

    // Объединяем все условия через AND (чтобы работали все вместе)
    const finalCondition =
      allConditions.length > 0 ? and(...allConditions) : undefined;

    const data = await db
      .select()
      .from(users)
      .where(finalCondition)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(finalCondition);

    const totalUsers = Number(totalCountResult[0].count);

    return {
      users: data,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    };
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
    return { users: [], totalPages: 0, totalUsers: 0 };
  }
}

export async function updateUserTags(userId: string, tags: string[]) {
  try {
    await db
      .update(users)
      .set({ tags: JSON.stringify(tags) })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
