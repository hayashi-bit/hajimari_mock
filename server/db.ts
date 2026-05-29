import { eq, desc, and, or, isNull, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  businessProfiles,
  InsertBusinessProfile,
  chatSessions,
  InsertChatSession,
  messages,
  InsertMessage,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ───

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Business Profile helpers ───

export async function getBusinessProfile(userId: number | null, deviceId?: string | null) {
  const db = await getDb();
  if (!db) return undefined;

  const condition = userId
    ? eq(businessProfiles.userId, userId)
    : deviceId
      ? eq(businessProfiles.deviceId, deviceId)
      : undefined;
  if (!condition) return undefined;

  const result = await db
    .select()
    .from(businessProfiles)
    .where(condition)
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertBusinessProfile(
  userId: number | null,
  data: Partial<InsertBusinessProfile>,
  deviceId?: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getBusinessProfile(userId, deviceId);

  if (existing) {
    const condition = userId
      ? eq(businessProfiles.userId, userId)
      : deviceId
        ? eq(businessProfiles.deviceId, deviceId)
        : eq(businessProfiles.id, existing.id);
    await db
      .update(businessProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(condition);
  } else {
    await db.insert(businessProfiles).values({ userId, deviceId, ...data });
  }
}

// ─── Chat Session helpers ───

export async function createChatSession(data: InsertChatSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatSessions).values(data);
  return result[0].insertId;
}

export async function getLatestSession(userId: number | null, deviceId?: string | null) {
  const db = await getDb();
  if (!db) return undefined;

  const condition = userId
    ? eq(chatSessions.userId, userId)
    : deviceId
      ? eq(chatSessions.deviceId, deviceId)
      : undefined;
  if (!condition) return undefined;

  const result = await db
    .select()
    .from(chatSessions)
    .where(condition)
    .orderBy(desc(chatSessions.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getOnboardingSession(userId: number | null, deviceId?: string | null) {
  const db = await getDb();
  if (!db) return undefined;

  const ownerCondition = userId
    ? eq(chatSessions.userId, userId)
    : deviceId
      ? eq(chatSessions.deviceId, deviceId)
      : undefined;
  if (!ownerCondition) return undefined;

  const result = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        ownerCondition,
        eq(chatSessions.isOnboarding, true)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function incrementMessageCount(sessionId: number) {
  const db = await getDb();
  if (!db) return;

  const session = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (session.length > 0) {
    await db
      .update(chatSessions)
      .set({ messageCount: (session[0].messageCount ?? 0) + 1 })
      .where(eq(chatSessions.id, sessionId));
  }
}

// ─── Message helpers ───

export async function addMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);
  await incrementMessageCount(data.sessionId);
  return result[0].insertId;
}

export async function getSessionMessages(sessionId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(messages.createdAt)
    .limit(limit);
}

export async function getRecentMessages(sessionId: number, count: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(desc(messages.createdAt))
    .limit(count);

  return result.reverse();
}

// ─── 壁打ち Session helpers ───

export async function updateSessionMeta(
  sessionId: number,
  data: Partial<{
    mode: string;
    keywords: string;
    strengths: string;
    uncertainties: string;
    nextTheme: string;
    summary: string;
    summaryGeneratedAt: Date;
  }>
) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(chatSessions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));
}

export async function getPreviousSession(userId: number | null, currentSessionId: number, deviceId?: string | null) {
  const db = await getDb();
  if (!db) return undefined;

  const ownerCondition = userId
    ? eq(chatSessions.userId, userId)
    : deviceId
      ? eq(chatSessions.deviceId, deviceId)
      : undefined;
  if (!ownerCondition) return undefined;

  const result = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        ownerCondition,
        eq(chatSessions.isOnboarding, false)
      )
    )
    .orderBy(desc(chatSessions.createdAt))
    .limit(2);

  const prev = result.find(s => s.id !== currentSessionId);
  return prev || undefined;
}

// ─── 履歴・お気に入り helpers ───

export async function getSessionHistory(userId: number | null, deviceId?: string | null) {
  const db = await getDb();
  if (!db) return [];

  const ownerCondition = userId
    ? eq(chatSessions.userId, userId)
    : deviceId
      ? eq(chatSessions.deviceId, deviceId)
      : undefined;
  if (!ownerCondition) return [];

  return db
    .select()
    .from(chatSessions)
    .where(
      and(
        ownerCondition,
        eq(chatSessions.isOnboarding, false)
      )
    )
    .orderBy(desc(chatSessions.createdAt));
}

export async function getSessionById(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function toggleFavorite(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const session = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (session.length === 0) throw new Error("Session not found");

  const newValue = !session[0].isFavorite;
  await db
    .update(chatSessions)
    .set({ isFavorite: newValue })
    .where(eq(chatSessions.id, sessionId));

  return newValue;
}
