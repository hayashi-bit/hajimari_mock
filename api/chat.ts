// Minimal version to diagnose 500 error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  console.log("[chat] handler called, method:", req.method);

  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[chat] no api key");
    res.status(500).json({ error: "no api key" });
    return;
  }

  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages required" });
    return;
  }

  console.log("[chat] calling anthropic, messages:", messages.length);

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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages,
      }),
    });
  } catch (err) {
    console.error("[chat] fetch error:", err);
    res.status(502).json({ error: String(err) });
    return;
  }

  console.log("[chat] anthropic status:", upstream.status);

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    console.error("[chat] anthropic error:", text);
    res.status(upstream.status).json({ error: text });
    return;
  }

  const data = await upstream.json() as { content?: { text?: string }[] };
  const content = data?.content?.[0]?.text ?? "";
  console.log("[chat] success, length:", content.length);

  res.setHeader("Content-Type", "text/event-stream");
  res.write(`data: ${JSON.stringify({ content })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}
