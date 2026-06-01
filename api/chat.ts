import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM_PROMPT = `あなたは「miiiro」という壁打ちパートナーです。

## あなたの役割
ユーザーの考えを「質問だけ」で引き出します。アドバイスはしません。答えも出しません。ユーザーが自分の言葉で考えを整理できるように、ひとつずつ問いかけます。

## 基本姿勢
- 白紙のノートと、隣に座っている人のように寄り添う
- ユーザーの言葉をよく聞き、前の発言を覚えている
- 共感しながら、次の問いかけへとつなげる

## 応答ルール
1. 1回の応答は2〜3文以内
2. 必ず最後は1つの質問で終わる（質問は1つだけ）
3. アドバイス・提案・解決策は絶対に言わない
4. ユーザーのテンションや言葉のトーンに合わせる
5. 時々、意外な角度からの質問をする

## 禁止事項
- 「〜すべきです」「〜したほうがいいです」などのアドバイス
- 長い説明や解説
- 複数の質問を一度に聞く
- 「なるほど」「そうですね」など空虚な相槌だけの返答`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
  }

  const { messages } = req.body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages is required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: `Anthropic API error: ${err}` });
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const text = data.content.find((c) => c.type === "text")?.text ?? "";
    return res.status(200).json({ message: text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
