# G1-1 実装依頼（Manus向けプロンプト）：Gmail解析のLLM化

このファイルは、LiveLog本体（Manus上）に実装を依頼するための「そのまま貼れる」指示書。
現状 `gmailParser`（正規表現）を **LLM構造化抽出** に置き換える（仕様書 `03_gmail_integration_spec.md` の §4 を実体化）。

関連: `05_gmail_email_analysis.md`（調査結果・確定項目）, `03_gmail_integration_spec.md`（基本仕様）

---

## モデル選定（決定：Sonnet 4.6）

- 採用: **`claude-sonnet-4-6`**（2026-06-16 決定）。理由＝未知の小規模メールや「宣伝 vs 購入」の微妙な判定の精度がコア価値（取りこぼし・誤登録防止）に直結するため、最初から品質を取る。既存 `api/chat.ts` も Sonnet 4.6 で運用統一できる。
- コストは Haiku の約3倍だが、Gmail自動取込はプレミアム限定＋月上限のため収益の1%未満（100人で約$27/月、1000人で約$270/月）。
- もしコストが気になれば `claude-haiku-4-5` へはモデルID 1行で下げられる（評価ハーネス `tools/gmail_eval` で精度差を実測可能）。
- 構造化出力（JSON Schema強制）は Sonnet 4.6 / Haiku 4.5 ともに対応。

---

## やること（Manusへの指示本文）

`gmailParser` を、以下を満たす LLM 解析関数に置き換えてください。

### 入力
- メール1通の `subject`（件名）, `from`（送信元）, `body`（本文プレーンテキスト）, `messageId`, `receivedAt`(ISO)

### 処理
- Claude API（`claude-haiku-4-5`）に本文を渡し、**構造化出力（output_config.format の json_schema）** で下記スキーマに抽出させる。
- まず `isTicketRelated`（購入実績か）を判定し、宣伝・先行案内・ログイン通知・スポーツ等は `false` にして取り込まない。
- `from` だけで判定しないこと（巨人戦も e+ から届く＝本文で判定）。
- 受信日 ≠ 公演日。公演日は本文の「公演日/日程/公演日時」を使い、転送メールの転送日や受信日は無視する。
- 全角の会場名（ＴＯＫＩＯ ＴＯＫＹＯ等）は半角正規化。
- 都道府県が本文に無ければ会場名から推定（渋谷→東京、Zepp Yokohama→神奈川 等）。
- `title`（公演名）がアーティスト名そのものか、フェス/企画名かを判断し、フェスなら `artistName` は空でよい（後段補完）。

### 出力スキーマ（JSON Schema）
```json
{
  "isTicketRelated": "boolean",
  "emailType": "lottery_apply | lottery_result | payment | issuance | purchase_complete | resale | announce | other",
  "title": "string 公演名",
  "artistName": "string アーティスト名（複数は / 区切り、フェスは空可）",
  "liveDate": "string YYYY-MM-DD",
  "openTime": "string HH:mm",
  "startTime": "string HH:mm",
  "venue": "string 会場名（半角正規化）",
  "prefecture": "string 都道府県",
  "ticketCompany": "string e+/ぴあ/ローチケ/LivePocket 等",
  "ticketFormat": "paper | digital | unknown",
  "ticketCount": "integer 枚数",
  "price": "integer 合計金額(円)",
  "seatInfo": "string 席種・券種",
  "statusHint": "pre_sale|on_sale|pre_lottery|lottery_pending|lottery_won|lottery_lost|payment_pending|print_pending|ticket_secured|attended|not_attended|cancelled|resale",
  "applyDeadline": "string YYYY-MM-DD 申込/購入締切",
  "lotteryResultDate": "string YYYY-MM-DD 当落発表日",
  "paymentDeadline": "string YYYY-MM-DDTHH:mm 入金期限",
  "ticketingDeadline": "string YYYY-MM-DDTHH:mm 発券期限",
  "sourceUrl": "string 公演詳細URL",
  "confidence": "number 0.0-1.0"
}
```
※ 値が取れない項目は空文字（数値は null）。`05_gmail_email_analysis.md §7` の確定項目を反映済み。

### 後続（既存仕様どおり）
- `isTicketRelated=false` は登録しない。
- `messageId` で重複チェック（G1-2）。同一メールは再解析・再登録しない。
- ステータスは前進方向のみ更新（G1-3）：申込→当落→入金→発券→確保。後退させない。
- `sourceType='gmail'`, `sourceMessageId=messageId` を lives に保存。

---

## ゴールデンテスト（実メール5通・必ずこの期待結果になること）

実ユーザーのGmailから採取した実データ。氏名・払込番号はマスク済み。

| # | 入力（要旨） | 期待される主な抽出 |
|---|---|---|
| 1 | LivePocket当選「Hype The Rock vol.3」渋谷FOWS 2025/3/2 開場18:00開演18:30 一般1枚 支払期限2024/12/29 ファミマ ¥4,945 | isTicketRelated=true / status=payment_pending / format=digital / title=Hype The Rock vol.3 / venue=渋谷FOWS / pref=東京 / liveDate=2025-03-02 / startTime=18:30 / ticketCount=1 / paymentDeadline=2024-12-29T23:59 |
| 2 | ぴあ「前髪ぱっつん少年」TOKIO TOKYO(東京都) 2025/12/25 18:30開演 スタンディング一般3,500円1枚 当選 支払期限2025/10/18 合計4,325円 | status=payment_pending / title=前髪ぱっつん少年 / venue=TOKIO TOKYO / pref=東京 / liveDate=2025-12-25 / startTime=18:30 / price=4325 / paymentDeadline=2025-10-18T23:59 |
| 3 | ローチケ「すりぃ」KT Zepp Yokohama 2026/3/3 19:00開演 1Fスタンディング1枚 当選 入金期間〜2026/2/2 合計6,900円 | status=payment_pending / title=すりぃ / venue=KT Zepp Yokohama / pref=神奈川 / liveDate=2026-03-03 / startTime=19:00 / price=6900 / paymentDeadline=2026-02-02 |
| 4 | e+「アザミ」WWW 2024/8/16 18:45開場19:30開演 オールスタンディング1枚 発券開始 発券期間〜2024/8/17 ¥4,440 | status=print_pending / format=paper / title=アザミ / venue=WWW / pref=東京 / liveDate=2024-08-16 / startTime=19:30 / ticketingDeadline=2024-08-17 |
| 5 | e+「【WEB限定】2025東京ドーム巨人戦・セゾンカード会員さま限定先行受付」野球の先行案内 | **isTicketRelated=false**（宣伝＋スポーツ・送信元は同じe+でも本文で除外） |

合格条件: 1〜4 は購入実績として正しく構造化、5 は確実に除外。`title/venue/liveDate/status` を最重視し、5通とも正答すること。

---

## 受け入れ基準
- 5通のゴールデンテスト全通過。
- 既存の正規表現ベースライン（`gmail_extract_sample.csv`）に対し、`price / paymentDeadline / sourceUrl` の取得率が明確に向上していること（情報が本文にあるのに取れていなかった項目）。
- `title / liveDate` の取得率 95%+。
