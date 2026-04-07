import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── pgvector custom type ─────────────────────────────────────────────────────

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(768)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value) as number[];
  },
});

// ─── Sources ──────────────────────────────────────────────────────────────────

export const sources = pgTable("sources", {
  id: text("id").primaryKey(), // e.g. "motorsport-com"
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  faviconUrl: text("favicon_url"),
  tier: integer("tier").notNull().default(1), // 1 or 2
  series: text("series").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── X Accounts ──────────────────────────────────────────────────────────────

export const xAccounts = pgTable("x_accounts", {
  handle: text("handle").primaryKey(), // e.g. "F1"
  displayName: text("display_name").notNull(),
  // "official_series" | "official_team" | "journalist" | "driver"
  accountType: text("account_type").notNull(),
  series: text("series").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
});

// ─── Story Clusters ───────────────────────────────────────────────────────────

export const clusters = pgTable(
  "clusters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    representativeArticleId: uuid("representative_article_id"),
    series: text("series").notNull(),
    articleCount: integer("article_count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("clusters_series_created_idx").on(t.series, t.createdAt)]
);

// ─── Articles ─────────────────────────────────────────────────────────────────

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    url: text("url").notNull(),
    urlHash: text("url_hash").notNull(), // MD5 of normalized URL
    title: text("title").notNull(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    series: text("series").array().notNull().default([]),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scrapedAt: timestamp("scraped_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    summary: text("summary"), // AI-generated 2-3 sentences
    imageUrl: text("image_url"),
    isBreaking: boolean("is_breaking").notNull().default(false),
    clusterId: uuid("cluster_id").references(() => clusters.id),
    embedding: vector("embedding"),
  },
  (t) => [
    uniqueIndex("articles_url_hash_idx").on(t.urlHash),
    index("articles_series_published_idx").on(t.series, t.publishedAt),
    index("articles_cluster_idx").on(t.clusterId),
    index("articles_breaking_idx").on(t.isBreaking, t.scrapedAt),
  ]
);

// ─── Social Posts ─────────────────────────────────────────────────────────────

export const socialPosts = pgTable(
  "social_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    platform: text("platform").notNull().default("x"),
    authorHandle: text("author_handle").notNull(),
    authorDisplayName: text("author_display_name").notNull(),
    // "official_series" | "official_team" | "journalist" | "driver"
    authorType: text("author_type").notNull(),
    content: text("content").notNull(),
    url: text("url").notNull(),
    series: text("series").array().notNull().default([]),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    scrapedAt: timestamp("scraped_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isBreaking: boolean("is_breaking").notNull().default(false),
    mediaUrls: text("media_urls").array().notNull().default([]),
  },
  (t) => [
    uniqueIndex("social_posts_url_idx").on(t.url),
    index("social_posts_author_published_idx").on(
      t.authorHandle,
      t.publishedAt
    ),
    index("social_posts_series_published_idx").on(t.series, t.publishedAt),
  ]
);

// ─── Race Calendar ────────────────────────────────────────────────────────────

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    series: text("series").notNull(),
    eventName: text("event_name").notNull(),
    circuitName: text("circuit_name").notNull(),
    country: text("country").notNull(),
    countryCode: text("country_code").notNull(),
    timezone: text("timezone").notNull(),
    season: integer("season").notNull(),
  },
  (t) => [index("events_series_season_idx").on(t.series, t.season)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    // "practice" | "qualifying" | "race" | "sprint" | "sprint_qualifying"
    type: text("type").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    // "scheduled" | "live" | "completed"
    status: text("status").notNull().default("scheduled"),
    estimatedDurationMinutes: integer("estimated_duration_minutes"),
  },
  (t) => [
    index("sessions_starts_at_status_idx").on(t.startsAt, t.status),
    index("sessions_event_idx").on(t.eventId),
  ]
);

export const liveUpdates = pgTable(
  "live_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    // "position" | "safety_car" | "retirement" | "pit_stop" | "incident"
    type: text("type").notNull(),
    content: jsonb("content").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("live_updates_session_time_idx").on(t.sessionId, t.timestamp)]
);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  seriesOrder: text("series_order").array().notNull().default([]),
  notificationPrefs: jsonb("notification_prefs").notNull().default({}),
  theme: text("theme").notNull().default("dark"),
  pushToken: text("push_token"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userLayouts = pgTable("user_layouts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  layout: jsonb("layout").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const savedArticles = pgTable(
  "saved_articles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.articleId] })]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const articlesRelations = relations(articles, ({ one, many }) => ({
  source: one(sources, {
    fields: [articles.sourceId],
    references: [sources.id],
  }),
  cluster: one(clusters, {
    fields: [articles.clusterId],
    references: [clusters.id],
  }),
  savedBy: many(savedArticles),
}));

export const clustersRelations = relations(clusters, ({ many }) => ({
  articles: many(articles),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  articles: many(articles),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  event: one(events, { fields: [sessions.eventId], references: [events.id] }),
  liveUpdates: many(liveUpdates),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  layout: one(userLayouts, {
    fields: [users.id],
    references: [userLayouts.userId],
  }),
  savedArticles: many(savedArticles),
}));

export const savedArticlesRelations = relations(savedArticles, ({ one }) => ({
  user: one(users, {
    fields: [savedArticles.userId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [savedArticles.articleId],
    references: [articles.id],
  }),
}));
