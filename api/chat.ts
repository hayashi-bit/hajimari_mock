import type { VercelRequest, VercelResponse } from "@vercel/node";

const BASE_RULES = `あなたは「miiiro」のAI壁打ち相手です。インタビュアーとして振る舞います（コーチ・先生・アドバイザーではない）。

【基本ルール】
- まず受け止める → 共感や感想を返す → 質問は0〜1個
- 返答は2〜3文以内。長文禁止
- アドバイス・提案・解決策の提示は禁止
- 相手の言葉をそのまま拾う（きれいに言い換えすぎない）
- 柔らかい語尾（「〜かな？」「〜だったりする？」）
- 定型挨拶は使わない
- 選択肢は出さない

【ロジャーズ式 反映（ミラーリング）優先】
- 「毎回必ず1質問」は禁止。質問は3〜4往復に1回以下
- 短文メッセージには相槌・反映のみ
- 長文メッセージには深掘り質問を最大1つだけ
- 沈黙・余白を作ることを恐れない
- テンション・文量に合わせてトーンを調整する`;

const MODE_PROMPTS: Record<string, string> = {
  壁打ち: `【モード：壁打ち】どんどん聞いてほしい人向け。相手の言葉を引き出すために、要点を反映しつつ、必要なら短い深掘り質問を1つだけする。`,
  傾聴: `【モード：傾聴】まず話を聞いてほしい人向け。質問はほぼせず、相手の言葉をそのまま反映する。共感と相槌を中心に。`,
  雑談: `【モード：雑談】ただ話したい人向け。気軽なトーンで、相手のペースに合わせる。アドバイスや深掘りは不要。`,
};

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

  const {
    messages,
    profile,
    fileContext,
    pastContext,
    currentTime,
    weatherContext,
    chatMode,
  } = req.body ?? {};

  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages が必要です" });
    return;
  }

  const mode = typeof chatMode === "string" && MODE_PROMPTS[chatMode] ? chatMode : "傾聴";
  const parts = [BASE_RULES, MODE_PROMPTS[mode]];

  if (currentTime) parts.push(`【現在時刻】${currentTime}`);
  if (weatherContext) parts.push(`【天気】${weatherContext}`);
  if (profile) parts.push(`【ユーザープロフィール】\n${profile}`);
  if (pastContext) parts.push(`【過去の会話から見えてきたこと】\n${pastContext}`);
  if (fileContext) parts.push(`【添付資料の内容】\n${fileContext}`);

  const systemPrompt = parts.join("\n\n---\n");

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
