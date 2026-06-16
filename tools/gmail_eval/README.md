# Gmail解析 認識度テスト（G1-1）

Claude **Haiku 4.5** でチケットメールを構造化抽出し、ゴールデン5通で精度を自動採点する評価ハーネス。
本番コードは Manus 側 `gmailParser` に移植するが、移植前にここで精度を実測する。

## 構成
- `extract.py` … Haiku 4.5 で1通を構造化抽出（JSON Schema 強制）。`05_..md §7` の確定項目に対応。
- `fixtures.py` … 実メール5通（マスク済み）＋期待値。巨人戦＝除外の判定も含む。
- `run_eval.py` … 5通を解析→項目別に自動採点→正答率を表示。複数モデル比較可。

## 実行
```bash
export ANTHROPIC_API_KEY=sk-ant-...
python run_eval.py                                   # Haiku で5通採点（本番）
python run_eval.py claude-haiku-4-5 claude-sonnet-4-6 # Haiku vs Sonnet 比較
python run_eval.py --dry-run                          # API無しでハーネス検証（40/40になる）
```

キー未設定時は自動で dry-run（ハーネス自体の検証）になる。

## 判定ルール
- 文字列は NFKC 正規化＋空白除去で比較、都道府県は「東京/東京都」を同一視。
- `*_has` は期待文字列が含まれていれば OK（期限の日付など）。
- 真偽値（isTicketRelated）は厳密一致。

## 次の拡張
- アップロードの全文コーパス（`*_ai_readable.md`）から難物 20〜30 通をサンプリングして大規模採点。
- 取得率の対・正規表現ベースライン（`docs/livelog/gmail_extract_sample.csv`）比較。
