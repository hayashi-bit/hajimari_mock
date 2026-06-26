# Day1 マイルストーン：Railwayで本番URLが開いた（2026-06-27）

## 達成
ライブリコのアプリ本体を、Manusの外＝**Railway（標準スタック）で起動・公開URLで表示**することに成功。
- 公開URL：`https://liverico-production.up.railway.app`
- ログイン画面（LiveRicoロゴ・Googleログインボタン）が正常に描画。
- ＝「Manus→標準スタックへの移行は実際に可能」を、動くもので実証。

## Day1（配線疎通）の達成内容
- Railwayアカウント作成・プロジェクト作成
- 正しいリポジトリ(hayashi-bit/liverico-app)に接続（最初 liverico=docsに誤接続→修正。Railwayの
  GitHub App許可を liverico-app のみに整理）
- ビルド成功（node@22.22.3 自動検出・railway.json）
- 環境変数11個を投入：DATABASE_URL(=開発DBの値・安全に起動)/JWT_SECRET(新規生成)/
  GOOGLE_*/SPOTIFY_*/APPLE_*/RESEND_API_KEY/TAVILY_API_KEY
  ※DEV_AUTH_BYPASS・DEV_USER_EMAILは本番に入れない（セキュリティ）
- アプリ起動(ACTIVE)→Generate Domain(Port 8080)→公開URLで表示

## 重要メモ・残課題
- **DATABASE_URLは現在“開発DB(DATABASE_URL_DEV)の値”**を入れている（安全なDay1テストのため）。
  本番DBのDATABASE_URL/JWT_SECRETはManus自動管理でSecretsに無い＝本番接続文字列はTiDB Cloud
  コンソールから取得、JWT_SECRETは本物に差し替えが必要＝**切替(Day5-7)前に対応**。
- **Googleログインはまだ不可**＝GOOGLE_REDIRECT_URIを移行先ドメインに設定＋Google Cloud Console
  に承認済みリダイレクトURI追加が必要＝**Day2(認証)で対応**。
- Day1の残り：Sentry(エラー監視)導入／mainブランチ保護。
- Manus固有env(BUILT_IN_FORGE_*/OAUTH_*/OWNER_*)は未投入でも起動した（lazy初期化）＝Day2-6で差替。

## 次
Day1残り(Sentry/ブランチ保護)→ Day2 認証(redirect URI・Manus OAuth削除)→ 画像→ Heartbeat→ 切替。
