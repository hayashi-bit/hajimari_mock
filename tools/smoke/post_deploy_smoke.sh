#!/usr/bin/env bash
# 本番デプロイ後スモークチェック
# 目的: 「本番が古いビルドのまま」を“構造的に”検知する。
#   - JSON恒久対策: 未登録の /api/* は必ず JSON 404 を返す（旧ビルドは HTML を返す＝Unexpected token '<' の元凶）
#   - publicId ランダム化: 連番の公開URL /u/1 は 404/410（旧ビルドは 200 で人数露出）
# 関連: docs/livelog/25_release_plan.md（P0「本番デプロイ＋デプロイ後スモーク」）
#       docs/livelog-site/index.html（リリースまでのTODO / Phase0進捗の「残」）
#
# 使い方:
#   BASE_URL=https://liverico.app tools/smoke/post_deploy_smoke.sh
#   tools/smoke/post_deploy_smoke.sh https://liverico.app
# 終了コード: 全合格=0 / 1件でも失格=1（CI・手動どちらでも“古いまま”を弾ける）

set -u
BASE_URL="${BASE_URL:-${1:-https://liverico.app}}"
BASE_URL="${BASE_URL%/}"
TIMEOUT="${TIMEOUT:-10}"

pass=0; fail=0
ok()   { printf '  \033[32m✓ PASS\033[0m %s\n' "$1"; pass=$((pass+1)); }
ng()   { printf '  \033[31m✗ FAIL\033[0m %s\n' "$1"; fail=$((fail+1)); }
info() { printf '  \033[2m· %s\033[0m\n' "$1"; }

echo "本番デプロイ後スモーク → $BASE_URL"
echo

# --- 1) 未登録 /api/* は JSON 404 を返す（HTMLを返したら旧ビルド） ---
echo "[1] JSON恒久対策: 未登録 /api/* が JSON 404 か"
probe="$BASE_URL/api/__notfound_$(date +%s)"
code=$(curl -s -m "$TIMEOUT" -o /tmp/smoke_body -w '%{http_code}' "$probe" 2>/dev/null) || code="000"
ctype=$(curl -s -m "$TIMEOUT" -o /dev/null -w '%{content_type}' "$probe" 2>/dev/null) || ctype=""
info "GET $probe → HTTP $code / $ctype"
if [ "$code" = "000" ]; then
  ng "到達不可（ネットワーク許可リスト/ドメインを確認）"
else
  case "$ctype" in
    application/json*) ok "Content-Type が JSON（HTMLを返していない）" ;;
    *) ng "Content-Type が JSON でない（旧ビルドの可能性＝SPAのHTMLが返っている）" ;;
  esac
  case "$code" in
    404|410) ok "ステータス $code（未登録APIとして正しく拒否）" ;;
    200) ng "200（未登録APIに200＝ルーティングが旧ビルド）" ;;
    *) info "ステータス $code（404想定。実装に合わせ確認）" ;;
  esac
fi
echo

# --- 2) 連番の公開URL /u/1 は 404/410（publicId ランダム化） ---
echo "[2] publicId ランダム化: 連番 /u/1 が 404/410 か"
code=$(curl -s -m "$TIMEOUT" -o /dev/null -w '%{http_code}' "$BASE_URL/u/1" 2>/dev/null) || code="000"
info "GET $BASE_URL/u/1 → HTTP $code"
case "$code" in
  000) ng "到達不可" ;;
  404|410) ok "連番URLは無効（人数露出が解消＝新ビルド）" ;;
  200) ng "200（/u/1 が生きている＝旧ビルドのまま・連番露出）" ;;
  *)   info "ステータス $code（404/410想定。リダイレクト等は実装と照合）" ;;
esac
echo

# --- 結果 ---
echo "──────────────"
printf '結果: \033[32m%d PASS\033[0m / \033[31m%d FAIL\033[0m\n' "$pass" "$fail"
if [ "$fail" -gt 0 ]; then
  echo "→ 1件以上の失格。本番が古いビルドのままか、デプロイが未反映の可能性が高い。"
  exit 1
fi
echo "→ 全合格。新ビルドが本番に反映済み。"
exit 0
