# Day1 ランブック：配線疎通（Railway1サービスで本番URLが開くまで）

目的＝**Authなし・画像なしでも最小構成が本番URLで動く**ところまで。miiiroの「3時間ループ」
（デプロイが通らないのにバグと戦う）を最初に潰す。実装機能はまだ触らない。

前提（Day0で揃える）
- `liverico` 新リポジトリ作成、Manusが全コードをpush済み。
- Railway / Cloudflare R2 / Sentry のアカウント。
- TiDBの接続文字列（`DATABASE_URL`）＋IP許可リスト（Railwayから接続可）。

---

## STEP 1. リポジトリ取り込み＆ローカル起動確認
```bash
git clone <liverico repo> && cd liverico
pnpm install
# .env を用意（env.example をコピーして値を入れる。最低 DATABASE_URL / JWT_SECRET）
cp docs/../.env.example .env   # ※配置場所に合わせて
pnpm build        # vite build → dist/public/ ＋ esbuild server → dist/index.js
NODE_ENV=production node dist/index.js   # ローカルで起動確認（PORT未指定なら3000）
```
- ✅ ローカルで起動し、トップが表示されればOK（ログイン前段でも可）。

## STEP 2. PORT対応の確認（Railway必須）
- Railwayは `PORT` 環境変数を注入する。サーバーが `process.env.PORT` を見て待受しているか確認。
- もし `3000` 固定なら、`server/_core/index.ts` の listen を
  `const port = Number(process.env.PORT) || 3000;` に修正（**唯一ありがちな配線の罠**）。

## STEP 3. Manus固有Viteプラグインの除去（ビルドを軽くする）
- `vite.config.ts` から `vitePluginManusRuntime` / `vitePluginManusDebugCollector` / `jsxLocPlugin` を削除。
- `package.json` から `vite-plugin-manus-runtime` 等を削除。
- 再度 `pnpm build` が通ることを確認。

## STEP 4. Railwayにデプロイ（GitHub連携・誰がpushしても本番が動く）
- Railwayで New Project → Deploy from GitHub repo → `liverico` を選択。
- Build/Start は `railway.json`（同梱）で固定：
  - Build: `pnpm install && pnpm build`
  - Start: `node dist/index.js`
- 環境変数は `env.example` の本番分を Railway の Variables に登録（値はマスクで投入）。
- ✅ 発行された Railway の URL を開き、トップが表示される＝**配線疎通クリア**。

## STEP 5. TiDB接続（dev/prod分離）
- 本番用 `DATABASE_URL`（TiDB保持）を Railway に登録。
- 開発用は別DB/別接続（`DATABASE_URL_DEV`相当）に分け、**SQLは開発DB既定**に。
- 起動後、tRPCの軽いread（例：ユーザー数）が返るか確認＝DB疎通OK。

## STEP 6. Sentry（本番が見える状態を先に作る）
- `sentry-setup.md` の手順でExpressに`@sentry/node`を入れ、`SENTRY_DSN`をRailwayに登録。
- わざとエラーを投げてSentryに出ることを確認＝**目隠しデバッグの根治**。

## STEP 7. mainブランチ保護
- GitHub → Settings → Branches → main：直push禁止・PR必須・（可能なら）CIパス必須。

---

## Day1 完了の定義（Acceptance）
- [ ] Railwayの本番URLでトップが開く（Authなしの最小構成でOK）
- [ ] TiDBにRailwayからアクセスできDBのreadが返る
- [ ] Sentryに本番エラーが届く
- [ ] mainブランチ保護が有効
→ ここまでで「コードが正しいのに本番に出ない」状態を卒業。Day2（認証）へ。

## 注意（Day1ではやらない）
- 認証の差し替え・画像移行・Heartbeatは触らない（Day2以降）。最小構成の疎通に集中。
