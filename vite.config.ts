import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

function vitePluginStorageProxy(): Plugin {
  return {
    name: "manus-storage-proxy",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/manus-storage", async (req, res) => {
        const key = req.url?.replace(/^\//, "");
        if (!key) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing storage key");
          return;
        }

        const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

        if (!forgeBaseUrl || !forgeKey) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Storage proxy not configured");
          return;
        }

        try {
          const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
          forgeUrl.searchParams.set("path", key);

          const forgeResp = await fetch(forgeUrl, {
            headers: { Authorization: `Bearer ${forgeKey}` },
          });

          if (!forgeResp.ok) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Storage backend error");
            return;
          }

          const { url } = (await forgeResp.json()) as { url: string };
          if (!url) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Empty signed URL");
            return;
          }

          res.writeHead(307, { Location: url, "Cache-Control": "no-store" });
          res.end();
        } catch {
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("Storage proxy error");
        }
      });
    },
  };
}

function vitePluginGitViewer(): Plugin {
  const git = (cmd: string) => {
    try { return execSync(`git ${cmd}`, { cwd: PROJECT_ROOT, encoding: "utf-8" }); } catch { return ""; }
  };
  return {
    name: "git-viewer",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/__git__", (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const action = url.searchParams.get("action") ?? "log";
        const ref = url.searchParams.get("ref") ?? "HEAD";
        const file = url.searchParams.get("file") ?? "";

        let data: object;
        if (action === "log") {
          const raw = git(`log --pretty=format:"%H|%an|%ae|%ad|%s" --date=short -50`);
          data = { commits: raw.trim().split("\n").filter(Boolean).map(l => { const [hash, author, email, date, ...msg] = l.split("|"); return { hash, author, email, date, message: msg.join("|") }; }) };
        } else if (action === "tree") {
          const raw = git(`ls-tree -r --name-only ${ref}`);
          data = { files: raw.trim().split("\n").filter(Boolean) };
        } else if (action === "show" && file) {
          const content = git(`show ${ref}:${file}`);
          data = { content };
        } else if (action === "diff") {
          const content = git(`show ${ref}`);
          data = { content };
        } else if (action === "branches") {
          const raw = git(`branch -a`);
          data = { branches: raw.trim().split("\n").filter(Boolean).map(b => b.trim()) };
        } else {
          data = { error: "unknown action" };
        }

        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(data));
      });

      // Git viewer HTML page
      server.middlewares.use("/__gitview__", (_req, res) => {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Git Viewer</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #c9d1d9; min-height: 100vh; }
  .header { background: #161b22; border-bottom: 1px solid #30363d; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
  .header h1 { font-size: 18px; font-weight: 600; color: #f0f6fc; }
  .badge { background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 2px 8px; font-size: 12px; }
  .layout { display: flex; height: calc(100vh - 57px); }
  .sidebar { width: 280px; background: #161b22; border-right: 1px solid #30363d; overflow-y: auto; flex-shrink: 0; }
  .sidebar-section { border-bottom: 1px solid #30363d; }
  .sidebar-title { padding: 10px 16px; font-size: 11px; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
  .sidebar-item { padding: 8px 16px; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: background 0.1s; }
  .sidebar-item:hover { background: #21262d; }
  .sidebar-item.active { background: #1f6feb22; color: #58a6ff; }
  .main { flex: 1; overflow: auto; }
  .tabs { display: flex; background: #161b22; border-bottom: 1px solid #30363d; padding: 0 24px; }
  .tab { padding: 12px 16px; cursor: pointer; font-size: 14px; border-bottom: 2px solid transparent; color: #8b949e; }
  .tab.active { color: #f0f6fc; border-bottom-color: #f78166; }
  .tab:hover:not(.active) { color: #c9d1d9; }
  .content { padding: 24px; }
  .commit-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #21262d; }
  .commit-hash { font-family: monospace; font-size: 12px; color: #58a6ff; cursor: pointer; white-space: nowrap; }
  .commit-hash:hover { text-decoration: underline; }
  .commit-msg { font-size: 14px; color: #f0f6fc; }
  .commit-meta { font-size: 12px; color: #8b949e; margin-top: 2px; }
  .avatar { width: 28px; height: 28px; border-radius: 50%; background: #21262d; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #8b949e; flex-shrink: 0; }
  .file-row { padding: 6px 0; font-size: 13px; font-family: monospace; cursor: pointer; color: #58a6ff; border-bottom: 1px solid #21262d; }
  .file-row:hover { color: #79c0ff; }
  .code-block { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 12px; overflow: auto; white-space: pre; line-height: 1.6; max-height: calc(100vh - 200px); }
  .diff-add { color: #3fb950; background: #1a3a1f; display: block; }
  .diff-del { color: #f85149; background: #3a1a1a; display: block; }
  .diff-meta { color: #8b949e; display: block; }
  .branch-row { padding: 8px 12px; font-family: monospace; font-size: 13px; border-bottom: 1px solid #21262d; display: flex; align-items: center; gap: 8px; }
  .branch-current { color: #3fb950; }
  .branch-remote { color: #58a6ff; }
  .loading { color: #8b949e; padding: 24px; text-align: center; }
  .empty { color: #8b949e; padding: 48px; text-align: center; font-size: 14px; }
  .back-btn { display: inline-flex; align-items: center; gap: 6px; color: #58a6ff; cursor: pointer; font-size: 13px; margin-bottom: 16px; }
  .back-btn:hover { text-decoration: underline; }
  .section-title { font-size: 16px; font-weight: 600; color: #f0f6fc; margin-bottom: 16px; }
</style>
</head>
<body>
<div class="header">
  <svg width="20" height="20" viewBox="0 0 16 16" fill="#f0f6fc"><path d="M2 2.5A2.5 2.5 0 014.5 0h7A2.5 2.5 0 0114 2.5v10.042a.75.75 0 01-1.218.585L8 9.075l-4.782 4.052A.75.75 0 012 12.542V2.5z"/></svg>
  <h1>Git Viewer</h1>
  <span class="badge" id="branch-badge">loading...</span>
</div>
<div class="layout">
  <div class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-title">表示</div>
      <div class="sidebar-item active" id="nav-log" onclick="showLog()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zm7-3.25v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5a.75.75 0 011.5 0z"/></svg>
        コミット履歴
      </div>
      <div class="sidebar-item" id="nav-tree" onclick="showTree()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A2.5 2.5 0 013.5 0h8.75a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V1.5h-8a1 1 0 00-1 1v6.708A2.492 2.492 0 013.5 9h3.25a.75.75 0 010 1.5H3.5a1 1 0 100 2h5.75a.75.75 0 010 1.5H3.5A2.5 2.5 0 011 11.5v-9zm13.23 7.79a.75.75 0 00-1.06-1.06l-1.97 1.97V7.75a.75.75 0 00-1.5 0v3.45l-1.97-1.97a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25z"/></svg>
        ファイルツリー
      </div>
      <div class="sidebar-item" id="nav-branches" onclick="showBranches()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M9.5 3.25a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25z"/></svg>
        ブランチ
      </div>
    </div>
  </div>
  <div class="main">
    <div class="content" id="content">
      <div class="loading">読み込み中...</div>
    </div>
  </div>
</div>
<script>
let currentView = 'log';
const api = (params) => fetch('/__git__?' + new URLSearchParams(params)).then(r => r.json());

function setActive(id) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

async function showLog() {
  setActive('nav-log'); currentView = 'log';
  document.getElementById('content').innerHTML = '<div class="loading">コミット履歴を読み込み中...</div>';
  const { commits = [] } = await api({ action: 'log' });
  document.getElementById('content').innerHTML = \`
    <div class="section-title">コミット履歴 (\${commits.length}件)</div>
    \${commits.map(c => \`
      <div class="commit-row">
        <div class="avatar">\${(c.author||'?')[0].toUpperCase()}</div>
        <div style="flex:1">
          <div class="commit-msg">\${escHtml(c.message)}</div>
          <div class="commit-meta">\${escHtml(c.author)} · \${c.date}</div>
        </div>
        <div class="commit-hash" onclick="showDiff('\${c.hash}')">\${c.hash.slice(0,7)}</div>
      </div>
    \`).join('')}
  \`;
}

async function showTree(ref = 'HEAD') {
  setActive('nav-tree'); currentView = 'tree';
  document.getElementById('content').innerHTML = '<div class="loading">ファイルツリーを読み込み中...</div>';
  const { files = [] } = await api({ action: 'tree', ref });
  document.getElementById('content').innerHTML = \`
    <div class="section-title">ファイルツリー (\${files.length}件)</div>
    \${files.map(f => \`<div class="file-row" onclick="showFile('\${f}', '\${ref}')">\${escHtml(f)}</div>\`).join('')}
  \`;
}

async function showBranches() {
  setActive('nav-branches'); currentView = 'branches';
  document.getElementById('content').innerHTML = '<div class="loading">読み込み中...</div>';
  const { branches = [] } = await api({ action: 'branches' });
  document.getElementById('content').innerHTML = \`
    <div class="section-title">ブランチ一覧</div>
    \${branches.map(b => {
      const isCurrent = b.startsWith('*');
      const isRemote = b.includes('remotes/');
      return \`<div class="branch-row \${isCurrent ? 'branch-current' : isRemote ? 'branch-remote' : ''}">\${isCurrent ? '▶ ' : ''}\${escHtml(b)}</div>\`;
    }).join('')}
  \`;
}

async function showFile(file, ref = 'HEAD') {
  const prev = document.getElementById('content').innerHTML;
  document.getElementById('content').innerHTML = '<div class="loading">読み込み中...</div>';
  const { content = '' } = await api({ action: 'show', file, ref });
  document.getElementById('content').innerHTML = \`
    <div class="back-btn" onclick="showTree('\${ref}')">← ファイル一覧に戻る</div>
    <div class="section-title">\${escHtml(file)}</div>
    <div class="code-block">\${escHtml(content)}</div>
  \`;
}

async function showDiff(hash) {
  document.getElementById('content').innerHTML = '<div class="loading">読み込み中...</div>';
  const { content = '' } = await api({ action: 'diff', ref: hash });
  const lines = content.split('\\n').map(l => {
    if (l.startsWith('+') && !l.startsWith('+++')) return \`<span class="diff-add">\${escHtml(l)}</span>\`;
    if (l.startsWith('-') && !l.startsWith('---')) return \`<span class="diff-del">\${escHtml(l)}</span>\`;
    if (l.startsWith('@@') || l.startsWith('commit') || l.startsWith('diff')) return \`<span class="diff-meta">\${escHtml(l)}</span>\`;
    return escHtml(l);
  }).join('\\n');
  document.getElementById('content').innerHTML = \`
    <div class="back-btn" onclick="showLog()">← コミット一覧に戻る</div>
    <div class="section-title">コミット差分: \${hash.slice(0,7)}</div>
    <div class="code-block">\${lines}</div>
  \`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Load current branch for badge
api({ action: 'branches' }).then(({ branches = [] }) => {
  const cur = branches.find(b => b.startsWith('*'));
  document.getElementById('branch-badge').textContent = cur ? cur.replace(/^\*\s*/, '') : '不明';
});

showLog();
</script>
</body>
</html>`);
      });
    },
  };
}

const isManus = !!process.env.MANUS_RUNTIME;
const plugins = [react(), tailwindcss(), vitePluginGitViewer(), ...(isManus ? [jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector(), vitePluginStorageProxy()] : [])];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
