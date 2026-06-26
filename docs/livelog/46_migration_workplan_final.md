# ライブリコ 移行 確定工程表（Manus実コード調査 反映版）

作成: 2026-06-26 ／ 出所: Manusのコード実査(migration_analysis)＋doc44計画。
結論: 不確実性が解消。**認証は浅〜中・TiDB保持でデータ移動ゼロ＝実質1週間前後**。

## 0. 確定した事実（移行を軽くする決定打）
- **認証はManus非依存**：Google OAuthは`accounts.google.com`直実装、JWTは`jose`独自実装。
  `ctx.user.id`は`protectedProcedure`(trpc.ts 1箇所)に集約。Manus OAuthコールバックを消すだけ。
  同じ`GOOGLE_CLIENT_ID`再利用可（redirect URI追加のみ）。
- **DBはTiDB保持で可**：TiDB固有機能ゼロ・標準MySQL。Drizzleは`DATABASE_URL`差し替えのみ。**データ移動ゼロ**。
- **同一オリジン構成**：tRPCは相対`/api/trpc`、フロント/バックは同一ポート3000。
  → **分割せずRailway1サービスで丸ごと配信が最速**（CORS無し・URL変更無し・Vercel不要）。
- 外部API(Tavily/Spotify/Apple Music/Resend/Setlist.fm/Google)は直接呼び＝env引き継ぐだけ。

## 1. 目標スタック（速度最適・確定提案）
| 層 | 移行先 | 備考 |
|---|---|---|
| ホスティング | **Railway 1サービス**（Expressがフロントも配信） | 同一オリジン維持＝最速。将来分割可 |
| DB | **TiDB Cloud 保持** | データ移動ゼロ。外部接続(IP許可リスト)だけ確認 |
| 認証 | 既存Google OAuth + jose JWT を維持 | Manus OAuthコールバック削除のみ |
| 画像 | **Cloudflare R2**(S3互換) | `@aws-sdk/client-s3`は既にpackage.jsonにあり |
| LLM | **Anthropic**(or OpenAI互換) | Forge LLMはOpenAI互換＝URL/キー/モデル名差し替え |
| Cron | **Railway Cron**(+CRON_SECRET Bearer) | Heartbeatの認証を差し替え |
| ログ | **Sentry** + Railwayログ | 目隠しデバッグの根治（最初に入れる） |

## 2. 差し替え対象と工数（Manus申告ベース）
| 対象 | 難易度 | 工数 | 要点 |
|---|---|---|---|
| Heartbeat cron → Railway Cron | 高 | 2〜3日 | `scheduledHandlers.ts`の認証をForge JWT→CRON_SECRET Bearerに。`createHeartbeatJob`削除、`gmail_tokens.scheduleCronTaskUid`を用途変更/廃止 |
| Storage → R2 | 中 | 1〜2日 | `storage.ts`をaws-sdk実装に。`storageProxy`をR2署名URL/CDNへ。既存`/manus-storage/{key}`画像のURL移行スクリプト |
| LLM → Anthropic | 低 | 半日 | `BUILT_IN_FORGE_API_URL`差し替え＋モデル名変更(gemini-2.5-flash→Claude) |
| Manus OAuth削除 | 低 | 1時間 | `/api/oauth/callback`と`sdk.ts`の該当を削除 |
| Viteプラグイン削除 | 低 | 30分 | manus-runtime/jsxLoc除去 |
| notifyOwner | 不要 | - | 未使用・削除 |

## 3. 工程表（並行・目安5〜7営業日）
**Day0 下ごしらえ（並行）**
- 林：アカウント(GitHub repo/Railway/Cloudflare R2/Sentry)、Google Cloud Consoleアクセス。
- クロコ：Manusのコードを実リポジトリで受領→ローカルで起動確認の段取り。

**Day1 配線疎通（最優先・Authなし画像なしで本番が動く所まで）**
- GitHubリポジトリ整備＋mainブランチ保護。
- Manus Viteプラグイン除去・esbuild/viteビルドをRailwayで通す。
- **Railwayに1サービスでデプロイ→空に近い状態でも本番URLが開く**（miiiroの3時間ループ予防）。
- Sentry導入（本番エラーが見える状態を先に作る）。
- TiDBにDATABASE_URLで接続（dev用は別DB/別接続に分離）。

**Day2 認証を本番で通す**
- JWT_SECRET等を移行先envへ（**JWT_SECRETは必ず引き継ぐ＝変えると全セッション無効化**）。
- Google Cloud Consoleに移行先ドメインのredirect URIを追加。
- Manus OAuthコールバック削除→Google OAuth単独でログイン疎通。

**Day3-4 Storage移行**
- `storage.ts`をR2(aws-sdk)へ。`storageProxy`をR2へ。
- 既存`/manus-storage/{key}`画像をR2へ再アップロード＋DBのURL更新スクリプト（非破壊・検証付き）。

**Day4-6 Heartbeat(Gmail増分同期)移行**
- Railway Cronで`/api/scheduled/gmail-incremental`を叩く。認証をCRON_SECRET Bearerに。
- `scheduleCronTaskUid`の扱いを変更。増分同期がプレビュー→確認を維持して動くか検証。
- 長時間ジョブ(バックフィル)がRailway常時起動で完走するか確認。

**Day5-7 LLM差し替え＋機能パリティ検証＋切替**
- LLMをAnthropicへ。Gmail抽出が同等以上に動くか検証。
- 全機能スモーク(記録/友達/公開プロフィール/フライヤー/アー写/Gmail)。
- **切替(Cutover)**：liverico.appのDNS/ドメインをRailwayへ。問題が出たらManusに戻せる状態で。

## 4. データ安全（非交渉）
- 切替前に**TiDB全テーブルの検証付きフルバックアップ**(dump＋件数記録)。TiDB保持でも必ず取る。
- 画像URL移行は**非破壊**(新URL書き込み前に旧を保持・件数照合)。
- JWT_SECRET引き継ぎ必須。切替はロールバック可能に。モニター(ヘビーユーザー2人＋林)は無停止。
- 本番データ・liverico.appドメイン・本文非保存原則を維持。

## 5. クリティカルな落とし穴（先に潰す）
1. **JWT_SECRETを変えない**（全ユーザー強制ログアウトになる）。
2. **画像URL移行を忘れると既存フライヤー/チケットが全部表示崩れ**（storageProxy撤去と同時にURL更新）。
3. **Google redirect URI**を移行先ドメインで追加しないとログイン不可。
4. **Heartbeat認証の差し替え**（Forge JWT前提のままだと増分同期が動かない）。
5. 旧Manus OAuthのみのユーザー(openIdが`google_`でない)は再ログイン必要＝対象がいないか確認(主要ユーザーはGoogle OAuth)。

## 6. 林に確認したい決定（5点）
1. ホスティング＝**Railway1サービス丸ごと**でよいか（推奨・最速）。
2. 画像＝**Cloudflare R2**でよいか（推奨・S3互換で安い）。
3. LLM＝**Anthropic**に寄せるか、OpenAI互換にするか（Gmail抽出のモデル選定）。
4. リポジトリ名（新規）。
5. TiDBの接続文字列を移行先から使えるよう、**IP許可リスト/接続情報**を用意できるか。
