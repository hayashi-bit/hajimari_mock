import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPA_URL = process.env.SUPABASE_URL!;
const SUPA_KEY = process.env.SUPABASE_ANON_KEY!;

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI embedding error: ${res.status}`);
  const data = await res.json();
  return data.data[0].embedding;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY が設定されていません" });
    return;
  }

  const { userId, sessionId, summary } = req.body ?? {};
  if (!userId || !sessionId || !summary) {
    res.status(400).json({ error: "userId, sessionId, summary が必要です" });
    return;
  }

  try {
    // すでに同セッションのembeddingがあれば更新、なければ挿入
    const checkRes = await fetch(
      `${SUPA_URL}/rest/v1/session_memories?session_id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(userId)}&select=id`,
      {
        headers: {
          "apikey": SUPA_KEY,
          "Authorization": `Bearer ${SUPA_KEY}`,
        },
      }
    );
    const existing = await checkRes.json();

    const embedding = await getEmbedding(summary);

    if (existing.length > 0) {
      // 更新
      await fetch(
        `${SUPA_URL}/rest/v1/session_memories?id=eq.${existing[0].id}`,
        {
          method: "PATCH",
          headers: {
            "apikey": SUPA_KEY,
            "Authorization": `Bearer ${SUPA_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ summary, embedding }),
        }
      );
    } else {
      // 挿入
      await fetch(`${SUPA_URL}/rest/v1/session_memories`, {
        method: "POST",
        headers: {
          "apikey": SUPA_KEY,
          "Authorization": `Bearer ${SUPA_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ user_id: userId, session_id: sessionId, summary, embedding }),
      });
    }

    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
