/**
 * Docs Page - miiiro 開発方針ドキュメント
 * Design: Editorial reading experience with sidebar navigation
 * Brand: Base #FFFFFF / Main #FAF2F4 / Accent1 #C66A5A / Accent2 #1A2E4A
 */

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Code2,
  Database,
  Heart,
  Lightbulb,
  MessageCircle,
  Mic,
  Palette,
  Server,
  Shield,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

type SectionId =
  | "core-concept"
  | "chat-ui-design"
  | "ui-principles"
  | "ai-personality"
  | "architecture"
  | "memory-design"
  | "deliverables"
  | "checklist";

interface Section {
  id: SectionId;
  title: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  { id: "core-concept", title: "コアコンセプト", icon: <Lightbulb className="w-4 h-4" /> },
  { id: "chat-ui-design", title: "チャットUIデザイン", icon: <Palette className="w-4 h-4" /> },
  { id: "ui-principles", title: "UI設計原則", icon: <Heart className="w-4 h-4" /> },
  { id: "ai-personality", title: "AI応答設計", icon: <Brain className="w-4 h-4" /> },
  { id: "architecture", title: "技術アーキテクチャ", icon: <Server className="w-4 h-4" /> },
  { id: "memory-design", title: "記憶の設計", icon: <Database className="w-4 h-4" /> },
  { id: "deliverables", title: "成果物の設計", icon: <Sparkles className="w-4 h-4" /> },
  { id: "checklist", title: "判断基準", icon: <Shield className="w-4 h-4" /> },
];

function SideNav({
  activeSection,
  onSelect,
}: {
  activeSection: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
            activeSection === section.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {section.icon}
          {section.title}
        </button>
      ))}
    </nav>
  );
}

function CoreConceptSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#0F3752" }}>
          コアコンセプト
        </h2>
        <p className="text-muted-foreground">miiiroの全ての設計判断の「最上位の判断基準」</p>
      </div>
      <blockquote className="border-l-4 border-primary pl-6 py-4 bg-primary/5 rounded-r-lg">
        <p className="font-serif text-xl italic" style={{ color: "#0F3752" }}>
          「白紙のノートと、隣に座っている人」
        </p>
      </blockquote>
      <div className="prose prose-slate max-w-none">
        <p className="text-foreground/80 leading-relaxed">
          miiiroは、ユーザーにとって以下の存在である：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">白紙のノート</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              何を書いてもいい。構造も正解もない。自分の言葉で、自分のペースで。
            </p>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">隣に座っている人</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              指示はしない。でも聞いている。覚えている。たまに「それ、どういうこと？」と聞いてくる。
            </p>
          </div>
        </div>
        <p className="text-foreground/80 leading-relaxed">
          このメタファーが意味するのは、<strong>miiiroは「ツール」ではなく「場」である</strong>ということ。
          ユーザーが自分の思考を言語化し、整理し、前に進むための「安全な場所」を提供する。
        </p>
        <p className="text-foreground/80 leading-relaxed mt-4">
          迷ったときは常にここに立ち返り、「この判断はコアメタファーを強化するか、希薄にするか？」で決定する。
        </p>
      </div>

      {/* メタファーの2層構造 */}
      <div className="mt-10 pt-8 border-t border-border/50">
        <h3 className="font-serif text-2xl mb-4" style={{ color: "#0F3752" }}>
          メタファーの2層構造
        </h3>
        <p className="text-foreground/80 leading-relaxed mb-4">
          miiiroのターゲット層は「GPTを開いても何を聞けばいいかわからない」人たちである。「白紙のノート」を渡すだけでは、GPTの空欄と同じ問題が発生する。
        </p>
        <p className="text-foreground/80 leading-relaxed mb-6">
          この矛盾を解決するために、メタファーは<strong>2つの別レイヤー</strong>で機能する。
        </p>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">レイヤー</th>
                <th className="text-left py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">メタファー</th>
                <th className="text-left py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">設計領域</th>
                <th className="text-left py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">意味</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 font-medium">UI（見た目）</td>
                <td className="py-3 px-4 text-primary font-medium">白紙のノート</td>
                <td className="py-3 px-4">画面設計</td>
                <td className="py-3 px-4 text-muted-foreground">余計なボタン・カード・装飾がない。入力欄は常に白紙。静か。</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium">AI（振る舞い）</td>
                <td className="py-3 px-4 text-primary font-medium">隣に座っている人</td>
                <td className="py-3 px-4">プロンプト設計</td>
                <td className="py-3 px-4 text-muted-foreground">話しかけてくるのはこっち。会話の起点はAI側にある。</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 p-5 rounded-xl bg-[#0F3752]/5 border border-[#0F3752]/10">
          <p className="text-foreground/80 leading-relaxed">
            <strong>ノートは白紙のまま。</strong>だが隣の人が「今日どうだった？」と声をかけてくるから、ユーザーはそのノートに「答え」を書き始める。ノートに質問が印刷されているのではなく、<strong>隣の人の声が聞こえる（チャット画面にAIのメッセージが先に表示されている）。</strong>入力欄（ノート）自体は常に白紙である。
          </p>
        </div>
      </div>

      {/* GPTとmiiiroの構造的な違い */}
      <div className="mt-10 pt-8 border-t border-border/50">
        <h3 className="font-serif text-2xl mb-4" style={{ color: "#0F3752" }}>
          GPTとmiiiroの構造的な違い
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground"></th>
                <th className="text-left py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">GPT</th>
                <th className="text-left py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">miiiro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["会話の起点", "ユーザー（能動的行動が必要）", "AI（ユーザーは受動的でOK）"],
                ["入力のハードル", "「何を聞けばいいかわからない」", "「答えるだけ」"],
                ["空欄の意味", "自分で考えて書く場所", "AIの問いかけに返事を書く場所"],
                ["使わない日", "罪悪感・離脱", "AIが待っていてくれる安心感"],
              ].map(([label, gpt, miiiro], i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-3 px-4 font-medium">{label}</td>
                  <td className="py-3 px-4 text-muted-foreground">{gpt}</td>
                  <td className="py-3 px-4 text-primary font-medium">{miiiro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 具体的な体験設計 */}
      <div className="mt-10 pt-8 border-t border-border/50">
        <h3 className="font-serif text-2xl mb-6" style={{ color: "#0F3752" }}>
          具体的な体験設計
        </h3>
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              <h4 className="font-semibold">アプリを開いた瞬間、AIからメッセージが来ている</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 ml-8">
              <li>「おはようございます。昨日のインスタ投稿、反応どうでしたか？」</li>
              <li>「先週話してた新メニューの件、その後どうなりました？」</li>
              <li className="text-foreground/70 font-medium">→ ユーザーは「答えるだけ」。自分で質問を考える必要がない。</li>
            </ul>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              <h4 className="font-semibold">答えに対してAIが深掘りしてくる</h4>
            </div>
            <div className="ml-8 text-sm space-y-2">
              <p className="text-muted-foreground"><span className="text-foreground/70">ユーザー：</span>「まだ何も進んでない…」</p>
              <p className="text-muted-foreground"><span className="text-foreground/70">AI：</span>「忙しかったんですね。ちなみに、何が一番引っかかってます？時間？それとも方向性？」</p>
              <p className="text-foreground/70 font-medium">→ ユーザーは答えるだけで壁打ちが進む。</p>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              <h4 className="font-semibold">沈黙もOKという設計</h4>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 ml-8">
              <li>何も答えなくても、翌日また別の切り口で話しかけてくる</li>
              <li>「使わなきゃ」というプレッシャーがない</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 実装上の方針 */}
      <div className="mt-10 pt-8 border-t border-border/50">
        <h3 className="font-serif text-2xl mb-4" style={{ color: "#0F3752" }}>
          実装上の方針
        </h3>
        <ul className="space-y-3 text-foreground/80">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>毎回アプリを開くと、AIからの問いかけが表示されている（プッシュ通知 or アプリ起動時に生成）</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>入力欄のプレースホルダーは最小限（空白に近い状態）</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>AIの問いかけは常に「一言で答えられる」レベルから始まる</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
            <span>会話が深まるにつれて、自然とユーザーの自由記述が増えていく（段階的に能動性を引き出す）</span>
          </li>
        </ul>
      </div>
    </div>
   );
}

function ChatUIDesignSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#1A2E4A" }}>
          チャットUIデザイン
        </h2>
        <p className="text-muted-foreground">「凛とした温もり・余白と意志・静かな推進力」</p>
      </div>

      {/* ブランド定義 */}
      <div className="p-5 rounded-xl border border-border/50" style={{ backgroundColor: "#FAF2F4" }}>
        <h4 className="font-semibold mb-2" style={{ color: "#1A2E4A" }}>miiiro サービス定義</h4>
        <p className="text-sm text-foreground/80 leading-relaxed">
          自分の意志でアクセルを踏もうとする女性のキャリアを、「方向づけ・アクセル・ブースト」で形にするサービス。
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-white">
            <span className="font-semibold" style={{ color: "#C66A5A" }}>HANDLE</span>
            <p className="text-muted-foreground mt-0.5">方向づけ</p>
          </div>
          <div className="p-2 rounded-lg bg-white">
            <span className="font-semibold" style={{ color: "#C66A5A" }}>ACCEL</span>
            <p className="text-muted-foreground mt-0.5">加速</p>
          </div>
          <div className="p-2 rounded-lg bg-white">
            <span className="font-semibold" style={{ color: "#C66A5A" }}>BOOST</span>
            <p className="text-muted-foreground mt-0.5">後押し</p>
          </div>
        </div>
      </div>

      {/* カラーパレット */}
      <div>
        <h3 className="text-lg font-semibold mb-3">カラーパレット</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">役割</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">カラー</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">用途</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Base", "#FFFFFF", "画面背景"],
                ["Main", "#FAF2F4", "AIバブル・セクション背景"],
                ["Accent 1", "#C66A5A", "ユーザーバブル・音声ボタン・CTA"],
                ["Accent 2", "#1A2E4A", "送信ボタン・ロゴ・見出し"],
                ["N1", "#E9DCE0", "ボーダー・ディバイダー"],
                ["N2", "#D2C3C8", "プレースホルダー・補助アイコン"],
                ["N3", "#A19097", "サブテキスト・タイムスタンプ"],
                ["N4", "#69565C", "本文テキスト"],
              ].map(([role, color, usage], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                    <span className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: color }}></span>
                    {role}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs">{color}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* デザイン判断 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">核心的なデザイン判断</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">要素</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">miiiro</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">理由</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["アバター", "なし", "「隣の人」は姿が見えない"],
                ["タイムスタンプ", "なし", "時間を気にさせない"],
                ["プレースホルダー", "空白", "白紙のノート"],
                ["音声ボタン", "48px（主役）", "スキマ時間に声で使う"],
                ["送信ボタン", "36px（サブ）", "テキスト入力は補助"],
                ["機能ボタン", "音声のみ", "引き算の設計"],
              ].map(([element, miiiro, reason], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-medium">{element}</td>
                  <td className="py-2.5 px-3" style={{ color: "#C66A5A" }}>{miiiro}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 競合との差 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">競合とのデザイン差別化</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">サービス</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">印象</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">miiiroの差</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["LINE", "賢やか・ポップ", "静か・余白・品格"],
                ["ChatGPT", "機能的・ツール感", "温かい・対話感"],
                ["Notion AI", "ドキュメント補助", "会話の場"],
              ].map(([service, impression, diff], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-medium">{service}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{impression}</td>
                  <td className="py-2.5 px-3 font-medium" style={{ color: "#C66A5A" }}>{diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* プロトタイプリンク */}
      <div className="p-5 rounded-xl border border-border/50" style={{ backgroundColor: "#1A2E4A" }}>
        <h4 className="font-semibold text-white mb-2">プロトタイププレビュー</h4>
        <p className="text-sm text-white/70 mb-3">
          実際のチャットUIをスマホフレームで体験できます。
        </p>
        <a
          href="/chat-preview"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          チャットUIを開く
        </a>
      </div>

      {/* アニメーション仕様 */}
      <div>
        <h3 className="text-lg font-semibold mb-3">アニメーション仕様</h3>
        <div className="space-y-3">
          {[
            { label: "メッセージ表示", value: "opacity 0→1 + translateY 8px→0 / 300ms ease-out" },
            { label: "タイピングインジケータ", value: "3ドットが0.3s遅延で交互にフェード" },
            { label: "音声ボタン（録音中）", value: "scale 1→1.08→1 / 1.5s infinite" },
            { label: "ボタン切り替え", value: "scale 0.8→1 + opacity / 200ms" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-xs font-mono font-medium text-primary shrink-0 mt-0.5 w-28">{item.label}</span>
              <p className="text-sm text-foreground/80 font-mono">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UIPrinciplesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#0F3752" }}>
          UI設計原則
        </h2>
        <p className="text-muted-foreground">「邪魔しないこと」が最高のUI</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">✕</span>
            やらないこと（禁止事項）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">禁止事項</th>
                  <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">理由</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["返答カード・選択肢の提示", "「AIに誘導されている」不快感を生む。自分の言葉で話す体験を奪う"],
                  ["過剰な装飾・アニメーション", "「ツール感」が出る。ノートの静けさが失われる"],
                  ["毎回同じ定型挨拶", "テンプレ感 = 飽きの最大要因"],
                  ["長文での返答", "「読まされている」感覚。会話ではなく講義になる"],
                  ["機能ボタンの乱立", "選択肢が多い = 認知負荷 = 離脱"],
                ].map(([item, reason], i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2.5 px-3 font-medium">{item}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">○</span>
            やること（設計方針）
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">設計方針</th>
                  <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">具体的な実装</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["入力欄は「ただの空白」", "テキスト入力 + 音声入力ボタンのみ。プレースホルダーすら最小限"],
                  ["AIの返答はプレーンテキスト", "マークダウン装飾は控えめ。人間が話しているように見えること"],
                  ["開いた瞬間に使える", "ログイン後、1タップで会話開始。チュートリアルなし"],
                  ["音声入力を「主役」にする", "キーボードより大きく、押しやすい位置に配置"],
                  ["成果物は「静かに現れる」", "押しつけず、会話が終わった後に「まとめ」がそっと表示される"],
                ].map(([item, detail], i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2.5 px-3 font-medium">{item}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-muted/50 border border-border/50">
          <div className="flex items-start gap-3">
            <Mic className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">音声入力について</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ターゲット層（女性フリーランス）は家事の合間や移動中に使うことが多い。
                「話しかけるだけで完結する」体験を実現するため、音声入力ボタンはテキスト入力欄と同等以上の存在感で配置する。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIPersonalitySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#0F3752" }}>
          AI応答設計
        </h2>
        <p className="text-muted-foreground">「飽きない」を作るのはUIではなくAIの振る舞い</p>
      </div>

      <p className="text-foreground/80 leading-relaxed">
        飽きないかどうかは、UIのギミックではなく<strong>AIの振る舞い（プロンプト設計）</strong>で決まる。
        「また話したい」と思わせる5つの原則を定義する。
      </p>

      <div className="space-y-4">
        {[
          {
            num: 1,
            title: "聞く人であること",
            desc: "遮らない。否定しない。まず受け止める。ユーザーが話し終わるまで待つ。短い相槌を打ってから、1つだけ質問する。",
          },
          {
            num: 2,
            title: "覚えている人であること",
            desc: "「前に言ってた〇〇の件、どうなりました？」— この一言が、汎用ChatGPTとの決定的な差になる。事業カルテと会話履歴をDBに保存し、毎回AIに「思い出させる」ことで実現する。",
          },
          {
            num: 3,
            title: "たまに意外なことを言う人であること",
            desc: "予測可能な応答 = 飽きる。たまに「それ、本当にやりたいですか？」「逆に、やめたらどうなりますか？」と、ユーザーが予期しない角度から問いかける。",
          },
          {
            num: 4,
            title: "相手のテンションに合わせること",
            desc: "元気な日は軽く返す。疲れている日は静かに寄り添う。毎回同じトーンで返すAIは「機械」に感じる。ユーザーの文体・文量・絵文字の有無からテンションを読み取り、合わせる。",
          },
          {
            num: 5,
            title: "短く返すこと",
            desc: "1回の応答は2〜3文。そして必ず1つだけ質問で終わる。長文は「読まされている」感覚を生み、会話のリズムを壊す。",
          },
        ].map((item) => (
          <div key={item.num} className="flex gap-4 p-4 rounded-xl bg-card border border-border/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-mono font-bold shrink-0">
              {item.num}
            </div>
            <div>
              <h4 className="font-semibold mb-1">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">やってはいけないこと vs やるべきこと</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-red-500">NG</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-emerald-600">OK</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["毎回同じ挨拶", "前回の話題に触れてから始める"],
                ["選択肢を出す", "「最近どうですか？」とだけ聞く"],
                ["長文で返す", "短く返して、1つだけ質問する"],
                ["褒めすぎる", "たまに率直に「それ、本当にやりたいですか？」と聞く"],
                ["毎回同じトーン", "相手のテンションに合わせる"],
              ].map(([ng, ok], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5 px-3 text-muted-foreground">{ng}</td>
                  <td className="py-2.5 px-3 font-medium">{ok}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#0F3752" }}>
          技術アーキテクチャ
        </h2>
        <p className="text-muted-foreground">OpenAI API ≠ ChatGPT — この区別が全ての基盤</p>
      </div>

      <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
        <h4 className="font-semibold text-amber-900 mb-2">関係者全員が理解すべき前提</h4>
        <p className="text-sm text-amber-800 leading-relaxed">
          miiiroが使うのは<strong>OpenAI API（GPT-4o-mini等）</strong>であり、ChatGPTという製品ではない。
          APIは「頭脳だけ借りる」部品であり、ユーザーのことを一切覚えない。これは制約ではなく、むしろ強みである。
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3"></th>
              <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">ChatGPT（製品）</th>
              <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">OpenAI API（部品）</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["提供形態", "Webアプリ・スマホアプリ", "プログラムから呼び出すAPI"],
              ["記憶機能", "ChatGPT側が会話を覚えてくれる", "API自体は何も覚えない"],
              ["料金", "月額20ドル等", "使った分だけ従量課金"],
              ["カスタマイズ", "限定的", "システムプロンプトで自由自在"],
            ].map(([label, chatgpt, api], i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2.5 px-3 font-medium">{label}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{chatgpt}</td>
                <td className="py-2.5 px-3 font-medium text-primary">{api}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">データフロー</h3>
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm leading-loose">
          <div className="space-y-2 text-slate-700">
            <p>【ユーザーがメッセージを送信】</p>
            <p className="text-slate-400 pl-8">↓</p>
            <p>miiiroのサーバーが以下を組み立てる：</p>
            <p className="pl-4">① システムプロンプト（AIの人格・ルール）</p>
            <p className="pl-4">② 事業カルテ（名前、事業内容、目標、悩み）← <span className="text-primary">DBから取得</span></p>
            <p className="pl-4">③ 直近の会話履歴（過去5〜10往復）← <span className="text-primary">DBから取得</span></p>
            <p className="pl-4">④ 今回のユーザーメッセージ</p>
            <p className="text-slate-400 pl-8">↓</p>
            <p>OpenAI APIに送信 → 応答を受け取る</p>
            <p className="text-slate-400 pl-8">↓</p>
            <p>応答を<span className="text-primary">DBに保存</span> + ユーザーに表示</p>
          </div>
        </div>
      </div>

      <blockquote className="border-l-4 border-primary/50 pl-4 py-2">
        <p className="text-sm text-foreground/80 italic">
          つまり「覚えている」のはAIではなく、miiiroのデータベースである。
          AIには毎回「この人はこういう人で、前回こういう話をしました」と教えてあげる構造。
        </p>
      </blockquote>
    </div>
  );
}

function MemoryDesignSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#0F3752" }}>
          記憶の設計
        </h2>
        <p className="text-muted-foreground">「何を覚え、何を忘れるか」を設計する</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">メリット</th>
              <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">説明</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["無料プランでも会話履歴が残る", "保存件数に制限をかけることでプラン差別化が可能"],
              ["端末を変えても同じ体験", "データはクラウドに保存されるため、スマホでもPCでも同一体験"],
              ["AIの「人格」を完全にコントロール可能", "ChatGPTと違い、miiiro独自のメンター像を自由に設計できる"],
              ["記憶の精度を設計できる", "「何を覚えるか」「いつ忘れるか」をmiiiro側で制御"],
              ["コスト最適化が可能", "会話履歴の送信量を調整することでAPI費用をコントロール"],
            ].map(([merit, desc], i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2.5 px-3 font-medium">{merit}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">データ保存構造（概念設計）</h3>
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm">
          <div className="space-y-1 text-slate-700">
            <p>ユーザーテーブル</p>
            <p className="pl-4">└─ 事業カルテ（プロフィール情報）</p>
            <p className="pl-4">└─ 会話セッション一覧</p>
            <p className="pl-8">└─ 各セッションのメッセージ履歴</p>
            <p className="pl-8">└─ 自動生成された「まとめ」</p>
            <p className="pl-8">└─ AIが抽出した重要トピックタグ</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">「飽きない」を実現するプロンプト設計</h3>
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm">
          <div className="space-y-1 text-slate-700">
            <p>システムプロンプトに以下を組み込む：</p>
            <p className="pl-4">- 応答トーンの動的調整ルール</p>
            <p className="pl-4">- 「3回に1回は予想外の質問をする」指示</p>
            <p className="pl-4">- 前回の会話トピックへの言及ルール</p>
            <p className="pl-4">- 応答文量の制限（最大3文 + 質問1つ）</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliverablesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#0F3752" }}>
          成果物の設計
        </h2>
        <p className="text-muted-foreground">「押しつけがましくない」成果物の提示方法</p>
      </div>

      <p className="text-foreground/80 leading-relaxed">
        壁打ちが終わった後、AIが自動的に「まとめ」を生成するが、表示方法は「押しつけない」。
        主語はあくまでユーザーであり、「AIが勝手に作ったもの」ではなく「自分が話したことの整理」として提示する。
      </p>

      <div className="space-y-3">
        {[
          "会話が5往復以上続いた場合のみ、画面下部に小さく「まとめを見る」リンクが現れる",
          "タップすると「今日の壁打ちまとめ」カードが展開される",
          "内容：話したテーマ / 出てきたアイデア / 明日やること（1〜3個）",
          "閉じても履歴からいつでも見返せる",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-foreground/80">{item}</p>
          </div>
        ))}
      </div>

      <blockquote className="border-l-4 border-primary/50 pl-4 py-2 mt-4">
        <p className="text-sm text-foreground/80 italic">
          重要：まとめは「AIが勝手に作ったもの」ではなく、「自分が話したことの整理」として提示する。主語はあくまでユーザー。
        </p>
      </blockquote>
    </div>
  );
}

function ChecklistSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl mb-2" style={{ color: "#0F3752" }}>
          判断基準チェックリスト
        </h2>
        <p className="text-muted-foreground">新しい機能やUI要素を追加する際の確認事項</p>
      </div>

      <div className="space-y-3">
        {[
          "これは「白紙のノート」の静けさを壊さないか？",
          "これは「隣に座っている人」の押しつけがましさを生まないか？",
          "ユーザーが「自分の言葉で話している」感覚を維持できるか？",
          "これがなくても、ユーザーは目的を達成できるか？（YESなら不要）",
          "3ヶ月後も飽きずに使い続けられるか？",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
            <div className="w-5 h-5 rounded border-2 border-primary/30 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">競合との差別化</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">サービス</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">体験</th>
                <th className="text-left py-2 px-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">miiiroとの違い</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["ChatGPT", "万能だが冷たい。覚えてくれない", "miiiroは「あなたを知っている」"],
                ["LINEのAI機能", "返答カードが押しつけがましい", "miiiroは「聞くだけ」"],
                ["Notion AI", "ドキュメント補助ツール。対話ではない", "miiiroは「会話の場」"],
                ["コーチング（人間）", "高額（月3〜10万円）。予約が必要", "miiiroは月1,100円。いつでも"],
              ].map(([service, exp, diff], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-medium">{service}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{exp}</td>
                  <td className="py-2.5 px-3 text-primary font-medium">{diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-[#0F3752] to-[#1a4a6b] text-white">
        <h3 className="font-serif text-xl mb-3">まとめ</h3>
        <blockquote className="border-l-2 border-white/30 pl-4">
          <p className="text-white/90 italic leading-relaxed">
            「ユーザーが、自分の言葉で、自分のペースで考えを言語化できる場を、静かに提供し続けること。」
          </p>
        </blockquote>
        <p className="text-white/60 text-sm mt-3">
          UIは邪魔をしない。AIは押しつけない。でも、話し終わった後には「今日も少し前に進めた」という感覚が残る。それがmiiiroの価値である。
        </p>
      </div>
    </div>
  );
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState<SectionId>("core-concept");

  const handleSelect = (id: SectionId) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "core-concept":
        return <CoreConceptSection />;
      case "chat-ui-design":
        return <ChatUIDesignSection />;
      case "ui-principles":
        return <UIPrinciplesSection />;
      case "ai-personality":
        return <AIPersonalitySection />;
      case "architecture":
        return <ArchitectureSection />;
      case "memory-design":
        return <MemoryDesignSection />;
      case "deliverables":
        return <DeliverablesSection />;
      case "checklist":
        return <ChecklistSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                miiiro Dashboard
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <span className="font-mono text-sm font-medium">開発方針ドキュメント</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3 px-3">
                Contents
              </p>
              <SideNav activeSection={activeSection} onSelect={handleSelect} />
            </div>
          </aside>

          {/* Mobile nav */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border p-2">
            <div className="flex overflow-x-auto gap-1 px-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSelect(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 lg:pb-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
