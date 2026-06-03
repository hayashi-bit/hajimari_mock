import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

function supabaseHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    res.status(500).json({ error: "Supabase env vars not configured" });
    return;
  }

  if (req.method === "POST") {
    const { type, content } = req.body ?? {};
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ error: "content is required" });
      return;
    }
    const validTypes = ["アイデア", "感想", "不具合", "要望"];
    const feedbackType = validTypes.includes(type) ? type : "アイデア";

    const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
      method: "POST",
      headers: { ...supabaseHeaders(), "Prefer": "return=representation" },
      body: JSON.stringify({ type: feedbackType, content: content.trim() }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: err });
      return;
    }

    const data = await response.json();
    res.status(201).json(data[0]);
    return;
  }

  if (req.method === "GET") {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/feedback?select=*&order=created_at.desc&limit=50`,
      { headers: supabaseHeaders() }
    );

    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: err });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
