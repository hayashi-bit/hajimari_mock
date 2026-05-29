import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import {
  getBusinessProfile,
  upsertBusinessProfile,
  createChatSession,
  getLatestSession,
  getOnboardingSession,
  addMessage,
  getSessionMessages,
  getRecentMessages,
  updateSessionMeta,
  getPreviousSession,
  getSessionHistory,
  getSessionById,
  toggleFavorite,
} from "../db";

// ─── Helper: resolve identity from ctx ───

function resolveIdentity(ctx: { user: { id: number } | null; deviceId: string | null }) {
  if (ctx.user) return { userId: ctx.user.id, deviceId: null };
  if (ctx.deviceId) return { userId: null, deviceId: ctx.deviceId };
  throw new Error("No identity: login or provide device ID");
}

// ─── Mode Types ───

type KabeuchiMode = "strength" | "worry" | "service" | "target" | "decision" | "action";

const MODE_LABELS: Record<KabeuchiMode, string> = {
  strength: "強み整理",
  worry: "悩み整理",
  service: "サービス整理",
  target: "ターゲット整理",
  decision: "意思決定",
  action: "行動整理",
};

const MODE_DIRECTIONS: Record<KabeuchiMode, string> = {
  strength: "「人からよく頼まれること」「自然にできていること」「褒められるけど本人は当たり前だと思っていること」を掘り下げる。",
  worry: "「何に引っかかっているか」「止まっている原因は何か」「本当は何が怖いのか」を掘り下げる。",
  service: "「誰のどんな困りごとを助けたいか」「自分が提供できる価値は何か」「理想のお客さんとの関係」を掘り下げる。",
  target: "「一番助けたい人はどんな人か」「その人はどこにいるか」「その人の日常で何に困っているか」を掘り下げる。",
  decision: "「どの選択肢で迷っているか」「それぞれの選択肢の先に何が見えるか」「本当はどちらに傾いているか」を掘り下げる。",
  action: "「最初にできそうなこと」「10分でできることは何か」「誰かに話すとしたら何から話すか」を掘り下げる。",
};

// ─── System Prompts ───

function buildKabeuchiPrompt(opts: {
  mode?: KabeuchiMode | null;
  profile?: { businessType?: string | null; targetCustomer?: string | null; currentGoal?: string | null; displayName?: string | null };
  previousMemory?: { keywords?: string; strengths?: string; uncertainties?: string; nextTheme?: string | null; summary?: string | null };
  userMessageCount: number;
}): string {
  let prompt = `あなたは「miiiro」の壁打ちパートナーです。

## あなたの役割
隣に座っている友人のように振る舞う。コーチでも先生でもアドバイザーでもない。
ユーザーの頭の中にあるものを「質問」で引き出す。答えは全てユーザーの中にある。
でも、まず最初にやることは「共感」。質問はその後。

## GPTとの決定的な違い（これがmiiiroの本質）
- GPTは「答えを出す」。miiiroは「問いを出す」。
- GPTは「情報を整理してくれる」。miiiroは「あなた自身の考えを整理させてくれる」。
- GPTに聞くと「正解っぽいもの」が返ってくる。miiiroに話すと「自分の本音」が出てくる。
- あなたは絶対にアドバイスしない。解決策を提示しない。代わりに、ユーザーが自分で気づく質問をする。

## 応答の流れ（最重要）
1. まず共感する（「それは大変だよね」「わかる」「うんうん」など、気持ちに寄り添う）
2. ユーザーの言葉を拾って、軽く言語化して投げ返す（「それってさ、〇〇ってことかも？」「つまり〇〇みたいな感じ？」）
3. その上で、ひとつだけ質問する（しなくてもいい回もある）

重要: 毎回必ず質問で終わる必要はない。共感だけで返す回があってもいい。
「うんうん、それはしんどいね。」だけで終わる回があっていい。
ユーザーが続きを話したくなる「間」を作ることが大事。

## 示唆のバランス（重要）
「アドバイス」と「示唆」は違う。以下はOK:
- ユーザーが出した言葉を拾って、少しだけ抽象度を上げて投げ返す（「それって、『自分が主導権を持ちたい』ってことかも？どうかな？」）
- 「つまり〇〇みたいな感じ？」と確認の形で返す
- 「なんか、〇〇と〇〇が繋がってる気がするんだけど、どう思う？」

以下はNG（これはアドバイス）:
- 「〇〇したほうがいいと思う」
- 「〇〇するべき」
- 「私はこう思う」という意見の提示
- 解決策や次のアクションの提案

ポイント: 「私がこう思う」ではなく、「あなたが言ったことを拾うと、こういうことかも？」という確認の形。あくまでユーザーの言葉が起点。

## 応答ルール
- 1回に質問は最大1つ（0でもいい）
- 合計2〜3文以内
- ユーザーの言葉をそのまま拾う（きれいに言い換えすぎない）
- 質問するときは「〜かな？」「〜だったりする？」「〜って感じ？」のような柔らかい語尾
- 「〜ですか？」「〜ですね。」のような硬い敬語は使わない
- 友達に話すような自然な口調（タメ口寄り、でも馴れ馴れしすぎない）

## 禁止事項
- アドバイス・提案・解決策の提示
- 「〜してみてはいかがでしょうか」「〜するといいですよ」
- 選択肢を複数並べて選ばせる
- 箇条書き・リスト形式の応答
- マークダウン記法の使用
- 長文（4文以上）`;

  // Add mode-specific direction
  if (opts.mode && MODE_DIRECTIONS[opts.mode]) {
    prompt += `\n\n## 今のモード: ${MODE_LABELS[opts.mode]}
${MODE_DIRECTIONS[opts.mode]}`;
  }

  // Add profile context
  if (opts.profile) {
    const p = opts.profile;
    const parts: string[] = [];
    if (p.displayName) parts.push(`名前: ${p.displayName}`);
    if (p.businessType) parts.push(`事業: ${p.businessType}`);
    if (p.targetCustomer) parts.push(`ターゲット: ${p.targetCustomer}`);
    if (p.currentGoal) parts.push(`目標: ${p.currentGoal}`);
    if (parts.length > 0) {
      prompt += `\n\n## ユーザー情報\n${parts.join("\n")}`;
    }
  }

  // Summary proposal takes priority at 6-8 turns (even if it's a 4th-turn reflection point like 8)
  if (opts.userMessageCount >= 6 && opts.userMessageCount <= 8) {
    prompt += `\n\n## まとめ提案タイミング
会話がある程度進んだ。今回の応答の最後に、自然な流れで「ここまでの話、一回整理してみる？」と提案してもいい。
ただし、無理に入れない。会話がまだ盛り上がっている場合は提案しない。
区切りが良いタイミング（話が一周した、同じことを繰り返し始めた、ユーザーが「うーん」と考え込んでいる）で提案する。
例: 「ねえ、ここまでの話、一回整理してみない？」「ちょっとここらへんでまとめてみる？」`;
  // Mid-session reflection at every 4 turns (but NOT during 6-8 summary proposal window)
  } else if (opts.userMessageCount > 0 && opts.userMessageCount % 4 === 0) {
    prompt += `\n\n## 途中整理タイミング
ここまでの会話を踏まえて、一度整理してあげてください。
「ここまで聞いてて思ったんだけど、〇〇ってことだよね？」のように、
ユーザーの話を短くまとめて確認する。新しい質問は不要。`;
  }

  // Add previous memory
  if (opts.previousMemory) {
    const mem = opts.previousMemory;
    const hasMemory = mem.keywords || mem.strengths || mem.uncertainties || mem.nextTheme;
    if (hasMemory) {
      prompt += `\n\n## 前回の壁打ちの記憶`;
      if (mem.keywords) {
        try { prompt += `\n- 重要ワード: ${JSON.parse(mem.keywords).join("、")}`; } catch {}
      }
      if (mem.strengths) {
        try { prompt += `\n- 見えてきた強み: ${JSON.parse(mem.strengths).join("、")}`; } catch {}
      }
      if (mem.uncertainties) {
        try { prompt += `\n- まだ迷っていること: ${JSON.parse(mem.uncertainties).join("、")}`; } catch {}
      }
      if (mem.nextTheme) {
        prompt += `\n- 次に考えるとよいこと: ${mem.nextTheme}`;
      }
    }
  }

  return prompt;
}

const ONBOARDING_SYSTEM_PROMPT = `あなたは「miiiro」のAIメンターです。
初めてのユーザーとの会話です。自然な対話を通じて、以下の情報を集めてください。

## 集める情報
1. どんな仕事・事業をしているか（または、これからしたいこと）
2. お客さん（ターゲット）はどんな人か
3. 今一番「こうなりたい」と思っていること

## ルール
- フォームのような質問はしない。自然な会話の流れで聞く
- 1回に1つだけ質問する
- 応答は2〜3文以内
- 温かく、フレンドリーに（タメ口寄り）
- 3つの情報が揃ったら「ありがとう！これだけで十分。次からあなたのことを覚えた上でお話しするね。」と締める
- マークダウン記法の使用は禁止`;

// ─── Mode Detection ───

async function detectMode(msgs: { role: string; content: string }[]): Promise<KabeuchiMode | null> {
  if (msgs.filter(m => m.role === "user").length < 2) return null;

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `以下の会話を読み、ユーザーが今どのモードで話しているかを判定してください。

モード一覧:
- strength: 自分の強み・得意なことを整理しようとしている
- worry: 悩み・引っかかっていることを整理しようとしている
- service: 提供するサービス・価値を整理しようとしている
- target: 誰に届けるか・ターゲットを整理しようとしている
- decision: 選択肢で迷っている・意思決定しようとしている
- action: 次に何をするか・行動を整理しようとしている

1つだけ選んでください。`,
        },
        {
          role: "user",
          content: `会話:\n${msgs.slice(-6).map(m => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`).join("\n")}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "mode_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              mode: {
                type: "string",
                enum: ["strength", "worry", "service", "target", "decision", "action"],
                description: "検出されたモード",
              },
            },
            required: ["mode"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      return parsed.mode as KabeuchiMode;
    }
  } catch {}
  return null;
}

// ─── Summary Generation ───

async function generateSessionSummary(msgs: { role: string; content: string }[]) {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `以下の壁打ち会話を分析し、構造化されたまとめを生成してください。

重要なルール:
- 会話の内容をそのまま反映すること。無理に「強み」に繋げたり、ポジティブに解釈し直したりしない
- strengthsは会話の中で実際に強みの話題が出た場合のみ記載。出ていなければ空配列にする
- uncertaintiesも実際に迷いが表現された場合のみ。推測で埋めない
- insightsは会話から自然に見えてきたことだけ。AIの解釈を加えない`,
        },
        {
          role: "user",
          content: `会話:\n${msgs.map(m => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`).join("\n")}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "session_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              theme: { type: "string", description: "この壁打ちのテーマ（一言）" },
              insights: {
                type: "array",
                items: { type: "string" },
                description: "見えてきたこと（3つまで）",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "重要なキーワード（5つまで）",
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "会話で実際に強みの話題が出た場合のみ記載。出ていなければ空配列",
              },
              uncertainties: {
                type: "array",
                items: { type: "string" },
                description: "実際に迷いが表現された場合のみ。推測で埋めない。なければ空配列",
              },
              nextTheme: { type: "string", description: "次に考えるとよいこと" },
              oneLineSummary: { type: "string", description: "一行まとめ（30文字以内）" },
            },
            required: ["theme", "insights", "keywords", "strengths", "uncertainties", "nextTheme", "oneLineSummary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
  } catch {}
  return null;
}

// ─── Extract profile from onboarding conversation ───

async function extractProfileFromConversation(
  msgs: { role: string; content: string }[]
): Promise<{ businessType?: string; targetCustomer?: string; currentGoal?: string; displayName?: string }> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "以下の会話から、ユーザーの事業情報を抽出してJSON形式で返してください。",
        },
        {
          role: "user",
          content: `会話内容:\n${msgs.map((m) => `${m.role}: ${m.content}`).join("\n")}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "profile_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              businessType: { type: "string", description: "事業内容" },
              targetCustomer: { type: "string", description: "ターゲット顧客" },
              currentGoal: { type: "string", description: "現在の目標" },
              displayName: { type: "string", description: "呼び方（名前）" },
            },
            required: ["businessType", "targetCustomer", "currentGoal", "displayName"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return {};
  } catch {
    return {};
  }
}

// ─── Router ───

export const chatRouter = router({
  /** Get or create a chat session (works for both authenticated and anonymous users) */
  getOrCreateSession: publicProcedure.query(async ({ ctx }) => {
    const { userId, deviceId } = resolveIdentity(ctx);
    const profile = await getBusinessProfile(userId, deviceId);

    // If no profile or onboarding not complete, start onboarding
    if (!profile || !profile.onboardingComplete) {
      let session = await getOnboardingSession(userId, deviceId);
      if (!session) {
        const sessionId = await createChatSession({
          userId,
          deviceId,
          isOnboarding: true,
          theme: "オンボーディング",
        });
        session = { id: sessionId, userId, deviceId, isOnboarding: true, theme: "オンボーディング", messageCount: 0, mode: null, keywords: null, strengths: null, uncertainties: null, nextTheme: null, summary: null, summaryGeneratedAt: null, isFavorite: false, createdAt: new Date(), updatedAt: new Date() };
      }
      const msgs = await getSessionMessages(session.id);
      return {
        session,
        messages: msgs,
        isOnboarding: true,
        profile: null,
      };
    }

    // Regular session — get latest non-onboarding session
    let session = await getLatestSession(userId, deviceId);
    if (!session || session.isOnboarding) {
      const sessionId = await createChatSession({ userId, deviceId });
      session = { id: sessionId, userId, deviceId, isOnboarding: false, theme: null, messageCount: 0, mode: null, keywords: null, strengths: null, uncertainties: null, nextTheme: null, summary: null, summaryGeneratedAt: null, isFavorite: false, createdAt: new Date(), updatedAt: new Date() };
    }
    const msgs = await getSessionMessages(session.id);

    // Get previous session memory for context
    const previousSession = await getPreviousSession(userId, session.id, deviceId);

    return {
      session,
      messages: msgs,
      isOnboarding: false,
      profile,
      previousMemory: previousSession ? {
        keywords: previousSession.keywords,
        strengths: previousSession.strengths,
        uncertainties: previousSession.uncertainties,
        nextTheme: previousSession.nextTheme,
        summary: previousSession.summary,
      } : null,
    };
  }),

  /** Start a new wall-hitting session */
  startNewSession: publicProcedure.mutation(async ({ ctx }) => {
    const { userId, deviceId } = resolveIdentity(ctx);
    const sessionId = await createChatSession({ userId, deviceId });
    return { sessionId };
  }),

  /** Send a message and get AI response */
  sendMessage: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        content: z.string().min(1).max(5000),
        isOnboarding: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, deviceId } = resolveIdentity(ctx);

      // Verify session ownership
      const session = await getSessionById(input.sessionId);
      if (!session) throw new Error("Session not found");
      if (userId && session.userId !== userId) throw new Error("Session not found");
      if (!userId && deviceId && session.deviceId !== deviceId) throw new Error("Session not found");

      // Save user message
      await addMessage({
        sessionId: input.sessionId,
        role: "user",
        content: input.content,
      });

      // Get context for AI
      const profile = await getBusinessProfile(userId, deviceId);
      const recentMsgs = await getRecentMessages(input.sessionId, 12);
      const userMessageCount = recentMsgs.filter(m => m.role === "user").length;

      if (input.isOnboarding) {
        // Onboarding flow
        const llmMessages = [
          { role: "system" as const, content: ONBOARDING_SYSTEM_PROMPT },
          ...recentMsgs.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        const result = await invokeLLM({ messages: llmMessages });
        const aiContent =
          typeof result.choices[0]?.message?.content === "string"
            ? result.choices[0].message.content
            : "すみません、うまく応答できませんでした。もう一度お話しいただけますか？";

        await addMessage({
          sessionId: input.sessionId,
          role: "assistant",
          content: aiContent,
        });

        // Check if we have enough info to extract profile
        if (userMessageCount >= 3) {
          const allMsgs = await getSessionMessages(input.sessionId);
          const extracted = await extractProfileFromConversation(
            allMsgs.map((m) => ({ role: m.role, content: m.content }))
          );

          if (extracted.businessType && extracted.currentGoal) {
            await upsertBusinessProfile(userId, {
              businessType: extracted.businessType,
              targetCustomer: extracted.targetCustomer || null,
              currentGoal: extracted.currentGoal,
              displayName: extracted.displayName || null,
              onboardingComplete: true,
            }, deviceId);

            return { aiMessage: aiContent, onboardingComplete: true };
          }
        }

        return { aiMessage: aiContent, onboardingComplete: false };
      }

      // ─── 壁打ちモード ───

      // Detect mode after 2+ user messages
      let currentMode: KabeuchiMode | null = null;
      if (userMessageCount >= 2) {
        currentMode = await detectMode(
          recentMsgs.map(m => ({ role: m.role, content: m.content }))
        );
        if (currentMode) {
          await updateSessionMeta(input.sessionId, { mode: currentMode });
        }
      }

      // Get previous session memory
      const previousSession = await getPreviousSession(userId, input.sessionId, deviceId);

      // Build system prompt
      const systemPrompt = buildKabeuchiPrompt({
        mode: currentMode,
        profile: profile ?? undefined,
        previousMemory: previousSession ? {
          keywords: previousSession.keywords ?? undefined,
          strengths: previousSession.strengths ?? undefined,
          uncertainties: previousSession.uncertainties ?? undefined,
          nextTheme: previousSession.nextTheme,
          summary: previousSession.summary,
        } : undefined,
        userMessageCount,
      });

      const llmMessages = [
        { role: "system" as const, content: systemPrompt },
        ...recentMsgs.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Call LLM
      const result = await invokeLLM({ messages: llmMessages });
      const aiContent =
        typeof result.choices[0]?.message?.content === "string"
          ? result.choices[0].message.content
          : "すみません、うまく応答できませんでした。もう一度お話しいただけますか？";

      // Save AI response
      await addMessage({
        sessionId: input.sessionId,
        role: "assistant",
        content: aiContent,
      });

      return {
        aiMessage: aiContent,
        onboardingComplete: false,
        mode: currentMode,
        userMessageCount,
      };
    }),

  /** Generate session summary */
  generateSummary: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, deviceId } = resolveIdentity(ctx);
      // Verify session ownership
      const session = await getSessionById(input.sessionId);
      if (!session) throw new Error("Session not found");
      if (userId && session.userId !== userId) throw new Error("Session not found");
      if (!userId && deviceId && session.deviceId !== deviceId) throw new Error("Session not found");
      const msgs = await getSessionMessages(input.sessionId);
      const conversationMsgs = msgs
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      if (conversationMsgs.length < 6) {
        return { success: false, reason: "会話がまだ短いです" };
      }

      const summary = await generateSessionSummary(conversationMsgs);
      if (!summary) {
        return { success: false, reason: "まとめの生成に失敗しました" };
      }

      // Save to session
      await updateSessionMeta(input.sessionId, {
        summary: JSON.stringify(summary),
        keywords: JSON.stringify(summary.keywords),
        strengths: JSON.stringify(summary.strengths),
        uncertainties: JSON.stringify(summary.uncertainties),
        nextTheme: summary.nextTheme,
        summaryGeneratedAt: new Date(),
      });

      return { success: true, summary };
    }),

  /** Generate the initial AI greeting message */
  getGreeting: publicProcedure
    .input(
      z.object({
        sessionId: z.number(),
        isOnboarding: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, deviceId } = resolveIdentity(ctx);

      // Verify session ownership
      const sessionCheck = await getSessionById(input.sessionId);
      if (!sessionCheck) throw new Error("Session not found");
      if (userId && sessionCheck.userId !== userId) throw new Error("Session not found");
      if (!userId && deviceId && sessionCheck.deviceId !== deviceId) throw new Error("Session not found");

      // Check if session already has messages
      const existingMsgs = await getSessionMessages(input.sessionId, 1);
      if (existingMsgs.length > 0) {
        return { alreadyGreeted: true };
      }

      let greeting: string;

      if (input.isOnboarding) {
        greeting =
          "はじめまして！miiiroへようこそ。\nあなたのことを少し教えてくれる？どんなお仕事をしてる？";
      } else {
        const profile = await getBusinessProfile(userId, deviceId);
        const name = profile?.displayName || "";

        // Check for previous session memory
        const previousSession = await getPreviousSession(userId, input.sessionId, deviceId);

        let memoryContext = "";
        if (previousSession?.summary) {
          try {
            const prevSummary = JSON.parse(previousSession.summary);
            memoryContext = `
前回の壁打ちの記憶:
- テーマ: ${prevSummary.theme || ""}
- 見えてきたこと: ${(prevSummary.insights || []).join("、")}
- 次に考えるとよいこと: ${prevSummary.nextTheme || ""}
この記憶を踏まえて、前回の続きから自然に問いかけてください。`;
          } catch {}
        }

        // Generate a contextual greeting
        const isFirstEver = !previousSession; // No previous session = first time user

        let greetingSystemPrompt: string;

        if (isFirstEver) {
          // First time: explain what this place is + what they'll get + invite to start
          greetingSystemPrompt = `あなたはmiiiroの壁打ちパートナーです。ユーザーが初めてこの場所に来ました。最初の声かけをしてください。
${name ? `ユーザーの名前: ${name}` : ""}
${profile?.businessType ? `事業内容: ${profile.businessType}` : ""}

以下の3つの要素を自然に含めてください:
1. ここがどんな場所か（壁打ちの場所、答えは出さない、話すだけでOK）
2. 何が得られるか（話してるうちに頭が整理される、自分の中から見えてくる）
3. 最初の一歩を促す（今頭にあることを話してみて、と軽く誘う）

ルール:
- 3〜4文以内（初回なので少し長くてOK）
- 友達に話しかけるようなカジュアルな口調（「です・ます」は使わない）
- 最後は軽い問いかけで終わる
- マークダウン記法は使わない
- 毎回少し違う言い回しにする（ブレがあったほうが面白い）
- 例: 「ここは壁打ちの場所。答えは出さないけど、話してるうちに自分の中から見えてくるよ。今頭にあること、なんでも話してみて。」`;
        } else {
          // Returning user: use memory and history for contextual greeting
          greetingSystemPrompt = `あなたはmiiiroの壁打ちパートナーです。ユーザーに最初の声かけをしてください。
${name ? `ユーザーの名前: ${name}` : ""}
${profile?.businessType ? `事業内容: ${profile.businessType}` : ""}
${profile?.currentGoal ? `目標: ${profile.currentGoal}` : ""}
${memoryContext}
ルール:
- 2〜3文以内
- 友達に話しかけるようなカジュアルな口調（「です・ます」は使わない）
- 「〜かな？」「〜だったりする？」のような柔らかい語尾
- 必ず1つ軽い質問で終わる（一言で答えられるレベル）
- アドバイスしない
- 毎回違う問いかけにする
- マークダウン記法は使わない
- 前回の記憶がある場合は、それに触れて「前回の続き」感を出す
- 例: 「おつかれさま。今日は何か考えてることある？」「やっほー。最近どう？」`;
        }

        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: greetingSystemPrompt,
            },
          ],
        });

        greeting =
          typeof result.choices[0]?.message?.content === "string"
            ? result.choices[0].message.content
            : `${name ? name + "さん、" : ""}今日はどんなことを考えてる？`;
      }

      // Save greeting as AI message
      await addMessage({
        sessionId: input.sessionId,
        role: "assistant",
        content: greeting,
      });

      return { greeting, alreadyGreeted: false };
    }),

  /** Get business profile */
  getProfile: publicProcedure.query(async ({ ctx }) => {
    const { userId, deviceId } = resolveIdentity(ctx);
    return getBusinessProfile(userId, deviceId);
  }),

  /** Get session history (all past sessions with summaries) */
  getHistory: publicProcedure.query(async ({ ctx }) => {
    const { userId, deviceId } = resolveIdentity(ctx);
    const sessions = await getSessionHistory(userId, deviceId);
    return sessions.map(s => ({
      id: s.id,
      theme: s.theme,
      mode: s.mode,
      messageCount: s.messageCount,
      summary: s.summary ? (() => { try { return JSON.parse(s.summary); } catch { return null; } })() : null,
      isFavorite: s.isFavorite,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }),

  /** Resume an existing session (load messages for continuing chat) */
  resumeSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { userId, deviceId } = resolveIdentity(ctx);
      const session = await getSessionById(input.sessionId);
      if (!session) {
        throw new Error("Session not found");
      }
      // Verify ownership
      if (userId && session.userId !== userId) {
        throw new Error("Session not found");
      }
      if (!userId && deviceId && session.deviceId !== deviceId) {
        throw new Error("Session not found");
      }
      const msgs = await getSessionMessages(session.id);
      const profile = await getBusinessProfile(userId, deviceId);
      return {
        session,
        messages: msgs,
        profile,
      };
    }),

  /** Toggle favorite status on a session */
  toggleFavorite: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { userId, deviceId } = resolveIdentity(ctx);
      const session = await getSessionById(input.sessionId);
      if (!session) {
        throw new Error("Session not found");
      }
      // Verify ownership
      if (userId && session.userId !== userId) {
        throw new Error("Session not found");
      }
      if (!userId && deviceId && session.deviceId !== deviceId) {
        throw new Error("Session not found");
      }
      const isFavorite = await toggleFavorite(input.sessionId);
      return { isFavorite };
    }),
});
