import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Указываем Drizzle, где лежат наши пароли
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts", // Убедись, что файл называется schema.ts!
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
