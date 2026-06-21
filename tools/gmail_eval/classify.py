"""
Step2：一次判定（安いモデル＝Haiku想定）の参照実装＆評価用

広い網（Gmail検索）で拾った候補メールを、安いモデルで「チケット購入実績か(true/false)」
だけ高速・低コストに判定する。true のものだけ Step3（高いモデルで構造化抽出 extract.py）へ。

設計: docs/livelog/21_gmail_two_stage_implementation.md
判定基準: docs/livelog/05_gmail_email_analysis.md（購入実績184通 vs 宣伝/通知/スポーツ）

使い方:
    export ANTHROPIC_API_KEY=sk-ant-...
    python classify.py            # ゴールデン全通を一次判定して採点

環境変数:
    ANTHROPIC_API_KEY  必須（未設定なら dry-run）
    LIVELOG_CLASSIFY_MODEL  省略時 claude-haiku-4-5
"""
import json
import os
import urllib.request

MODEL = os.environ.get("LIVELOG_CLASSIFY_MODEL", "claude-haiku-4-5")
API_URL = "https://api.anthropic.com/v1/messages"

# 一次判定は軽量。purchase の真偽＋カテゴリ＋一言理由のみ（抽出はしない＝高いモデルの仕事）。
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "isTicketPurchase": {"type": "boolean"},
        "category": {"type": "string", "enum": [
            "purchase",      # 購入実績（申込完了/当選/入金/発券/購入/落選）＝true
            "promo",         # 宣伝・先行案内・販売告知・おまかせエントリー・一般発売/プレリザーブ
            "notice",        # ログイン通知・パスワード・メンテ等
            "sports",        # 野球等スポーツ
            "other"]},
        "reason": {"type": "string"},
    },
    "required": ["isTicketPurchase", "category", "reason"],
}

SYSTEM = """あなたはライブ/コンサートのチケットメールの「一次判定」エンジンです。
広く拾った候補メールから、本人がチケットを「申込/当選/入金/発券/購入/落選」した
"購入実績メール" だけを isTicketPurchase=true と判定します。抽出はしません（真偽だけ）。

true（category=purchase）にするのは、本人の購入実績が分かるメールのみ:
- 申込完了 / 抽選結果（当選・落選）/ 入金案内・入金完了 / 発券案内 / 購入完了 / ダウンロード案内。

false にするもの:
- promo: 宣伝・先行案内・販売告知・「おまかせエントリー対象外の抽選発売のお知らせ」
  ・一般発売のお知らせ・プレリザーブ等の"案内/告知"（まだ申し込んでいない・買っていない）。
- notice: ログイン通知・パスワード・メンテ等。
- sports: 野球等スポーツ。 other: それ以外。

重要:
- 送信元だけで決めない（同じ e+ /ぴあ から宣伝も購入確認も届く）。本文の内容で判断する。
- 「お知らせ/ご案内」でも、"これから売る・申し込める" 告知は false、
  "あなたが申し込んだ/当たった/払って/発券して" は true。
- 落選（ご用意できませんでした）も購入実績の一部なので true。"""


def build_user_prompt(subject, sender, body, received_at=""):
    return (f"以下のメールが「購入実績メール」か一次判定してください。\n\n"
            f"件名: {subject}\n送信元: {sender}\n受信日時: {received_at}\n"
            f"--- 本文ここから ---\n{body}\n--- 本文ここまで ---")


def classify(subject, sender, body, received_at="", model=MODEL):
    """安いモデルで購入実績か否かだけ判定。APIキー必須。"""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY 未設定")
    payload = {
        "model": model,
        "max_tokens": 256,
        "system": SYSTEM,
        "messages": [{"role": "user",
                      "content": build_user_prompt(subject, sender, body, received_at)}],
        "output_config": {"format": {"type": "json_schema", "schema": SCHEMA}},
    }
    req = urllib.request.Request(
        API_URL, data=json.dumps(payload).encode("utf-8"),
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01",
                 "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
    text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
    usage = data.get("usage", {})
    return json.loads(text), usage


def run_eval(model=MODEL):
    """ゴールデンを一次判定し、期待 isTicketRelated と一致するか採点。"""
    from fixtures import GOLDEN
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("※ ANTHROPIC_API_KEY 未設定 → 呼び出しスキップ（fixtures の期待値だけ表示）")
        for g in GOLDEN:
            print(f"  [{g['id']}] expect isTicketRelated={g['expect']['isTicketRelated']}")
        return
    ok = total = 0
    tok_in = tok_out = 0
    for g in GOLDEN:
        exp = g["expect"]["isTicketRelated"]
        try:
            got, usage = classify(g["subject"], g["from"], g["body"], g.get("received_at", ""), model=model)
        except Exception as e:
            print(f"[{g['id']}] 失敗: {e}")
            continue
        total += 1
        hit = got.get("isTicketPurchase") is exp
        ok += hit
        tok_in += usage.get("input_tokens", 0)
        tok_out += usage.get("output_tokens", 0)
        mark = "✅" if hit else "⚠️"
        print(f"{mark} [{g['id']}] purchase={got.get('isTicketPurchase')} "
              f"({got.get('category')}) 期待={exp}  — {got.get('reason','')}")
    rate = (ok / total * 100) if total else 0
    print(f"\n→ 一次判定 {ok}/{total} ({rate:.0f}%)  tokens in={tok_in} out={tok_out}  model={model}")


if __name__ == "__main__":
    import sys
    m = next((a for a in sys.argv[1:] if not a.startswith("--")), MODEL)
    run_eval(m)
