# liverico-app 実装インベントリ（基準表）

*出所: `hayashi-bit/liverico-app` のコード実査（②セッションが並列調査で作成）／受領: 2026-07-01。*
*基準: コードに実在するもののみを「実装済み」と記載。推測・将来予定は含まない。LLMは全機能 **Google Gemini 2.5 Flash（Forge経由）** を使用（Claudeではない）。本番DBは未変更。*

> この表は「資料づくりで盛らないための正」。LP/ピッチ・機能説明・次の着手判断は、必ずこの表の状態（✅実装済み／🟡部分実装／❌未実装）を踏まえること。

## ■1. 画面（ページ）一覧

| 画面名 | URLパス | 役割 | 主なファイル |
|---|---|---|---|
| 予定（トップ） | `/` | 今後のライブ一覧・ステータス管理・カレンダー登録 | `pages/Upcoming.tsx` |
| 履歴 | `/history` | 参加済みライブを年別にまとめて表示（申込/当選/参加数） | `pages/History.tsx` |
| ライブ詳細 | `/live/:id` | 情報/出演者/セトリ/メモのタブ、チケット・画像・カレンダー・公式検索 | `pages/LiveDetail.tsx` |
| 設定 | `/settings` | アカウント・データ書出/バックアップ・Gmail連携・重複検出 | `pages/Settings.tsx` |
| マイページ（私） | `/me` | 自分の統計（参加数/アーティスト数/都道府県数）・ランキング | `pages/MyPage.tsx` |
| プロフィール編集 | `/profile/edit` | 表示名・自己紹介・好きなアーティスト・音楽サービス設定 | `pages/ProfileEdit.tsx` |
| 友達 | `/friends` | 友達一覧・URL/QRで追加・友達カード（統計） | `pages/Friends.tsx` |
| 公開プロフィール | `/u/:publicId` | 友達の公開プロフィール・共有メモ・共通バッジ・統計 | `pages/PublicProfile.tsx` |
| 変更履歴 | `/changelog` | バージョン履歴 | `pages/Changelog.tsx` |
| マニュアル | `/manual` | 使い方ガイド | `pages/Manual.tsx` |
| ドキュメント | `/docs` | API/仕様ドキュメント | `pages/Docs.tsx` |
| フィードバック管理 | `/admin/feedback` | 管理者用フィードバック閲覧 | `pages/FeedbackAdmin.tsx` |
| 404 | `/404` | 不明URL | `pages/NotFound.tsx` |

## ■2. 機能一覧（状態つき）

| 機能 | 状態 | 説明 | 対応ファイル |
|---|---|---|---|
| ライブ記録 CRUD・一覧 | ✅実装済み | 作成/詳細/更新/削除・upcoming/history/all | `livesRouter.ts`, `pages/Upcoming/History.tsx` |
| 13種ステータス | ✅実装済み | enumに正確に **13種**（受付前〜リセール） | `drizzle/schema.ts:74-88` |
| チケット期限管理 | 🟡部分実装 | 期限フィールド（支払/汎用/発券期間）保持＋Gmailから自動抽出。**期限接近の通知・並べ替え・警告は無し** | `schema.ts:95-112`, `gmailRouter.ts` |
| Gmail自動取込 | ✅実装済み | 2段LLM（分類→抽出）。ステータス/チケット会社/会場/日時/期限を抽出。スポーツ/演劇/お笑い/TVを除外し**音楽ライブのみ判定** | `gmailRouter.ts`, `gmailParser.ts`, `_core/llm.ts` |
| フライヤーAI出演者抽出 | ✅実装済み | フライヤー画像をVision解析＋Tavily補完で出演者抽出 | `livesRouter.ts extractPerformers` |
| 出演者のアー写AI取得 | ✅実装済み | Apple Music優先→Spotifyフォールバックで画像取得（個別/一括/バックフィル） | `setlistRouter.ts addArtist/bulkFetchArtwork`, `appleMusicHelper.ts`, `spotify.ts` |
| 公演アーティストから出演者追加 | ✅実装済み | `artistName`を分割して出演者に反映 | `setlistRouter.ts addPerformersFromLiveArtist` |
| 出演者の一括削除 | ✅実装済み | 選択式・所有者検証つき | `setlistRouter.ts bulkDeleteArtists` |
| 予習プレイリスト（代表曲） | ✅実装済み | 出演者の代表曲をApple Music→Spotifyで取得・表示 | `rehearsalRouter.ts`, `LiveDetail.tsx RehearsalPlaylist` |
| 予習曲の各サービスリンク | ✅実装済み | 予習曲: Apple Music/Spotify。プレビュー再生(previewUrl)＋外部リンク | `LiveDetail.tsx` |
| セトリ各曲の音楽/YouTubeリンク | ✅実装済み | セトリ各曲にApple Music/Spotify/Amazon Music/**YouTube（検索リンク）** | `LiveDetail.tsx MusicLinkRow`, `setlistRouter.ts getMusicLinks` |
| セットリスト記録 | ✅実装済み | setlist.fm API＋livefans.jpスクレイプで取得・手動編集 | `setlistRouter.ts fetchFromSetlistFm/fetchFromLiveFans` |
| 公開プロフィール | ✅実装済み | `/u/:publicId` 公開・統計・共有メモ・バッジ | `pages/PublicProfile.tsx`, `profileRouter.ts` |
| 友達 | ✅実装済み | 追加/削除/一覧・URL/QR共有 | `pages/Friends.tsx`, `profileRouter.ts` |
| 共通バッジ3種 | ✅実装済み | 🤝一緒に参戦／📍同じ場所にいた／同じライブ日付違い（CalendarDays） | `PublicProfile.tsx:468-492` |
| 統計（参加/アーティスト/都道府県） | ✅実装済み | 参加数・アーティスト数・都道府県数等を集計表示 | `MyPage.tsx`, `PublicProfile.tsx`, `profileRouter.ts` |
| カレンダー登録 | ✅実装済み（クライアント側） | 開場/開演から **.ics生成＋Googleカレンダー登録リンク**（端末判別）。サーバ側ICSエンドポイントは無し | `LiveDetail.tsx:1674-1711`, `Upcoming.tsx` |
| 会場の地図表示 | 🟡部分実装 | Googleマップ**検索リンク**のみ（埋め込み地図ではない）。`Map.tsx`は存在するが詳細画面で未使用 | `LiveDetail.tsx:1664`, `components/Map.tsx`(未使用) |
| 紙/電子チケット区分 | ✅実装済み | `ticketFormat` 紙/電子/不明トグル | `LiveDetail.tsx` |
| 発券情報 | ✅実装済み | 払込票番号・発券場所・発券URL・発券期間・申込番号等 | `LiveDetail.tsx IssuanceInfoSection`, `schema.ts:108-114` |
| チケットサイトリンク | ✅実装済み | e+/ローチケ/ぴあ/LivePocket/ZAIKO/Tiget＋自由記述＋URL | `LiveDetail.tsx` |
| 公式サイトAI検索 | ✅実装済み | Tavily検索＋LLMで公式HP/X/レーベル等を判定・候補提示 | `livesRouter.ts searchOfficialUrl` |
| 画像保存 | ✅実装済み（一部） | 「チケット等の画像」**複数枚**＋フライヤー画像。**思い出/グッズの独立カテゴリは無し**（汎用画像欄に集約） | `LiveDetail.tsx TicketImagesSection/Flyer` |
| メモ（自分用/シェア用） | ✅実装済み | 🔒自分用（非公開）と🌐シェア感想（公開）の2種 | `LiveDetail.tsx:2424-2469`, `memos`テーブル |
| テキスト取込（e+/ぴあ/ローチケ） | ✅実装済み | 貼付テキストを解析＋AI重複排除して一括登録 | `livesRouter.ts importFromText/parseEplusText` |
| e+連携（注文履歴） | ✅実装済み | e+ログイン＋スクレイプで注文同期、ブックマークレット/トークン取込 | `livesRouter.ts syncEplus/importWithToken` |
| 好きなアーティスト登録 | ✅実装済み（自由記述のみ） | プロフィールに自由記述で保存・表示 | `profileRouter.ts`, `ProfileEdit.tsx` |
| **好きなアーティストの新公演キャッチ・通知** | ❌**未実装** | `follows`テーブルは存在するが**業務ロジック皆無**。新公演の検知も通知も無し | （`follows`はバックアップ対象としてのみ参照） |
| 通知システム | 🟡部分実装 | `notifyOwner`（管理者向け／日次バックアップ通知）のみ。**ユーザー向け自動通知・Web Pushは無し** | `_core/notification.ts`, `dailyBackupHandler.ts` |
| フィードバック投稿 | ✅実装済み | 投稿（公開）＋管理者一覧/既読 | `feedbackRouter.ts`, `FeedbackAdmin.tsx` |
| バックアップ（日次） | ✅実装済み | 本番DBをmysqldump→S3保存（読取専用）・件数マニフェスト・異常検知 | `dailyBackupHandler.ts` |
| 認証（Google/Manus OAuth） | ✅実装済み | セッションJWT・Googleログイン | `_core/sdk.ts`, `_core/oauth.ts` |

## ■3. 外部連携の現状

| 連携 | 状態 | 用途 | 必要env |
|---|---|---|---|
| Apple Music | ✅稼働 | アー写・代表曲（ES256 JWT、Catalog API） | `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_PRIVATE_KEY` |
| Spotify | ✅稼働 | アー写・代表曲フォールバック（Client Credentials） | `SPOTIFY_CLIENT_ID`/`SECRET` |
| Gmail / Google OAuth | ✅稼働 | メール取込・増分同期 | `GOOGLE_CLIENT_ID`/`SECRET`/`GOOGLE_REDIRECT_URI` |
| setlist.fm | ✅稼働 | アーティスト＋日付でセトリ取得（MBID経由） | `SETLIST_FM_API_KEY` |
| LiveFans.jp | ✅稼働 | セトリのスクレイプ取得（APIキー不要） | なし |
| iTunes Search API | ✅稼働 | 曲単位のApple Music直リンク | なし（公開API） |
| Tavily（Web検索） | ✅稼働 | 公式サイト/X検索・出演者補完 | `TAVILY_API_KEY`（未設定時は警告のみ） |
| LLM（**Gemini 2.5 Flash**／Forge経由） | ✅稼働 | メール分類・抽出、フライヤーVision、フェス出演者、公式サイト判定、重複検出 | `BUILT_IN_FORGE_API_URL`/`KEY` |
| 画像ストレージ（S3／Forge presign） | ✅稼働 | フライヤー/チケット/生成画像 | `BUILT_IN_FORGE_API_URL`/`KEY` |
| YouTube | 🟡検索リンクのみ | セトリ曲のYouTube**検索URL**生成のみ（API/埋め込み無し） | なし |
| Google Maps | 🟡検索リンクのみ | 会場名のマップ**検索リンク**。サーバproxy(`_core/map.ts`)は定義済みだが手続きから未使用 | （proxyは`BUILT_IN_FORGE_*`） |

## ■4. DBテーブルと用途（全17＝アプリ16＋移行管理1）

| # | テーブル | 用途 |
|---|---|---|
| 1 | `users` | アカウント・プロフィール・role・publicId・好きなアーティスト(自由記述) |
| 2 | `lives` | ライブ記録本体（公演情報・13種ステータス・チケット/発券/料金・画像・公式URL・privacy） |
| 3 | `ticket_images` | ライブごとのチケット等画像（複数枚・order） |
| 4 | `artists` | ライブ別アーティスト（main/discovery・Spotify/Apple ID・画像・代表曲キャッシュ） |
| 5 | `setlist_items` | セットリストの曲（order/title/artistName/note） |
| 6 | `memos` | 自分用メモ＋シェア用感想 |
| 7 | `import_tokens` | ワンタイム取込トークン |
| 8 | `gmail_tokens` | Google OAuthトークン＋増分同期状態 |
| 9 | `gmail_analysis_cache` | メールLLM解析キャッシュ（本文は保存しない） |
| 10 | `feedbacks` | ユーザーからの要望/質問/感想 |
| 11 | `gmail_email_decisions` | メール単位の取込/スキップ判断の永続化 |
| 12 | `friendships` | 友達（一方向 userId→friendUserId） |
| 13 | `gmail_sync_jobs` | バックグラウンド同期ジョブ状態・進捗 |
| 14 | `gmail_sync_results` | メール単位の抽出結果＋取込状態（unique: userId+messageId） |
| 15 | `live_performers` | live↔artists 結合（isMain・source: vision/tavily/manual） |
| 16 | `follows` | ⚠️**スキーマのみ・未使用**（フォロー機能ロジックは未実装） |
| 17 | `__drizzle_migrations` | マイグレーション管理（Drizzle） |

## ■5. 要点（資料づくりで"盛らない"ための注意）

- **未実装**＝「好きなアーティストの新公演キャッチ＆通知」（`follows`は箱だけ）。好きなアーティストは**自由記述の表示のみ**。
- **部分実装**＝チケット期限（保持・抽出はするが通知/並べ替え無し）／会場マップ（検索リンク）／YouTube（検索リンク）／通知（管理者向けのみ）。
- **画像**はチケット系（複数）＋フライヤー。「思い出/グッズ」の独立カテゴリは無し。
- **LLMはGemini 2.5 Flash**（Claudeではない）。資料で「Claude搭載」と書かないこと。
- **カレンダー登録**はブラウザ側で.ics生成＋Googleカレンダーリンク（サーバendpointは無い）。

## ■6. 移行ステータス（2026-07-01・②が実コード実査で確認＝STEP A）

| # | 項目 | 判定 | 根拠 |
|---|---|---|---|
| 1 | Sentry | 🟢配線デプロイ済 | ②が`@sentry/node`配線→PR#3→ビルド失敗(lockfile)→**PR#4で修正しマージ・Railway ACTIVE(2026-07-01)**。`SENTRY_DSN`投入済。残＝boom受信検証(②に委任)のみ |
| 2 | mainブランチ保護 | ⏸先送り | **無料privateリポジトリでは保護ルールが非強制**（GitHub警告）＝設定しても直push禁止にならない。有料(Team)課金の価値は現状薄い。実運用は②が毎回PR経由＋毎日バックアップ＋本番DB非改変で担保。**有料化 or 公開の前に再検討**（2026-07-01 Aで先送り決定） |
| 3 | 画像R2 | 🟢実装マージ済・移行待ち | 基盤(バケット`liverico-images`/APIトークン/Railway env)完了。**方式=案B（`/manus-storage/{key}`のURL契約維持・DB無変更・非破壊／チケット画像を公開しない）**。②が storage.ts→R2＋proxyをR2優先/Forgeフォールバックで実装→**PR#5マージ済(711d9d0)**＝新規=R2/旧=Forgeで表示継続(コード保証・要実機確認)。STEP3非破壊移行スクリプト＋手順書=**PR#6マージ済(0889a93・inert/自動実行なし)**。残＝実機確認(ビルド緑✅/新規R2)→移行スクリプト実行→照合OK後に②がForge撤去(最終PR)。<br>**⚠️移行実行が2026-07-01ブロック**：RailwayのConsoleで dry-run成功(対象27件・全未R2・全て変更履歴の静的画像名っぽい)だが `--commit` が `BUILT_IN_FORGE_API_URL 未設定` でFATAL停止。RailwayにManus Forge系env(BUILT_IN_FORGE_*)未投入。②に確認中：①Forge creds入手可否 ②Railway一時投入可否 ③移行元(forge本番)の所在＋DATABASE_URL開発DB値のまま問題 ④実フライヤー/チケット画像が27件に含まれるか |
| 4 | Heartbeat(Gmail増分同期) | 🟡Day4着手中 | STEP A完了：cron3本(gmail-incremental自動登録/auto-archive/daily-backup)は**発火・認証・CRUD全てForge依存**、CRON_SECRET/railway cron定義は未存在。方針確定=**A①Railwayネイティブcron/B毎時グローバル1回・全ユーザー反復/C CRON_SECRET(Bearer)/D移行中はForge isCronフォールバック残す**。**`CRON_SECRET`はRailway登録済(2026-07-01)**。②がSTEP B実装中(CRON_SECRET認証＋全ユーザー反復化＋Forgeジョブ登録no-op化＋Railway Cron定義) |
| 5 | LLM | ❌未（Forge/Geminiのまま） | `llm.ts`: `forge.manus.im/v1/chat/completions`・`model:"gemini-2.5-flash"`。Anthropic差し替え無し |
| 6 | env(DATABASE_URL/JWT_SECRET) | ⚠️要Railway確認 | コード/サンドボックスからは実値不明。Day1経緯では「Railwayは開発DB接続のまま」。**林がRailwayダッシュボードで確認**が必要 |

**結論**: 移行は **Day1完了＋Day2認証稼働まで**。Day3以降（画像R2・Heartbeat・LLM・Manus OAuth削除）＋Day1の締め（Sentry・ブランチ保護）は**全て未着手**。

### 次の一手（①の方針・2026-07-01）
- Day1の締めから：**Sentry配線（DSN無しでは無害no-op・boomは`ENABLE_DEBUG_BOOM=1`時のみ）** ＋ **mainブランチ保護（直push禁止・PR必須／CIパス必須は現状スコープ外）**。
- env項目6は**林がRailwayで要確認**（本番DB値か・JWT_SECRETは本物か＝切替Day5-7の前提）。
- CI必須化は見送り：現状 `tsc`20件エラー・テスト3件failのため、CI必須にすると全PRが恒久赤＝マージ不能。CI整備は移行一段落後の別タスク。
