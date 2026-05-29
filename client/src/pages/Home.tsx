/**
 * miiiro 開発ダッシュボード
 * 技術顧問（門倉さん）向け: 開発進捗・アップデート履歴・技術仕様・プロンプト設計
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import {
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  MessageSquare,
  Mic,
  Rocket,
  Target,
  ArrowRight,
  Layers,
  Brain,
  Database,
  Shield,
  History,
  Sparkles,
  FileText,
  ExternalLink,
  Calendar,
  Users,
  Heart,
  Lightbulb,
} from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663574493378/YftbLHZFd22nj5w5n2Njvk/hero-bg-fk3XsRQtVAHTSfDviYCTsx.webp";

// ─── Data ───

interface UpdateEntry {
  date: string;
  version: string;
  title: string;
  changes: string[];
  type: "feature" | "fix" | "design";
}

const updates: UpdateEntry[] = [
  {
    date: "2026-05-18",
    version: "v0.5.1",
    title: "フィードバックUI強化・スマホ不具合修正",
    type: "fix",
    changes: [
      "フィードバックFABボタン: PC/スマホともに常時表示に修正",
      "みんなの声ページ（/voices）新規追加 + フォーム内導線",
      "フィードバック管理（/ideas）ステータス管理UI追加",
      "Homeにアイディア入力フォーム埋め込み",
      "PCサイドバー常時表示（閉じられないバグ修正）",
      "スマホ: 入力時の画面ブレ修正（visualViewportハンドラー削除）",
    ],
  },
  {
    date: "2026-05-18",
    version: "v0.5.0",
    title: "匿名セッション・ヘッダーUI改善",
    type: "feature",
    changes: [
      "ログイン不要化: デバイスIDベースの匿名セッション実装",
      "ヘッダーUI: アイコン+テキストラベル（「履歴」「+ 新規」）",
      "ダッシュボードへの隠しボタン（miiiroロゴ5回タップ）",
      "/chat, /history から認証ゲートを完全削除",
      "モニターはURLを開くだけで壁打ち開始可能",
    ],
  },
  {
    date: "2026-05-18",
    version: "v0.4.0",
    title: "履歴・続きチャット・お気に入り機能",
    type: "feature",
    changes: [
      "セッション履歴一覧ページ（/history）",
      "まとめ付きセッションカードUI",
      "続きチャット（?session=パラメータで既存セッション再開）",
      "お気に入りトグル（ハートアイコン）",
      "履歴フィルタリング（すべて / お気に入り）",
    ],
  },
  {
    date: "2026-05-17",
    version: "v0.3.0",
    title: "壁打ちプロンプト・トーン修正",
    type: "design",
    changes: [
      "問い詰め感の排除 → 共感ファーストに全面修正",
      "語尾を「〜ですか？」→「〜かな？」「〜だったりする？」に統一",
      "共感だけで返す回を許容（毎回質問で終わらなくてよい）",
      "getGreetingのトーンもカジュアル化",
    ],
  },
  {
    date: "2026-05-17",
    version: "v0.2.0",
    title: "壁打ち機能の全面実装",
    type: "feature",
    changes: [
      "インタビュアー型システムプロンプト（アドバイス禁止・質問で引き出す）",
      "6モード自動判定（LLMベース）",
      "4往復ごとの途中整理ロジック",
      "まとめ生成（構造化JSON出力 → DB保存）",
      "記憶保存（keywords/strengths/uncertainties/nextTheme）",
      "次回起動時の記憶引き継ぎ（前回バナー + greeting生成時参照）",
      "初回ウェルカム画面（コンセプト・GPTとの違い・使い方）",
    ],
  },
  {
    date: "2026-05-16",
    version: "v0.1.0",
    title: "初期プロトタイプ",
    type: "feature",
    changes: [
      "チャットUI（スマホ最適化）",
      "OpenAI API連携（GPT-4o-mini）",
      "オンボーディング（事業カルテ対話形式取得）",
      "音声入力（Web Speech API）",
      "会話履歴の永続化（MySQL/TiDB）",
    ],
  },
];

// ─── Sprint Plan ───

type SprintStatus = "completed" | "in-progress" | "upcoming";

interface Sprint {
  id: number;
  title: string;
  subtitle: string;
  status: SprintStatus;
  duration: string;
  goal: string;
  deliverables: string[];
}

const sprints: Sprint[] = [
  {
    id: 1,
    title: "Sprint 1",
    subtitle: "AIと対話できるプロトタイプの構築",
    status: "completed",
    duration: "Week 1-2",
    goal: "ターゲット層がスマホで実際にAIメンターと会話できる状態にする",
    deliverables: [
      "スマホブラウザで開くだけでAIメンターと対話できるURL",
      "共感的で温かいメンタートーンのシステムプロンプト",
      "事業カルテ＋会話履歴の永続化",
      "壁打ちインタビュアー型プロンプト",
      "音声入力（Web Speech API）",
    ],
  },
  {
    id: 2,
    title: "Sprint 2",
    subtitle: "壁打ち・ SNS投稿生成機能の実装",
    status: "in-progress",
    duration: "Week 3-4",
    goal: "「インタビュー形式の壁打ち」と「SNS投稿生成」をチャットの中の機能として実装する",
    deliverables: [
      "壁打ちモード（AIが深掘り質問を繰り返す）",
      "SNS投稿生成機能（会話から投稿文を自動生成）",
      "モード切り替えUIの実装",
    ],
  },
  {
    id: 3,
    title: "Sprint 3",
    subtitle: "第1回モニターテスト → UI/UX改善",
    status: "upcoming",
    duration: "Week 5-6",
    goal: "操作の「摩擦」を極限まで減らし、「話すだけで完結する」体験に近づける",
    deliverables: [
      "摩擦が最小化された直感的UI",
      "壁打ち後の自動構造化機能",
      "音声入力の強化",
    ],
  },
  {
    id: 4,
    title: "Sprint 4",
    subtitle: "第2回モニターテスト → 事業性ジャッジ",
    status: "upcoming",
    duration: "Week 7-8",
    goal: "「お金を払ってでも使い続けたいか」の最終判断を下す",
    deliverables: [
      "PMF（Product-Market Fit）の判断材料",
      "本格開発 or ピボットの明確な意思決定",
      "モニター定量・定性フィードバックレポート",
    ],
  },
];

const releaseConditions = [
  {
    gate: "モニターテスト開始条件",
    conditions: [
      "壁打ちプロンプトが安定動作（5往復以上破綻なく会話継続）",
      "まとめ生成が正常に機能する",
      "スマホブラウザでログイン不要で利用可能",
      "音声入力が動作する",
    ],
  },
  {
    gate: "正式オープン条件（Sprint 4完了後）",
    conditions: [
      "「月額1,100円で使い続けるか？」にYESが過半数",
      "継続利用率（翌日以降も開く）が50%以上",
      "「自分で考えた感覚が残る」と回答したモニターが過半数",
      "致命的なUIフリクションが解消されている",
    ],
  },
  {
    gate: "ピボット判断基準",
    conditions: [
      "YESが30%未満 → コンセプト変更を検討",
      "「話しにくい」が過半数 → プロンプト設計を根本的に見直し",
      "「使いたいが月額は払いたくない」 → 収益モデル変更を検討",
    ],
  },
];

const techStack = [
  { layer: "フロントエンド", tech: "React 19 + TypeScript + Tailwind CSS 4", detail: "Vite, Wouter, Framer Motion, shadcn/ui" },
  { layer: "バックエンド", tech: "Express 4 + tRPC 11", detail: "型安全なRPC、Superjson、publicProcedure/protectedProcedure" },
  { layer: "DB", tech: "MySQL (TiDB) + Drizzle ORM", detail: "スキーマファースト、drizzle-kit migrate" },
  { layer: "AI", tech: "OpenAI API (GPT-4o-mini)", detail: "invokeLLM helper、構造化JSON出力、モード判定" },
  { layer: "認証", tech: "Manus OAuth + 匿名デバイスID", detail: "管理者はOAuth、モニターはdeviceIdベース" },
  { layer: "ホスティング", tech: "Manus Platform", detail: "自動デプロイ、カスタムドメイン対応" },
  { layer: "テスト", tech: "Vitest", detail: "サーバーサイドユニットテスト、モック活用" },
];

const promptDesign = {
  layers: [
    {
      name: "Layer 1: 基本ルール（固定）",
      rules: [
        "インタビュアーとして振る舞う（コーチ・先生・アドバイザーではない）",
        "まず共感 → 感想 → 質問（質問は0〜1個）",
        "2〜3文以内。長文禁止",
        "アドバイス・提案・解決策の提示は禁止",
        "ユーザーの言葉をそのまま拾う（きれいに言い換えすぎない）",
        "柔らかい語尾（「〜かな？」「〜だったりする？」）",
      ],
    },
    {
      name: "Layer 2: モード別質問方向（動的注入）",
      rules: [
        "強み整理: 人からよく頼まれること、自然にできていることを掘る",
        "悩み整理: 何に引っかかっているか、止まっている原因を掘る",
        "サービス整理: 誰のどんな困りごとを助けたいかを掘る",
        "ターゲット整理: 一番助けたい人はどんな人かを掘る",
        "意思決定: どの選択肢で迷っているか、本当はどちらに傾いているかを掘る",
        "行動整理: 最初にできそうなこと、10分でできることを掘る",
      ],
    },
    {
      name: "Layer 3: 記憶コンテキスト（動的注入）",
      rules: [
        "事業カルテ（オンボーディングで収集済み）",
        "前回セッションの記憶（重要ワード・強み・迷い・次回テーマ）",
        "直近の会話履歴（最新20件）",
      ],
    },
  ],
  midReflection: "4往復ごとにプロンプトに整理指示を動的注入。「ここまで聞いてて思ったんだけど、〇〇ってことだよね？」形式。",
  modeDetection: "会話の最初の2〜3往復後、LLMに別途判定させる。判定結果をセッションに保存し、以降のプロンプトに注入。",
  summarySchema: `{
  "theme": "今日話したテーマ",
  "insights": ["見えてきたこと"],
  "keywords": ["大事そうな言葉"],
  "strengths": ["見えてきた強み"],
  "uncertainties": ["まだ迷っていること"],
  "nextTheme": "次に考えるとよいこと",
  "nextAction": "小さな次アクション"
}`,
};

const dbSchema = [
  { table: "chat_sessions", columns: "id, userId, deviceId, title, mode, messageCount, keywords, strengths, uncertainties, nextTheme, summary, summaryGeneratedAt, isFavorite, createdAt, updatedAt" },
  { table: "messages", columns: "id, sessionId, role, content, createdAt" },
  { table: "business_profiles", columns: "id, userId, deviceId, displayName, businessType, targetCustomer, currentGoal, onboardingCompleted, createdAt, updatedAt" },
];

// ─── Components ───

function SectionHeader({ icon, label, title }: { icon: React.ReactNode; label: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="font-mono text-xs uppercase tracking-wider text-primary font-medium">{label}</span>
      </div>
      <h2 className="font-serif text-2xl lg:text-3xl mb-6" style={{ color: "#1A2E4A" }}>
        {title}
      </h2>
    </motion.div>
  );
}

function UpdateCard({ entry, index }: { entry: UpdateEntry; index: number }) {
  const typeConfig = {
    feature: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "機能追加" },
    fix: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "修正" },
    design: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "設計変更" },
  };
  const tc = typeConfig[entry.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative pl-8 pb-8 border-l-2 border-border/50 last:pb-0"
    >
      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-background" />
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-xs text-muted-foreground">{entry.date}</span>
        <span className="font-mono text-xs font-medium text-primary">{entry.version}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${tc.bg} ${tc.text} border ${tc.border}`}>
          {tc.label}
        </span>
      </div>
      <h3 className="font-semibold text-base mb-2">{entry.title}</h3>
      <ul className="space-y-1">
        {entry.changes.map((change, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
            <span>{change}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function IdeaInputSection() {
  const [content, setContent] = useState("");
  const [type, setType] = useState<"feedback" | "idea" | "bug" | "request">("idea");
  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("送信しました");
      setContent("");
    },
    onError: () => {
      toast.error("送信に失敗しました");
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate({
      deviceId: getOrCreateDeviceId(),
      type,
      content: content.trim(),
    });
  };

  return (
    <section className="container py-12">
      <SectionHeader
        icon={<Lightbulb className="w-4 h-4 text-primary" />}
        label="Feedback"
        title="開発アイディアを入れる"
      />
      <div className="max-w-lg space-y-3">
        <div className="flex gap-2 flex-wrap">
          {(["idea", "feedback", "bug", "request"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="px-3 py-1 rounded-full text-xs transition-all"
              style={{
                background: type === t ? "#C66A5A" : "#FAF2F4",
                color: type === t ? "#FFFFFF" : "#69565C",
                border: `1px solid ${type === t ? "#C66A5A" : "#E9DCE0"}`,
              }}
            >
              {t === "idea" ? "アイデア" : t === "feedback" ? "感想" : t === "bug" ? "不具合" : "要望"}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="思いついたことを書いてください..."
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
          style={{ background: "#FAF2F4", border: "1px solid #E9DCE0", color: "#2D2520" }}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || createMutation.isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "#1A2E4A", color: "#FFFFFF" }}
          >
            {createMutation.isPending ? "送信中..." : "送信"}
          </button>
          <a href="/voices" className="text-xs hover:underline" style={{ color: "#C66A5A" }}>
            みんなの声を見る →
          </a>
        </div>
      </div>
    </section>
  );
}

function FeedbackSummarySection() {
  const summaryQuery = trpc.feedback.summary.useQuery();
  const summary = summaryQuery.data;
  const counts = summary?.counts ?? { total: 0, feedback: 0, idea: 0, bug: 0, request: 0, new: 0 };
  const feedbacks = summary?.latest ?? [];

  return (
    <section className="container py-12">
      <SectionHeader
        icon={<MessageSquare className="w-4 h-4 text-primary" />}
        label="Feedback"
        title="モニターフィードバック"
      />
      {summaryQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : counts.total === 0 ? (
        <p className="text-sm text-muted-foreground">まだフィードバックはありません</p>
      ) : (
        <div className="max-w-3xl space-y-4">
          {/* Stats */}
          <div className="flex gap-4 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">全{counts.total}件（未対応 {counts.new}）</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">感想 {counts.feedback}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">アイデア {counts.idea}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">不具合 {counts.bug}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">要望 {counts.request}</span>
          </div>
          {/* Recent items */}
          <div className="space-y-2">
            {feedbacks.slice(0, 5).map((item) => (
              <div key={item.id} className="bg-card rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.type === "feedback" ? "感想" : item.type === "idea" ? "アイデア" : item.type === "bug" ? "不具合" : "要望"}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.displayName || "匿名"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("ja-JP")}</span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{item.content}</p>
              </div>
            ))}
          </div>
          <a href="/ideas" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            すべてのフィードバックを見る <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const completedFeatures = [
    "チャットUI（スマホ最適化）",
    "音声入力（Web Speech API）",
    "オンボーディング（事業カルテ対話形式取得）",
    "壁打ちインタビュアー型プロンプト",
    "6モード自動判定",
    "途中整理（4往復ごと）",
    "まとめ生成（構造化JSON）",
    "記憶保存・次回引き継ぎ",
    "セッション履歴一覧",
    "続きチャット",
    "お気に入り登録",
    "匿名セッション（ログイン不要）",
    "初回ウェルカム画面",
    "共感ファーストのトーン設計",
    "フィードバックFAB（常時表示）",
    "みんなの声ページ",
    "フィードバック管理（ステータス管理）",
  ];

  const pendingFeatures = [
    "SNS投稿生成機能",
    "セッション履歴のナビゲーション統合",
    "Dark mode",
    "PWA対応",
    "モニターテスト実施",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative container py-12 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="font-mono text-sm text-primary font-medium">Development Dashboard</span>
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#1A2E4A" }}>
              miiiro
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-6">
              自分の意志でアクセルを踏もうとする女性のキャリアを、「方向づけ・アクセル・ブースト」で形にするサービス
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
              <div className="p-3 rounded-xl bg-card/80 backdrop-blur border border-border/50 text-center">
                <div className="font-mono text-2xl font-bold text-primary">{completedFeatures.length}</div>
                <div className="text-xs text-muted-foreground mt-1">実装済み機能</div>
              </div>
              <div className="p-3 rounded-xl bg-card/80 backdrop-blur border border-border/50 text-center">
                <div className="font-mono text-2xl font-bold text-primary">34</div>
                <div className="text-xs text-muted-foreground mt-1">テストケース</div>
              </div>
              <div className="p-3 rounded-xl bg-card/80 backdrop-blur border border-border/50 text-center">
                <div className="font-mono text-2xl font-bold text-primary">v0.5.1</div>
                <div className="text-xs text-muted-foreground mt-1">現在バージョン</div>
              </div>
              <div className="p-3 rounded-xl bg-card/80 backdrop-blur border border-border/50 text-center">
                <div className="font-mono text-2xl font-bold text-primary">6</div>
                <div className="text-xs text-muted-foreground mt-1">壁打ちモード</div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Feature Status */}
      <section className="container py-12">
        <SectionHeader
          icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
          label="Implementation Status"
          title="実装状況"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              完了（{completedFeatures.length}項目）
            </h3>
            <div className="space-y-1.5">
              {completedFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-foreground/80">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Circle className="w-4 h-4 text-slate-400" />
              未着手（{pendingFeatures.length}項目）
            </h3>
            <div className="space-y-1.5">
              {pendingFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sprint Plan */}
      <section className="container py-12">
        <SectionHeader
          icon={<Calendar className="w-4 h-4 text-primary" />}
          label="Sprint Roadmap"
          title="スプリント計画"
        />
        <div className="space-y-4 max-w-4xl">
          {sprints.map((sprint, i) => {
            const statusConfig = {
              completed: { label: "完了", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
              "in-progress": { label: "進行中", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
              upcoming: { label: "未着手", bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
            };
            const sc = statusConfig[sprint.status];
            return (
              <motion.div
                key={sprint.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`p-5 rounded-xl bg-card border ${
                  sprint.status === "in-progress" ? "border-primary/30 ring-1 ring-primary/10" : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono text-sm font-semibold">{sprint.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${sc.bg} ${sc.text} border ${sc.border}`}>
                      {sc.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{sprint.duration}</span>
                </div>
                <h4 className="font-semibold text-base mb-2">{sprint.subtitle}</h4>
                <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-muted/50">
                  <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">{sprint.goal}</p>
                </div>
                <div className="space-y-1">
                  {sprint.deliverables.map((d, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                      <span className="text-muted-foreground">{d}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Release Conditions */}
      <section className="container py-12">
        <SectionHeader
          icon={<Shield className="w-4 h-4 text-primary" />}
          label="Release Gates"
          title="リリース・正式オープン条件"
        />
        <div className="space-y-4 max-w-4xl">
          {releaseConditions.map((gate, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-5 rounded-xl bg-card border border-border/50"
            >
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {gate.gate}
              </h3>
              <div className="space-y-1.5">
                {gate.conditions.map((c, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                    <span className="text-muted-foreground">{c}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feedback Summary */}
      <FeedbackSummarySection />

      {/* Idea Input Form */}
      <IdeaInputSection />

      {/* Update History */}
      <section className="container py-12">
        <SectionHeader
          icon={<History className="w-4 h-4 text-primary" />}
          label="Update History"
          title="アップデート履歴"
        />
        <div className="max-w-3xl">
          {updates.map((entry, i) => (
            <UpdateCard key={i} entry={entry} index={i} />
          ))}
        </div>
      </section>

      {/* Prompt Design */}
      <section className="container py-12">
        <SectionHeader
          icon={<Brain className="w-4 h-4 text-primary" />}
          label="Prompt Architecture"
          title="壁打ちプロンプト設計"
        />

        <div className="space-y-6 max-w-4xl">
          {/* Core Concept */}
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              コアコンセプト: GPTとの決定的な違い
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-mono text-xs text-muted-foreground">観点</th>
                    <th className="text-left py-2 px-3 font-mono text-xs text-muted-foreground">GPT</th>
                    <th className="text-left py-2 px-3 font-mono text-xs text-muted-foreground">miiiro</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium">役割</td>
                    <td className="py-2 px-3 text-muted-foreground">答えを出す</td>
                    <td className="py-2 px-3 text-primary font-medium">問いを出す</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium">出力</td>
                    <td className="py-2 px-3 text-muted-foreground">情報を整理してくれる</td>
                    <td className="py-2 px-3 text-primary font-medium">あなた自身の考えを整理させてくれる</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-3 font-medium">結果</td>
                    <td className="py-2 px-3 text-muted-foreground">正解っぽいものが返る</td>
                    <td className="py-2 px-3 text-primary font-medium">自分の本音が出てくる</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">体験</td>
                    <td className="py-2 px-3 text-muted-foreground">「教えてもらった」感覚</td>
                    <td className="py-2 px-3 text-primary font-medium">「自分で考えた」感覚が残る</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3-Layer Architecture */}
          {promptDesign.layers.map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-5 rounded-xl bg-card border border-border/50"
            >
              <h3 className="font-semibold mb-3 font-mono text-sm">{layer.name}</h3>
              <ul className="space-y-1.5">
                {layer.rules.map((rule, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-3 h-3 text-primary mt-1 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Mid-reflection & Mode Detection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="font-semibold text-sm mb-2">途中整理</h4>
              <p className="text-sm text-muted-foreground">{promptDesign.midReflection}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h4 className="font-semibold text-sm mb-2">モード判定</h4>
              <p className="text-sm text-muted-foreground">{promptDesign.modeDetection}</p>
            </div>
          </div>

          {/* Summary Schema */}
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              まとめ生成スキーマ（LLM構造化出力）
            </h3>
            <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto text-foreground/80">
              {promptDesign.summarySchema}
            </pre>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container py-12">
        <SectionHeader
          icon={<Code2 className="w-4 h-4 text-primary" />}
          label="Tech Stack"
          title="技術スタック"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">レイヤー</th>
                <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">採用技術</th>
                <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">詳細</th>
              </tr>
            </thead>
            <tbody>
              {techStack.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{row.layer}</td>
                  <td className="py-3 px-4 font-mono text-sm">{row.tech}</td>
                  <td className="py-3 px-4 text-muted-foreground">{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DB Schema */}
      <section className="container py-12">
        <SectionHeader
          icon={<Database className="w-4 h-4 text-primary" />}
          label="Database Schema"
          title="DBスキーマ"
        />
        <div className="space-y-4 max-w-4xl">
          {dbSchema.map((table, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
              <h3 className="font-mono text-sm font-semibold mb-2 text-primary">{table.table}</h3>
              <p className="font-mono text-xs text-muted-foreground break-all">{table.columns}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Decisions */}
      <section className="container py-12">
        <SectionHeader
          icon={<Shield className="w-4 h-4 text-primary" />}
          label="Architecture Decisions"
          title="設計判断"
        />
        <div className="space-y-4 max-w-4xl">
          {[
            {
              q: "なぜ /chat を壁打ち専用にしたか（別ページにしない）",
              a: "ページを分けると「チャットと壁打ちの違いは何？」という説明コストが発生する。ターゲット層にとって選択肢が増えること自体が障壁。既存のDB・UI・音声入力はそのまま活用できる。",
            },
            {
              q: "なぜ匿名セッション（デバイスID）を採用したか",
              a: "モニターテスト段階でOAuth登録を強制すると離脱率が上がる。デバイスIDベースなら「URLを開くだけ」で壁打ち開始可能。端末変更で別人扱いになるが、モニターテストでは十分。",
            },
            {
              q: "なぜモード判定をLLMに任せるか（ルールベースにしない）",
              a: "ターゲット層は自分の状態を正確に言語化できないことが多い。キーワードマッチでは拾えない。LLM判定はコスト微小（判定プロンプトは短い）で精度が圧倒的に高い。",
            },
            {
              q: "なぜまとめ生成を自動ではなくボタンタップ式にしたか",
              a: "自動生成にすると毎回LLMコストがかかる。ボタン表示は自動（5往復以上で表示）、生成はタップ時のみ実行。コスト抑制とユーザー意思の尊重を両立。",
            },
            {
              q: "なぜ共感ファーストに修正したか",
              a: "初期プロンプトは「受け止め→即質問」のパターンが繰り返され、問い詰められている感覚になった。実際のモニターフィードバックに基づき、共感だけで返す回を許容し、質問の前にワンクッション入れる設計に変更。",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="p-5 rounded-xl bg-card border border-border/50"
            >
              <h3 className="font-semibold text-sm mb-2">{item.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="container py-12">
        <div className="flex flex-wrap gap-3">
          <a href="/chat" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            <MessageSquare className="w-4 h-4" />
            壁打ちを試す
          </a>
          <a href="/history" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <History className="w-4 h-4" />
            セッション履歴
          </a>
          <a href="/docs" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <FileText className="w-4 h-4" />
            設計ドキュメント
          </a>
          <a href="/voices" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Heart className="w-4 h-4" />
            みんなの声
          </a>
          <a href="/ideas" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-sm font-medium hover:bg-muted/50 transition-colors">
            <Lightbulb className="w-4 h-4" />
            フィードバック管理
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-serif text-foreground">miiiro</span>
            <span>— 開発ダッシュボード</span>
          </div>
          <span className="font-mono text-xs">Last updated: 2026-05-18 | 技術顧問: 門倉 悠真</span>
        </div>
      </footer>
    </div>
  );
}
