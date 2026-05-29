/**
 * みんなの声 — モニター・ユーザー向け
 * フィードバック閲覧 + 投稿
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, ArrowLeft, Heart } from "lucide-react";
import { useLocation } from "wouter";
import { getOrCreateDeviceId } from "@/lib/deviceId";

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  feedback: { label: "感想", emoji: "💬" },
  idea: { label: "アイデア", emoji: "💡" },
  request: { label: "要望", emoji: "🙋" },
  bug: { label: "不具合", emoji: "🐛" },
};

export default function Voices() {
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [type, setType] = useState<"feedback" | "idea" | "request" | "bug">("feedback");
  const [submitted, setSubmitted] = useState(false);

  const feedbacksQuery = trpc.feedback.list.useQuery({ limit: 50 });
  const feedbacks = feedbacksQuery.data ?? [];
  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      setContent("");
      setShowForm(false);
      setSubmitted(true);
      feedbacksQuery.refetch();
    },
    onError: () => {
      // simple inline error - no toast dependency needed
      alert("送信に失敗しました。もう一度お試しください");
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate({
      deviceId: getOrCreateDeviceId(),
      displayName: displayName.trim() || undefined,
      type,
      content: content.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            壁打ちに戻る
          </button>
          <h1 className="text-sm font-medium">みんなの声</h1>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(!showForm)}
            className="text-xs"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" />
            投稿する
          </Button>
        </div>
      </header>

      <main className="container py-6 max-w-2xl">
        {/* 投稿フォーム */}
        {showForm && (
          <div className="mb-6 p-4 rounded-xl bg-card border border-border animate-in slide-in-from-top-2">
            <p className="text-sm font-medium mb-3">あなたの声を聞かせてください</p>
            {/* 種類選択 */}
            <div className="flex gap-2 mb-3 flex-wrap">
              {(Object.entries(TYPE_LABELS) as [string, { label: string; emoji: string }][]).map(
                ([key, { label, emoji }]) => (
                  <button
                    key={key}
                    onClick={() => setType(key as typeof type)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      type === key
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {emoji} {label}
                  </button>
                )
              )}
            </div>
            {/* テキスト */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="思ったこと、なんでも書いてみて"
              className="w-full h-24 p-3 rounded-lg bg-muted/30 border border-border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
              maxLength={2000}
            />
            {/* 名前 */}
            <div className="flex items-center gap-3 mt-3">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="名前（任意・匿名OK）"
                className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!content.trim() || createMutation.isPending}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                送信
              </Button>
            </div>
          </div>
        )}

        {/* 送信完了メッセージ */}
        {submitted && !showForm && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 animate-in fade-in">
            ✨ ありがとう！あなたの声が届きました
          </div>
        )}

        {/* 一覧 */}
        {feedbacksQuery.isError ? (
          <div className="text-center py-16">
            <p className="text-sm text-destructive">読み込みに失敗しました</p>
            <button
              onClick={() => feedbacksQuery.refetch()}
              className="mt-2 text-xs text-primary underline"
            >
              再読み込み
            </button>
          </div>
        ) : feedbacksQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">まだ声がありません</p>
            <p className="text-xs text-muted-foreground mt-1">最初の一言を投稿してみませんか？</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((item) => {
              const typeInfo = TYPE_LABELS[item.type] || { label: item.type, emoji: "📝" };
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs">{typeInfo.emoji}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {typeInfo.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.displayName || "匿名"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(item.createdAt).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{item.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
