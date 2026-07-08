// lib/db/schema.ts
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. ПОЛЬЗОВАТЕЛИ И ПРОФИЛИ
// ==========================================
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    imageUrl: text("image_url"),
    role: text("role").default("client").notNull(),

    isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
    phone: text("phone"),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    city: text("city"),
    maritalStatus: text("marital_status"),
    hasChildren: boolean("has_children").default(false),
    source: text("source"),
    tags: text("tags").default("[]"),
    telegramChatId: text("telegram_chat_id"),

    // 🔥 ДОБАВИЛИ ТОЛЬКО ЭТУ СТРОКУ (Никнейм в Телеграме):
    username: text("username"),

    jewishStatus: text("jewish_status"),
    agreedToPrivacy: boolean("agreed_to_privacy").default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      // 🔥 И ДОБАВИЛИ ЭТОТ БЛОК (Защита от дублей):
      telegramChatIdIdx: uniqueIndex("telegram_chat_id_idx").on(
        table.telegramChatId,
      ),
    };
  },
);

// 🔥 НОВАЯ ТАБЛИЦА: Профили авторов (спикеров/раввинов)
export const authorProfiles = pgTable("author_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(), // Один юзер = один профиль автора

  slug: text("slug").notNull().unique(), // Например: pinhasi-vishedski

  shortBio: text("short_bio"), // Короткое описание для сайдбара
  donationLink: text("donation_link"), // Ссылка для кнопки "Помочь уроку"

  // Соцсети
  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  telegramUrl: text("telegram_url"),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 2. СОБЫТИЯ И КАТЕГОРИИ
// ==========================================
export const eventCategories = pgTable("event_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#3b82f6").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),

  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringPattern: text("recurring_pattern"),
  recurringDays: text("recurring_days"),

  date: text("date"),
  time: text("time"),
  location: text("location"),

  isFree: boolean("is_free").default(false).notNull(),
  price: text("price"),
  audience: text("audience").default("all").notNull(),

  isRegistrationClosed: boolean("is_registration_closed").default(false),
  status: text("status").default("planned").notNull(),
  categoryId: text("category_id").references(() => eventCategories.id),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const eventParticipants = pgTable("event_participants", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  phone: text("phone").default("Не указан").notNull(),
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

// ==========================================
// 4. CRM: ЗАДАЧИ И УВЕДОМЛЕНИЯ
// ==========================================
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("backlog").notNull(),
  creatorId: text("creator_id").references(() => users.id),
  assigneeId: text("assignee_id").references(() => users.id),
  eventId: text("event_id").references(() => events.id),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  senderId: text("sender_id").references(() => users.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  type: text("type").default("system").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ==========================================
// 5. КОНТЕНТ: НОВОСТИ / СТАТЬИ
// ==========================================
export const newsCategories = pgTable("news_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  slug: text("slug").notNull().unique(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const news = pgTable("news", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(true),
  isPinned: boolean("is_pinned").default(false),
  views: integer("views").default(0),

  // 🔥 Связь с автором
  authorId: text("author_id")
    .references(() => users.id)
    .notNull(),
  categoryId: uuid("category_id").references(() => newsCategories.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const newsComments = pgTable("news_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  newsId: uuid("news_id")
    .references(() => news.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 6. КОНТЕНТ: ВИДЕОУРОКИ
// ==========================================
export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  link: text("link").notNull(),
  imageUrl: text("image_url"),

  // 🔥 Связь с автором
  authorId: text("author_id").references(() => users.id, {
    onDelete: "set null",
  }),

  views: integer("views").default(0),
  isPublished: boolean("is_published").default(true),

  category: varchar("category", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 7. НАСТРОЙКИ БОТА
// ==========================================
export const botSettings = pgTable("bot_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  isActive: boolean("is_active").default(true).notNull(),
  channelLink: text("channel_link"),
  tzedakahLink: text("tzedakah_link"),
  reminderMessage: text("reminder_message").default(
    "Доброе утро! ☕️ Утренний Хасидут начнется через 10 минут. Ждем вас!",
  ),
  tzedakahMessage: text("tzedakah_message").default(
    "Спасибо, что были с нами на эфире! Поддержать общину можно по ссылке ниже:",
  ),
  superadminTelegramId: text("superadmin_telegram_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==========================================
// 🔥 ОТНОШЕНИЯ (RELATIONS) ДЛЯ DRIZZLE
// ==========================================

// Пользователи
export const usersRelations = relations(users, ({ one, many }) => ({
  authorProfile: one(authorProfiles, {
    fields: [users.id],
    references: [authorProfiles.userId],
  }),
  news: many(news),
  videos: many(videos),
}));

// Профиль автора
export const authorProfilesRelations = relations(authorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [authorProfiles.userId],
    references: [users.id],
  }),
}));

// Статьи (Новости)
export const newsRelations = relations(news, ({ many, one }) => ({
  comments: many(newsComments),
  author: one(users, {
    fields: [news.authorId],
    references: [users.id],
  }),
  category: one(newsCategories, {
    fields: [news.categoryId],
    references: [newsCategories.id],
  }),
}));

// Комментарии к статьям
export const newsCommentsRelations = relations(newsComments, ({ one }) => ({
  news: one(news, {
    fields: [newsComments.newsId],
    references: [news.id],
  }),
  user: one(users, {
    fields: [newsComments.userId],
    references: [users.id],
  }),
}));

// Видео
export const videosRelations = relations(videos, ({ one }) => ({
  author: one(users, {
    fields: [videos.authorId],
    references: [users.id],
  }),
}));
