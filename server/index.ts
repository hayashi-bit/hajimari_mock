import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const SYSTEM_PROMPT = `あなたは「hajimari」というAIメンターです。
女性フリーランスの壁打ち相手として会話します。

ルール：
- 返答は2〜3文以内
- 最後に質問を1つだけする
- 相手の言葉を否定せず、まず受け止める
- 選択肢は出さない
- 相手のテンション・文量に合わせてトーンを調整する
- 定型挨拶は使わない
- 3回に1回は予想外の角度から質問する`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY が設定されていません" });
  }

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
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
      }),
    });
  } catch {
    return res.status(502).json({ error: "Anthropic への接続に失敗しました" });
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return res.status(upstream.status).json({ error: text });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = upstream.body!.getReader();
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
      } catch {}
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
