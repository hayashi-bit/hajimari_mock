# LiveLog（ライブリコ）— 移行ハンドオーバー文書（Manus作成・記録用コピー）

> このファイルは Manus が liverico-app リポジトリに置いた引き継ぎ文書（リポジトリ内では
> MIGRATION_GUIDE.md / handover.md として存在）の記録用コピー。正本はリポジトリ内。
> 作成日: 2026-06-26 ／ 対象バージョン: `cea37872`（Manus WebDev プロジェクト `livelog_new`）
> スタック: React 19 + Tailwind 4 + Express 4 + tRPC 11 + Drizzle ORM + TiDB/MySQL

---

## 1. ビルド・起動・構成

### 1-1. 必要条件
| 項目 | 値 |
|------|----|
| Node.js | 22.x（`.nvmrc` 未設定・`engines` 未設定） |
| パッケージマネージャ | `pnpm`（`pnpm-lock.yaml` で固定） |
| DB | MySQL 互換（TiDB Serverless / PlanetScale / RDS MySQL 8.0 等） |

### 1-2. コマンド
```bash
pnpm install
pnpm dev      # NODE_ENV=development tsx watch server/_core/index.ts → http://localhost:3000
pnpm build    # フロント: vite build → dist/public/ ／ バック: esbuild server/_core/index.ts → dist/index.js
NODE_ENV=production node dist/index.js
```

### 1-3. 待受ポート
```ts
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(port, ...);
```
`PORT` があればそれを、なければ 3000。Railway/Render/Fly は PORT 自動注入＝変更不要。

### 1-4. ディレクトリ構成
```
client/src/{pages,components,lib/trpc.ts(baseURL:/api/trpc),App.tsx}
drizzle/{schema.ts,migrations/}
server/_core/(OAuth・JWT・tRPC・Vite統合) ・db.ts・routers.ts・livesRouter.ts・
  gmailRouter.ts・profileRouter.ts・setlistRouter.ts・spotify.ts・appleMusicHelper.ts・
  mailer.ts・dailyBackupHandler.ts(日次バックアップ)
shared/(共通型・定数)
```

## 2. 環境変数
**値は絶対コミットしない（.env は .gitignore 済み）。**

### 2-1. 引き継ぎ必須
`DATABASE_URL` / `DATABASE_URL_DEV` / `JWT_SECRET`(★変更で全セッション無効化) /
`GOOGLE_CLIENT_ID`(237418704687-…) / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`(移行先ドメインに更新) /
`SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` / `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY` /
`RESEND_API_KEY` / `SETLIST_FM_API_KEY` / `TAVILY_API_KEY` / `DEV_AUTH_BYPASS`/`DEV_USER_EMAIL`(開発のみ)

### 2-2. 差し替え対象（Manus固有）
`BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY`（LLM・Storage・Heartbeat）／
`VITE_FRONTEND_FORGE_API_KEY` / `VITE_FRONTEND_FORGE_API_URL`（移行後は削除推奨＝サーバー経由に統一）

### 2-3. 移行後に削除可能
`OAUTH_SERVER_URL` / `VITE_OAUTH_PORTAL_URL` / `VITE_APP_ID` / `OWNER_OPEN_ID` / `OWNER_NAME`

## 3. 認証アーキテクチャ
- 2層：Google OAuth（主系・`GET /api/oauth/google/callback`・新規はこちらのみ）／
  Manus OAuth（互換残存・`GET /api/oauth/callback`・新規不使用）。
- フロー：getLoginUrl()→accounts.google.com→callback→getToken/userinfo→db.resolveGoogleUser
  (`openId="google_{googleId}"`)→jose JWT HS256(有効期限1年)→`app_session_id`クッキー(httpOnly/sameSite:none/secure)。
- セッション：JWT HS256(jose)・署名鍵 `JWT_SECRET`・**Manus依存なし（完全独自実装）**。
- 移行注意：`google_`プレフィックスのユーザーはそのままログイン可／旧Manusユーザーは再ログイン要／
  `GOOGLE_REDIRECT_URI`更新＋Google Cloud ConsoleにURI追加登録。

## 4. データベース（17テーブル・本番行数 2026-06-26）
users5 / lives228 / ticket_images0 / artists241 / setlist_items223 / memos0 / import_tokens0 /
gmail_tokens3 / gmail_analysis_cache3142 / feedbacks0 / gmail_email_decisions462 / friendships4 /
gmail_sync_jobs3 / gmail_sync_results0 / live_performers134 / follows0 ／ **合計4,445**。
- **TiDB固有機能は不使用**（標準MySQL）。TiDB継続なら `DATABASE_URL` 変更のみ。
※doc47バックアップ(06:20)時点とは件数が微増（取得タイミング差）。正本はリポジトリ内handover。

## 5. Manus固有コンポーネント差し替えロードマップ
| 優先 | 対象 | 工数 | 方針 |
|---|---|---|---|
| P1 | Heartbeat cron | 大2-3日 | `scheduledHandlers.ts`の認証を CRON_SECRET Bearer に。create/deleteHeartbeatJob を Railway Cron 登録へ |
| P1 | Forge Storage→S3/R2 | 中1-2日 | `server/storage.ts` を @aws-sdk/client-s3(既存)へ。既存画像URLのDB更新スクリプト要 |
| P2 | Forge LLM→OpenAI等 | 小半日 | `BUILT_IN_FORGE_API_URL`変更・モデル名 gemini-2.5-flash を変更 |
| P3 | Manus OAuthコールバック削除 | 小1h | `/api/oauth/callback` 削除 |
| P3 | Viteプラグイン削除 | 小30m | manus-runtime/jsxLoc 削除 |
| 不要 | notifyOwner | - | 未使用・削除 |

- Heartbeat：`heartbeat.ts`が `BUILT_IN_FORGE_API_URL/webdevtoken...` へ gRPC-over-HTTP。
  認証 現＝`sdk.authenticateRequest`→Forge `GetUserInfoWithJwt`／移行後＝`Bearer {CRON_SECRET}`。
  `gmail_tokens.scheduleCronTaskUid` は更新 or 廃止。
- Storage：既存画像URLは `/manus-storage/{key}`、`storageProxy.ts` が Forge S3 へ307。
  選択肢＝①新ストレージへ再UP＋DB URL更新(推奨) ②旧への読みプロキシを移行期間のみ維持。

## 6. 外部サービス（差し替え不要・直接HTTP）
Spotify / Apple Music / Resend / Setlist.fm / Tavily / Google APIs(Gmail)。envを引き継ぐだけ。

## 7. tRPCクライアント
`client/src/lib/trpc.ts` は相対パス `/api/trpc`＝同一オリジン前提。別オリジン分離なら絶対URLに変更要。

## 8. バックアップ
初回フル（2026-06-26 UTC）= `liverico_backup_20260626.zip`。本番ダンプ1.73MB＋manifest＋
復元検証 全17テーブル PASS（検証用DB `liverico_restore_test` で確認後破棄）。
移行期間中は日次自動（`server/dailyBackupHandler.ts`）。
