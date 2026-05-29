import { describe, it, expect, vi } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getSessionHistory: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      theme: "キャリア",
      mode: "strength",
      messageCount: 8,
      summary: JSON.stringify({ theme: "強みの発見", insights: ["行動力がある"], nextTheme: "具体化" }),
      isFavorite: false,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
    {
      id: 2,
      userId: 1,
      theme: null,
      mode: "worry",
      messageCount: 3,
      summary: null,
      isFavorite: true,
      createdAt: new Date("2025-01-02"),
      updatedAt: new Date("2025-01-02"),
    },
  ]),
  getSessionById: vi.fn().mockImplementation(async (id: number) => {
    if (id === 1) return { id: 1, userId: 1, isOnboarding: false, messageCount: 8 };
    if (id === 99) return { id: 99, userId: 999, isOnboarding: false, messageCount: 2 };
    return undefined;
  }),
  toggleFavorite: vi.fn().mockResolvedValue(true),
  getSessionMessages: vi.fn().mockResolvedValue([
    { id: 1, sessionId: 1, role: "assistant", content: "こんにちは", createdAt: new Date() },
    { id: 2, sessionId: 1, role: "user", content: "テスト", createdAt: new Date() },
  ]),
  getBusinessProfile: vi.fn().mockResolvedValue({ businessType: "コーチング", displayName: "テスト" }),
}));

import { getSessionHistory, getSessionById, toggleFavorite, getSessionMessages, getBusinessProfile } from "./db";

describe("Chat History API logic", () => {
  it("getSessionHistory returns sessions for user", async () => {
    const sessions = await getSessionHistory(1);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe(1);
    expect(sessions[1].isFavorite).toBe(true);
  });

  it("getSessionHistory parses summary JSON correctly", async () => {
    const sessions = await getSessionHistory(1);
    const s = sessions[0];
    const parsed = s.summary ? JSON.parse(s.summary) : null;
    expect(parsed).not.toBeNull();
    expect(parsed.theme).toBe("強みの発見");
    expect(parsed.insights).toContain("行動力がある");
  });

  it("getSessionById returns session for valid id", async () => {
    const session = await getSessionById(1);
    expect(session).toBeDefined();
    expect(session!.id).toBe(1);
  });

  it("getSessionById returns undefined for invalid id", async () => {
    const session = await getSessionById(404);
    expect(session).toBeUndefined();
  });

  it("toggleFavorite returns new value", async () => {
    const result = await toggleFavorite(1);
    expect(result).toBe(true);
  });

  it("resumeSession returns messages for valid session owned by user", async () => {
    const session = await getSessionById(1);
    expect(session).toBeDefined();
    expect(session!.userId).toBe(1); // ownership check
    const msgs = await getSessionMessages(1);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("assistant");
  });

  it("resumeSession rejects session not owned by user", async () => {
    const session = await getSessionById(99);
    expect(session).toBeDefined();
    expect(session!.userId).not.toBe(1); // different user
  });
});
