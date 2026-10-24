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
  index,
  jsonb,
  foreignKey,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. ПОЛЬЗОВАТЕЛИ И ПРОФИЛИ
// ==========================================
export const users = pgTable(
  "users",
  {
    // Canonical Menorah key. Existing Clerk/tg_ keys remain unchanged.
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
    // Legacy import is routing evidence, not a fresh authentication proof.
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
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
    userIdx: index("user_identities_user_id_idx").on(table.userId),
    ownerIdx: uniqueIndex("user_identities_id_user_id_idx").on(table.id, table.userId),
    subjectCheck: check("user_identities_subject_check", sql`length(btrim(${table.providerInstance})) > 0 AND length(btrim(${table.providerUserId})) > 0`),
    activeClerkPerUserIdx: uniqueIndex("user_identities_active_clerk_per_user_idx")
      .on(table.userId)
      .where(sql`${table.provider} = 'clerk' AND ${table.disabledAt} IS NULL`),
  }),
).enableRLS();

export const telegramMiniappSessions = pgTable("telegram_miniapp_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  identityId: uuid("identity_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  ownerFk: foreignKey({ name: "telegram_miniapp_sessions_identity_owner_fk",
    columns: [table.identityId, table.userId], foreignColumns: [userIdentities.id, userIdentities.userId] })
    .onDelete("cascade").onUpdate("cascade"),
  hashCheck: check("telegram_miniapp_sessions_hash_check", sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`),
  lifetimeCheck: check("telegram_miniapp_sessions_lifetime_check", sql`${table.expiresAt} > ${table.createdAt} AND ${table.lastSeenAt} >= ${table.createdAt} AND (${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt})`),
  userIdx: index("telegram_miniapp_sessions_user_id_idx").on(table.userId),
  identityIdx: index("telegram_miniapp_sessions_identity_id_idx").on(table.identityId),
  expiryIdx: index("telegram_miniapp_sessions_open_expiry_idx").on(table.expiresAt).where(sql`${table.revokedAt} IS NULL`),
})).enableRLS();

export const telegramContacts = pgTable(
  "telegram_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    telegramUserId: text("telegram_user_id").notNull().unique(),
    telegramChatId: text("telegram_chat_id").unique(),
    username: text("username"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    languageCode: text("language_code"),
    photoUrl: text("photo_url"),
    allowsWriteToPm: boolean("allows_write_to_pm").default(false).notNull(),
    isPrimary: boolean("is_primary").default(true).notNull(),
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
    primaryPerUserIdx: uniqueIndex("telegram_contacts_one_primary_per_user_idx")
      .on(table.userId)
      .where(sql`${table.isPrimary} = true`),
    userIdx: index("telegram_contacts_user_id_idx").on(table.userId),
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
    tokenHashCheck: check("user_identity_link_attempts_hash_check", sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`),
    lifetimeCheck: check("user_identity_link_attempts_lifetime_check", sql`${table.expiresAt} > ${table.createdAt} AND (${table.consumedAt} IS NULL OR (${table.consumedAt} >= ${table.createdAt} AND ${table.consumedAt} <= ${table.expiresAt}))`),
    userIdx: index("user_identity_link_attempts_user_id_idx").on(table.userId),
    openExpiryIdx: index("user_identity_link_attempts_open_expiry_idx").on(table.expiresAt).where(sql`${table.consumedAt} IS NULL`),
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
}, (table) => ({
  providerCheck: check("user_identity_merge_log_provider_check", sql`${table.triggerProvider} IN ('clerk', 'telegram')`),
  distinctUsersCheck: check("user_identity_merge_log_users_check", sql`${table.sourceUserId} <> ${table.targetUserId} AND length(btrim(${table.reason})) > 0`),
})).enableRLS();

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
}, t => ({ listIdx: index("events_status_created_idx").on(t.status, t.createdAt, t.id) })).enableRLS();

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
}, t => ({ ownerEventIdx: index("event_participants_owner_event_idx").on(t.userId, t.eventId, t.createdAt) })).enableRLS();

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
  miniappSessions: many(telegramMiniappSessions),
  telegramContacts: many(telegramContacts),
  identityLinkAttempts: many(userIdentityLinkAttempts),
  authorProfile: one(authorProfiles, {
    fields: [users.id],
    references: [authorProfiles.userId],
  }),
  news: many(news),
  videos: many(videos),
}));


export const userIdentitiesRelations = relations(userIdentities, ({ one, many }) => ({
  miniappSessions: many(telegramMiniappSessions),
  user: one(users, {
    fields: [userIdentities.userId],
    references: [users.id],
  }),
}));

export const telegramMiniappSessionsRelations = relations(telegramMiniappSessions, ({ one }) => ({
  user: one(users, { fields: [telegramMiniappSessions.userId], references: [users.id] }),
  identity: one(userIdentities, { fields: [telegramMiniappSessions.identityId, telegramMiniappSessions.userId],
    references: [userIdentities.id, userIdentities.userId] }),
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

// Telegram release: server-only operational state. No public Data API policies.
export const telegramUpdates = pgTable("telegram_updates", {
  updateId: text("update_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}).enableRLS();

export const telegramCampaigns = pgTable(
  "telegram_campaigns",
  {
    key: text("key").primaryKey(),
    eventId: text("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    active: boolean("active").default(true).notNull(),
  },
  (t) => ({
    keyCheck: check(
      "telegram_campaigns_key_check",
      sql`${t.key} ~ '^[A-Za-z0-9_-]{1,64}$'`,
    ),
  }),
).enableRLS();

export const eventPaymentAttempts = pgTable(
  "event_payment_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: text("registration_id")
      .references(() => eventParticipants.id, { onDelete: "restrict" })
      .notNull()
      .unique(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    eventId: text("event_id")
      .references(() => events.id, { onDelete: "restrict" })
      .notNull(),
    amountAgorot: integer("amount_agorot").notNull(),
    currency: text("currency").default("ILS").notNull(),
    provider: text("provider").default("shutafim").notNull(),
    selectionHash: text("selection_hash").notNull(),
    paymentUrl: text("payment_url").notNull(),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
    openCount: integer("open_count").default(0).notNull(),
    lastOpenedSource: text("last_opened_source", { enum: ["telegram", "website"] }),
  },
  (t) => ({
    amountCheck: check(
      "event_payment_attempts_amount_check",
      sql`${t.amountAgorot}>0 AND ${t.currency}='ILS' AND ${t.provider}='shutafim'`,
    ),
    statusCheck: check(
      "event_payment_attempts_status_check",
      sql`${t.status} IN ('pending','paid','cancelled') AND ${t.selectionHash} ~ '^[0-9a-f]{64}$'`,
    ),
    openCountCheck: check("event_payment_attempts_open_count_check", sql`${t.openCount} >= 0`),
    openSourceCheck: check("event_payment_attempts_open_source_check", sql`${t.lastOpenedSource} IS NULL OR ${t.lastOpenedSource} IN ('telegram', 'website')`),
    ownerIdx: index("event_payment_attempts_owner_idx").on(t.userId, t.eventId),
  }),
).enableRLS();

export const telegramBroadcasts = pgTable(
  "telegram_broadcasts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestKey: uuid("request_key").notNull().unique(),
    createdBy: text("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    message: text("message").notNull(),
    eventId: text("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    buttonLabel: text("button_label"),
    audience: jsonb("audience").notNull(),
    recipientCount: integer("recipient_count").notNull(),
    status: text("status").default("queued").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    statusCheck: check(
      "telegram_broadcasts_status_check",
      sql`${t.status} IN ('queued','completed','cancelled') AND ${t.recipientCount}>=0 AND length(${t.message}) BETWEEN 1 AND 3500`,
    ),
    createdIdx: index("telegram_broadcasts_created_idx").on(t.createdAt),
  }),
).enableRLS();

export const telegramBroadcastDeliveries = pgTable(
  "telegram_broadcast_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    broadcastId: uuid("broadcast_id")
      .references(() => telegramBroadcasts.id, { onDelete: "cascade" })
      .notNull(),
    contactId: uuid("contact_id")
      .references(() => telegramContacts.id, { onDelete: "restrict" })
      .notNull(),
    status: text("status").default("queued").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    errorClass: text("error_class"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (t) => ({
    recipientIdx: uniqueIndex("telegram_delivery_recipient_idx").on(
      t.broadcastId,
      t.contactId,
    ),
    dueIdx: index("telegram_delivery_due_idx").on(
      t.status,
      t.nextAttemptAt,
      t.id,
    ),
    statusCheck: check(
      "telegram_delivery_status_check",
      sql`${t.status} IN ('queued','sending','delivered','skipped','failed','unknown') AND ${t.attempts} BETWEEN 0 AND 5`,
    ),
  }),
).enableRLS();
