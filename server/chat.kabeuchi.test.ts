import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "今日はどんなことを考えていますか？",
        },
      },
    ],
  }),
}));

// Mock the database module
vi.mock("./db", () => ({
  getBusinessProfile: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    businessType: "コーチング",
    targetCustomer: "30代女性",
    currentGoal: "月商100万",
    displayName: "テストユーザー",
    onboardingComplete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  upsertBusinessProfile: vi.fn().mockResolvedValue(undefined),
  createChatSession: vi.fn().mockResolvedValue(1),
  getLatestSession: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    isOnboarding: false,
    theme: null,
    messageCount: 0,
    mode: null,
    keywords: null,
    strengths: null,
    uncertainties: null,
    nextTheme: null,
    summary: null,
    summaryGeneratedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getOnboardingSession: vi.fn().mockResolvedValue(null),
  addMessage: vi.fn().mockResolvedValue(1),
  getSessionMessages: vi.fn().mockResolvedValue([]),
  getRecentMessages: vi.fn().mockResolvedValue([
    { id: 1, sessionId: 1, role: "assistant", content: "今日はどんなことを考えていますか？", createdAt: new Date() },
    { id: 2, sessionId: 1, role: "user", content: "自分の強みがわからない", createdAt: new Date() },
  ]),
  updateSessionMeta: vi.fn().mockResolvedValue(undefined),
  getPreviousSession: vi.fn().mockResolvedValue(null),
  getSessionById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    deviceId: null,
    isOnboarding: false,
    theme: null,
    messageCount: 0,
    mode: null,
    keywords: null,
    strengths: null,
    uncertainties: null,
    nextTheme: null,
    summary: null,
    summaryGeneratedAt: null,
    isFavorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getSessionHistory: vi.fn().mockResolvedValue([]),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    deviceId: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("chat.kabeuchi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getOrCreateSession returns session for authenticated user with profile", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.getOrCreateSession();

    expect(result).toBeDefined();
    expect(result.session).toBeDefined();
    expect(result.session.id).toBe(1);
    expect(result.isOnboarding).toBe(false);
    expect(result.profile).toBeDefined();
    expect(result.profile?.businessType).toBe("コーチング");
  });

  it("sendMessage returns AI response for kabeuchi mode", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.sendMessage({
      sessionId: 1,
      content: "自分の強みがわからない",
      isOnboarding: false,
    });

    expect(result).toBeDefined();
    expect(result.aiMessage).toBeDefined();
    expect(typeof result.aiMessage).toBe("string");
    expect(result.aiMessage.length).toBeGreaterThan(0);
    expect(result.onboardingComplete).toBe(false);
  });

  it("sendMessage in onboarding mode works correctly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.sendMessage({
      sessionId: 1,
      content: "コーチングをしています",
      isOnboarding: true,
    });

    expect(result).toBeDefined();
    expect(result.aiMessage).toBeDefined();
    expect(typeof result.aiMessage).toBe("string");
  });

  it("startNewSession creates a new session", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.startNewSession();

    expect(result).toBeDefined();
    expect(result.sessionId).toBe(1);
  });

  it("getGreeting returns greeting for new session", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.getGreeting({
      sessionId: 1,
      isOnboarding: false,
    });

    expect(result).toBeDefined();
    expect(result.alreadyGreeted).toBe(false);
    expect(result.greeting).toBeDefined();
    expect(typeof result.greeting).toBe("string");
  });

  it("generateSummary fails gracefully for short conversations", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.generateSummary({ sessionId: 1 });

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.reason).toBe("会話がまだ短いです");
  });

  it("generateSummary succeeds for long conversations", async () => {
    // Override mock to return enough messages
    const db = await import("./db");
    vi.mocked(db.getSessionMessages).mockResolvedValueOnce([
      { id: 1, sessionId: 1, role: "assistant", content: "今日はどんなことを？", createdAt: new Date() },
      { id: 2, sessionId: 1, role: "user", content: "自分の強みがわからない", createdAt: new Date() },
      { id: 3, sessionId: 1, role: "assistant", content: "どんな時に人から頼まれる？", createdAt: new Date() },
      { id: 4, sessionId: 1, role: "user", content: "相談をよく受ける", createdAt: new Date() },
      { id: 5, sessionId: 1, role: "assistant", content: "どんな相談？", createdAt: new Date() },
      { id: 6, sessionId: 1, role: "user", content: "キャリアの方向性について", createdAt: new Date() },
      { id: 7, sessionId: 1, role: "assistant", content: "それは強みですね", createdAt: new Date() },
    ]);

    // Mock LLM to return structured summary
    const llm = await import("./_core/llm");
    vi.mocked(llm.invokeLLM).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              theme: "自分の強みの整理",
              insights: ["相談を受けることが多い", "キャリア相談が得意"],
              keywords: ["相談", "キャリア", "方向性"],
              strengths: ["傾聴力", "キャリア相談"],
              uncertainties: ["これをビジネスにできるか"],
              nextTheme: "相談力をサービスにする方法",
              nextAction: "過去に相談を受けた人に感想を聞いてみる",
            }),
          },
        },
      ],
    } as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.generateSummary({ sessionId: 1 });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary?.theme).toBe("自分の強みの整理");
    expect(result.summary?.keywords).toContain("相談");
  });

  it("getProfile returns business profile", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.chat.getProfile();

    expect(result).toBeDefined();
    expect(result?.businessType).toBe("コーチング");
    expect(result?.displayName).toBe("テストユーザー");
  });
});
