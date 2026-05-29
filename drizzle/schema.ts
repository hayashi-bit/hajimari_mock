import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Business profile (事業カルテ) — collected via AI conversation during onboarding.
 * Stores the minimal info needed for the AI to "remember" the user.
 */
export const businessProfiles = mysqlTable("business_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),  // nullable for anonymous users
  deviceId: varchar("deviceId", { length: 64 }),  // for anonymous session tracking
  businessType: text("businessType"),
  targetCustomer: text("targetCustomer"),
  currentGoal: text("currentGoal"),
  displayName: varchar("displayName", { length: 100 }),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;

/**
 * Chat sessions — each conversation thread.
 * Extended for 壁打ち (wall-hitting) interview sessions.
 */
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),  // nullable for anonymous users
  deviceId: varchar("deviceId", { length: 64 }),  // for anonymous session tracking
  theme: varchar("theme", { length: 255 }),
  messageCount: int("messageCount").default(0).notNull(),
  isOnboarding: boolean("isOnboarding").default(false).notNull(),

  // 壁打ち専用フィールド
  mode: varchar("mode", { length: 50 }),  // strength/worry/service/target/decision/action
  keywords: text("keywords"),              // JSON array of important words
  strengths: text("strengths"),            // JSON array of discovered strengths
  uncertainties: text("uncertainties"),     // JSON array of things still uncertain
  nextTheme: text("nextTheme"),            // What to explore next time
  summary: text("summary"),               // JSON object: full session summary
  summaryGeneratedAt: timestamp("summaryGeneratedAt"),
  isFavorite: boolean("isFavorite").default(false).notNull(),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Messages — individual messages within a chat session.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Feedbacks — モニターからのフィードバック・要望・アイデアを統合管理。
 */
export const feedbacks = mysqlTable("feedbacks", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }),
  displayName: varchar("displayName", { length: 100 }),  // 空なら「匿名」
  sessionId: int("sessionId"),  // 壁打ち中に送った場合の紐付け
  type: mysqlEnum("type", ["feedback", "idea", "bug", "request"]).default("feedback").notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["new", "noted", "planned", "done", "wontfix"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = typeof feedbacks.$inferInsert;
