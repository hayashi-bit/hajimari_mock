# リブランド仕様（LiveLog → ライブリコ／LiveRico）＋ Manus指示

作成: 2026-06-21 ／ 名称・ロゴ・コピー・カラーを確定し、一括置換に渡すための仕様。
関連: 12(コピー) / naming-brief / 19-21(Gmail) / 11(マスターTODO B)

## 確定事項
| 項目 | 確定内容 |
|---|---|
| サービス名 | **ライブリコ／LiveRico**（日本語=ライブリコ／英字=LiveRico） |
| ロゴ | ピンク→オレンジのポップなワードマーク（Canva案2）。透過PNG。Canvaデザイン名「Custom Typeface 'LiveRico' with Energetic Accents」(design_id: DAHNNPOU6BM) |
| サブ表記（ロゴ下） | **そのライブの全部を、ともだちと楽しみつくす。** |
| メインキャッチ | **ライブを軸に、人生を楽しみ尽くす。** |

## カラーコンセプト（厳守・取り違え注意）
- **アプリ本体＝ピンク→オレンジのグラデ**（`#ff4f7b → #ff8a3d`）。ポップ・遊び心・ドリッピング調の多色。出典: Aooo 2nd Album『Rooom』アートワーク。
  - オレンジ `#ff7a1f` / ピンク `#e5478a` / イエロー `#fcd303` / ブルー `#2e7bd6` / ライム `#9bcb3c` / 背景 `#eef2f7`
- ⚠️ **開発ドキュメントサイトは navy `#1a3a52` × gold `#d4af37` の“別テーマ”**。アプリ本体の配色とは別物。**ロゴ/アプリ制作時にこの navy×gold を使わないこと**（過去にクロコが取り違えた）。

## ロゴアセットの受け渡し
- 透過PNGは Canva 書き出し済みだが、本実行環境はネットワーク制限で `export-download.canva.com` に到達不可＝クロコがリポジトリへ直接保存できない。
- 受け渡し手順：林さんがCanvaの連携アカウントから書き出し→ `docs/livelog/assets/liverico-logo.png` に配置、またはマナスへ直接アップロード。
- 確定までの暫定対応：マナスは現テキストロゴの文字を「LiveRico」に差し替えてもよい（画像ロゴは後から差し替え可能）。

## Manusへの指示（リブランド棚卸し→一括置換）
```
【リブランド：LiveLog → ライブリコ / LiveRico に統一】
名称・サブ表記・ロゴを下記に統一する。まず①棚卸しを報告→②確認後に一括置換。

■ 確定文言
・サービス名：ライブリコ / LiveRico
・ロゴ下サブ表記：そのライブの全部を、ともだちと楽しみつくす。
・メインキャッチ：ライブを軸に、人生を楽しみ尽くす。
・カラー：アプリ本体はピンク→オレンジ（#ff4f7b→#ff8a3d）。navy×goldは使わない（あれは開発サイトの別テーマ）。

■ ① まず棚卸し（置換せず一覧で報告）
「LiveLog」「ライブログ」等の旧表記が出る箇所を全部リスト化（ファイル＋現文字列＋種別）。
特に漏れやすい所を必ず確認：
1) 画面UI（ロゴ/ヘッダー/タイトル/旧サブ表記「ライブ参加記録・管理アプリ」）
2) HTMLメタ（title / description / OGP og:title,og:site_name,og:image / Twitterカード）
3) アイコン（favicon / PWA manifest name,short_name,theme_color / アプリアイコン）
4) メール文面（Resend等の件名・本文・署名の「LiveLog」）
5) OAuth同意画面のアプリ名・ブランディング（Google Auth Platform側）
6) 定数/文言ハードコード（const.ts等）、利用規約・プラポリ内の名称、ストア説明
7) ロゴ画像アセットのパス（差し替え要）

■ ② 確認後に一括置換＋ロゴ差し替え
・テキストはライブリコ/LiveRicoへ、サブ表記を上記へ。
・ロゴ画像は提供する透過PNGに差し替え（未提供の間は文字ロゴ「LiveRico」で暫定可）。
・theme_color等のカラーはアプリ本体のピンク→オレンジ系に合わせる。
・OAuth同意画面のアプリ名も「ライブリコ」に更新。
```

## 棚卸し結果（マナス報告・2026-06-21）＝置換対象の全箇所
> 旧表記「LiveLog」「ライブログ」「livelog.app」「manus.space」等が出る箇所。詳細表はマナス報告のとおり。主な所在：
- 画面UI：`client/src/App.tsx`(29,42,43,50) / `AppLayout.tsx`(71) / `FeedbackAdmin.tsx`(44) / `PublicProfile.tsx`(550)
- シェア/OGP文言：`ShareButton.tsx`(42,43) / `PublicProfile.tsx`(331,332) / `ProfileEdit.tsx`(105,106)
- HTMLメタ：`client/index.html`(12=`{{project_title}}`／description・OGP・Twitterカードは**未設定**)
- ドキュメント：`Docs.tsx`(217,285,287,651,324,329) / `Manual.tsx`(108,161,203,240,443) / `Changelog.tsx`(125)
- メール(Resend)：`server/mailer.ts`(7,30,33,49,72,75)
- 内部/その他：`LiveDetail.tsx`(iCal 1119,1121,1134) / `Upcoming.tsx`(90) / `setlistRouter.ts`(UA 170,208) / `livesRouter.ts`(1496) / `Settings.tsx`(531,548,573) / `Friends.tsx`(214 LocalStorageキー) / `profileRouter.ts`(128) / `server/_core/env.ts`(12 旧OAuthコールバック)
- 画像/PWA：favicon(未確認) / `manifest.json`(無し=新規) / OGP画像(無し=新規)

## ⚠️ 起因（単純置換だと壊れる/要注意の箇所）
1. **`server/_core/env.ts:12` 旧ドメインのOAuthコールバックURL**（`livelogapp-...manus.space/api/oauth/google/callback`）。**いま格闘中のログイン不具合と直結**。フォールバックでこれが使われると liverico.app でOAuthが壊れる。→ 新ドメインに更新＋「フォールバックが実際に使われていないか」を要確認。**最優先**。
2. **`Friends.tsx:214` LocalStorageキー `livelog_friends`**。改名すると**既存ユーザーの保存データが迷子**になる。→ キーは変えない、または読み込み時に旧キー→新キー移行を実装。
3. **`Settings.tsx` バックアップ/CSVのファイル名(531,573)＋復元検証文字列(548)**。検証文字列を変えると**既存の `livelog_backup_*.json` が復元できなくなる**。→ 復元は**新旧両方の目印を受理**するように（後方互換）。
4. **`client/index.html:12 {{project_title}}`**。コードではなく**Manus管理UI（Settings→General→Website name）で「ライブリコ」に変更**。コード置換と混同しない。
5. **`server/mailer.ts:7` 送信元 `onboarding@resend.dev`**。ブランド統一なら **`hello@liverico.app`＋Resendのドメイン認証(SPF/DKIM)** が要る。未認証のままだと到達率・なりすまし扱いのリスク。
6. **画像/PWA：manifest.json新規・OGP画像新規・favicon差し替え**。PWA名/テーマ色/OGP画像は**アプリ本体カラー（ピンク→オレンジ）と新ロゴ**で作る（navy×gold厳禁）。
7. **表記の使い分け統一**：日本語UI＝**ライブリコ**／英字ロゴ・ハンドル・技術ID＝**LiveRico**（naming-brief表記ルール）。一括置換で混ぜない。
8. **URL群（`manus.space` / `livelog.app`）の置換先は最終ドメイン構成しだい**（apex=LP＋ログイン一体／開発サイト隔離／FBはアプリ内＝doc構成）。確定まではひとまず `liverico.app` に寄せる。UserAgent内 `livelog.app`(setlistRouter)も要修正。
9. iCal PRODID(1119)変更は低リスク（既存取込済みイベントには影響なし・識別子のみ）。

## 残タスク
- [ ] ロゴ透過PNGを `docs/livelog/assets/` へ配置（林さんがCanvaから書き出し）
- [ ] マナス：棚卸し報告 → 一括置換 → ロゴ差し替え → OAuth同意画面名称変更
- [ ] App Store / Google Play のアプリ名・スクショ（配布時）
