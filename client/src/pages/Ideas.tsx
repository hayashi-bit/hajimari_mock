/**
 * Ideas — 内部向けフィードバック管理
 * ステータス管理（対応済/見送り/開発中）+ フィルタ + 全件閲覧
 */

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  Lightbulb,
  MessageSquare,
  Bug,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Shield,
} from "lucide-react";

type FeedbackType = "feedback" | "idea" | "bug" | "request";
type FeedbackStatus = "new" | "noted" | "planned" | "done" | "wontfix";

const TYPE_LABELS: Record<FeedbackType, { label: string; icon: React.ReactNode; color: string }> = {
  feedback: { label: "感想", icon: <MessageSquare className="w-3 h-3" />, color: "bg-blue-50 text-blue-700 border-blue-200" },
  idea: { label: "アイデア", icon: <Lightbulb className="w-3 h-3" />, color: "bg-amber-50 text-amber-700 border-amber-200" },
  bug: { label: "不具合", icon: <Bug className="w-3 h-3" />, color: "bg-red-50 text-red-700 border-red-200" },
  request: { label: "要望", icon: <Sparkles className="w-3 h-3" />, color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const STATUS_OPTIONS: { value: FeedbackStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "new", label: "新着", icon: <Clock className="w-3 h-3" />, color: "bg-slate-50 text-slate-600 border-slate-200" },
  { value: "noted", label: "確認済み", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "planned", label: "開発中", icon: <Sparkles className="w-3 h-3" />, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "done", label: "対応済み", icon: <CheckCircle2 className="w-3 h-3" />, color: "bg-green-50 text-green-700 border-green-200" },
  { value: "wontfix", label: "見送り", icon: <Clock className="w-3 h-3" />, color: "bg-gray-50 text-gray-500 border-gray-200" },
];

function StatusDropdown({ currentStatus, onUpdate, feedbackId, disabled }: { currentStatus: string; onUpdate: (id: number, status: FeedbackStatus) => void; feedbackId: number; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((s) => s.value === currentStatus) || STATUS_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${current.color} ${disabled ? "opacity-50 cursor-wait" : ""}`}
      >
        {current.icon}
        {current.label}
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[130px]">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onUpdate(feedbackId, opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                  opt.value === currentStatus ? "font-medium" : ""
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Ideas() {
  const [filterType, setFilterType] = useState<FeedbackType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | "all">("all");

  const feedbacksQuery = trpc.feedback.list.useQuery({ limit: 100 });
  const updateStatusMutation = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("ステータスを更新しました");
      feedbacksQuery.refetch();
    },
    onError: () => {
      toast.error("更新に失敗しました");
    },
  });

  const handleStatusUpdate = (id: number, status: FeedbackStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const feedbacks = feedbacksQuery.data ?? [];
  const filtered = feedbacks.filter((f) => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    return true;
  });

  const statusCounts = {
    all: feedbacks.length,
    new: feedbacks.filter((f) => f.status === "new").length,
    noted: feedbacks.filter((f) => f.status === "noted").length,
    planned: feedbacks.filter((f) => f.status === "planned").length,
    done: feedbacks.filter((f) => f.status === "done").length,
    wontfix: feedbacks.filter((f) => f.status === "wontfix").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                ダッシュボード
              </button>
            </Link>
            <span className="text-border">/</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">フィードバック管理</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-mono">内部向け</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap mb-3">
          {([{ value: "all", label: "すべて" }, ...STATUS_OPTIONS] as { value: FeedbackStatus | "all"; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                filterStatus === opt.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              {opt.label} ({statusCounts[opt.value] ?? 0})
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
              filterType === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            全種類
          </button>
          {(["feedback", "idea", "bug", "request"] as const).map((t) => {
            const count = feedbacks.filter((f) => f.type === t).length;
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  filterType === t
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {TYPE_LABELS[t].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Feedback List */}
        {feedbacksQuery.isError ? (
          <div className="text-center py-12">
            <p className="text-sm text-destructive">読み込みに失敗しました</p>
            <button
              onClick={() => feedbacksQuery.refetch()}
              className="mt-2 text-xs text-primary underline"
            >
              再読み込み
            </button>
          </div>
        ) : feedbacksQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">該当するフィードバックがありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => {
              const typeConfig = TYPE_LABELS[item.type as FeedbackType] || TYPE_LABELS.feedback;
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-mono text-muted-foreground">#{item.id}</span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                          {typeConfig.icon}
                          {typeConfig.label}
                        </span>
                        <StatusDropdown
                          currentStatus={item.status}
                          feedbackId={item.id}
                          onUpdate={handleStatusUpdate}
                          disabled={updateStatusMutation.isPending}
                        />
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{item.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{item.displayName || "匿名"}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString("ja-JP")}</span>
                        {item.sessionId && (
                          <span className="font-mono">session #{item.sessionId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
