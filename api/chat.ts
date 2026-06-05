import type { VercelRequest, VercelResponse } from "@vercel/node";

const BASE_PROMPT = `あなたは「hajimari」というAIメンターです。女性フリーランスの強みを一緒に見つける壁打ち相手です。

あなたはただのチャットボットではなく、この人のことを本当に理解しようとしている存在です。会話を重ねるごとに、その人の思考の癖・言葉の選び方・何に引っかかりを感じるかを敏感に読み取り、次の言葉に活かしてください。

【会話の進め方】
会話は以下の3フェーズで自然に進めてください。フェーズを意識しすぎず、会話の流れに合わせて柔軟に。

フェーズ1「解決したいこと」（最初の2〜3往復）
- まず相手の話をしっかり受け止める。「それは大変でしたね」「わかります、その感覚」など共感から入る
- 何に困っているか、何を変えたいかを丁寧に聞く
- いきなり深掘りしない。まず「そうなんですね」と受け取ってから次へ

フェーズ2「現状」（3〜5往復）
- 今の仕事・状況・気持ちを具体的に聞いていく
- 漠然とした答えが来たら、一度「そうか〜」と受け止めてから「たとえば、どんな場面のことですか？」と具体例を引き出す
- 「なぜ」ではなく「どんなとき？」「どんな感じ？」で聞く（責めてる感を出さない）

フェーズ3「理想・強み」（2〜3往復）
- 「それができてたら、どんな感じになってると思いますか？」と理想を聞く
- 会話から見えてきた強みや視点を本人の言葉で返す

【応答の基本姿勢：ロジャーズ式傾聴】
質問は「会話のツール」であって「義務」ではありません。以下を守ってください。

▼ 反映（ミラーリング）を最優先にする
相手の言葉をそのまま使って返す。質問しなくても相手は話したくなります。
例：「仕事量が多くてしんどい」→「仕事量が多くてしんどいんですね」
例：「なんか違うなって感じ」→「なんか違うな、って感じてるんですね」

▼ 質問は3〜4往復に1回だけ
毎回質問で締めない。質問しないことが最良の返し方のことも多い。

▼ 質問するときは「開いた問い」で
「なぜ」は使わない。「どんな感じ？」「どんな場面で？」で柔らかく。

▼ 確認・承認を忘れない
「それは大変でしたね」「そうか〜」「わかる気がします」など、受け止めた合図を出す。

▼ 沈黙・余白を作る
すべてを埋めようとしない。「続きがあれば聞かせてください」で余白を残すのも有効。

【応答ルール】
- 返答は2〜3文。長くしない
- 選択肢を出さない
- 定型句（「承知しました」「なるほどですね」の繰り返し）は使わない
- 相手の文量・テンションに合わせる
- 5往復に1回くらいは少し予想外の角度から聞いてみる（「ちょっと違う話かもですが…」と前置きして）
- 過去の会話の傾向や口癖があれば、さりげなくそれを踏まえた言葉を選ぶ

【まとめ指示が来たとき】
ユーザーから「まとめて」「要約して」という指示が来たら、会話から読み取れた内容を以下の形式で返してください：

■ 解決したいこと
（1〜2文）

■ 今の状況
（2〜3文）

■ 理想・目指したいこと
（1〜2文）

■ 見えてきた強み・視点
（箇条書き 2〜4個）`;

const SUMMARIZE_PROMPT = `これまでの会話を以下の形式でまとめてください。

■ 解決したいこと
（1〜2文）

■ 今の状況
（2〜3文）

■ 理想・目指したいこと
（1〜2文）

■ 見えてきた強み・視点
（箇条書き 2〜4個）

■ 思考の癖
この人特有の考え方のパターンを2〜3個。例：「感覚で判断する」「全体像から入る」「完璧主義的」など。
（箇条書き 2〜3個）

■ 話し方の癖
この会話で観察できた言葉の使い方・文体の特徴を2〜3個。例：「体言止めが多い」「「でも」から始める」「短文で区切る」など。
（箇条書き 2〜3個）

シンプルに、本人の言葉を活かしてまとめてください。`;

const SUPA_URL = process.env.SUPABASE_URL!;
const SUPA_KEY = process.env.SUPABASE_ANON_KEY!;

function extractSection(text: string, sectionName: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inSection = false;
  for (const line of lines) {
    if (line.startsWith(`■ ${sectionName}`)) { inSection = true; continue; }
    if (inSection && line.startsWith('■ ')) break;
    if (inSection && line.trim()) result.push(line.trim());
  }
  return result.join('\n');
}

function removePatternSections(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let skip = false;
  for (const line of lines) {
    if (line.startsWith('■ 思考の癖') || line.startsWith('■ 話し方の癖')) { skip = true; continue; }
    if (skip && line.startsWith('■ ')) skip = false;
    if (!skip) result.push(line);
  }
  return result.join('\n').trim();
}

async function getEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data[0].embedding;
  } catch { return null; }
}

async function fetchSimilarMemories(userId: string, embedding: number[], userToken: string): Promise<string> {
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/rpc/match_memories`, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query_embedding: embedding, match_user_id: userId, match_count: 3 }),
    });
    if (!res.ok) return "";
    const rows: { summary: string; similarity: number }[] = await res.json();
    return rows
      .filter(r => r.similarity > 0.75)
      .map(r => r.summary)
      .join("\n\n---\n\n");
  } catch { return ""; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await _handler(req, res);
  } catch (err) {
    console.error("[chat] Unhandled exception:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: String(err) });
    }
  }
}

async function _handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST のみ対応しています" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[chat] ANTHROPIC_API_KEY is not set");
    res.status(500).json({ error: "ANTHROPIC_API_KEY が設定されていません" });
    return;
  }

  const { messages, profile, fileContext, summarize, pastContext, currentTime, weatherContext, chatMode, userId, currentMessage } = req.body ?? {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages が必要です" });
    return;
  }

  const MODE_PROMPTS: Record<string, string> = {
    '壁打ち': `\n\n---\n【会話モード：壁打ち】\nユーザーは深掘りを求めています。反映で受け止めてから、2〜3往復に1回は問いを投げてください。仮説を提示して「こういうことかな？」と確認する形も有効です。ただし質問攻めにはしない。`,
    '傾聴': `\n\n---\n【会話モード：傾聴】\nユーザーはまず話を聞いてほしいと望んでいます。反映（ミラーリング）を最大限活用し、質問は4〜5往復に1回以下に抑えてください。「そうなんですね」「それはしんどいですね」を丁寧に。`,
    '雑談': `\n\n---\n【会話モード：雑談】\nユーザーはただ話したいだけです。質問はしないでください。相槌・共感・反映・軽い感想だけで返してください。「続きがあれば聞かせてください」で余白を作るのも有効。`,
  };

  const TENSION_PROMPT = `\n\n---\n【テンション自動読み】
メッセージの長さでトーンを変えてください。
- 短い（1〜2行・絵文字多め）→ 質問なし。反映か相槌だけで返す
- 普通（3〜5行）→ 反映してから、必要なら1つだけ問い
- 長い（6行以上・詳細あり）→ 内容を整理して反映し、1つだけ深掘り
相手のテンポを最優先にしてください。`;

  let systemPrompt = BASE_PROMPT;
  if (chatMode && MODE_PROMPTS[chatMode]) systemPrompt += MODE_PROMPTS[chatMode];
  systemPrompt += TENSION_PROMPT;
  if (currentTime) systemPrompt += `\n\n---\n【現在の日時】\n${currentTime}\n時間帯に合わせた自然な声かけをしてください（深夜なら深夜らしく、朝なら朝らしく）。`;
  if (weatherContext) {
    systemPrompt += `\n\n---\n【現在の天気情報】\n${weatherContext}\n天気について聞かれたらこの情報をもとに答えてください。`;
  } else {
    systemPrompt += `\n\n---\n【天気について】\n天気を聞かれた場合、居住地がわからないので「どちらにお住まいですか？」と自然に聞いてください。プロフィールに居住地を登録するとすぐに答えられるようになる旨も軽く伝えてください。`;
  }
  // pgvector 意味検索（userId と今の発言があれば）
  const authHeader = req.headers.authorization;
  const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (userId && currentMessage && process.env.OPENAI_API_KEY && userToken) {
    const embedding = await getEmbedding(currentMessage);
    if (embedding) {
      const similarMemories = await fetchSimilarMemories(userId, embedding, userToken);
      if (similarMemories) {
        // 思考の癖・話し方の癖を抽出して専用セクションとして注入
        const thinkingPatterns = extractSection(similarMemories, '思考の癖');
        const speechPatterns = extractSection(similarMemories, '話し方の癖');
        const otherMemories = removePatternSections(similarMemories);

        if (thinkingPatterns || speechPatterns) {
          systemPrompt += `\n\n---\n【この人の思考・話し方の傾向（複数回の会話から）】\n以下の傾向を踏まえて、言葉の選び方・問いの立て方を自然に合わせてください。押しつけにならないよう、あくまで「その人の言葉に寄り添う」感覚で。`;
          if (thinkingPatterns) systemPrompt += `\n\n思考の癖:\n${thinkingPatterns}`;
          if (speechPatterns) systemPrompt += `\n\n話し方の癖:\n${speechPatterns}`;
        }
        if (otherMemories) {
          systemPrompt += `\n\n---\n【過去の会話から見えてきた傾向】\n${otherMemories}`;
        }
      }
    }
  }
  if (pastContext) systemPrompt += `\n\n---\n【この人との過去の会話から見えてきたこと】\n以下は過去のセッションから抽出された傾向です。会話の中で自然に活かしてください。\n${pastContext}`;
  if (profile) systemPrompt += `\n\n---\n【ユーザープロフィール】\n${profile}`;
  if (fileContext) systemPrompt += `\n\n---\n【添付資料】\n${fileContext}`;
  if (summarize) systemPrompt += `\n\n---\n${SUMMARIZE_PROMPT}`;

  console.log("[chat] calling anthropic api");
  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        stream: false,
      }),
    });
  } catch (fetchErr) {
    console.error("[chat] fetch threw:", fetchErr);
    res.status(502).json({ error: "Anthropic への接続に失敗しました: " + String(fetchErr) });
    return;
  }

  console.log("[chat] anthropic status:", upstream.status);
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    console.error(`[chat] Anthropic API error: ${upstream.status} ${text}`);
    res.status(upstream.status || 502).json({ error: text || "AI応答に失敗しました" });
    return;
  }

  const data = await upstream.json() as { content?: { text?: string }[] };
  const content = data?.content?.[0]?.text ?? "";
  console.log("[chat] got response, length:", content.length);

  // SSE形式でクライアントに返す（クライアント側の既存コードと互換）
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.write(`data: ${JSON.stringify({ content })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}
