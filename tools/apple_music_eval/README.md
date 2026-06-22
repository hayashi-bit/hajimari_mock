# Apple Music アー写カバー率テスト（ルール3・実リスト検証）

アー写＋予習プレイリストは **Apple Music API** に確定（Spotify不採用・doc14置換）。
採用の前提として、**林の実参戦リスト（マイナー含む）でアー写が取れるか**を実測する（前髪ぱっつん少年が試金石）。

## 認証情報（2026-06-22 取得済み）
- Team ID：`6ZZDG46JS2`
- Key ID：`867859YX46`
- 秘密鍵：`AuthKey_867859YX46.p8`（**1回限りDL済・秘密。チャットやコードに貼らない／環境変数で渡す**）

## 実行（Apple到達可の環境で）
```bash
pip install pyjwt cryptography requests
export APPLE_TEAM_ID=6ZZDG46JS2
export APPLE_KEY_ID=867859YX46
export APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_867859YX46.p8
python run_eval.py
python run_eval.py --dry-run   # 認証情報なしでハーネス検証
```

## ⚠️ 実行場所
このサンドボックスは egress 制限で `api.music.apple.com` に到達できない（クロコは実走不可）。
次のいずれかで実行する：
- 林のローカルPC（Python）
- egress に `api.music.apple.com` を許可した新セッション（ただし .p8 の配置が必要）
- **Manus**（アー写実装と同じ場所＝最有力。3つの認証情報を env で渡す）

## 判定
- `アー写OK n/16` を比較表で出す。**前髪ぱっつん少年が取れるか**を最重視。
- 取れない稀なケースは「ユーザー投稿」で補う（doc14方針を踏襲）。
- 結果が良ければアー写＋予習プレイリストの実装へ。崩れる箇所が多ければ設計見直し。
</content>
