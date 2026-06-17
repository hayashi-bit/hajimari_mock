"""
Gmailチケットメール → 構造化抽出（Claude Haiku 4.5・構造化出力）

LiveLog G1-1 の解析ロジックの参照実装＆評価用。
本番は Manus 側 gmailParser に移植するが、ここで精度を実測する。

使い方:
    export ANTHROPIC_API_KEY=sk-ant-...
    python extract.py            # 単体テスト（ゴールデン1通）

環境変数:
    ANTHROPIC_API_KEY  必須（未設定なら呼び出しはスキップ）
    LIVELOG_MODEL      省略時 claude-haiku-4-5
"""
import json
import os
import urllib.request

MODEL = os.environ.get("LIVELOG_MODEL", "claude-sonnet-4-6")
API_URL = "https://api.anthropic.com/v1/messages"

# 抽出スキーマ（05_gmail_email_analysis.md §7 の確定項目を反映）
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "isTicketRelated": {"type": "boolean"},
        "emailType": {"type": "string", "enum": [
            "lottery_apply", "lottery_result", "payment", "issuance",
            "purchase_complete", "resale", "announce", "other"]},
        "title": {"type": "string"},
        "artistName": {"type": "string"},
        "liveDate": {"type": "string"},
        "openTime": {"type": "string"},
        "startTime": {"type": "string"},
        "venue": {"type": "string"},
        "prefecture": {"type": "string"},
        "ticketCompany": {"type": "string"},
        "ticketFormat": {"type": "string", "enum": ["paper", "digital", "unknown"]},
        "ticketCount": {"type": "integer"},
        "price": {"type": "integer"},
        "seatInfo": {"type": "string"},
        "statusHint": {"type": "string", "enum": [
            "pre_sale", "on_sale", "pre_lottery", "lottery_pending", "lottery_won",
            "lottery_lost", "payment_pending", "print_pending", "ticket_secured",
            "attended", "not_attended", "cancelled", "resale", "unknown"]},
        "applyDeadline": {"type": "string"},
        "lotteryResultDate": {"type": "string"},
        "paymentDeadline": {"type": "string"},
        "ticketingDeadline": {"type": "string"},
        "sourceUrl": {"type": "string"},
        "confidence": {"type": "number"},
    },
    "required": ["isTicketRelated", "emailType", "title", "venue", "liveDate",
                 "ticketCompany", "ticketFormat", "statusHint", "confidence"],
}

SYSTEM = """あなたはライブ/コンサートのチケットメールを構造化抽出するエンジンです。
日本語のチケットメール（イープラス/ぴあ/ローチケ/LivePocket/チケットボード/セブンチケット/CNプレイガイド等）から、
公演情報とチケットステータスをJSONで抽出します。

重要ルール:
- まず isTicketRelated を判定する。本人がチケットを申込/当選/購入/発券したことが分かる「購入実績メール」のみ true。
  宣伝・先行案内・販売告知・ログイン通知・パスワード・スポーツ(野球等)・お笑いは false。
- 送信元アドレスだけで判断しないこと（同じ e+ から宣伝も購入確認も届く）。本文の内容で判断する。
- 受信日時 ≠ 公演日。公演日は本文の「公演日/日程/公演日時」を使う。転送メールの転送日や受信日は無視する。
- liveDate は YYYY-MM-DD、時刻は HH:mm、期限は YYYY-MM-DD または YYYY-MM-DDThh:mm。
- 全角の会場名（例 ＴＯＫＩＯ ＴＯＫＹＯ）は半角に正規化する。
- prefecture が本文に無ければ会場名から推定（渋谷→東京都、Zepp Yokohama→神奈川県 等）。
- title が単独アーティスト名ならそれをそのまま、フェス/企画名なら artistName は空でよい。
- statusHint: 当選かつ支払必要→payment_pending、発券案内→print_pending、入金完了/DL/購入完了→ticket_secured、落選→lottery_lost、申込完了→lottery_pending。
- ticketFormat: 電子/スマチケ/QR/ダウンロード→digital、店頭発券/Loppi/コンビニ発券→paper、不明→unknown。
- 値が取れない文字列項目は空文字 ""、数値項目は 0 にする。
- isTicketRelated=false のときも emailType と他必須項目は形式的に埋める（title 等は空文字可）。"""


def build_user_prompt(subject, sender, body, received_at=""):
    return (f"以下のメールを解析してください。\n\n"
            f"件名: {subject}\n送信元: {sender}\n受信日時: {received_at}\n"
            f"--- 本文ここから ---\n{body}\n--- 本文ここまで ---")


def extract(subject, sender, body, received_at="", model=MODEL):
    """Claude Haiku で1通を構造化抽出。APIキー必須。"""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY 未設定")
    payload = {
        "model": model,
        "max_tokens": 1024,
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
    # structured output: text ブロックに JSON が入る
    text = "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")
    usage = data.get("usage", {})
    return json.loads(text), usage


if __name__ == "__main__":
    from fixtures import GOLDEN
    g = GOLDEN[0]
    try:
        out, usage = extract(g["subject"], g["from"], g["body"], g.get("received_at", ""))
        print(json.dumps(out, ensure_ascii=False, indent=2))
        print("usage:", usage)
    except Exception as e:
        print("呼び出し不可:", e)
