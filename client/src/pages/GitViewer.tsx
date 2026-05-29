import { useState } from "react";

interface Commit {
  hash: string;
  short: string;
  author: string;
  date: string;
  message: string;
}

// Injected at build time via vite define
declare const __GIT_LOG__: Commit[];
declare const __GIT_FILES__: string[];
declare const __GIT_BRANCH__: string;

const commits: Commit[] = typeof __GIT_LOG__ !== "undefined" ? __GIT_LOG__ : [];
const files: string[] = typeof __GIT_FILES__ !== "undefined" ? __GIT_FILES__ : [];
const branch: string = typeof __GIT_BRANCH__ !== "undefined" ? __GIT_BRANCH__ : "unknown";

type View = "log" | "tree" | "file" | "diff";

export default function GitViewer() {
  const [view, setView] = useState<View>("log");
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [diffContent, setDiffContent] = useState("");
  const [loadingFile, setLoadingFile] = useState(false);

  const fetchFile = async (file: string) => {
    setLoadingFile(true);
    try {
      const res = await fetch(`/__git__?action=show&file=${encodeURIComponent(file)}`);
      const data = await res.json();
      setFileContent(data.content ?? "");
    } catch {
      setFileContent("(読み込みエラー)");
    }
    setLoadingFile(false);
  };

  const fetchDiff = async (hash: string) => {
    setLoadingFile(true);
    try {
      const res = await fetch(`/__git__?action=diff&ref=${hash}`);
      const data = await res.json();
      setDiffContent(data.content ?? "");
    } catch {
      setDiffContent("(読み込みエラー)");
    }
    setLoadingFile(false);
  };

  const openFile = (file: string) => {
    setSelectedFile(file);
    setView("file");
    fetchFile(file);
  };

  const openDiff = (commit: Commit) => {
    setSelectedCommit(commit);
    setView("diff");
    fetchDiff(commit.hash);
  };

  const navItems = [
    { key: "log" as View, label: "コミット履歴", icon: "🕐" },
    { key: "tree" as View, label: "ファイル一覧", icon: "📁" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#0d1117", color: "#c9d1d9" }}>
      {/* Header */}
      <div style={{ background: "#161b22", borderBottom: "1px solid #30363d", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>📦</span>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#f0f6fc" }}>Git Viewer</span>
        <span style={{ background: "#21262d", border: "1px solid #30363d", borderRadius: 6, padding: "2px 10px", fontSize: 12, color: "#79c0ff" }}>
          {branch}
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#161b22", borderRight: "1px solid #30363d", display: "flex", flexDirection: "column" }}>
          {navItems.map(item => (
            <div
              key={item.key}
              onClick={() => setView(item.key)}
              style={{
                padding: "12px 16px", cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", gap: 8,
                background: view === item.key ? "#1f6feb22" : "transparent",
                color: view === item.key ? "#58a6ff" : "#c9d1d9",
                borderLeft: view === item.key ? "2px solid #58a6ff" : "2px solid transparent",
              }}
            >
              {item.icon} {item.label}
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "12px 16px", fontSize: 11, color: "#484f58", borderTop: "1px solid #21262d" }}>
            {commits.length}コミット · {files.length}ファイル
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* Commit log */}
          {view === "log" && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f6fc", marginBottom: 16 }}>
                コミット履歴 ({commits.length}件)
              </div>
              {commits.map(c => (
                <div key={c.hash} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #21262d", alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#21262d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                    {c.author[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "#f0f6fc" }}>{c.message}</div>
                    <div style={{ fontSize: 12, color: "#8b949e", marginTop: 3 }}>{c.author} · {c.date}</div>
                  </div>
                  <div
                    onClick={() => openDiff(c)}
                    style={{ fontFamily: "monospace", fontSize: 12, color: "#58a6ff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    {c.short}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* File tree */}
          {view === "tree" && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f6fc", marginBottom: 16 }}>
                ファイル一覧 ({files.length}件)
              </div>
              {files.map(f => (
                <div
                  key={f}
                  onClick={() => openFile(f)}
                  style={{ padding: "6px 0", fontFamily: "monospace", fontSize: 13, color: "#58a6ff", cursor: "pointer", borderBottom: "1px solid #21262d" }}
                >
                  {f}
                </div>
              ))}
            </div>
          )}

          {/* File content */}
          {view === "file" && (
            <div>
              <div onClick={() => setView("tree")} style={{ color: "#58a6ff", cursor: "pointer", fontSize: 13, marginBottom: 12 }}>
                ← ファイル一覧に戻る
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f6fc", marginBottom: 16 }}>{selectedFile}</div>
              {loadingFile ? (
                <div style={{ color: "#8b949e" }}>読み込み中...</div>
              ) : (
                <pre style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12, overflow: "auto", whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#c9d1d9" }}>
                  {fileContent}
                </pre>
              )}
            </div>
          )}

          {/* Diff */}
          {view === "diff" && selectedCommit && (
            <div>
              <div onClick={() => setView("log")} style={{ color: "#58a6ff", cursor: "pointer", fontSize: 13, marginBottom: 12 }}>
                ← コミット一覧に戻る
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f6fc", marginBottom: 4 }}>{selectedCommit.message}</div>
              <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 16 }}>{selectedCommit.author} · {selectedCommit.date} · {selectedCommit.short}</div>
              {loadingFile ? (
                <div style={{ color: "#8b949e" }}>読み込み中...</div>
              ) : (
                <pre style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: 16, fontFamily: "monospace", fontSize: 12, overflow: "auto", lineHeight: 1.6 }}>
                  {diffContent.split("\n").map((line, i) => {
                    let color = "#c9d1d9";
                    let bg = "transparent";
                    if (line.startsWith("+") && !line.startsWith("+++")) { color = "#3fb950"; bg = "#1a3a1f22"; }
                    else if (line.startsWith("-") && !line.startsWith("---")) { color = "#f85149"; bg = "#3a1a1a22"; }
                    else if (line.startsWith("@@") || line.startsWith("diff ") || line.startsWith("commit ")) { color = "#8b949e"; }
                    return <span key={i} style={{ display: "block", color, background: bg }}>{line}</span>;
                  })}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
