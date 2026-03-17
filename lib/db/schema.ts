// lib/db/schema.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

// ==========================================
// 1. ПОЛЬЗОВАТЕЛИ
// ==========================================
export const users = pgTable("users", {
  id: text("id").primaryKey(), // ID из Clerk (user_...)
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  role: text("role").default("client").notNull(), // superadmin, admin, client

  // --- НОВЫЕ ПОЛЯ ДЛЯ CRM ---
  isProfileComplete: boolean("is_profile_complete").default(false).notNull(), // Флаг заполнения анкеты
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  city: text("city"),
  maritalStatus: text("marital_status"), // Холост / В браке
  hasChildren: boolean("has_children").default(false),
  source: text("source"), // Откуда узнали (необязательно)
  tags: text("tags").default("[]"), // Будем хранить как JSON массив строк: '["VIP", "Новичок"]'
  telegramChatId: text("telegram_chat_id"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === НОВАЯ ТАБЛИЦА: Категории событий ===
export const eventCategories = pgTable("event_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Например: "Праздник", "Урок Торы"
  color: text("color").default("#3b82f6").notNull(), // Цвет для календаря
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === ОБНОВЛЕННАЯ ТАБЛИЦА СОБЫТИЙ ===
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),

  // Обложка (ссылка из Supabase Storage)
  imageUrl: text("image_url"),

  date: timestamp("date", { withTimezone: true }),
  location: text("location"),

  // Финансы
  isPaid: boolean("is_paid").default(false).notNull(),
  price: text("price"), // Текстом, чтобы можно было писать "100 ₪" или "Добровольный взнос"

  // Статус и Связь с категорией
  status: text("status").default("planned").notNull(), // 'planned', 'completed', 'cancelled'
  categoryId: text("category_id").references(() => eventCategories.id), // Привязка к категории

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 3. ТАБЛИЦА ЗАДАЧ (Те самые карточки для Trello-доски)
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),

  // Колонки Канбана: 'backlog', 'todo', 'in_progress', 'done'
  status: text("status").default("backlog").notNull(),

  // КТО назначил (Раввин)
  creatorId: text("creator_id").references(() => users.id),
  // КТО выполняет (Админ)
  assigneeId: text("assignee_id").references(() => users.id),
  // К какому событию привязано (если нужно)
  eventId: text("event_id").references(() => events.id),

  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 4. ТАБЛИЦА УВЕДОМЛЕНИЙ (Тот самый "Колокольчик")
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(), // Оставляем текстовый ID (например, ntf_abc123)
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // КТО отправил (для CRM). Для системных уведомлений Канбана будет null
  senderId: text("sender_id").references(() => users.id, {
    onDelete: "set null",
  }),

  title: text("title").notNull(),
  message: text("message").notNull(),

  // Куда вести юзера при клике
  link: text("link"),

  // ТИП уведомления: 'kanban', 'crm_personal', 'crm_bulk'
  type: text("type").default("system").notNull(),

  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// === ТАБЛИЦА: Участники событий (Заявки) ===
export const eventParticipants = pgTable("event_participants", {
  id: text("id").primaryKey(),

  // Связь с событием (если удалить событие - удалятся и заявки)
  eventId: text("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),

  // Связь с пользователем (кто записался)
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  phone: text("phone").default("Не указан").notNull(),

  // Статус заявки (например, 'pending' - ожидает, 'approved' - подтверждена админом)
  status: text("status").default("pending").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ==========================================
// 3. УСЛУГИ (SERVICES)
// ==========================================

export const serviceCategories = pgTable("service_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#10b981").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: text("price"),
  duration: text("duration"),
  categoryId: text("category_id").references(() => serviceCategories.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const serviceParticipants = pgTable("service_participants", {
  id: text("id").primaryKey(),
  serviceId: text("service_id")
    .references(() => services.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  phone: text("phone").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- НАСТРОЙКИ TELEGRAM БОТА ---
export const botSettings = pgTable("bot_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  isActive: boolean("is_active").default(true).notNull(), // Включены ли утренние напоминания
  channelLink: text("channel_link"), // Ссылка на закрытый канал
  tzedakahLink: text("tzedakah_link"), // Ссылка на цдаку
  reminderMessage: text("reminder_message").default(
    "Доброе утро! ☕️ Утренний Хасидут начнется через 10 минут. Ждем вас!",
  ),
  tzedakahMessage: text("tzedakah_message").default(
    "Спасибо, что были с нами на эфире! Поддержать общину можно по ссылке ниже:",
  ),
  superadminTelegramId: text("superadmin_telegram_id"), // Сюда бот будет писать с вопросом "Отправить цдаку?"
  updatedAt: timestamp("updated_at").defaultNow(),
});
