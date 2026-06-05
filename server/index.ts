import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  const SUPABASE_URL = "https://kwmulkworqsswmiqbabd.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bXVsa3dvcnFzc3dtaXFiYWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDQwMzcsImV4cCI6MjA5MjcyMDAzN30.yT9dssLbf6gjIzisahhRy8CJpzjxyQxpXdg_tI63imE";

  const supabaseHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };

  app.post("/api/notify", async (_req, res) => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/mascot_notify?id=eq.1`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({ done: true }),
      });
    } catch {}
    res.json({ ok: true });
  });

  app.get("/api/notify", async (_req, res) => {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/mascot_notify?id=eq.1&select=done`, {
        headers: supabaseHeaders,
      });
      const rows = await r.json() as { done: boolean }[];
      const done = rows[0]?.done ?? false;
      if (done) {
        await fetch(`${SUPABASE_URL}/rest/v1/mascot_notify?id=eq.1`, {
          method: "PATCH",
          headers: supabaseHeaders,
          body: JSON.stringify({ done: false }),
        });
      }
      res.json({ done });
    } catch {
      res.json({ done: false });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
