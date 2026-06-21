# 開発履歴の自動記録パイプライン（changelog.json）

作成: 2026-06-22 ／ 目的＝Manus の実装履歴（大小すべて）を開発サイトに**自動で**集約する。
関連: 開発サイト「開発履歴（自動）」ページ（id=changelog）／feedback.json と同じ方式。

## 方針（確定）
- **方式：changelog.json**（feedback.json と同じ実績ある型）。Manus が `liverico.app/changelog.json` を持ち、**実装するたびに1件追記**。開発サイトが自動で読み込み表示。
- **粒度：大小すべて**。各件に**重要度タグ（major/minor/patch＝大/中/小）**を付け、サイト側で絞り込める。
- **過去分：一括バックフィル**（これまでの実装を全部 changelog.json に書き出す）。
- **PII（個人を特定する情報）は含めない**（メール・本文など）。

## JSON スキーマ（開発サイトが読む形）
開発サイトの `loadChangelog()` は以下を期待する（`docs/livelog-site/index.html`）。

```json
{
  "generatedAt": "2026-06-22T10:00:00+09:00",
  "totalCount": 128,
  "items": [
    {
      "date": "2026-06-21",
      "title": "Gmail取込を『広い網→2段判定→増分』に実装",
      "category": "feature",
      "importance": "major",
      "area": "Gmail",
      "detail": "ベンダー非依存の広い網で候補収集→安いモデルで一次判定→高いモデルで構造化抽出。初回5年/以降増分。本文非保存。",
      "checkpoint": "94714e90",
      "images": ["https://liverico.app/changelog-assets/gmail-2step.png"]
    }
  ]
}
```

### フィールド定義
| キー | 必須 | 値 | 説明 |
|---|---|---|---|
| `date` | ○ | "YYYY-MM-DD" | 実装日。サイトは新しい順に並べ替える |
| `title` | ○ | 文字列 | 1行の見出し |
| `category` | ○ | `feature`/`fix`/`infra`/`refactor`/`docs`/`chore` | 種別。サイト表示=新機能/修正/基盤/整理/文書/雑務 |
| `importance` | ○ | `major`/`minor`/`patch` | 重要度＝大/中/小。サイトの絞り込みに使用 |
| `detail` | 任意 | 文字列 | 補足（改行可）。PIIは入れない |
| `area` | 任意 | 文字列 | 領域（Gmail/課金/認証/UI 等） |
| `checkpoint` | 任意 | 文字列 | ManusのチェックポイントID等 |
| `image` / `images` | 任意 | URL / URL配列 | **画面キャプチャ**。公開URL（feedback.json同様に公開＋CORS）。サイトがサムネイル表示＋クリックで拡大。PIIが写り込まないよう注意 |

- 並び順はサイト側で `date` 降順に整列するので、items の順序は問わない。
- 公開要件：`feedback.json` と同様に**公開＋CORS許可**（開発サイトは htmlpreview 経由で別オリジンから fetch する）。

## Manus への指示
```
【開発履歴の自動記録：changelog.json を新設し、過去を一括書き出し＋今後は実装ごとに自動追記】

■ 目的
Manusの実装履歴（大小すべて）を liverico.app/changelog.json に集約し、
開発サイトの「開発履歴」ページが自動表示できるようにする。feedback.json と同じ方式。

■ ① エンドポイント新設
・liverico.app/changelog.json を公開（feedback.json と同じ公開＋CORS設定）。
・形式は下記スキーマに厳密に合わせる（generatedAt / totalCount / items[]）。

■ ② 過去の一括バックフィル
・これまでの実装を大小問わず全部 items に書き出す（漏れなく）。
・各件に date / title / category / importance(major=大/minor=中/patch=小) を付与。
  迷う粒度は分割しすぎず「意味のある単位」で。ただし小さな修正も patch として残す。
・detail には概要のみ。PII（メール・本文・個人情報）は入れない。
・可能なら checkpoint（チェックポイントID）と area（領域）も付ける。

■ ③ 今後の自動追記
・実装/デプロイのたびに items に1件 append し、generatedAt と totalCount を更新。
・既存項目は書き換えず追記のみ（履歴の改ざんをしない）。

■ ④ 画面キャプチャ（image / images）
・各件に、その実装の画面キャプチャを添付できる（image=1枚、または images=複数）。
・画像は公開URL（feedback.json同様に公開＋CORS）。changelog-assets/ などに置く。
・キャプチャに他人のデータ・メール・個人情報が写り込まないようにする。

■ ⑤ 完了報告
・changelog.json のURLが開く（公開・CORS OK）ことと件数、画像が表示されることを報告。
```

## 開発サイト側（実装済み・2026-06-22）
- ナビ「③ 開発履歴（自動）」／ページ `id=changelog`。
- `loadChangelog()` が `https://liverico.app/changelog.json` を fetch → 重要度フィルタ（すべて/大/中/小）で表示。
- **画面キャプチャ（image/images）はサムネイル表示＋クリックで拡大**まで実装済み。
- 未公開の間は「未公開かCORS確認」のメッセージを出す（Manusが用意し次第、自動で表示される）。
