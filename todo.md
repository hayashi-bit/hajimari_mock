# Project TODO

## Completed
- [x] Basic homepage layout (Sprint Dashboard)
- [x] Docs page with core concept documentation
- [x] Ideas board page
- [x] Chat preview page (static prototype)
- [x] miiiro rebrand (hajimari → miiiro, new color palette)
- [x] Upgrade to full-stack (web-db-user)
- [x] DB schema design (business_profiles, chat_sessions, messages)
- [x] Push DB schema migration
- [x] Chat API endpoint (tRPC procedure with LLM integration)
- [x] System prompt design (miiiro mentor tone)
- [x] Chat page UI (real working chat, not static preview)
- [x] Voice input (Web Speech API)
- [x] Onboarding dialogue flow (business carte via AI conversation)
- [x] Vitest tests for chat router

## Pending
- [x] Home page restore after full-stack upgrade
- [x] Sprint schedule update on Home
- [ ] Integrate Home/Docs/Ideas navigation into hub layout (Pattern B)
- [ ] Push notifications (Sprint 2+)
- [ ] Auto-summary after wall-hitting session (Sprint 2+)
- [ ] Session history page (Sprint 2+)
- [x] Wall-hitting mode (Sprint 2: Week 3-4) → Sprint 1後半で実装済み
- [ ] SNS post generation (Sprint 2: Week 3-4)
- [ ] Dark mode
- [ ] PWA support

## 壁打ち機能実装（Sprint 1 後半）
- [x] DBスキーマ拡張: chatSessionsにmode, keywords, strengths, uncertainties, nextTheme, summary, summaryGeneratedAtカラム追加
- [x] システムプロンプト書き換え: AIメンター → インタビュアー型（壁打ち専用）
- [x] 途中整理ロジック: 往復数カウント → プロンプトに整理指示を動的注入
- [x] モード自動判定: LLMで会話からモード推定 → セッション保存
- [x] まとめ生成API: LLM構造化出力 → DB保存
- [x] 記憶保存: keywords/strengths/uncertainties/nextTheme抽出・保存
- [x] 次回起動時の記憶引き継ぎ: 前回セッションの記憶からAIが問いかけ
- [x] 壁打ちUI: 「今日のまとめを見る」ボタン（5往復以上で表示）
- [x] まとめ表示UI: ボトムシート/モーダルでまとめ内容を表示
- [x] 「新しい壁打ちを始める」ボタン
- [x] 初回導線 UI: サービスコンセプト・GPTとの違いが伝わるウェルカム画面
- [x] Vitestテスト: 壁打ちAPIのテスト
- [x] 再訪時の前回記憶バナー表示（previousMemoryをUIに反映）
- [x] まとめ生成失敗時・メッセージ送信失敗時のtoastフィードバック

## プロンプト改善
- [x] 壁打ちプロンプトのトーン修正: 問い詰め感→共感ファースト、柔らかい口調

## 履歴・続きチャット・お気に入り機能
- [x] DBスキーマ: chat_sessionsにisFavoriteカラム追加
- [x] サーバー: セッション履歴一覧API（まとめ付き）
- [x] サーバー: 続きチャットAPI（既存セッションを再開）
- [x] サーバー: お気に入りトグルAPI
- [x] フロント: 履歴一覧ページ（/history）
- [x] フロント: 履歴から続きチャットへの導線
- [x] フロント: お気に入りトグルUI
- [x] getGreetingのトーン修正（共感ファースト・カジュアル口調）

## ヘッダーUI改善・独立ページ化
- [x] ヘッダーの「+」「本アイコン」をアイコン+テキストラベルに変更
- [x] /chatを独立ページとして切り離し（ダッシュボードなしで直接アクセス可能）
- [x] モニター共有方法の提示

## 匿名セッション・ヘッダーUI・隠しボタン
- [x] DBスキーマ: chat_sessionsにdeviceIdカラム追加（匿名ユーザー対応）
- [x] サーバー: 匿名ユーザー用API（deviceIdベースでセッション管理、認証不要）
- [x] フロント: デバイスID自動生成・localStorage保存
- [x] フロント: 認証不要で/chatが動作するように修正
- [x] フロント: ヘッダーのアイコン+テキストラベル化（「履歴」「新規」）
- [x] フロント: ダッシュボードへの隠しボタン（miiiroロゴ5回タップで遷移）
## ダッシュボード（技術者向け情報整理）
- [x] Home.tsxを更新: 開発進捗・アップデート履歴・技術仕様・壁打ちプロンプト設計を門倉さん向けに整理

## モニター向けUI改善・ガイド追加
- [x] /chat初回表示にスライド式の使い方・注意事項ガイドを追加
- [x] 初期画面を履歴なし状態に（ウェルカムから始まる）
- [x] まとめ生成しなくてもセッション自体が履歴に残るように修正
- [x] まとめプロンプトから「強みに繋げる」ロジックを削除
- [x] モニター向け「試してほしいこと」リストを作成（アプリ外）

## プロンプト示唆・まとめ提案改善
- [x] buildKabeuchiPromptに軽い言語化の投げ返しを許可（「それって〇〇ってことかも？」程度）
- [x] 6-8往復タイミングでAIが「ここまでの話、一回整理してみる？」と提案するロジック追加
## きっかけチップ + 初回メッセージ改善
- [x] getGreetingプロンプト改善: 初回は「場の説明+何が得られるか+最初の一歩」を含むLLM生成メッセージに
- [x] Chat.tsxにきっかけチップUI追加（3個、新規セッション時のみ、タップで送信）
## モバイルキーボード対応 + チップ条件緩和
- [x] キーボード表示時にメッセージエリアが見えるようレイアウト修正（visualViewport API + スクロール追従）
- [x] きっかけチップ表示条件を緩和: resumeSessionId制限を外し「AIメッセージ1件のみ＋ユーザー未発言」で判定
## 左サイドバー（GPT風履歴パネル）
- [x] ChatSidebarコンポーネント作成（お気に入り固定セクション + 履歴一覧 + 新規チャットボタン）
- [x] PC: 左サイドバー常時表示、スマホ: ハンバーガーメニューでドロワー呼び出し
- [x] Chat.tsxのレイアウトをサイドバー対応に変更（ヘッダーにハンバーガー追加）
## ドキュメント復活
- [x] スプリント計画・リリース条件・正式オープンまでの条件をDocsまたはHomeに復活
## フィードバック機能（統合テーブル）
- [x] DBスキーマ: feedbacksテーブル追加（deviceId, displayName, sessionId, type, content, status, createdAt）
- [x] tRPC API: フィードバック送信（create）、一覧取得（list）、ステータス更新（updateStatus）
- [x] 壁打ち画面: フィードバック送信ボタン+ボトムシートUI
- [x] Ideasページ復活: フィードバック一覧+直接投稿+ステータスバッジ
- [x] Home: フィードバックサマリーセクション追加（最新5件+件数+種類別内訳）
- [x] Vitestテスト: フィードバックAPIのテスト
## /voices + /ideas分離
- [x] /voicesページ新規作成（モニター向け: みんなの声一覧+投稿）
- [x] /ideasページ改修（内部向け: ステータス管理UI強化、対応済/見送り/開発中）
- [x] 壁打ちサイドバーに「みんなの声」リンク追加
- [x] フィードバック送信後に「みんなの声を見る？」誘導
- [x] App.tsxに/voicesルート登録
## Home.tsxナビゲーション追加
- [x] Home.tsxのボタン群に「みんなの声」(/voices)リンク追加
- [x] Home.tsxのボタン群に「フィードバック管理」(/ideas)リンク追加
## サイドバーバグ修正
- [x] PC: サイドバーを常時表示（閉じられないバグ修正）
- [x] PC: 「≡ 履歴」ボタンを非表示にする（スマホのみ表示）
## Chat UIバグ修正（フィードバック・入力フォーム）
- [x] フィードバック吹き出しアイコン（FAB）をPC/スマホ両方で表示（オンボーディング中のみ非表示）
- [x] フィードバックフォーム内に「みんなの声を見る」導線を追加
- [x] スマホ: 入力フォームが最上段に来る問題を修正（下部固定に）
- [x] FABのオンボーディング中非表示は仕様（初回質問中にフィードバックは不要）
- [x] TSライブラリ参照エラー解消（tsc --noEmit通過、LSPキャッシュの問題だった）
## 緊急バグ修正（ユーザー報告）
- [x] 問題1: /ideas読み込みエラー（limit:200→100に修正、サーバー側max:100に合わせ）
- [x] 問題2: スマホFAB非表示（isOnboarding条件削除、常時表示に）
- [x] 問題3: Home.tsxにアイディア入力欄追加（IdeaInputSectionコンポーネント）
- [x] 問題4: スマホで文字入力時に画面がブレる（visualViewport handler削除）
