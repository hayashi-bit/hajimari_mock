# ライブリコ 移行計画（Manus→標準スタック+Claude Code）圧縮版

作成: 2026-06-25 ／ 決定：門倉さん・林ともに移行GO。明日開始。2〜3週間は使えない＝圧縮する。
関連: doc42(アセスメント)/43(門倉ブリーフ)。

## 0. 速度を出す中核判断
- **DBはTiDB Cloudのまま保持**（Postgres等に移さない）。Drizzle=MySQL方言のため移すと
  スキーマ書き直し＋危険な大移動が発生。保持すれば「データ移行＝接続先の差し替え」で済み、
  リスクも時間も激減。→ 剥がすManus固有は **①Auth ②画像ストレージ ③ホスティング** の3つだけ。
- **コードは活かす**：React(フロント)・tRPC/Drizzle(バック)は標準＝そのまま移植。書き直さない。
- **並行構築・無停止**：Manusは動かしたまま。新スタックが本番疎通→検証→DNS切替（ロールバック可）。

## 1. 目標スタック（推奨・初日に確定）
| 層 | 現状(Manus) | 移行先(推奨) | 理由 |
|---|---|---|---|
| フロント | React on Manus | **Vercel** | Reactの定番・即デプロイ |
| バック | Express+tRPC on Manus Autoscale | **Railway**(or Render) | 常時起動＝Gmailバックフィル等の長時間ジョブに強い(Vercel不向き) |
| DB | TiDB Cloud | **TiDB Cloud 保持** | 方言維持・データ移動回避(最大の時短) |
| 認証 | Manus Auth | **Auth.js(NextAuth) + Google** | 既にGoogle OAuth＝ユーザー体験変化が最小 |
| 画像 | Manus forge(storageProxy) | **Cloudflare R2**(S3互換) | 安価・S3互換で実装容易。既存画像は移行 |
| ログ | 不可視 | **Sentry + Rail/Vercelログ** | 目隠しデバッグの根治(最優先で先に入れる) |

## 2. 圧縮スケジュール（並行トラック・目安1週間前後／Auth結合で前後）
**Day0(明日)＝棚卸し＋下ごしらえ（ここが全ての前提）**
- Manus：全コードをGitHubへpush＋**結合ハンドオーバー文書**＋両DBのダンプ(バックアップ)＋env一覧(名前のみ)。
- 林：アカウント準備(GitHub repo / Vercel / Railway / Cloudflare R2 / Sentry / Google Cloud OAuth)。
- クロコ：コードを読み**Auth結合の深さを実測**→目標スタック確定→真の所要を確定。

**Track-配線(最優先)**：GitHubリポジトリ整備→GitHub Actions CI/CD→**Hello Worldを本番ドメインで疎通**
→Sentry→mainブランチ保護→.env(local/production)分離→ローカルDB(docker)でdev分離。
※「配線疎通」の定義＝**Authなし・画像なしでも最小構成が本番で動く**まで(沼回避)。

**Track-DB**：Day0のダンプで**検証付きフルバックアップ**→新バック(Railway)をTiDBに接続→
dev/prodを正しく分離→drizzleマイグレーションを一本道化→件数整合チェック。

**Track-Auth(最大リスク・単独タスク)**：Manus Authを剥がしAuth.js+Googleに差替。
OAuthコールバックURL・セッション・userId参照を全部繋ぎ直す。**他の機能移行より先に完結**。

**Track-画像**：forgeストレージの画像をR2へ移行＋参照URLを差し替え。疎通確認はユーザーに見せない段階で。

**Track-機能パリティ**：新スタックでGmail取込/記録/友達/公開プロフィールが動くことを検証(テスト＋スモーク)。

**切替(Cutover)**：liverico.appのDNS/ドメインを新ホストへ。問題が出たらManusに戻せる状態で。

## 3. データ安全（非交渉）
- 移行前に**検証付きフルバックアップ**(両DB全テーブルdump＋件数記録)＝step0。バックアップ協力は依頼可。
- TiDB保持なら大移動は無いが、念のためダンプは取る。切替はロールバック可能に。
- 本番データ・liverico.appドメイン・モニター(ヘビーユーザー2人＋林)のアクセス・本文非保存原則は維持。

## 4. Manusへの当面方針
- **新機能は積まない**(doc41の重い機能はホールド＝移行先で作る)。
- Day0の棚卸し(コードpush＋ハンドオーバー＋ダンプ)に全集中。
- モニターは現Manus版で無停止継続。

## 5. クロコの正直な但し書き
- 1週間前後は「Auth結合が浅〜中」が前提。深ければ延びる＝Day0のコードを読んで即確定する。
- TiDB保持で最大のリスク(データ移動)を消しているので、miiiroの段取りより速く回せる見込み。
