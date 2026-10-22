// lib/db/schema.ts
import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  check,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  varchar,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. ПОЛЬЗОВАТЕЛИ И ПРОФИЛИ
// ==========================================
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    // Telegram-first Mini App profiles may exist before a Clerk/email identity is linked.
    email: text("email"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    imageUrl: text("image_url"),
    role: text("role").default("client").notNull(),

    isProfileComplete: boolean("is_profile_complete").default(false).notNull(),
    phone: text("phone"),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    city: text("city"),
    cityId: text("city_id"),
    maritalStatus: text("marital_status"),
    spouseName: text("spouse_name"), // 🔥 ДОБАВЛЕНО: Имя супруга/и
    hasChildren: boolean("has_children").default(false),

    // 🔥 ДОБАВЛЯЕМ ЭТО ПОЛЕ:
    childrenData: jsonb("children_data").default([]).notNull(),

    source: text("source"),
    tags: text("tags").default("[]"),
    telegramChatId: text("telegram_chat_id"),
    username: text("username"),
    jewishStatus: text("jewish_status"), // Legacy self-report is retained, never inferred/backfilled.
    gender: text("gender", { enum: ["male", "female"] }),
    affiliation: text("affiliation", { enum: ["maternal", "giyur", "none"] }),
    giyurStage: text("giyur_stage", { enum: ["advanced", "completed"] }),
    filterVersion: integer("filter_version"),
    filterCompletedAt: timestamp("filter_completed_at", { withTimezone: true }),
    identityDisabledAt: timestamp("identity_disabled_at", { withTimezone: true }),
    filterRevision: integer("filter_revision").default(0).notNull(),
    agreedToPrivacy: boolean("agreed_to_privacy").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      genderCheck: check("users_gender_check", sql`${table.gender} IS NULL OR ${table.gender} IN ('male', 'female')`),
      affiliationCheck: check("users_affiliation_check", sql`${table.affiliation} IS NULL OR ${table.affiliation} IN ('maternal', 'giyur', 'none')`),
      giyurStageCheck: check("users_giyur_stage_check", sql`${table.giyurStage} IS NULL OR ${table.giyurStage} IN ('advanced', 'completed')`),
      filterCompletionCheck: check("users_filter_completion_check", sql`${table.filterVersion} IS DISTINCT FROM 2 OR ${table.filterCompletedAt} IS NOT NULL`),
      telegramChatIdIdx: uniqueIndex("telegram_chat_id_idx").on(
        table.telegramChatId,
      ),
    };
  },
).enableRLS();


export const userIdentities = pgTable(
  "user_identities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    provider: text("provider").notNull(),
    providerInstance: text("provider_instance").default("primary").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerCheck: check(
      "user_identities_provider_check",
      sql`${table.provider} IN ('clerk', 'telegram')`,
    ),
    providerSubjectIdx: uniqueIndex("user_identities_provider_subject_idx").on(
      table.provider,
      table.providerInstance,
      table.providerUserId,
    ),
    userProviderIdx: uniqueIndex("user_identities_user_provider_idx").on(
      table.userId,
      table.provider,
      table.providerInstance,
    ),
  }),
).enableRLS();

export const telegramContacts = pgTable(
  "telegram_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    telegramUserId: text("telegram_user_id").notNull().unique(),
    telegramChatId: text("telegram_chat_id").unique(),
    username: text("username"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    languageCode: text("language_code"),
    photoUrl: text("photo_url"),
    allowsWriteToPm: boolean("allows_write_to_pm").default(false).notNull(),
    marketingStatus: text("marketing_status").default("unknown").notNull(),
    marketingOptInAt: timestamp("marketing_opt_in_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    blockedAt: timestamp("blocked_at", { withTimezone: true }),
    firstStartParam: text("first_start_param"),
    lastStartParam: text("last_start_param"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastDeliveryAt: timestamp("last_delivery_at", { withTimezone: true }),
    lastDeliveryErrorCode: text("last_delivery_error_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    marketingStatusCheck: check(
      "telegram_contacts_marketing_status_check",
      sql`${table.marketingStatus} IN ('unknown', 'subscribed', 'unsubscribed', 'blocked')`,
    ),
  }),
).enableRLS();

export const userIdentityLinkAttempts = pgTable(
  "user_identity_link_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    provider: text("provider").notNull(),
    providerInstance: text("provider_instance").default("primary").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    returnTo: text("return_to"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    providerCheck: check(
      "user_identity_link_attempts_provider_check",
      sql`${table.provider} IN ('clerk', 'telegram')`,
    ),
  }),
).enableRLS();

export const userIdentityMergeLog = pgTable("user_identity_merge_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceUserId: text("source_user_id").notNull(),
  targetUserId: text("target_user_id").notNull(),
  triggerProvider: text("trigger_provider").notNull(),
  triggerProviderUserId: text("trigger_provider_user_id"),
  reason: text("reason").notNull(),
  details: jsonb("details").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const authorProfiles = pgTable("author_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  slug: text("slug").notNull().unique(),

  shortBio: text("short_bio"),
  donationLink: text("donation_link"),

  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  telegramUrl: text("telegram_url"),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

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
}).enableRLS();

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
  childPrice: text("child_price"), // 🔥 ДОБАВИЛИ ЭТУ СТРОКУ
  paymentUrl: text("payment_url"),
  audience: text("audience").default("all").notNull(),
  isRegistrationClosed: boolean("is_registration_closed").default(false),
  status: text("status").default("planned").notNull(),
  categoryId: text("category_id").references(() => eventCategories.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const eventParticipants = pgTable("event_participants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  phone: text("phone").default("Не указан").notNull(),

  // Здесь будем хранить JSON со списком гостей (семья + дополнительные)
  extraData: jsonb("extra_data"),

  // 🔥 ОБНОВЛЕНО: Статусы для отслеживания оплат и брошенных корзин
  status: text("status").default("pending").notNull(), // pending (ждет оплаты), paid (успешно), abandoned (бросил корзину)
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

export const notifications = pgTable("notifications", {
  // 🔥 ИСПРАВЛЕНА ЭТА СТРОКА:
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
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
}).enableRLS();

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
}).enableRLS();

export const news = pgTable("news", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(true),
  isPinned: boolean("is_pinned").default(false),
  views: integer("views").default(0),
  status: varchar("status", {
    enum: ["draft", "pending", "published", "rejected"],
  })
    .default("draft")
    .notNull(),
  rejectionReason: text("rejection_reason"),

  authorId: text("author_id")
    .references(() => users.id)
    .notNull(),
  categoryId: uuid("category_id").references(() => newsCategories.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}).enableRLS();

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
}).enableRLS();

// ==========================================
// 6. КОНТЕНТ: ВИДЕОУРОКИ
// ==========================================
export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  link: text("link").notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", {
    enum: ["draft", "pending", "published", "rejected"],
  })
    .default("draft")
    .notNull(),
  rejectionReason: text("rejection_reason"),

  authorId: text("author_id").references(() => users.id, {
    onDelete: "set null",
  }),

  views: integer("views").default(0),
  isPublished: boolean("is_published").default(true),

  category: varchar("category", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}).enableRLS();

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

  // Форум-группа для заявок
  notificationGroupId: text("notification_group_id"),
  eventsTopicId: text("events_topic_id"),
  servicesTopicId: text("services_topic_id"), // 👇 ДОБАВЛЕНО

  updatedAt: timestamp("updated_at").defaultNow(),
}).enableRLS();

// ==========================================
// 🔥 ОТНОШЕНИЯ (RELATIONS) ДЛЯ DRIZZLE
// ==========================================

export const usersRelations = relations(users, ({ one, many }) => ({
  identities: many(userIdentities),
  telegramContacts: many(telegramContacts),
  authorProfile: one(authorProfiles, {
    fields: [users.id],
    references: [authorProfiles.userId],
  }),
  news: many(news),
  videos: many(videos),
}));


export const userIdentitiesRelations = relations(userIdentities, ({ one }) => ({
  user: one(users, {
    fields: [userIdentities.userId],
    references: [users.id],
  }),
}));

export const telegramContactsRelations = relations(telegramContacts, ({ one }) => ({
  user: one(users, {
    fields: [telegramContacts.userId],
    references: [users.id],
  }),
}));

export const userIdentityLinkAttemptsRelations = relations(userIdentityLinkAttempts, ({ one }) => ({
  user: one(users, {
    fields: [userIdentityLinkAttempts.userId],
    references: [users.id],
  }),
}));

export const authorProfilesRelations = relations(authorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [authorProfiles.userId],
    references: [users.id],
  }),
}));

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

export const videosRelations = relations(videos, ({ one }) => ({
  author: one(users, {
    fields: [videos.authorId],
    references: [users.id],
  }),
}));

// ==========================================
// 7. ЗАЯВКИ MENORAH KIDS
// ==========================================
// Замените вашу таблицу kidsApplications на эту:
export const kidsApplications = pgTable("kids_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  programTitle: text("program_title").notNull(),
  parentFirstName: text("parent_first_name").notNull(),
  parentLastName: text("parent_last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  children: jsonb("children").default([]).notNull(), // Массив объектов: {name, age, birthDate}
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

// Append-only evidence of explicitly authorized manual child registrations.
export const communityAudit = pgTable("community_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: text("actor_id").notNull(),
  parentId: text("parent_id").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason").notNull(),
  details: jsonb("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

// Temporary submitted questionnaire, bound to an OAuth attempt by a random
// HttpOnly cookie. No provider token or entered email is used as identity.
export const communityRegistrationDrafts = pgTable("community_registration_drafts", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  payload: jsonb("payload").notNull(),
  filterVersion: integer("filter_version").notNull(),
  ownerId: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();
