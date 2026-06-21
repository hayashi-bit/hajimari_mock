# 開発サイト用の画像置き場

開発サイト（`docs/livelog-site/index.html`）に画像を載せるためのフォルダ。

## 入れ方（htmlpreview配信でも崩れない方法）
1. このフォルダ（`docs/livelog-site/assets/`）に画像をコミットする。
   例：`docs/livelog-site/assets/manus-handoff.png`
2. index.html から **絶対rawURL** で参照する（相対パスはhtmlpreviewで壊れる）。

```html
<img src="https://raw.githubusercontent.com/hayashi-bit/hajimari_mock/claude/vibrant-meitner-tbc76w/docs/livelog-site/assets/manus-handoff.png"
     alt="クロコ→マナスの受け渡し" style="max-width:100%;border:1px solid #e6eef7;border-radius:8px">
```

## 注意
- ❌ `src="assets/manus-handoff.png"`（相対パス）→ htmlpreviewでは表示されない。
- ✅ 上記の絶対rawURL（`raw.githubusercontent.com/.../docs/livelog-site/assets/ファイル名`）。
- ブランチを変えたら URL の `claude/vibrant-meitner-tbc76w` も合わせる。
- 画像はなるべく軽量に（PNG/JPGで横幅1600px以内が目安）。
