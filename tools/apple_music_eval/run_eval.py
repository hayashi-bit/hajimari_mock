#!/usr/bin/env python3
"""Apple Music API アー写カバー率テスト（ルール3：実リストでマイナーが取れるか検証）。

3つの認証情報から developer token(JWT/ES256) を生成し、各アーティストを
Apple Music カタログ検索 → トップ候補に artwork があるかを採点する。

必要な環境変数（秘密の .p8 はファイルパスで渡す。チャットに貼らない）:
  APPLE_TEAM_ID            例: 6ZZDG46JS2
  APPLE_KEY_ID             例: 867859YX46
  APPLE_PRIVATE_KEY_PATH   ダウンロードした AuthKey_867859YX46.p8 のパス
  APPLE_STOREFRONT         省略時 jp

実行:
  pip install pyjwt cryptography requests
  python run_eval.py
  python run_eval.py --dry-run   # 認証情報なしでハーネス自体を検証

※このサンドボックスは api.music.apple.com への到達がegressで塞がれているため、
  Apple到達可の環境（林ローカル / Apple許可した新セッション / Manus）で実行する。
"""
import os, sys, time, json

try:
    from fixtures import ARTISTS
except ImportError:
    from .fixtures import ARTISTS

STOREFRONT = os.environ.get("APPLE_STOREFRONT", "jp")
API = "https://api.music.apple.com/v1/catalog/{sf}/search"


def make_developer_token():
    import jwt  # pyjwt
    team_id = os.environ["APPLE_TEAM_ID"]
    key_id = os.environ["APPLE_KEY_ID"]
    key_path = os.environ["APPLE_PRIVATE_KEY_PATH"]
    with open(key_path, "r") as f:
        private_key = f.read()
    now = int(time.time())
    payload = {"iss": team_id, "iat": now, "exp": now + 60 * 60 * 12}  # 最大6ヶ月だが12hで十分
    token = jwt.encode(payload, private_key, algorithm="ES256",
                       headers={"alg": "ES256", "kid": key_id})
    return token


def search_artist(token, name):
    import requests
    r = requests.get(
        API.format(sf=STOREFRONT),
        headers={"Authorization": f"Bearer {token}"},
        params={"types": "artists", "term": name, "limit": 5},
        timeout=15,
    )
    if r.status_code != 200:
        return {"ok": False, "http": r.status_code, "body": r.text[:200]}
    data = r.json()
    items = (data.get("results", {}).get("artists", {}) or {}).get("data", [])
    if not items:
        return {"ok": True, "found": False}
    top = items[0]
    attrs = top.get("attributes", {})
    art = attrs.get("artwork") or {}
    art_url = art.get("url")
    return {
        "ok": True, "found": True,
        "matched": attrs.get("name"),
        "artwork": bool(art_url),
        "artwork_url": (art_url or "").replace("{w}", "600").replace("{h}", "600"),
        "candidates": [it.get("attributes", {}).get("name") for it in items],
    }


def main():
    dry = "--dry-run" in sys.argv
    if dry or not os.environ.get("APPLE_TEAM_ID"):
        print("[dry-run] 認証情報なし。ハーネスとフィクスチャのみ検証。")
        print(f"対象アーティスト {len(ARTISTS)} 組:")
        for name, note in ARTISTS:
            print(f"  - {name}  ({note})")
        print("\n本実行は APPLE_TEAM_ID/APPLE_KEY_ID/APPLE_PRIVATE_KEY_PATH を設定して再実行。")
        return

    token = make_developer_token()
    print(f"developer token 生成OK / storefront={STOREFRONT}\n")
    hit = miss = 0
    rows = []
    for name, note in ARTISTS:
        res = search_artist(token, name)
        if not res.get("ok"):
            print(f"✗ {name}: HTTP {res.get('http')} {res.get('body')}")
            miss += 1
            rows.append((name, "ERROR", "", note))
            continue
        if res.get("found") and res.get("artwork"):
            print(f"✓ {name} → {res['matched']}  アー写OK")
            hit += 1
            rows.append((name, "OK", res["matched"], res["artwork_url"]))
        elif res.get("found"):
            print(f"△ {name} → {res['matched']}  ヒットしたがアー写なし")
            rows.append((name, "NO_ART", res["matched"], ""))
        else:
            print(f"✗ {name}  候補ゼロ")
            miss += 1
            rows.append((name, "NOT_FOUND", "", note))
        time.sleep(0.2)

    total = len(ARTISTS)
    print(f"\n── 結果: アー写OK {hit}/{total} ({hit*100//total}%) ──")
    print("\n比較表(name / 状態 / マッチ名 / アー写URL or 備考):")
    for r in rows:
        print(f"  {r[0]}\t{r[1]}\t{r[2]}\t{r[3]}")


if __name__ == "__main__":
    main()
