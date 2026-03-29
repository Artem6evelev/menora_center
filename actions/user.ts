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

    // Используем Имя из формы, если его нет — из Clerk, если и там нет — "Резидент"
    const userFirstName = data.firstName || clerkUser?.firstName || "Резидент";
    const userLastName = data.lastName || clerkUser?.lastName || "";

    const fullPhone = `${data.phoneCode}${data.phone}`;

    await db
      .insert(users)
      .values({
        id: userId,
        email: email,
        firstName: userFirstName, // ИЗ ФОРМЫ
        lastName: userLastName, // ИЗ ФОРМЫ
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
          firstName: userFirstName, // ИЗ ФОРМЫ
          lastName: userLastName, // ИЗ ФОРМЫ
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
        from: `"Menorah Rishon" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Добро пожаловать в общину Menorah Rishon! 🕎",
        html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f9f9f9; }
        .card { background-color: #ffffff; border-radius: 24px; padding: 40px; shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eeeeee; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo-text { font-size: 24px; font-weight: 900; color: #111; letter-spacing: -1px; }
        .gold { color: #FFB800; }
        h1 { color: #111; font-size: 28px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.5px; }
        p { color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
        .button { 
          display: inline-block; 
          padding: 16px 32px; 
          background-color: #FFB800; 
          color: #000000 !important; 
          text-decoration: none; 
          border-radius: 14px; 
          font-weight: 800; 
          text-transform: uppercase; 
          font-size: 14px; 
          letter-spacing: 1px;
          transition: all 0.3s ease;
        }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        .divider { height: 1px; background-color: #eee; margin: 30px 0; }
        .info-box { background-color: #fff9eb; border-left: 4px solid #FFB800; padding: 15px; border-radius: 8px; margin-bottom: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="logo-text">MENORAH <span class="gold">RISHON</span></div>
          </div>
          
          <h1>Шалом, ${userFirstName}! 👋</h1>
          
          <p>Мы искренне рады приветствовать вас в цифровом пространстве нашей общины. Ваша анкета успешно получена, а регистрация завершена!</p>
          
          <div class="info-box">
            <p style="margin: 0; font-size: 14px; font-weight: 600;">Что теперь доступно в вашем профиле:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #555;">
              <li>Запись на уроки Торы и праздничные трапезы</li>
              <li>Личный календарь событий общины</li>
              <li>Специальные предложения для резидентов</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Личный кабинет</a>
          </div>

          <p>Если у вас возникнут вопросы, просто ответьте на это письмо — мы всегда на связи.</p>

          <div class="divider"></div>

          <p style="font-size: 14px; color: #888; font-style: italic; margin-bottom: 0;">
            «Духовный рост. В единой общине.»
          </p>
        </div>
        
        <div class="footer">
          &copy; 2026 Menorah Center Rishon LeZion. Все права защищены.
        </div>
      </div>
    </body>
    </html>
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
