// lib/db/schema.ts
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

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
// === ОБНОВЛЕННАЯ ТАБЛИЦА СОБЫТИЙ ===
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),

  // Обложка
  imageUrl: text("image_url"),

  // --- НОВЫЕ И ОБНОВЛЕННЫЕ ПОЛЯ ДЛЯ ФИЛЬТРОВ ---
  // Сохраняем дату и время текстом (YYYY-MM-DD и HH:MM),
  // так намного проще работать с инпутами в React и делать фильтры
  date: text("date"),
  time: text("time"),
  location: text("location"),

  // Финансы
  isFree: boolean("is_free").default(false).notNull(), // Заменили isPaid на isFree
  price: text("price"),

  // Аудитория (для кого событие)
  audience: text("audience").default("all").notNull(), // 'all', 'men', 'women', 'kids'
  // ----------------------------------------------

  // Статус и Связь с категорией
  status: text("status").default("planned").notNull(), // 'planned', 'completed', 'cancelled'
  categoryId: text("category_id").references(() => eventCategories.id),

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

// 1. Таблица Новостей
export const news = pgTable("news", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(), // Красивая ссылка (например: /news/pesah-2026)
  content: text("content").notNull(), // Здесь будет храниться HTML-код статьи
  imageUrl: text("image_url"), // Главная картинка новости
  isPublished: boolean("is_published").default(true), // Черновик или опубликовано
  isPinned: boolean("is_pinned").default(false), // Закреплена ли наверху
  views: integer("views").default(0), // Счетчик просмотров
  authorId: text("author_id").notNull(), // Кто создал (ID суперадмина)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  categoryId: uuid("category_id").references(() => newsCategories.id, {
    onDelete: "set null",
  }),
});

// 2. Таблица Комментариев
export const newsComments = pgTable("news_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  newsId: uuid("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").notNull(), // ID резидента, который оставил коммент
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Отношения (Relations) для Drizzle, чтобы легко доставать комменты вместе с новостью
export const newsRelations = relations(news, ({ many }) => ({
  comments: many(newsComments),
}));

export const newsCommentsRelations = relations(newsComments, ({ one }) => ({
  news: one(news, {
    fields: [newsComments.newsId],
    references: [news.id],
  }),
  // Если у тебя таблица юзеров называется users, связываем коммент с автором:
  user: one(users, {
    fields: [newsComments.userId],
    references: [users.id],
  }),
}));

// Таблица категорий (тем) новостей
export const newsCategories = pgTable("news_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // Например: "Жизнь общины"
  description: text("description"), // "Интервью, фотоотчеты и истории"
  icon: text("icon"), // Название иконки (например 'users', 'book')
  slug: text("slug").notNull().unique(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
