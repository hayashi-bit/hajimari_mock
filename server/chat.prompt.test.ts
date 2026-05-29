import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module — capture calls to verify prompt content
const mockInvokeLLM = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: "うんうん、それってさ、自分の居場所を探してるってことかも？",
      },
    },
  ],
});

vi.mock("./_core/llm", () => ({
  invokeLLM: (...args: any[]) => mockInvokeLLM(...args),
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
  getRecentMessages: vi.fn().mockResolvedValue([]),
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
  toggleFavorite: vi.fn().mockResolvedValue(true),
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

function buildMessages(userCount: number) {
  const msgs: { id: number; sessionId: number; role: string; content: string; createdAt: Date }[] = [];
  let id = 1;
  for (let i = 0; i < userCount; i++) {
    msgs.push({ id: id++, sessionId: 1, role: "assistant", content: `AI応答 ${i}`, createdAt: new Date() });
    msgs.push({ id: id++, sessionId: 1, role: "user", content: `ユーザー発言 ${i}`, createdAt: new Date() });
  }
  return msgs;
}

describe("chat.prompt - 示唆バランスとまとめ提案", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("プロンプトに示唆のバランスセクションが含まれる", async () => {
    const db = await import("./db");
    vi.mocked(db.getRecentMessages).mockResolvedValueOnce(buildMessages(3));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.chat.sendMessage({
      sessionId: 1,
      content: "テスト",
      isOnboarding: false,
    });

    // invokeLLMが呼ばれた時のsystem promptを検証
    // 最初の呼び出しはモード検出、2番目が壁打ち応答
    const calls = mockInvokeLLM.mock.calls;
    // モード検出は2+ユーザーメッセージで発火するので、calls[0]がモード検出、calls[1]が壁打ち
    const kabeuchiCall = calls.find((c: any) =>
      c[0]?.messages?.[0]?.content?.includes("示唆のバランス")
    );
    expect(kabeuchiCall).toBeDefined();
    const systemPrompt = kabeuchiCall![0].messages[0].content;
    expect(systemPrompt).toContain("示唆のバランス");
    expect(systemPrompt).toContain("それって、『自分が主導権を持ちたい』ってことかも？");
    expect(systemPrompt).toContain("つまり〇〇みたいな感じ？");
  });

  it("プロンプトに軽い言語化の投げ返しが応答の流れに含まれる", async () => {
    const db = await import("./db");
    vi.mocked(db.getRecentMessages).mockResolvedValueOnce(buildMessages(3));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.chat.sendMessage({
      sessionId: 1,
      content: "テスト",
      isOnboarding: false,
    });

    const calls = mockInvokeLLM.mock.calls;
    const kabeuchiCall = calls.find((c: any) =>
      c[0]?.messages?.[0]?.content?.includes("応答の流れ")
    );
    expect(kabeuchiCall).toBeDefined();
    const systemPrompt = kabeuchiCall![0].messages[0].content;
    // 応答の流れのステップ2が「軽く言語化して投げ返す」になっている
    expect(systemPrompt).toContain("軽く言語化して投げ返す");
  });

  it("6往復目でまとめ提案プロンプトが含まれる", async () => {
    const db = await import("./db");
    vi.mocked(db.getRecentMessages).mockResolvedValueOnce(buildMessages(6));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.chat.sendMessage({
      sessionId: 1,
      content: "テスト",
      isOnboarding: false,
    });

    const calls = mockInvokeLLM.mock.calls;
    const kabeuchiCall = calls.find((c: any) =>
      c[0]?.messages?.[0]?.content?.includes("まとめ提案タイミング")
    );
    expect(kabeuchiCall).toBeDefined();
    const systemPrompt = kabeuchiCall![0].messages[0].content;
    expect(systemPrompt).toContain("一回整理してみる？");
    expect(systemPrompt).not.toContain("途中整理タイミング");
  });

  it("7往復目でもまとめ提案プロンプトが含まれる", async () => {
    const db = await import("./db");
    vi.mocked(db.getRecentMessages).mockResolvedValueOnce(buildMessages(7));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.chat.sendMessage({
      sessionId: 1,
      content: "テスト",
      isOnboarding: false,
    });

    const calls = mockInvokeLLM.mock.calls;
    const kabeuchiCall = calls.find((c: any) =>
      c[0]?.messages?.[0]?.content?.includes("まとめ提案タイミング")
    );
    expect(kabeuchiCall).toBeDefined();
  });

  it("8往復目でもまとめ提案が途中整理より優先される", async () => {
    const db = await import("./db");
    // 8 = 4の倍数だが、まとめ提案が優先されるべき
    vi.mocked(db.getRecentMessages).mockResolvedValueOnce(buildMessages(8));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.chat.sendMessage({
      sessionId: 1,
      content: "テスト",
      isOnboarding: false,
    });

    const calls = mockInvokeLLM.mock.calls;
    const kabeuchiCall = calls.find((c: any) =>
      c[0]?.messages?.[0]?.content?.includes("まとめ提案タイミング")
    );
    expect(kabeuchiCall).toBeDefined();
    const systemPrompt = kabeuchiCall![0].messages[0].content;
    // 途中整理は含まれない（まとめ提案が優先）
    expect(systemPrompt).not.toContain("途中整理タイミング");
    expect(systemPrompt).toContain("まとめ提案タイミング");
  });

  it("4往復目（6未満）は途中整理が発火する", async () => {
    const db = await import("./db");
    vi.mocked(db.getRecentMessages).mockResolvedValueOnce(buildMessages(4));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.chat.sendMessage({
      sessionId: 1,
      content: "テスト",
      isOnboarding: false,
    });

    const calls = mockInvokeLLM.mock.calls;
    const kabeuchiCall = calls.find((c: any) =>
      c[0]?.messages?.[0]?.content?.includes("途中整理タイミング")
    );
    expect(kabeuchiCall).toBeDefined();
    const systemPrompt = kabeuchiCall![0].messages[0].content;
    expect(systemPrompt).toContain("途中整理タイミング");
    expect(systemPrompt).not.toContain("まとめ提案タイミング");
  });

  it("12往復目（6-8範囲外）は途中整理が発火する", async () => {
    const db = await import("./db");
    vi.mocked(db.getRecentMessages).mockResolvedValueOnce(buildMessages(12));

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.chat.sendMessage({
      sessionId: 1,
      content: "テスト",
      isOnboarding: false,
    });

    const calls = mockInvokeLLM.mock.calls;
    const kabeuchiCall = calls.find((c: any) =>
      c[0]?.messages?.[0]?.content?.includes("途中整理タイミング")
    );
    expect(kabeuchiCall).toBeDefined();
    const systemPrompt = kabeuchiCall![0].messages[0].content;
    expect(systemPrompt).toContain("途中整理タイミング");
    expect(systemPrompt).not.toContain("まとめ提案タイミング");
  });
});
