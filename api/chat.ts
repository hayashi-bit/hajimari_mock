// Absolute minimum - no external calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  // Just return a hardcoded response to test if the function works at all
  res.setHeader("Content-Type", "text/event-stream");
  res.write(`data: ${JSON.stringify({ content: "テスト応答：APIは動作しています。" })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}
