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

【応答ルール】
- 返答は2〜3文。長くしない
- 最後に質問を1つだけ
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

シンプルに、本人の言葉を活かしてまとめてください。`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST のみ対応しています" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY が設定されていません" });
    return;
  }

  const { messages, profile, fileContext, summarize, pastContext, currentTime } = req.body ?? {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages が必要です" });
    return;
  }

  let systemPrompt = BASE_PROMPT;
  if (currentTime) systemPrompt += `\n\n---\n【現在の日時】\n${currentTime}\n時間帯に合わせた自然な声かけをしてください（深夜なら深夜らしく、朝なら朝らしく）。`;
  if (pastContext) systemPrompt += `\n\n---\n【この人との過去の会話から見えてきたこと】\n以下は過去のセッションから抽出された傾向です。会話の中で自然に活かしてください。\n${pastContext}`;
  if (profile) systemPrompt += `\n\n---\n【ユーザープロフィール】\n${profile}`;
  if (fileContext) systemPrompt += `\n\n---\n【添付資料】\n${fileContext}`;
  if (summarize) systemPrompt += `\n\n---\n${SUMMARIZE_PROMPT}`;

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
        stream: true,
      }),
    });
  } catch {
    res.status(502).json({ error: "Anthropic への接続に失敗しました" });
    return;
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    res.status(upstream.status || 502).json({ error: text || "AI応答に失敗しました" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      try {
        const json = JSON.parse(data);
        if (json.type === "content_block_delta") {
          const content = json.delta?.text;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
}
