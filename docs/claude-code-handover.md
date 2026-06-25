# Claude Code 開発引き継ぎドキュメント

## 概要

このドキュメントは `hajimari_mock` の開発セッション（2026年6月）での経験をもとに、
新しいプロジェクトを Claude Code で開発する際に同じ失敗を繰り返さないための引き継ぎ資料です。

---

## 1. このセッションで何がうまくいかなかったか

### 1-1. Vercel 本番デプロイが更新されない（最大の問題・3時間ループ）

**何が起きたか：**
- PR #20 が `hayashi-bit` アカウントによって GitHub にマージされ、Vercel が本番デプロイ
- その後 PR #21〜#26 を Claude Code の MCP ツール（`mcp__github__merge_pull_request`）でマージしたが、Vercel が一切反応しなかった
- `hajimari-dashboard.vercel.app` は PR #20 の古いコードのまま（開発ダッシュボードが表示）
- コードは正しかった。デプロイが動かなかっただけ

**根本原因：**
Vercel の GitHub 連携（GitHub App）は **`hayashi-bit` アカウントが push/merge したときのみ** 本番デプロイをトリガーする。
Claude Code の MCP が使う GitHub App は別の App ID であり、Vercel の Webhook がそれを無視する。

**やってしまった無駄な対応：**
- `notify` ブランチにダミーコミットを push して Vercel を起動しようとした（全て ERROR）
- `mcp__github__push_files` で main に直接 push した（Vercel は無視）
- `mcp__Vercel__deploy_to_vercel` ツールを呼んだ（CLI コマンドを返すだけで何もできなかった）
- 複数回 PR を作っては同じ問題に直面した

**恒久解決策（最初からやるべきだったこと）：**
GitHub Actions workflow を使う。`.github/workflows/deploy.yml` を main に置くことで、
**誰が push しても** Vercel へのデプロイが走る。

必要な準備（えいじさんに1回だけお願いすること）：
1. Vercel ダッシュボード → Account Settings → Tokens → Create Token（期限なし）
2. GitHub → リポジトリ → Settings → Secrets → 以下3個登録
   - `VERCEL_TOKEN`：上記で作ったトークン
   - `VERCEL_ORG_ID`：Vercel のチーム/個人 ID
   - `VERCEL_PROJECT_ID`：Vercel のプロジェクト ID

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel Production
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        run: npx vercel deploy --prod --yes --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**新しいプロジェクトへの教訓：**
> Vercel + GitHub MCP を組み合わせる場合、**最初の設定時に必ず GitHub Actions deploy workflow を用意すること。**
> これをしないと、Claude Code が何をしても本番に反映されない。

---

### 1-2. ブランチの使い回しによるコンフリクト（繰り返し発生）

**何が起きたか：**
- `claude/stoic-johnson-uKcMA` という1つのブランチを複数の PR に使い回した
- PR マージ後もそのブランチを使い続けたため、古いコミット履歴との差分でコンフリクトが頻発
- コンフリクト解消のたびに余計なマージコミットが生まれ、履歴が汚れた

**根本原因：**
タスクごとに fresh なブランチを切らずに同じブランチを再利用した。

**正しいやり方：**
```bash
# タスクのたびに必ず origin/main から新しいブランチを切る
git fetch origin main
git checkout -B feat/task-name origin/main
```

**新しいプロジェクトへの教訓：**
> 1タスク = 1ブランチ。必ず `origin/main` から fresh に切る。
> マージ済みのブランチは二度と使わない。

---

### 1-3. TypeScript ビルド設定ミス（tsconfig.json）

**何が起きたか：**
- `api/chat.ts` が HTTP 500 を返し続けた（PR #18〜#20 の間、複数のデバッグ試行）
- ハードコードレスポンステスト、ミニマルハンドラなど多くの迂回策を試みた

**根本原因：**
`tsconfig.json` の `module` が `ESNext` になっていた。
Vercel のサーバーレス関数は Node.js の `require()` で読み込むため、CommonJS 出力が必要。
ESModule 出力だとハンドラが export される前に 500 エラーになる。

**修正内容（1行）：**
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "CommonJS",        // ESNext → CommonJS に変更
    "moduleResolution": "node",  // bundler → node に変更
    ...
  }
}
```

**新しいプロジェクトへの教訓：**
> Vercel サーバーレス関数（`api/*.ts`）を使う場合、tsconfig は必ず `module: CommonJS` にすること。
> `VercelRequest` / `VercelResponse` 型も正しく import すること（`req: any` は NG）。

---

### 1-4. 根本原因の特定に時間をかけすぎた

**問題のパターン：**
1. エラーが発生
2. 表面的な対処（ファイル内容を変える、再 push する）
3. 同じエラーが続く
4. さらに別の迂回策を試みる
5. 根本原因にたどり着くのに数時間かかる

**正しいアプローチ：**
エラーに直面したら、まず以下を確認する：
- Vercel のデプロイ状態（`list_deployments` ツールで確認）
- ビルドログ（`get_deployment_build_logs` ツールで確認）
- どのコミット・どのアカウントがデプロイをトリガーしたか
- GitHub と Vercel の権限・連携の設定

**新しいプロジェクトへの教訓：**
> 同じエラーが2回続いたら、迂回策ではなく根本原因を調べる。
> デプロイが動かない → まず「誰がpushしたか・どのAppが使われているか」を確認する。

---

## 2. このセッションでうまくいったこと

- チャット API の修正（tsconfig CommonJS 化）は正しく機能した
- `public/` の静的ファイル構成はシンプルで正しい選択だった
- Vercel サーバーレス関数の構造（`api/*.ts`）は正常に動作している
- GitHub Actions workflow の準備は完了している（Secrets 登録後に即動作する）

---

## 3. 新しいプロジェクト（マナス）開始時のチェックリスト

### プロジェクト開始前（えいじさんが1回やること）

- [ ] Vercel プロジェクトを作成し、GitHub リポジトリと連携
- [ ] Vercel Token を発行して GitHub Secrets に登録
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- [ ] `.github/workflows/deploy.yml` を最初のコミットに含める

### TypeScript + Vercel 構成の場合

- [ ] `tsconfig.json` の `module` が `CommonJS` であることを確認
- [ ] `moduleResolution` が `node` であることを確認
- [ ] `api/*.ts` で `VercelRequest` / `VercelResponse` を正しく import

### 開発フロー（Claude Code が守るべきルール）

- [ ] タスクのたびに `git fetch origin main && git checkout -B feat/xxx origin/main`
- [ ] PR マージ後はそのブランチを絶対に再利用しない
- [ ] デプロイが更新されているか、必ず `list_deployments` で確認する
- [ ] 同じエラーが2回続いたら迂回策を止めて根本原因を調査する

---

## 4. 技術スタック・環境メモ（hajimari_mock の場合）

| 項目 | 内容 |
|------|------|
| フロントエンド | 静的 HTML + CSS + Vanilla JS（`public/`） |
| バックエンド | Vercel Serverless Functions（`api/*.ts`） |
| AI | Anthropic claude-sonnet-4-6（SSE ストリーミング） |
| ホスティング | Vercel（本番: `hajimari-dashboard.vercel.app`） |
| DB/Auth | Supabase |
| ビルド | ビルドなし（`echo 'no build step needed'`） |
| デプロイ | GitHub Actions → `vercel deploy --prod` |

---

## 5. Claude Code との付き合い方（えいじさんへ）

- **「時間かかっていい、承認不要で進めて」** は有効。ただし同じエラーのループに入ったら止める
- **デプロイが動かない** → 迂回策より先に「Vercel ダッシュボードで状態確認」を指示する
- **コンフリクトが出た** → 新しいブランチを fresh に切るよう指示する
- **1回の指示で完結しないタスク** → 途中経過を聞いて方向を確認する
- GitHub Actions が設定済みであれば、Claude Code のコード修正は自動的に本番反映される

---

*作成日: 2026年6月25日 / hajimari_mock セッションより*
