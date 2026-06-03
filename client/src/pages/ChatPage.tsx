import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { AlertCircle, Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MOCK_RESPONSES: string[] = [
  "ありがとうございます。コミュニティ運営と新規事業の両方を担当されているんですね。それぞれの業務でどちらがより時間を取られていますか？",
  "なるほど。説明コストが高いとのことですが、具体的にどんな場面でそれを感じることが多いですか？例えば新しいメンバーへの引き継ぎ、外部パートナーへの説明、社内の上司への報告など、どのシーンが一番しんどいですか？",
  "それは確かに難しいですね。「上っ面の会話」になってしまうというのは、相手があなたの仕事の価値を理解していないということでしょうか？それとも、あなた自身がうまく言語化できていない感覚もありますか？",
  "具体的なエピソードを聞かせてもらえますか？最近、自分の仕事をうまく伝えられたと感じた場面と、そうでなかった場面、両方あれば教えてください。",
];

let mockIndex = 0;

function getMockResponse(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = MOCK_RESPONSES[mockIndex % MOCK_RESPONSES.length];
      mockIndex++;
      resolve(response);
    }, 1200);
  });
}

export default function ChatPage() {
  const { profile, isProfileComplete, buildSystemPrompt } = useUserProfile();
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial greeting once profile is set
  useEffect(() => {
    if (isProfileComplete && messages.length === 0) {
      const greeting = profile.name
        ? `こんにちは、${profile.name}さん。`
        : "こんにちは。";
      const context = profile.jobTitle
        ? `${profile.jobTitle}として${profile.organization ? profile.organization + "で" : ""}働かれているんですね。`
        : "";
      const opener = profile.currentChallenges
        ? `「${profile.currentChallenges.slice(0, 30)}${profile.currentChallenges.length > 30 ? "…" : ""}」という課題があるとのこと、もう少し詳しく聞かせてもらえますか？`
        : "今日はどんなことについて話しましょうか？";

      setMessages([
        {
          id: "init",
          role: "assistant",
          content: `${greeting}${context}\n\n${opener}`,
        },
      ]);
    }
  }, [isProfileComplete]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // In production, pass buildSystemPrompt() as the system prompt to the API
      const _ = buildSystemPrompt();
      const reply = await getMockResponse();
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isProfileComplete) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto mt-20 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              プロフィールを設定してください
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              あなたの仕事情報を登録することで、AIが最初から文脈を理解した状態で会話できます。
              毎回ゼロから説明する手間がなくなります。
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="px-6 py-2.5 bg-[#F87C62] text-white text-sm font-semibold rounded-xl hover:bg-[#e66a50] transition shadow-md shadow-orange-200"
            >
              プロフィールを設定する
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-800">AIチャット</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              あなたの仕事情報をもとに会話しています
            </p>
          </div>
          {/* Profile context badge */}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            コンテキスト読み込み済み
          </div>
        </div>

        {/* Context summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 shrink-0">
          <p className="text-xs text-slate-500 font-medium mb-1">AIが把握している情報</p>
          <p className="text-xs text-slate-600 line-clamp-2">
            {[profile.jobTitle, profile.organization, profile.mainResponsibilities]
              .filter(Boolean)
              .join(" / ")}
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="text-xs text-[#F87C62] hover:underline mt-1 inline-block"
          >
            編集する →
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  msg.role === "assistant"
                    ? "bg-[#0F3752]"
                    : "bg-gradient-to-br from-[#F87C62] to-[#0F3752]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              {/* Bubble */}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? "bg-white border border-slate-200 text-slate-700 shadow-sm"
                    : "bg-[#F87C62] text-white shadow-md shadow-orange-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0F3752] shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 shrink-0">
          <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#F87C62]/30 focus-within:border-[#F87C62] transition">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力（Shift+Enterで改行）"
              className="flex-1 resize-none text-sm text-slate-700 placeholder-slate-300 focus:outline-none bg-transparent"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F87C62] text-white hover:bg-[#e66a50] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 shadow-md shadow-orange-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
