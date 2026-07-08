import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema"; // ВАЖНО: импортируем всё из схемы

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

// ВТОРОЙ АРГУМЕНТ { schema } обязателен, чтобы работали relations!
export const db = drizzle(client, { schema });
