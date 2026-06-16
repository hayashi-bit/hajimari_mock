"""
認識度テスト・ハーネス

ゴールデン5通（fixtures.GOLDEN）をモデルに解析させ、期待値と項目別に自動採点。
複数モデルを並べて精度比較もできる。

使い方:
    export ANTHROPIC_API_KEY=sk-ant-...
    python run_eval.py                         # haiku で5通採点
    python run_eval.py claude-haiku-4-5 claude-sonnet-4-6   # 2モデル比較
    python run_eval.py --dry-run               # API無しでハーネス自体を検証

判定:
    - 文字列項目は正規化（NFKC・空白除去・小文字）後に一致
    - *_has は期待文字列が含まれていればOK（期限の日付など）
    - prefecture は「東京/東京都」を同一視
"""
import sys
import unicodedata
import os
from fixtures import GOLDEN

FIELDS = ["isTicketRelated", "statusHint", "ticketFormat", "title", "venue",
          "prefecture", "liveDate", "startTime", "ticketCount", "price",
          "paymentDeadline", "ticketingDeadline"]


def norm(v):
    if isinstance(v, bool):
        return v
    s = unicodedata.normalize("NFKC", str(v)).replace(" ", "").lower()
    return s.rstrip("都道府県")  # 東京/東京都 を同一視


def check_field(key, expected, got):
    if key.endswith("_has"):
        base = key[:-4]
        return norm(expected) in norm(got.get(base, ""))
    if isinstance(expected, bool):
        return got.get(key) is expected
    return norm(expected) == norm(got.get(key, ""))


def score(expect, got):
    """期待値の各項目を採点。(正答数, 総数, 失敗リスト) を返す。"""
    ok, total, fails = 0, 0, []
    for k, exp in expect.items():
        total += 1
        if check_field(k, exp, got):
            ok += 1
        else:
            base = k[:-4] if k.endswith("_has") else k
            fails.append(f"{base}: 期待={exp} / 実際={got.get(base, '∅')}")
    return ok, total, fails


def run(models, dry_run=False):
    if not dry_run:
        from extract import extract

    for model in models:
        print(f"\n{'='*64}\nMODEL: {model}\n{'='*64}")
        grand_ok = grand_total = 0
        tok_in = tok_out = 0
        for g in GOLDEN:
            if dry_run:
                # ハーネス検証: 期待値そのものを「完璧な抽出」として採点 → 全項目一致するはず
                got = dict(g["expect"])
                for k in list(got):
                    if k.endswith("_has"):
                        got[k[:-4]] = got.pop(k)
                usage = {}
            else:
                try:
                    got, usage = extract(g["subject"], g["from"], g["body"],
                                         g.get("received_at", ""), model=model)
                except Exception as e:
                    print(f"[{g['id']}] 呼び出し失敗: {e}")
                    continue
            ok, total, fails = score(g["expect"], got)
            grand_ok += ok
            grand_total += total
            tok_in += usage.get("input_tokens", 0)
            tok_out += usage.get("output_tokens", 0)
            mark = "✅" if ok == total else "⚠️"
            print(f"{mark} [{g['id']}] {ok}/{total}")
            for f in fails:
                print(f"     × {f}")
        rate = (grand_ok / grand_total * 100) if grand_total else 0
        print(f"\n→ 合計 {grand_ok}/{grand_total}  ({rate:.0f}%)"
              + (f"   tokens in={tok_in} out={tok_out}" if not dry_run else "  [dry-run]"))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv or not os.environ.get("ANTHROPIC_API_KEY")
    models = args or ["claude-haiku-4-5"]
    if dry and "--dry-run" not in sys.argv:
        print("※ ANTHROPIC_API_KEY 未設定 → dry-run（ハーネス検証のみ）で実行します。")
    run(models, dry_run=dry)
