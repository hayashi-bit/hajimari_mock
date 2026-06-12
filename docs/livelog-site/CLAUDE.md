# LiveLog Developer Docs — Claude Code 引き継ぎ

## このプロジェクトについて
LiveLogアプリの開発者向けドキュメントサイト。
単一HTMLファイル（index.html）で構成されており、Netlifyでホスティング。

## 現在の公開URL
https://peaceful-bonbon-b14dd5.netlify.app/

## ファイル構成
```
docs/
  index.html   ← ドキュメントサイト本体（単一ファイル）
  CLAUDE.md    ← この引き継ぎ書
```

## Netlify自動デプロイのセットアップ手順

### 1. このフォルダをLiveLogリポジトリに追加
```bash
# LiveLogリポジトリのルートで
mkdir docs
cp index.html docs/
cp CLAUDE.md docs/
git add docs/
git commit -m "docs: 開発者向けドキュメントサイトを追加"
git push
```

### 2. NetlifyでGitHub連携
1. https://app.netlify.com を開く
2. 「Import from Git」→「GitHub」を選択
3. LiveLogリポジトリを選択
4. Build settings:
   - Base directory: `docs`
   - Publish directory: `docs`
   - Build command: （空欄でOK）
5. Deploy

### 3. 以降の更新フロー
```bash
# Claude Codeで index.html を編集後
git add docs/index.html
git commit -m "docs: 〇〇を追加"
git push
# → Netlifyが自動でデプロイ（約30秒）
```

## ドキュメントの構成（index.html内）

### ナビゲーション構造
- はじめに: overview / stack / status
- バックエンド: arch / lives / artists / setlist / memos / auth / db
- フロントエンド: pages / components / hooks
- インフラ: env / phases

### ページ追加方法
index.html内で以下の2箇所を編集：

**① サイドバーにナビ項目追加**
```html
<div class="nav-item" onclick="show('新ID',this)">
  <i class="ti ti-アイコン名"></i>新しいページ名
</div>
```

**② ページ本体を追加**
```html
<div id="page-新ID" class="page">
  <div class="topbar"><div class="topbar-title">ページタイトル</div></div>
  <!-- コンテンツ -->
</div>
```

## 技術仕様
- 純粋なHTML/CSS/JS（フレームワーク不使用）
- フォント: Inter（本文）、JetBrains Mono（コード）
- アイコン: Tabler Icons（CDN）
- レスポンシブ対応済み（モバイル・タブレット・デスクトップ）
- ダークモード: 未対応

## カラーパレット
```css
--navy: #1a3a52;   /* メインカラー */
--gold:  #d4af37;  /* アクセント */
--bg:    #ffffff;
--bg2:   #f8f8f7;
--bg3:   #f2f2f0;
```
