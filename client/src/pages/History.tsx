import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Calendar,
  Sparkles,
  Play,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

type SessionSummary = {
  theme?: string;
  insights?: string[];
  nextTheme?: string;
  actionItems?: string[];
};

type HistoryItem = {
  id: number;
  theme: string | null;
  mode: string | null;
  messageCount: number;
  summary: SessionSummary | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(date: Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;
  return d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function modeLabel(mode: string | null): string {
  const labels: Record<string, string> = {
    strength: "強み発見",
    worry: "悩み整理",
    service: "サービス設計",
    target: "ターゲット",
    decision: "意思決定",
    action: "行動計画",
  };
  return mode ? labels[mode] || mode : "";
}

function SessionCard({
  item,
  onResume,
  onToggleFavorite,
}: {
  item: HistoryItem;
  onResume: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}) {
  const summary = item.summary;
  const hasContent = summary && (summary.theme || (summary.insights && summary.insights.length > 0));

  return (
    <Card className="p-5 hover:shadow-md transition-shadow border-[#E9DCE0]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" style={{ color: "#A19097" }} />
          <span className="text-xs font-mono" style={{ color: "#A19097" }}>
            {formatDate(item.createdAt)}
          </span>
          {item.mode && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#FAF2F4", color: "#C66A5A" }}
            >
              {modeLabel(item.mode)}
            </span>
          )}
        </div>
        <button
          onClick={() => onToggleFavorite(item.id)}
          className="p-1.5 rounded-full hover:bg-gray-50 transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              item.isFavorite
                ? "fill-rose-400 text-rose-400"
                : ""
            }`}
            style={!item.isFavorite ? { color: "#D2C3C8" } : undefined}
          />
        </button>
      </div>

      {/* Summary Content */}
      {hasContent ? (
        <div className="space-y-2 mb-4">
          {summary.theme && (
            <h3 className="font-medium text-sm" style={{ color: "#2D2520" }}>
              {summary.theme}
            </h3>
          )}
          {summary.insights && summary.insights.length > 0 && (
            <div className="space-y-1">
              {summary.insights.slice(0, 3).map((insight, i) => (
                <p key={i} className="text-xs flex items-start gap-1.5" style={{ color: "#69565C" }}>
                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#C66A5A" }} />
                  {insight}
                </p>
              ))}
            </div>
          )}
          {summary.nextTheme && (
            <p className="text-xs mt-2" style={{ color: "#C66A5A" }}>
              次のテーマ: {summary.nextTheme}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-sm" style={{ color: "#A19097" }}>
            {item.messageCount > 0
              ? `${item.messageCount}回のやりとり`
              : "まだ会話していません"}
          </p>
          {!summary && item.messageCount >= 5 && (
            <p className="text-xs mt-1" style={{ color: "#D2C3C8" }}>
              まとめ未生成
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #E9DCE0" }}>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#A19097" }}>
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{item.messageCount}回</span>
        </div>
        <button
          onClick={() => onResume(item.id)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
          style={{ color: "#C66A5A" }}
        >
          <Play className="w-3 h-3" />
          続きから話す
        </button>
      </div>
    </Card>
  );
}

export default function History() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "favorites">("all");

  const { data: history, isLoading, refetch } = trpc.chat.getHistory.useQuery();

  const toggleFavMutation = trpc.chat.toggleFavorite.useMutation({
    onSuccess: () => refetch(),
    onError: () => toast.error("お気に入りの更新に失敗しました"),
  });

  const handleResume = (sessionId: number) => {
    navigate(`/chat?session=${sessionId}`);
  };

  const handleToggleFavorite = (sessionId: number) => {
    toggleFavMutation.mutate({ sessionId });
  };

  const filteredHistory = history?.filter((item) => {
    if (filter === "favorites") return item.isFavorite;
    return true;
  }) || [];

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur"
        style={{ background: "rgba(255,255,255,0.95)", borderBottom: "1px solid #E9DCE0" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/chat")}
              className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              style={{ color: "#69565C" }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-medium" style={{ color: "#1A2E4A" }}>
              壁打ちノート
            </h1>
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
            style={{ color: "#C66A5A" }}
          >
            新しい壁打ち
          </button>
        </div>
      </header>

      {/* Filter */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={
              filter === "all"
                ? { background: "#C66A5A", color: "#FFFFFF" }
                : { background: "#FAF2F4", color: "#69565C" }
            }
          >
            すべて
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1"
            style={
              filter === "favorites"
                ? { background: "#C66A5A", color: "#FFFFFF" }
                : { background: "#FAF2F4", color: "#69565C" }
            }
          >
            <Heart className="w-3 h-3" />
            お気に入り
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C66A5A" }} />
          </div>
        ) : !history ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "#A19097" }}>
              履歴の取得に失敗しました
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-xs font-medium px-4 py-2 rounded-lg"
              style={{ background: "#FAF2F4", color: "#C66A5A" }}
            >
              再試行
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "#A19097" }}>
              {filter === "favorites"
                ? "お気に入りの壁打ちはまだありません"
                : "まだ壁打ちの記録がありません"}
            </p>
            <button
              onClick={() => navigate("/chat")}
              className="mt-4 text-xs font-medium px-4 py-2 rounded-full text-white"
              style={{ background: "#C66A5A" }}
            >
              最初の壁打ちを始める
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <SessionCard
                key={item.id}
                item={item as HistoryItem}
                onResume={handleResume}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
