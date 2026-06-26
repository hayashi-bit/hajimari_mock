# Sentry導入（Express・本番が見える状態を最初に作る）

目隠しデバッグの根治。Day1で入れる。

## 1. パッケージ
```bash
pnpm add @sentry/node
```

## 2. 初期化（サーバー起動の最初・他のrequireより前が理想）
`server/_core/index.ts` の冒頭：
```ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? "development",
  tracesSampleRate: 0.1,
});
```

## 3. Expressのエラーハンドラ（ルート定義の後・最後に）
```ts
// すべてのルート定義の後
Sentry.setupExpressErrorHandler(app);
```
※ @sentry/node v8 では `Sentry.setupExpressErrorHandler(app)` を使う。
   tRPC側の例外も、onError でSentryにcaptureExceptionすると拾える：
```ts
// trpc の createExpressMiddleware の onError 等で
onError({ error }) { Sentry.captureException(error); }
```

## 4. 疎通確認
- 一時的に `/debug-sentry` ルートで `throw new Error("sentry test")` を投げ、
  SentryのIssuesに出ることを確認してから削除。

## 5. 環境変数
- `SENTRY_DSN` を Railway Variables に登録（開発では未設定でも可）。

## 受け入れ基準
- 本番でエラーが起きたらSentryに即見える＝「推測で潰す」をやめられる。
