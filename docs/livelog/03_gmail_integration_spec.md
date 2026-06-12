# LiveLog 仕様書 ③ Gmail 連携(チケットメール自動取り込み)

> 対象アプリ: **LiveLog**(Manus WebDev プロジェクト)
> この文書は **Manus(マナス)に実装を依頼するための実装指示書**。
> 前提: **① Google ログインは実装済み**。本機能は同じ Google OAuth 基盤に**スコープを追加**して実現する。
> 設計原則: **特定の販売サービスにハードコード依存しない汎用設計**(全ユーザー・全販売元で動く)。

---

## 0. 目的と価値

### 解決する課題
1. **取りこぼし解消**: e+/ぴあ/ローチケの3大サイトに乗らない**小規模イベント**(代官山の小箱フェス、対バン、自主企画 等)を取得できない。これらは Peatix / ZAIKO / LivePocket / teket など**バラバラの販売元**で売られる。
2. **ステータス手入力の手間**: 抽選→当落→入金→発券→確保 のステータス更新を手動でやっている。

### Gmail を使う理由(汎用性の核)
> 販売プラットフォームがどれだけ多様でも、**「申込/購入/当落/入金/発券の通知メールは必ずユーザーのGmailに届く」**。
> よって **Gmail を横断検索すれば、販売元を問わず**ライブ情報とステータス変化を拾える。
> 特定サービスのAPI連携ではなく **Gmail一本**に寄せることで、**将来現れる新サービスにも自動対応**できる。

### 提供価値(2層)
| 層 | 内容 | 対応 |
|---|---|---|
| ① 新規登録 | メールから未登録ライブを自動登録 | 取りこぼし解消 |
| ② ステータス自動更新 | 既存ライブのステータスをメールから自動更新 | 手間ゼロ |

→ いずれも**プレミアム機能(課金の壁)**として提供する想定。

---

## 1. 認証(既存 Google OAuth にスコープ追加)

- 既存の Google OAuth(①)に **Gmail 読み取りスコープを追加**:
  - `https://www.googleapis.com/auth/gmail.readonly`
- **段階的同意(incremental authorization)**を使う:
  - ログインは最小スコープ(`openid email profile`)のまま。
  - 設定画面で「Gmail連携を有効にする」を押したときに**追加スコープを別途要求**する。
  - → Gmailを使わないユーザーに余計な権限を求めない(同意率・審査の観点で重要)。
- `access_type=offline` + `prompt=consent` で **refresh_token** を取得し保存。

### Google Cloud Console 側(オーナー作業)
1. 対象プロジェクト(LiveLog)で **Gmail API を有効化**。
2. OAuth同意画面にスコープ `gmail.readonly` を追加。
3. `gmail.readonly` は **制限付きスコープ(restricted scope)** のため、**一般公開には Google のセキュリティ審査(CASA含む)が必要**。
   - 審査前は「テストユーザー」に登録したアカウントのみ利用可。
   - → **MVP段階はテストユーザー運用、本公開前に審査申請**(リードタイム数週間を見込む)。

---

## 2. DB スキーマ

### 既存 `gmail_tokens` を利用(App Overview に既存)
| カラム | 用途 |
|---|---|
| `id` | PK |
| `userId` | ユーザー紐付け |
| `accessToken` | 暗号化保存推奨 |
| `refreshToken` | **暗号化保存必須** |
| `expiresAt` | アクセストークン有効期限 |

追加カラム(推奨):
| カラム | 用途 |
|---|---|
| `lastSyncedAt` | 最後に取り込んだ時刻(増分取得の起点) |
| `historyId` | Gmail History API 用(増分同期する場合) |
| `enabled` | 連携ON/OFF |

### `lives` への追加(重複防止・追跡用)
| カラム | 用途 |
|---|---|
| `sourceType` | 取得元 `'manual' \| 'eplus' \| 'image' \| 'gmail'` |
| `sourceMessageId` | 由来Gmailメッセージ ID(重複登録防止のキー) |

### ステータス履歴(任意・②の信頼性向上)
`status_history` テーブル(`id, liveId, fromStatus, toStatus, source, sourceMessageId, createdAt`)
→ メール由来の自動更新を監査・取り消し可能にする。

---

## 3. メール取得ロジック(Gmail API)

### 検索クエリ(汎用・販売元非依存)
特定ドメインに依存せず、**広めに拾ってからLLMで判定**する方針。
ベースクエリ例(Gmail検索構文):

```
newer_than:1y (
  チケット OR 抽選 OR 当選 OR 当落 OR 落選 OR 入金 OR 支払 OR 発券 OR
  公演 OR ライブ OR LIVE OR 来場 OR 申込 OR お申し込み OR 受付 OR リセール OR
  ticket OR lottery OR order OR confirmation
)
```

- 既知の主要販売元(`peatix.com`, `zaiko.io`, `livepocket.jp`, `teket.jp`, `eplus.jp`, `pia.jp`, `l-tike.com` 等)は**ブースト用のヒント**として持つが、**必須条件にはしない**(新サービス対応のため)。
- 取得は `users.messages.list` → `users.messages.get`(`format=full` か必要部分)。
- 増分取得: `lastSyncedAt` / `historyId` 以降のみ。初回のみ過去1年分。

### パイプライン
```
1. Gmail検索でチケット候補メールを列挙(message id 一覧)
2. 各メールの本文(text/plain 優先, なければ html→text 変換)を取得
3. 既に sourceMessageId 登録済みならスキップ(重複防止)
4. LLM で「これはライブ/チケット関連か?」を判定 + 構造化抽出(§4)
5. 抽出結果を 新規登録 or ステータス更新 に振り分け(§5)
6. lastSyncedAt 更新
```

---

## 4. LLM 解析(汎用パーサー)

**販売元ごとのルールを書かず、LLM に構造化抽出させる**(=新サービスにも自動対応)。
既存の `parseEplusText` / `parseImageLive` と同じ `invokeLLM` 基盤を流用。

### 抽出スキーマ(出力 JSON)
```json
{
  "isTicketRelated": true,
  "emailType": "lottery_apply | lottery_result | payment | issuance | purchase_complete | resale | announce | other",
  "title": "公演名",
  "artistName": "アーティスト名（複数は / 区切り）",
  "liveDate": "2026-08-15",
  "venue": "会場名",
  "prefecture": "東京都",
  "ticketFormat": "paper | digital | unknown",
  "price": 8800,
  "seatInfo": "整理番号A-12",
  "deadlineDate": "2026-07-01",
  "deadlineTime": "23:59",
  "openTime": "17:00",
  "startTime": "18:00",
  "statusHint": "pre_sale|on_sale|pre_lottery|lottery_pending|lottery_won|lottery_lost|payment_pending|print_pending|ticket_secured|attended|not_attended|cancelled|resale",
  "confidence": 0.0
}
```

### プロンプト要件
- システム: 「あなたは日本のライブ/コンサートのチケットメールから情報を抽出する専門家」
- 入力: メールの 件名 + 送信元 + 本文(プレーンテキスト化)
- 出力: 上記JSONのみ。判定不能フィールドは null。
- `emailType` と `statusHint` の対応(§5の表)をプロンプトに明示。
- **広告/メルマガ/一般販促は `isTicketRelated:false`** で弾く(誤登録防止)。

---

## 5. 振り分けロジック(新規登録 / ステータス更新)

### emailType → status 対応
| emailType | 意味 | status |
|---|---|---|
| `lottery_apply` | 抽選申込完了 | `lottery_pending` |
| `lottery_result`(当選) | 当選通知 | `lottery_won` |
| `lottery_result`(落選) | 落選通知 | `lottery_lost` |
| `payment` | 入金/支払い案内 | `payment_pending` |
| `issuance` | 発券案内（紙/電子も判定） | `print_pending` + `ticketFormat` |
| `purchase_complete` | 購入完了/座席確定 | `ticket_secured` |
| `resale` | リセール案内 | `resale` |
| `announce` | 公演発表/先行案内 | `pre_sale` / `pre_lottery` |

### マッチング(既存ライブとの突合)
```
同一ライブか判定 = (アーティスト名 or 公演名の類似) AND (liveDate 近接, 同日〜数日)
  ├─ 一致する既存ライブあり → ② ステータス更新（statusの前進のみ。後退は原則しない）
  └─ 一致なし → ① 新規ライブ作成（sourceType='gmail', sourceMessageId 記録）
```

- **ステータスは「前進」方向のみ自動更新**(例: ticket_secured を payment_pending に戻さない)。後退の可能性がある変化は「提案」に留める。
- 重複防止キー: `sourceMessageId`(同一メールの二重処理を防ぐ)+ ライブの (artist, date, venue) 近似。

---

## 6. UX(設定画面 + プレビュー)

**安全第一: いきなり自動登録せず、初期は「プレビュー → ユーザー承認 → 反映」**。

### 設定画面 / Gmail連携セクション
1. 「Gmail連携を有効にする」ボタン → 追加スコープ同意(§1)
2. 「メールから取り込む」ボタン → `gmail.scan` 実行
3. **プレビュー画面**:
   - 新規登録候補(チェックボックスで取捨選択)
   - ステータス更新候補(「○○ を 当選 に更新しますか?」)
   - 各項目に**由来メールの件名/日時**を表示(透明性)
4. 「選択した項目を反映」で確定
5. 連携状態・最終同期時刻・「連携解除」ボタン

### 将来(任意): 自動バックグラウンド同期
- `heartbeat`(既存の定期実行)で定期スキャン → 新着のみ自動処理 or 通知。
- まずは手動ボタン運用でMVP、ニーズ確認後に自動化。

---

## 7. tRPC API(`gmailRouter` 新設)

```
gmail.getAuthUrl()         // Gmail追加スコープの認可URLを返す
gmail.handleCallback(code) // refresh_token取得→gmail_tokens保存
gmail.status()             // 連携状態・lastSyncedAt
gmail.scan()               // メール検索→解析→「候補」を返す（DB未反映のプレビュー）
gmail.apply(selections)    // 選択された候補を反映（新規作成/ステータス更新）
gmail.disconnect()         // トークン削除・連携解除
```
- すべて `protectedProcedure`。プレミアム制限を入れる場合は `premiumProcedure`(②で定義)に。

---

## 8. プライバシー / セキュリティ(重要)

- **スコープは `gmail.readonly` のみ**(送信・削除権限は要求しない)。
- メール本文は**解析に使うだけで永続保存しない**(抽出後のライブ情報のみ保存)。`sourceMessageId` は参照用IDのみ保持。
- `refreshToken` は**暗号化して保存**。
- 連携解除時はトークンを**確実に revoke + 削除**。
- プライバシーポリシーに「Gmailからチケット情報のみ読み取り、本文は保存しない」旨を明記(Google審査の必須要件)。
- LLMに渡すのはチケット候補と判定したメールのみ。広告/私信は弾く設計(§4)。

---

## 9. テスト観点

- [ ] Gmail連携 同意 → refresh_token 保存 → status() が connected。
- [ ] scan() が候補を返す(新規/ステータス更新の両方)。
- [ ] 同じメールを2回scanしても重複登録されない(sourceMessageId)。
- [ ] 当選メール → 既存ライブが `lottery_won` に更新。
- [ ] 落選メール → `lottery_lost`。発券(紙)メール → `print_pending` + `ticketFormat=paper`。
- [ ] 小規模販売元(Peatix/ZAIKO/LivePocket等)のメールも販売元ハードコード無しで拾える。
- [ ] 広告メールが isTicketRelated:false で弾かれる。
- [ ] 連携解除でトークンが revoke される。

---

## 10. リリース戦略(段階)

| 段階 | 内容 |
|---|---|
| MVP | 手動「メールから取り込む」+ プレビュー承認 + 新規登録のみ。テストユーザー運用 |
| v2 | ステータス自動更新を追加 |
| v3 | バックグラウンド自動同期 + 期限リマインダー通知(プレミアムの目玉) |
| 公開 | Google 制限付きスコープ審査(CASA)を通して一般公開 |

---

## 11. 依存関係 / 順序

- **前提**: ① Google ログイン(実装済み)。
- **関連**: ② Stripe/プレミアム — Gmail連携を `premiumProcedure` でゲートする場合に必要。
- **布石**: 期限リマインダー通知(Resend 連携済み)とセットで「自動化」の価値が完成する。
