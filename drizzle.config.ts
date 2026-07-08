import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts", // Твой путь к схеме
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 🔥 ДОБАВЬ ВОТ ЭТУ СТРОКУ:
  schemaFilter: ["public"], // Запрещаем Drizzle лезть в системные таблицы Supabase
});
