# Gmail解析 認識度テスト（G1-1）

チケットメールを構造化抽出し、ゴールデンで精度を自動採点する評価ハーネス。
本番コードは Manus 側に移植するが、移植前にここで精度を実測する。
全体設計（広い網→2段→増分）は `docs/livelog/21_gmail_two_stage_implementation.md`。

## 構成（2段アーキに対応）
- `classify.py` … **Step2 一次判定**（安いモデル＝Haiku想定）。候補メールが「購入実績か(true/false)」だけ高速判定し、宣伝・通知・スポーツを弾く。`python classify.py` でゴールデンの真偽を採点。
- `extract.py` … **Step3 構造化抽出**（高いモデル＝Sonnet）。1通を JSON Schema 強制で構造化。
- `fixtures.py` … 実メール（マスク済み）＋期待値。購入実績6通＋宣伝/スポーツ=除外3通（おまかせエントリー/一般発売/巨人戦）。
- `run_eval.py` … 抽出を項目別に自動採点→正答率。複数モデル比較可。

## 実行
```bash
export ANTHROPIC_API_KEY=sk-ant-...
python classify.py                                   # Step2 一次判定の採点（Haiku）
python run_eval.py                                   # Step3 抽出の採点（Sonnet/Haiku）
python run_eval.py claude-haiku-4-5 claude-sonnet-4-6 # モデル比較
python run_eval.py --dry-run                          # API無しでハーネス検証
```

キー未設定時は自動で dry-run（ハーネス自体の検証）になる。

## 判定ルール
- 文字列は NFKC 正規化＋空白除去で比較、都道府県は「東京/東京都」を同一視。
- `*_has` は期待文字列が含まれていれば OK（期限の日付など）。
- 真偽値（isTicketRelated）は厳密一致。

## 次の拡張
- アップロードの全文コーパス（`*_ai_readable.md`）から難物 20〜30 通をサンプリングして大規模採点。
- 取得率の対・正規表現ベースライン（`docs/livelog/gmail_extract_sample.csv`）比較。
