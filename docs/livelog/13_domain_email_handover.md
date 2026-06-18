# 【依頼書】新ブランド「ライブリコ（LiveRico）」ドメイン取得＋ブランドメール発行 手順書

作成: 2026-06-17 ／ 依頼元: 林 ／ 宛先: ThreeWay インフラ担当
対象ドメイン: **liverico.app** ／ 既存環境: Google Workspace（threeway.co.jp）・ドメインはお名前.com管理

---

## 0. やりたいこと（一言）
> **`liverico.app` を取得し、既存のGoogle Workspaceに追加して、`admin@liverico.app` と `hello@/support@liverico.app` を使えるようにしたい。**
> ゴール：林が**いつものGmailで `@liverico.app` を送受信できる**状態。新サービスの登録・サポートを全部このメールに統一する。

## 0-1. 目的（背景）
新サービス「**ライブリコ（英字: LiveRico）**」を立ち上げます。SNSアカウントや各種サービスの登録・サポート対応を、すべて **@liverico.app の独自メール**に統一したい。
既存のGoogle Workspaceに**ドメインを追加するだけ**で実現できるため（新規Workspace契約は不要）、下記をお願いします。

## 1. 依頼サマリー（3ステップ）
1. **お名前.comで `liverico.app` を取得**（会社の既存アカウントで一元管理）
2. **既存Google Workspaceに `liverico.app` をセカンダリドメインとして追加**（所有権確認＋MX設定）
3. **メールアドレスを発行**：`admin@liverico.app`（登録/復旧用）／`hello@liverico.app`・`support@liverico.app`（公開サポート用）

> ※ コストは**ドメイン代（年¥約2,000）のみ**。エイリアス＋グループ運用なら**Workspaceの追加席（月額）は不要**。

---

## 2. 詳細手順

### STEP 1. ドメイン取得（お名前.com）
- [ ] お名前.com にログイン → ドメイン検索「liverico」→ **`.app`** を選択して取得・決済
- [ ] 取得後：**Whois代理公開ON／ドメインロックON／自動更新ON**（ブランド資産のため失効厳禁）

### STEP 2. Google Workspace にドメイン追加
- [ ] **admin.google.com**（特権管理者）→ **アカウント → ドメイン → ドメインの管理 → ドメインを追加**
- [ ] `liverico.app` を入力 → **「セカンダリ ドメイン」を選択**
      ⚠️ 「ドメインエイリアス」ではなく**セカンダリ**（hello@ 等の独自ローカル部を作るため）
- [ ] **所有権の確認（TXT）**：管理コンソールに表示される確認用TXTレコードを、**お名前.comのDNSレコード設定**に追加 → 確認実行
- [ ] **MXレコード設定**（お名前.comのDNS）：Google Workspaceのメール配信先を設定
  - 新方式（推奨・1レコード）: ホスト名 `@`／タイプ `MX`／優先度 `1`／値 `SMTP.GOOGLE.COM`
  - もしくは従来方式（5レコード）:
    | 優先度 | 値 |
    |---|---|
    | 1 | ASPMX.L.GOOGLE.COM |
    | 5 | ALT1.ASPMX.L.GOOGLE.COM |
    | 5 | ALT2.ASPMX.L.GOOGLE.COM |
    | 10 | ALT3.ASPMX.L.GOOGLE.COM |
    | 10 | ALT4.ASPMX.L.GOOGLE.COM |
- [ ] **到達率向上の認証レコード**（DNSにTXTで追加・サポートメール運用のため推奨）
  - SPF: `v=spf1 include:_spf.google.com ~all`
  - DKIM: 管理コンソール → アプリ → Google Workspace → Gmail → **メールの認証** で鍵を生成 → 出力されたTXTをDNSに追加 → 認証を開始
  - DMARC（任意）: `_dmarc.liverico.app` TXT に `v=DMARC1; p=none; rua=mailto:admin@liverico.app`
- [ ] DNS反映を待って、Workspace側で「**有効**」を確認（お名前は反映が比較的早い）

### STEP 3. メールアドレス発行（追加月額0円の方法）
- [ ] **admin@liverico.app**：林の既存ユーザー（hayashi@threeway.co.jp）に**エイリアス追加**（無料）
      → SNS/各サービスの登録・復旧用。林の受信箱に届く
- [ ] **hello@liverico.app**・**support@liverico.app**：**グループ（共有受信箱）として作成**（無料）
      → メンバーに林（＋将来サポート担当）。複数人で対応・Gmailで返信可
- [ ] 送信テスト：各アドレスで送受信できるか確認（Gmailの「名前を指定して送信」も設定可）

---

## 3. 完了後に共有してほしいもの（納品/報告）
- [ ] 取得したドメイン名・有効期限・自動更新ONの状態
- [ ] 発行したメールアドレス一覧（admin@／hello@／support@）
- [ ] 林がGmailで `@liverico.app` を**送受信できる**状態になったことの確認
- [ ] （あれば）DNS設定のスクショ or 設定値の控え

---

## 4. コスト
| 項目 | 費用 |
|---|---|
| ドメイン `liverico.app` | 年 ¥約2,000（お名前.com） |
| Google Workspace 追加 | **¥0**（セカンダリドメイン＋エイリアス＋グループ運用の場合） |
| 専用ユーザーを増やす場合 | 1席 ¥約800/月（必要時のみ） |

---

## 5. 注意・運用ルール
- **ドメインは失効厳禁**（メールが死ぬ＝SNS等の復旧不能）。自動更新・ロック必須。
- 登録/復旧用 `admin@` は**公開しない**。公開窓口は `hello@/support@` に分ける。
- 関連アカウントは**2段階認証ON**。
- 今後、本サービス関連のメールは**すべて @liverico.app に統一**する方針。

---

## 補足（背景情報）
- ブランド表記：**ライブリコ**（日本語）／**LiveRico**（英字・ロゴ/ハンドル）。
- ドメインTLDは `.app`（アプリ訴求・冗長なし・安定価格）を採用。`.com` は実在サービスがあり不可、`.live` は「live」二重で不採用。
- SNSハンドル（@liverico）確保も並行で進行中。
