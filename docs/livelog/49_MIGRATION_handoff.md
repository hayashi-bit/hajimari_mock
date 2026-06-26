# MIGRATION.md — LiveRico 移行 引き継ぎ書（liverico-app に置く正本）

> このファイルは liverico-app セッションが「単体で全部わかる」ための引き継ぎ書。
> まず本リポジトリ直下の `handover.md`（Manusが書いた実コード調査）も必ず読むこと。

## 0. これは何
LiveRico（ライブリコ）＝ライブ参戦の記録・共有・予習アプリ。コアユーザーは
インディー/マイナーのライブに通う人。今は無料モニター配布の直前（有料化はその後）。
ヘビーユーザー2人＋オーナー(林)が実データで使用中。

## 1. なぜ移行するか
Manus基盤の構造的制約で開発が詰まる：本番ログ不可視（目隠しデバッグ）／SQLツールが
本番DB固定（dev/prodドリフト4回）／本物のステージング不在（プレビューと本番が別DB）。
→ 小さなバグで2〜3時間溶ける。標準スタック+Claude Codeなら本番を「見て」直せる。
無料モニター期（データ小）の今が一番安い移行窓。門倉・林ともに移行GO。

## 2. 現状（2026-06-26 時点）
- **アプリ本体コードは push 済み**（このリポジトリ hayashi-bit/liverico-app・287ファイル）。
- **本番DBの検証付きフルバックアップ取得済み**＝復元PASS確認済（全17テーブル件数・指紋一致）。
- **日次バックアップ運用中**（移行完了まで毎日。切替直前に再度フル復元検証）。
- 開発DBのドリフト（ticket_images/follows/age/gender/visibility欠落）はManusが是正済み。

## 3. 技術スタックと目標（5つの確定決定）
現状：React + Express + tRPC + Drizzle ORM + TiDB Cloud(MySQL互換) / Google OAuth+Manus Auth /
画像=Manus forge / LLM=Forge(gemini) / メール=Resend。
| 層 | 移行先（確定） | 理由 |
|---|---|---|
| ホスティング | **Railway 1サービス**（Expressがフロントも配信） | 同一オリジン維持（tRPCは相対パス）=最速・常時起動でGmail長時間ジョブに強い |
| DB | **TiDB Cloud 保持** | TiDB固有機能ゼロ・標準MySQL。Drizzleは接続先差し替えのみ＝**データ移動ゼロ** |
| 認証 | 既存 Google OAuth + jose JWT を維持 | Manus非依存。Manus OAuthコールバック削除のみ。**JWT_SECRET変更厳禁** |
| 画像 | **Cloudflare R2**(S3互換) | aws-sdk既存・egress無料 |
| LLM | **Anthropic**(OpenAI互換窓口) | ドロップインでClaude品質。分類=Haiku/抽出=Sonnet目安 |
| Cron | **Railway Cron + CRON_SECRET** | Heartbeat認証をForge JWT→Bearerに差し替え |
| ログ | **Sentry + Railwayログ** | 目隠しデバッグの根治（最初に入れる） |

## 4. 工程表（並行・5〜7営業日）
- **Day1 配線疎通**：Railway1サービスで本番URLが開く＋Sentry＋TiDB接続＋mainブランチ保護
  （Authなし・画像なしの最小構成で。「コードは正しいのに本番に出ない」状態を最初に卒業）
- **Day2 認証**：JWT_SECRET引き継ぎ＋Google redirect URI追加＋Manus OAuth削除→Google単独ログイン
- **Day3-4 画像**：R2へ移行＋既存 `/manus-storage/{key}` 画像URLの非破壊移行スクリプト
- **Day4-6 Heartbeat（唯一の難所）**：Railway Cron＋認証差し替え。増分同期がプレビュー→確認を維持して動くか検証
- **Day5-7 LLM差し替え＋全機能スモーク＋切替(DNS・ロールバック可)**

## 5. Manus固有＝差し替え対象（handover G より）
| 対象 | 難易度 | 代替 |
|---|---|---|
| Forge LLM (invokeLLM・14箇所) | 低 | OpenAI互換でAnthropicへ。モデル名変更 |
| Forge Storage (storagePut・3箇所) | 中 | @aws-sdk/client-s3 → R2 |
| storageProxy (/manus-storage/*) | 中 | R2署名URL/CDN直URL |
| Heartbeat cron (2関数) | 高 | Railway Cron＋CRON_SECRET。認証(Forge JWT)も差し替え |
| Manus OAuthコールバック | 低 | 削除（openIdが"google_"でない旧ユーザーのみ再ログイン要） |
| Viteプラグイン(manus-runtime/jsxLoc等) | 低 | 削除 |
| notifyOwner | 不要 | 未使用・削除 |

## 6. 絶対に踏まない落とし穴
1. **JWT_SECRETを変えない**（変えると全ユーザー強制ログアウト）
2. **画像URL移行を忘れない**（storageProxy撤去と同時に更新しないと既存フライヤー/チケットが全崩れ）
3. **Google redirect URI** を移行先ドメインで追加（忘れるとログイン不可。GOOGLE_CLIENT_IDは再利用可）
4. **Heartbeat認証の差し替え**（Forge JWT前提のままだと増分同期が死ぬ）
5. **server が process.env.PORT を見ているか**（Railwayは PORT 注入。handoverでは PORT→既定3000）

## 7. 非交渉（安全）
- 本番DB(us-east-1)へ破壊的変更(INSERT/UPDATE/DELETE/DROP/ALTER)を勝手にしない。必要時は明示確認＋バックアップ。
- 本番データを失わない/上書きしない。切替はロールバック可能に。モニター(2人＋林)は無停止。
- .env等の秘密はコミットしない。秘密はRailway Variablesに。本文非保存の原則を維持。
- 新規コスト発生・本番への変更・大規模アーキ変更は止まって林に確認。

## 8. データ事実（バックアップmanifestより・本番DB）
17テーブル・総4,308行。users 5 / lives 228 / artists 241 / live_performers 134 /
gmail_analysis_cache 3142 / setlist_items 159 / gmail_sync_jobs 189 / gmail_sync_results 184。
publicId採番・公開プロフィール /u/:publicId あり。

## 9. 運用体制（脳を割らない）
- **これからの開発の本拠地＝この liverico-app セッション**（コードがここ）。
- 旧 hajimari_mock リポジトリ＝移行計画の記録母艦（doc42〜48）＋開発者向けサイト。常時参照不要。
- 大きな判断は林に確認。Day完了ごとに報告。
