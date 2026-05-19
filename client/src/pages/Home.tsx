/**
 * hajimari Sprint Dashboard
 * Design: Editorial Timeline Journey Map
 * Colors: Salmon Orange (#F87C62) + Navy (#0F3752) + Warm White (#FFFBF5)
 * Typography: DM Serif Display (headings) + DM Sans (body) + IBM Plex Mono (labels)
 */

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  MessageSquare,
  Mic,
  Rocket,
  Target,
  Users,
  Zap,
  ArrowRight,
  Calendar,
  Layers,
} from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663574493378/YftbLHZFd22nj5w5n2Njvk/hero-bg-fk3XsRQtVAHTSfDviYCTsx.webp";

type SprintStatus = "completed" | "in-progress" | "upcoming";

interface Sprint {
  id: number;
  title: string;
  subtitle: string;
  status: SprintStatus;
  duration: string;
  goal: string;
  description: string;
  deliverables: string[];
  tasks: { label: string; done: boolean }[];
  icon: React.ReactNode;
}

const sprints: Sprint[] = [
  {
    id: 1,
    title: "Sprint 1",
    subtitle: "AIと対話できるプロトタイプの構築",
    status: "in-progress",
    duration: "Week 1",
    goal: "ターゲット層がスマホで実際にAIメンターと会話できる状態にする",
    description:
      "「SNS投稿生成」と「インタビュー形式の壁打ち」の2機能に絞り、AIとのリアルなやり取りが体験できるプロダクトを構築。BaaS経由でユーザーの事業カルテと会話履歴を保存し、AIが「あなたのことを覚えている」状態を実現する。",
    deliverables: [
      "スマホブラウザで開くだけでAIメンターと対話できるURL",
      "共感的で温かいメンタートーンのシステムプロンプト",
      "事業カルテ＋会話履歴の永続化（BaaS）",
    ],
    tasks: [
      { label: "React + TypeScript + Tailwind CSS セットアップ", done: true },
      { label: "Supabase/Firebase 初期設定", done: true },
      { label: "チャットUI（スマホ最適化）の実装", done: false },
      { label: "システムプロンプト設計・実装", done: false },
      { label: "OpenAI API連携", done: false },
      { label: "事業カルテ入力フォーム", done: false },
      { label: "Vercelデプロイ", done: false },
    ],
    icon: <Code2 className="w-5 h-5" />,
  },
  {
    id: 2,
    title: "Sprint 2",
    subtitle: "第1回モニターテスト → プロンプト改善",
    status: "upcoming",
    duration: "Week 2",
    goal: "ターゲット層のリアルな反応を得て、AIの「人格」と「言葉遣い」を調整する",
    description:
      "ターゲット層（女性フリーランス）3〜5名にURLを渡し、数日間自由に使ってもらう。検証すべきは「AIの言葉遣いが心地よいか」「また明日も話しかけたいと思うか」という感情面の反応。",
    deliverables: [
      "ユーザーの感情に寄り添うようチューニングされたAI応答品質",
      "モニターフィードバックレポート",
      "改善されたシステムプロンプト v2",
    ],
    tasks: [
      { label: "モニター3〜5名の選定・依頼", done: false },
      { label: "テスト用ガイドライン作成", done: false },
      { label: "フィードバック収集フォーム準備", done: false },
      { label: "プロンプト改善（1日単位で反復）", done: false },
      { label: "応答品質のA/Bテスト", done: false },
    ],
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    id: 3,
    title: "Sprint 3",
    subtitle: "UI/UXの改善と機能の取捨選択",
    status: "upcoming",
    duration: "Week 3",
    goal: "操作の「摩擦」を極限まで減らし、「話すだけで完結する」体験に近づける",
    description:
      "モニターが「面倒だ」と感じたポイントをUIレベルで修正。音声入力ボタンの強化、使われなかった機能の削除、壁打ち終了後の「自動サマリー＆タスク化」機能を実装。",
    deliverables: [
      "摩擦が最小化された直感的UI",
      "壁打ち後の自動構造化機能",
      "音声入力の実装（Web Speech API）",
    ],
    tasks: [
      { label: "UIフリクションポイントの特定・修正", done: false },
      { label: "音声入力ボタンの実装", done: false },
      { label: "自動サマリー＆タスク化機能", done: false },
      { label: "不要機能の削除", done: false },
      { label: "レスポンシブ最適化", done: false },
    ],
    icon: <Mic className="w-5 h-5" />,
  },
  {
    id: 4,
    title: "Sprint 4",
    subtitle: "第2回モニターテスト → 事業性ジャッジ",
    status: "upcoming",
    duration: "Week 4",
    goal: "「お金を払ってでも使い続けたいか」の最終判断を下す",
    description:
      "改善されたプロダクトを再度モニターに使ってもらい、「もしこれが月額1,100円だったら、明日からも使いますか？」というシビアな質問を投げかける。YESが過半数を超えれば本格開発フェーズに移行。",
    deliverables: [
      "PMF（Product-Market Fit）の判断材料",
      "本格開発 or ピボットの明確な意思決定",
      "モニター定量・定性フィードバックレポート",
    ],
    tasks: [
      { label: "改善版プロダクトの再テスト実施", done: false },
      { label: "「月額1,100円で使うか？」アンケート", done: false },
      { label: "定量データ分析（利用頻度・継続率）", done: false },
      { label: "PMF判定レポート作成", done: false },
      { label: "本格開発 or ピボットの意思決定", done: false },
    ],
    icon: <Target className="w-5 h-5" />,
  },
];

const techStack = [
  { layer: "フロントエンド", tech: "React + TypeScript + Tailwind CSS", reason: "スマホ最適化UIを高速に構築" },
  { layer: "バックエンド", tech: "Supabase / Firebase", reason: "認証・DB・ストレージを数時間でセットアップ" },
  { layer: "AI API", tech: "OpenAI API（GPT-4o-mini）", reason: "共感的対話に最適、コスト効率◎" },
  { layer: "ホスティング", tech: "Vercel", reason: "デプロイ即公開、URL共有でテスト可能" },
  { layer: "音声入力", tech: "Web Speech API", reason: "追加コストゼロで音声→テキスト変換" },
];

function StatusBadge({ status }: { status: SprintStatus }) {
  const config = {
    completed: { label: "完了", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    "in-progress": { label: "進行中", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    upcoming: { label: "未着手", bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium ${c.bg} ${c.text} border ${c.border}`}>
      {status === "completed" && <CheckCircle2 className="w-3 h-3" />}
      {status === "in-progress" && <Clock className="w-3 h-3 animate-pulse" />}
      {status === "upcoming" && <Circle className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

function ProgressBar({ tasks }: { tasks: { done: boolean }[] }) {
  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-muted-foreground">進捗</span>
        <span className="text-xs font-mono font-medium">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #F87C62, #FF9A85)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function SprintCard({ sprint, index }: { sprint: Sprint; index: number }) {
  const isActive = sprint.status === "in-progress";
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg ${
        isActive ? "border-primary/30 shadow-primary/5 ring-1 ring-primary/10" : "border-border"
      }`}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F87C62] to-[#FF9A85]" />
      )}
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {sprint.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl">{sprint.title}</h3>
                <StatusBadge status={sprint.status} />
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{sprint.duration}</p>
            </div>
          </div>
        </div>

        {/* Subtitle & Goal */}
        <h4 className="text-lg font-semibold mb-2">{sprint.subtitle}</h4>
        <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-muted/50">
          <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/80">{sprint.goal}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{sprint.description}</p>

        {/* Progress */}
        <ProgressBar tasks={sprint.tasks} />

        {/* Tasks */}
        <div className="mt-5 space-y-2">
          <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">タスク</p>
          <div className="space-y-1.5">
            {sprint.tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                {task.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                )}
                <span className={task.done ? "text-muted-foreground line-through" : "text-foreground"}>
                  {task.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div className="mt-5 pt-5 border-t border-border/50">
          <p className="text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider mb-2">成果物</p>
          <div className="space-y-1.5">
            {sprint.deliverables.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground/80">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const totalTasks = sprints.reduce((acc, s) => acc + s.tasks.length, 0);
  const doneTasks = sprints.reduce((acc, s) => acc + s.tasks.filter((t) => t.done).length, 0);
  const overallProgress = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="relative container py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="font-mono text-sm text-primary font-medium">Sprint Dashboard</span>
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl tracking-tight mb-4" style={{ color: "#0F3752" }}>
              hajimari
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              女性向けAIメンターサービス — スピード優先・プロトタイプ検証型の開発進捗を関係者に共有するダッシュボードです。
            </p>

            {/* Overall Progress */}
            <div className="mt-8 p-5 rounded-2xl bg-card/80 backdrop-blur border border-border/50 max-w-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">全体進捗</span>
                <span className="font-mono text-sm font-medium text-primary">{overallProgress}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #F87C62, #FF9A85)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground font-mono">
                <span>{doneTasks} / {totalTasks} タスク完了</span>
                <span>Sprint {sprints.findIndex((s) => s.status === "in-progress") + 1} / 4</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Development Philosophy */}
      <section className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-medium">Development Philosophy</span>
          </div>
          <h2 className="font-serif text-2xl lg:text-3xl mb-4" style={{ color: "#0F3752" }}>
            体験先行・最速検証
          </h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-8">
            バックエンドの本格設計（DB・認証・課金）は後回しにし、AIとのインタラクティブな対話体験を最速で構築。
            モニターに触ってもらい、フィードバックを得て改善するサイクルを1週間単位で回します。
            「体験として正しいことが証明されたもの」だけに本格的な開発投資を行います。
          </p>

          {/* Key Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Layers className="w-5 h-5" />,
                title: "体験先行",
                desc: "まずAIと対話できる「動くプロダクト」を作る。DB・課金は体験が固まってから。",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "モニター検証",
                desc: "ターゲット層に実際に使ってもらい「毎日使いたいか」を検証する。",
              },
              {
                icon: <Calendar className="w-5 h-5" />,
                title: "最短4週間",
                desc: "4スプリントで「事業として成立するか」の答えを出す。",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-5 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Timeline Section */}
      <section className="container py-16">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-medium">Sprint Timeline</span>
        </div>
        <h2 className="font-serif text-2xl lg:text-3xl mb-8" style={{ color: "#0F3752" }}>
          開発スプリント
        </h2>

        {/* Timeline visual connector (desktop) */}
        <div className="hidden lg:block relative mb-12">
          <div className="flex items-center justify-between px-8">
            {sprints.map((sprint, i) => (
              <div key={sprint.id} className="flex flex-col items-center relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold z-10 ${
                    sprint.status === "completed"
                      ? "bg-emerald-500 text-white"
                      : sprint.status === "in-progress"
                      ? "bg-primary text-white animate-pulse"
                      : "bg-muted text-muted-foreground border-2 border-border"
                  }`}
                >
                  {sprint.id}
                </div>
                <span className="mt-2 text-xs font-mono text-muted-foreground">{sprint.duration}</span>
                {i < sprints.length - 1 && (
                  <div className="absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)]" style={{ width: "200%" }}>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Connecting line */}
          <div className="absolute top-4 left-12 right-12 h-0.5 bg-border -z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 via-primary to-primary/30"
              initial={{ width: "0%" }}
              whileInView={{ width: "25%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Sprint Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sprints.map((sprint, i) => (
            <SprintCard key={sprint.id} sprint={sprint} index={i} />
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-medium">Tech Stack</span>
          </div>
          <h2 className="font-serif text-2xl lg:text-3xl mb-6" style={{ color: "#0F3752" }}>
            技術スタック
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">レイヤー</th>
                  <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">採用技術</th>
                  <th className="text-left py-3 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">選定理由</th>
                </tr>
              </thead>
              <tbody>
                {techStack.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.layer}</td>
                    <td className="py-3 px-4 font-mono text-sm">{row.tech}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* Decision Gate */}
      <section className="container py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-8 lg:p-12 rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0F3752 0%, #1a4a6b 100%)" }}
        >
          <div className="relative z-10">
            <h2 className="font-serif text-2xl lg:text-3xl text-white mb-4">
              Sprint 4 完了後の判断ゲート
            </h2>
            <p className="text-white/70 max-w-2xl leading-relaxed mb-8">
              「もしこれが月額1,100円だったら、明日からも使いますか？」— この問いへのYESが過半数を超えた時点で、
              本格開発フェーズ（DB・認証・課金の設計）に移行します。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium text-sm">YES → 本格開発</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">
                  DB設計、認証、課金システム、スケーリングの本格実装に着手
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-medium text-sm">NO → 再検証</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed">
                  Sprint 2〜4を再度回し、体験の改善またはピボットを実施
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-serif text-foreground">hajimari</span>
            <span>— Sprint Dashboard</span>
          </div>
          <a href="/docs" className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium">
            <span>開発方針ドキュメント →</span>
          </a>
          <span className="font-mono text-xs">Last updated: 2026-05-06</span>
        </div>
      </footer>
    </div>
  );
}
