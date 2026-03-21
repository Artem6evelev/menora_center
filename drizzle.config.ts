import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts", // Убедись, что путь к твоей схеме правильный
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Или как у тебя называется переменная
  },
  // 🔥 ДОБАВЬ ВОТ ЭТУ СТРОЧКУ 🔥
  schemaFilter: ["public"],
});
