import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY が設定されていません" });
    return;
  }

  const { profile, strengths, style } = req.body ?? {};

  const styleGuide: Record<string, string> = {
    sns: "SNSプロフィール向け（100〜150文字、テンポよく、emoji可）",
    pitch: "営業・提案時の自己紹介（200〜250文字、信頼感・実績重視）",
    casual: "交流会・カジュアルな場向け（100〜130文字、親しみやすく）",
  };

  const systemPrompt = `あなたはフリーランス女性の強みを言語化するプロのライターです。
提供されたプロフィールと強みのヒントをもとに、自然でリアルな自己紹介文を生成してください。

ルール：
- 「私は〜です」から始めない。名前や仕事から自然に入る
- 強みは本人の言葉のニュアンスを活かす（抽象的な美辞麗句は使わない）
- 「〜できます」「〜が得意です」より「〜を大切にしています」「〜が好きです」の方が人間らしい
- 最後に一言、読んだ人が話しかけたくなるような締めを入れる
- 指定されたスタイルに合わせる`;

  const strengthText = Array.isArray(strengths) && strengths.length > 0
    ? strengths.map((s: { text: string; count: number }) => `・${s.text}（${s.count}回の会話で言及）`).join('\n')
    : '（まだ強みデータがありません）';

  const userMessage = `【スタイル】${styleGuide[style] || styleGuide.sns}

【プロフィール】
${profile || '（プロフィール未設定）'}

【会話から見えてきた強みのヒント】
${strengthText}

上記をもとに自己紹介文を生成してください。`;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        stream: true,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      res.status(upstream.status).json({ error: err });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
