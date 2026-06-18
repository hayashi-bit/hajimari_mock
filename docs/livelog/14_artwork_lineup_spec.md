# アートワーク＆出演者 実装指示書（Manus向け・3本）

作成: 2026-06-18 ／ Gmailと並行で進める機能。コンセプト「AIで楽しく・気持ちよく」「フェス出演者の自動補完」「SNS映え画像(B-3)」に対応。

## 全体像と優先度
| 優先 | 機能 | 役割 |
|---|---|---|
| ★1 | ① Spotifyアー写連携 | 土台。アーティスト名→写真。全機能に効く |
| ★2 | ② フェス出演者追加 | 貼付/画像→AI抽出。各出演者は①で写真自動付与 |
| ★3 | ③ フライヤー保存 | 既存の画像取込を流用、低コストで見栄え向上 |

## 共通の前提（Manus側で確認・流用）
- **画像ストレージ**：既存アプリで使っている仕組み（S3 / Supabase Storage 等）を流用。新規導入不要。
- **LLM**：Gmail解析で使っている `parseEmailWithLLM` と同じ Claude(構造化出力) の仕組みを流用。
- **権利**：Spotify画像はSpotify Developerガイドライン内で表示（出典/帰属）。フライヤーはユーザー投稿物。リリース前に規約整理（別途）。

---

# ① Spotify アー写連携（★1・土台）

```
artists にアーティスト写真を自動付与してください。Spotify Web API を使います。

【セットアップ】
- Spotify Developer でアプリ登録 → Client ID / Secret を取得。
- env: SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET
- 認証は Client Credentials Flow（ユーザーログイン不要）。取得した access_token は約1時間キャッシュして再利用。

【DBスキーマ追加（artists）】
- imageUrl       varchar  -- Spotifyのアーティスト画像URL
- spotifyId      varchar  -- SpotifyのアーティストID
- imageSource    varchar  -- 'spotify' 等
- imageFetchedAt datetime -- 取得日時（再取得制御）
- imageStatus    varchar  -- 'ok' | 'not_found' | 'needs_review'（名前が曖昧で複数候補のとき）

【取得ロジック】
- アーティストが新規作成された時、または imageUrl が空の時に Spotify を検索：
  GET https://api.spotify.com/v1/search?q={artist名}&type=artist&limit=5
- マッチ選定：名前を正規化(全半角・大小・空白除去)して完全一致を優先 → 無ければ人気(popularity/followers)最上位。
  - 完全一致が無く候補が割れる場合は imageStatus='needs_review' にして、UIで手動確認できるようにする。
- 取得できたら images[0].url / id / name を保存。not_found は imageStatus='not_found' で記録（毎回叩かない）。
- 既存アーティストの一括バックフィル用に、imageUrl が空のものをまとめて処理するジョブも用意（レート制限対策で逐次＋ディレイ）。

【表示】
- ライブカード・アーティストプロフィール・(将来)フェス出演者一覧で imageUrl を表示。無い時はプレースホルダ。

【注意】
- 日本のアーティストは表記ゆれ(英字/日本語)があるため、完全一致が取れない場合は needs_review に逃がす（誤った写真を出さない）。
- レート制限：結果はDBキャッシュし、再取得は imageFetchedAt から一定期間後のみ。

【報告】
- 追加したカラム、Spotify検索の実装箇所、テスト数件（例: 「ずっと真夜中でいいのに。」「美波」「ReoNa」）の取得結果(imageUrl/imageStatus)。
```

---

# ② フェス出演者の追加（★2）

```
フェス等のライブに「出演者リスト」を一括追加できるようにしてください。既存の画像/テキスト取込AIを流用します。

【目的】
フェス登録時に出演者を自動で埋め、「お目当て/気になる/新発見」で整理できるようにする。

【DBスキーマ】
- 中間テーブル live_artists を用意（無ければ作成）:
  - liveId, artistId, interestTag enum('target','curious','discovery','none') default 'none',
    isHeadliner bool default false, sortOrder int
- artists は ① の写真付与対象（新規追加分も自動でSpotify検索）。

【取得方法（2系統）】
A. 貼付/画像→AI抽出（主・確実）
   - ユーザーがラインナップのテキスト or タイムテーブル画像を貼る/アップロード
   - LLM(構造化出力)で { festivalName, artists: [アーティスト名...] } を抽出（Gmailと同じClaude仕組みを流用）
B. AI Web検索（補助）
   - 「{フェス名} {年} 出演者/ラインナップ」でWeb検索し候補を提示（要ユーザー確認・needs_confirm扱い）

【フロー】
1. ライブ(フェス)を登録 or 開く
2. 「出演者をAIで追加」→ A(貼付/画像) または B(AI検索)
3. 抽出した出演者リストをプレビュー → ユーザーが取捨選択・編集
4. 確定したら artists にエンティティ化（既存と名前で重複排除）＋ live_artists に紐付け
5. 各出演者は①でSpotify写真が自動付与
6. 各出演者に interestTag（お目当て/気になる/新発見）を付けられる

【報告】
- live_artists の設計、AI抽出の実装箇所、テスト（フェスのTT画像1枚で何名抽出できたか／写真が付いたか）。
```

---

# ③ フライヤー保存（★3・低コスト）

```
ライブに「フライヤー（告知画像）」を保存・表示できるようにしてください。既存の画像取込を流用します。

【DBスキーマ（lives）】
- flyerUrl varchar -- 告知画像のストレージURL

【ロジック】
1. 「画像から取り込む」でユーザーがアップロードした告知画像を、AI解析に使うだけでなく
   そのまま既存ストレージに保存し、作成/更新したライブの flyerUrl に紐付ける（追加実装は最小）。
2. ライブ詳細に「フライヤーを追加/差し替え」アップロードも用意（手動でも付けられる）。

【表示】
- ライブ詳細・カードで flyerUrl を表示（アー写とは別枠）。

【報告】
- 追加カラム、画像保存の実装箇所、取込画像が flyerUrl に入ることの確認。
```

---

## 着手順（推奨）
**① → ② → ③**。理由：①の写真基盤ができてから②の出演者を追加すると自動で写真が付き、③も含め一気に映える。Gmail（過去5年・スキップ永続化）とは独立に並行可能。
