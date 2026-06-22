# 夜間 自動実装 完全指示書（マナス向け・確認なしで一気に進めてOK）

作成: 2026-06-22 ／ 位置づけ＝Gmail取込が本番で完走確認済み（5分・ETA/中止/プレビュー/前髪ぱっつん少年取得/広告非混入）。
ここから A〜F をガードレール内で、林の都度確認を待たずに進める。**マナスはミスが多い前提で、各項目に「正確なファイル位置・完全なコード・プロンプト全文・受け入れ基準（Acceptance）」を付ける。** 推測で書かず、まず該当ファイルを開いて現状を確認してから当てはめること。

---

## 0. 全体の大原則（破ってはいけない）

1. **本番データを失わない／壊さない。** DELETE/DROP/TRUNCATE/広範囲UPDATEは、対象件数を先に`SELECT COUNT(*)`で確認し、バックアップ（該当行を別テーブルにINSERT SELECT、または件数とサンプルをログ記録）を取ってから。
2. **本文非保存。** Gmail本文をDB・ログ・キャッシュに残さない。調査は「送信元＋件名のメタデータのみ」。`gmail_analysis_cache`にも本文を入れない。
3. **プレビュー→確認→取込を維持。** 自動でユーザーのライブに直接INSERTしない。必ず`gmail_sync_results`に出して、ユーザーが確認してから本登録。
4. **スキーマ変更はdev/prod両方に明示適用。** `webdev_execute_sql`は本番DB（`DRIZZLE_DATABASE_URL`=us-east-1）に固定で繋がる地雷あり。**どのDBに対して実行しているか毎回明示し、devとprodの両方に同じ変更を当てる。** 片側だけにしない（ドリフト4回の元凶）。
5. **テスト96+とスモークを通してからチェックポイント保存。** 実装・チェックポイント保存は進めてよい。**公開（本番デプロイの最終公開）は林が起きてから。**
6. **STOPして待つのは次の3つだけ：** ①本番データの破壊的大量操作 ②大規模アーキ変更 ③新規コスト発生（Reserved等）。これ以外は止まらず進める。
7. 各項目の完了時に**何をどのDB/ファイルに対して行ったか＋Acceptanceの結果**を朝レポートに残す。

8. **【重要・クレジット節約】着手前に「もう直っていないか」を必ず確認する。** A〜Fには、過去のセッションで既に修正済み・実装済みのものが混じっている可能性が高い。各項目に入る前に、まず該当コード/DB/挙動を読んで**現状を確認**し、**すでにAcceptanceを満たしているものは実装せずスキップ**（朝レポートに「確認済み・対応不要」と1行記録するだけ）。「念のため作り直す」を禁止。推測ループでクレジットを燃やさない＝確認→不要なら触らない。

9. **全項目の実装が終わったら、開発履歴（changelog）を更新する。** changelog自動記録の仕組み（liverico.app/changelog.json）に、今回の各実装を1件ずつ追記する（タイトル・日付・要点。画像があれば添付）。開発サイトの③開発履歴（自動）に反映される形にする。

---

## A. バグ修正

### A-1. 加藤さん「ご要望・質問」入力欄に文字が打てない
**現状調査（先にやる）:** お問い合わせ/フィードバックのフォーム該当コンポーネントを開き、`<textarea>`/`<input>`が
- `value`を持つのに`onChange`が無い（＝制御された読み取り専用化）か
- `disabled`/`readOnly`が付いているか
- 親が`pointer-events:none`やオーバーレイで覆っていないか
を確認。最頻原因は「`value={state}`はあるが`onChange`未配線」。

**修正パターン（制御コンポーネント）:**
```tsx
const [feedback, setFeedback] = useState("");
// ...
<textarea
  value={feedback}
  onChange={(e) => setFeedback(e.target.value)}
  placeholder="ご要望・ご質問をどうぞ"
  rows={5}
/>
```
**Acceptance:** 実機（できればモバイル幅）で文字入力→送信→保存先（DBまたは通知）に届く。空送信時のバリデーションも確認。

### A-2. ロゴ表示＝案3（静的配信に統一）
storageProxy（署名付きURL・期限切れで消える経路）を**ロゴ/OGP/aicon等の固定アセットに使わない**。`public/`に置いて静的配信。
- ファイルを`public/`（例 `public/logo.png` `public/ogp.png`）に配置。
- 参照を`<img src="/logo.png">`の固定パスに。HTMLの`<meta property="og:image" content="https://liverico.app/ogp.png">`も固定URLに。
**Acceptance:** シークレットウィンドウ・時間をおいた再読込でロゴ/OGPが消えない（署名期限の影響を受けない）。

### A-3. 上部タブのスワイプ誤タップ → タップ式タブUI
スワイプジェスチャでタブ切替している箇所を、**明示的にタップできるタブ**へ。スワイプ依存をやめ、各タブを`role="tab"`のボタンにして`onClick`で切替。タップ領域は最低44px高。
**Acceptance:** 横スクロール/スワイプで誤って別タブに飛ばない。タップで確実に切替。

### A-4. PWA案内を控えめに
「ホーム画面に追加」等の案内が押し付けがましい/頻出する場合、表示頻度を下げる（一度閉じたら一定期間出さない＝`localStorage`にdismiss記録）。モーダルで操作を妨げない。
**Acceptance:** 案内は1回出して閉じたら当面再表示されない。本来操作を邪魔しない。

### A-5. 同期UI 状態復元の本番確認
過去に「処理中で固まる」バグの修正（checkpoint bbd9146b）が入っている：done/errorジョブは無視・完了時`lastSyncAt`更新・`useEffect`依存に`syncStatus?.processedCount`を含める。**本番で再現テスト:** 同期完了後にリロード→「処理中」で固まらない／完了サマリーが出る。
**Acceptance:** 完了済みジョブでポーリングが回り続けない。リロードしても状態が正しく復元。

---

## B. Gmailチューニング

### B-1. 件数の一貫性（31 vs 79）調査
プレビュー件数と完了サマリー件数が食い違う原因を、**メタデータのみ**で調査：
- 重複（同一`messageId`の二重カウント）→ `unique(userId, messageId)`制約と`COUNT(DISTINCT messageId)`で確認。
- Step2で除外したものをサマリーに含めていないか（分母の定義ズレ）。
- バックフィルと増分の二重計上。
**Acceptance:** プレビュー件数＝確認画面件数＝完了サマリー件数の定義が一致し、数が合う。差異が出る場合は「定義の違い」を朝レポートに明記。

### B-2. カレンダー通知・他人転送をプレビューでフラグ
自分が買ったチケットでないもの（Googleカレンダーのリマインダ転送、友人からの転送メール等）を**除外ではなくフラグ表示**し、ユーザーが確認画面で外せるように。判定はLLMのStep3出力に項目追加：
```
"source_kind": "self_purchase" | "calendar_reminder" | "forwarded" | "unknown",
"confidence": 0.0〜1.0
```
プレビューで`self_purchase`以外は「要確認」バッジを付ける。デフォルトのチェックは`self_purchase`のみON。
**Acceptance:** カレンダー通知/転送が「要確認」で見分けられ、誤登録されない。

### B-3. 網羅性確認
既知の網漏れ（eplus.co.jp / pia.co.jp 等）が拾えているか、**from:フィルタを付けない広い網**を維持しつつ確認。前髪ぱっつん少年（チケットぴあ経由）が継続して取れること。
**Acceptance:** 主要プレイガイド＋小規模アーティストが取りこぼされない。

### B-4. publicId / `/u/1` 確認
publicId採番と公開プロフィール`/u/:publicId`が正しく動くか本番確認。
**Acceptance:** `/u/1`等が正しく表示。

### B-5. 体感UX（doc30 §6・推奨優先順）
1. **直近優先＋順次表示**：新しいメールから処理し、取れたものからカードが増える。
2. **見つかった件数＋ETA**：「ライブを探しています… 12件見つかりました」＋残り時間。
3. （並列化は実装済み）
4. **完了サマリー**：「5年分・79公演・最多はサカナクション5回」。
5. 離脱OK＋完了通知。
**Acceptance:** 「動いてる安心感」と「見えてくるわくわく感」が両方ある。60分待たされない。

#### LLM堅牢パース（不変条件・Step2/Step3共用）
```ts
export function parseLLMJson<T = unknown>(raw: string): T {
  let s = raw.trim();
  // ```json ... ``` / ``` ... ``` のフェンス除去
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // 最初の { から最後の } までを切り出す（前置き/末尾コメント対策）
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return JSON.parse(s) as T;
}
```
**system末尾に必ず（Step2/Step3共通）:**
```
出力は純粋なJSONのみ。コードブロック(```やjson)・前置き・説明文・末尾コメントを
一切付けない。最初の文字が { で、最後の文字が } であること。
```

---

## C. Heartbeat 増分自動同期

増分同期（`lastSyncAt`以降の新着のみ）をHeartbeat/cronで回す。
- **完了で自分を解除**（無限ループ防止）。**削除/退会で停止。**
- `lastSyncAt`の自己回復（途中失敗でも次回続きから）。
- **stagger**（全ユーザー同時起動しない＝レート/負荷分散）。
- 増分も**プレビュー→確認**を維持（自動本登録しない）。
**公開は林が起きてから。** 実装・dev検証まで進めてよい。
**Acceptance:** 新着チケットメールが増分で拾われ、二重取込しない。完了で自己解除。

---

## D. ビジュアル

### D-1. フライヤー（公演フライヤー画像）
- 保存・表示・**公開範囲は「友達まで」を初期値**。
- storageProxyの署名URL期限切れに注意（固定表示が要る箇所は静的/恒久URL方針に合わせる）。
**Acceptance:** フライヤーが保存・表示でき、デフォルトで友達までに限定。

### D-2. チケット画像
- **個人情報・QRを含むためデフォルト非公開。**
- 表示時もQR領域の扱いに注意（最低でも公開範囲は本人のみ初期値）。
**Acceptance:** チケット画像が他人に見えない初期設定。本人は確認可。

---

## E. Apple Music アー写カバー率検証

`tools/apple_music_eval/run_eval.py`を**3つの認証情報（env）**で実行：
- `APPLE_TEAM_ID` `APPLE_KEY_ID` `APPLE_PRIVATE_KEY_PATH`（.p8の秘密鍵パス。**.p8の中身はチャット/コードに貼らない・env経由**）。
- `fixtures.py`の16組（前髪ぱっつん少年・meiyo・ロクデナシ 他）で「アー写OK n/16」を出す。
**JWT（ES256）生成の要点（既存run_eval.py内）:**
```python
import jwt, time
token = jwt.encode(
    {"iss": TEAM_ID, "iat": int(time.time()), "exp": int(time.time()) + 60*60*12},
    private_key,                      # .p8 の内容（envから）
    algorithm="ES256",
    headers={"kid": KEY_ID, "alg": "ES256"},
)
# GET https://api.music.apple.com/v1/catalog/jp/search?types=artists&term=...
#   Authorization: Bearer <token>
#   -> data.results.artists.data[].attributes.artwork.url があれば OK
```
**Acceptance:** 「アー写OK n/16」比較表を朝レポートに添付。**前髪ぱっつん少年が取れるか**を明記。良ければアー写＋予習プレイリスト実装に進む（ルール3：実リスト検証の表を必ず添える）。

---

## F. ticketCompanyCustom カラムのDROP

`ticketCompanyCustom`（0019マイグレーションでDROP対象・値0・未使用）を**本番にも適用**。
- **破壊的操作なので手順厳守：** ①dev/prod両方で`SELECT COUNT(*) FROM <table> WHERE ticketCompanyCustom IS NOT NULL AND ticketCompanyCustom <> ''`で実データ0を確認 → ②値・件数を朝レポートに記録（バックアップ代わり）→ ③dev DROP → 検証 → ④prod DROP。
- どちらのDBに実行したか毎回明示（`webdev_execute_sql`の本番固定に注意）。
**Acceptance:** dev/prod両方からカラムが消え、アプリが正常動作（テスト96+/スモーク通過）。

---

## 朝レポート（林が起きて最初に見る形）
- A〜F各項目：やったこと／対象ファイル・対象DB（dev/prod）／Acceptance結果（○/×/保留）。
- STOPで止めた項目があればその理由（①破壊的大量操作 ②大規模アーキ ③新規コスト）。
- Apple Music：アー写OK n/16の表＋前髪ぱっつん少年の可否。
- **スキップした項目**（すでに直っていて対応不要だったもの）を1行ずつ。
- 未完・要判断（公開待ち含む）を箇条書き。
- **開発履歴（changelog）を更新したか**（更新済みの件数）。
