# -*- coding: utf-8 -*-
"""
ゴールデンテスト用の実メール5通（氏名・払込番号・URLはマスク済み）と期待値。
出典: 実ユーザーGmail（96116c99 ほか）。05_gmail_email_analysis.md のテストケースに対応。
"""

GOLDEN = [
    {
        "id": "livepocket_win",
        "subject": "Fwd: [LivePocket-Ticket-]抽選結果のお知らせ（XXXXXXXX）",
        "from": "（転送） noreply@livepocket.jp",
        "received_at": "2026-06-15T10:19:16+09:00",
        "body": """お申込みいただいたチケットについて、下記の申込内容にてご当選されました。
支払期限（2024年12月29日(日) 23:59）までに、申込み時に選択したコンビニ店舗にて必ず支払いを完了してください。
イベント名：Hype The Rock vol.3
会場：渋谷FOWS
日程：2025年3月2日
[開場日時]18:00  [開演日時]18:30
受付名：オフィシャル先行
チケット名：一般
チケット枚数：1枚
チケット料金：¥4,500
合計金額：¥4,945 (税込)
支払方法：コンビニ決済 ファミリーマート
支払期限：2024年12月29日(日) 23:59""",
        "expect": {
            "isTicketRelated": True, "statusHint": "payment_pending",
            "ticketFormat": "digital", "title": "Hype The Rock vol.3",
            "venue": "渋谷FOWS", "prefecture": "東京都", "liveDate": "2025-03-02",
            "startTime": "18:30", "ticketCount": 1, "price": 4945,
            "paymentDeadline_has": "2024-12-29",
        },
    },
    {
        "id": "pia_win",
        "subject": "抽選結果のお知らせ / Lottery Results［「前髪ぱっつん少年」1次先行］",
        "from": "members_info@pia.co.jp",
        "received_at": "2026-06-15T09:59:44+09:00",
        "body": """お申し込みいただいた以下のチケットのご用意ができましたのでお知らせいたします。
■抽選結果 「前髪ぱっつん少年」1次先行 ＜第1希望＞ 当選
公演名： 前髪ぱっつん少年
公演日時： 2025年12月25日(木) 18:30開演
会場名： ＴＯＫＩＯ ＴＯＫＹＯ(東京都)
席種・枚数： スタンディング（一般） 3,500円 1枚
合計金額： 計 4,325円
決済方法 ファミリーマートでお支払い
支払期限：2025年10月18日(土) 23:59""",
        "expect": {
            "isTicketRelated": True, "statusHint": "payment_pending",
            "title": "前髪ぱっつん少年", "venue": "TOKIO TOKYO",
            "prefecture": "東京都", "liveDate": "2025-12-25", "startTime": "18:30",
            "price": 4325, "paymentDeadline_has": "2025-10-18",
        },
    },
    {
        "id": "ltike_win",
        "subject": "Fwd: |ローチケ|抽選結果のお知らせ",
        "from": "（転送） lt-mail@l-tike.com",
        "received_at": "2026-06-15T09:58:13+09:00",
        "body": """厳正なる抽選を行った結果、お客様はご当選されました。
[当選内容]
■公演タイトル ：すりぃ
■入金期間 ：ただいまより、2026/2/2(月) 23:00まで
[第1希望]
■公演日 ：2026/3/3（火） 19:00 開演
■会場名 ：ＫＴ Ｚｅｐｐ Ｙｏｋｏｈａｍａ
■チケット料金 ：１Ｆスタンディング 1枚 計5,800円
■合計金額 ：計6,900円
本公演のチケットは、電子チケットを利用いたします。""",
        "expect": {
            "isTicketRelated": True, "statusHint": "payment_pending",
            "ticketFormat": "digital", "title": "すりぃ",
            "venue": "KT Zepp Yokohama", "prefecture": "神奈川県",
            "liveDate": "2026-03-03", "startTime": "19:00", "price": 6900,
            "paymentDeadline_has": "2026-02-02",
        },
    },
    {
        "id": "eplus_issue",
        "subject": "【e+より】《重要》チケット発券開始のご案内",
        "from": "info@eplus.co.jp",
        "received_at": "2024-08-11T11:01:22+09:00",
        "body": """＜ チケット発券のご案内 ＞
お申込みされたチケットの受取りについてご案内いたします。
公演名　　　：　アザミ
会場名　　　：　ＷＷＷ
公演日時　　：　2024/08/16(金)  18：45開場 19：30開演
席種・料金　：　オールスタンディング \\4,000×1枚[チケット料金]＋\\330×1枚[サービス料]
発券枚数　　：　1
店頭発券手数料　：　\\110
発券期間　：　2024/08/11(日) 14:00　〜　2024/08/17(土) 21:00
ファミリーマート店舗にて、次の手順でお手続きください。""",
        "expect": {
            "isTicketRelated": True, "statusHint": "print_pending",
            "ticketFormat": "paper", "title": "アザミ", "venue": "WWW",
            "prefecture": "東京都", "liveDate": "2024-08-16", "startTime": "19:30",
            "ticketingDeadline_has": "2024-08-17",
        },
    },
    {
        # 2026-06-21 実機で「取り込まれない」と判明した実例①（MAISONdes・未発券リマインド）。
        # 漏れ原因は抽出ではなく検索クエリ側：①from が eplus.co.jp（クエリは eplus.jp のみ）
        # ②件名「未発券」が subject 条件に無い。抽出自体は下記のとおり正しく構造化できる。
        "id": "eplus_unissued_reminder",
        "subject": "【e+より】《必ずご確認ください》チケット未発券のご案内",
        "from": "info@eplus.co.jp",
        "received_at": "2026-06-03T15:18:00+09:00",
        "body": """＜ チケット発券のご案内 ＞
お申込みいただいたチケットの公演日が近づいておりますが、チケットが未発券のままとなっております。
公演名　　　：　MAISONdes LIVE ＃3
会場名　　　：　ＫＴ Ｚｅｐｐ Ｙｏｋｏｈａｍａ
公演日時　　：　2026/06/06(土)  17：00開場 18：00開演
席種・料金　：　１Ｆスタンディング \\6,800×2枚[チケット料金]＋\\550×2枚[サービス料]
発券枚数　　：　2
店頭発券手数料　：　\\330
発券期間　：　2026/05/30(土) 14:00　〜　2026/06/07(日) 21:00
払込票番号：　XXXXXXXXXXXX
ファミリーマート店舗にて、次の手順でお手続きください。""",
        "expect": {
            "isTicketRelated": True, "statusHint": "print_pending",
            "ticketFormat": "paper", "title": "MAISONdes LIVE ＃3",
            "venue": "KT Zepp Yokohama", "prefecture": "神奈川県",
            "liveDate": "2026-06-06", "startTime": "18:00", "ticketCount": 2,
            "ticketingDeadline_has": "2026-06-07",
        },
    },
    {
        # 2026-06-21 実機で「取り込まれない」と判明した実例②（ずとまよ・抽選結果/第5希望当選）。
        # 漏れ原因は検索クエリ側：from が pia.co.jp（クエリは pia.jp / mp.pia.jp のみ）。
        # 件名「抽選結果」は条件にあるため、ドメイン追加だけで拾える。
        "id": "pia_zutomayo_win",
        "subject": "抽選結果のお知らせ / Lottery Results［ずっと真夜中でいいのに。〔東京・神奈川・大阪・兵庫〕※セブン-イレブン先行］",
        "from": "members_info@pia.co.jp",
        "received_at": "2026-02-07T18:09:00+09:00",
        "body": """お申し込みいただいた以下のチケットのご用意ができましたのでお知らせいたします。
■抽選結果 ずっと真夜中でいいのに。〔東京・神奈川・大阪・兵庫〕※セブン-イレブン先行
＜第1希望＞ ご用意できませんでした
＜第5希望＞ 当選
払込票番号：XXXX-XXXX-XXXXX
公演名： ずっと真夜中でいいのに。
公演日時： 2026年6月2日(火) 19:00開演
会場名： Ｋアリーナ横浜(神奈川県)
席種・枚数： 指定席 9,900円 1枚
■料金明細 合計金額： 計 11,385円
■決済方法 セブン-イレブンでお支払い
支払期限：2026年2月10日(火) 23:59""",
        "expect": {
            "isTicketRelated": True, "statusHint": "payment_pending",
            "title": "ずっと真夜中でいいのに。", "venue": "Kアリーナ横浜",
            "prefecture": "神奈川県", "liveDate": "2026-06-02", "startTime": "19:00",
            "ticketCount": 1, "price": 11385, "paymentDeadline_has": "2026-02-10",
        },
    },
    {
        "id": "eplus_baseball_promo",
        "subject": "【WEB限定】2025東京ドーム巨人戦・セゾンカード会員さま限定先行受付",
        "from": "info@eplus.co.jp",
        "received_at": "2025-04-04T17:21:18+09:00",
        "body": """◆ SAISON CARD NEWS MAIL ◆ 2025/04/04
◇2025東京ドーム巨人戦◇セゾンカード会員さま先行受付！（東京ドーム）
会員様から毎年ご好評いただいております、「読売ジャイアンツ主催試合」セゾンカード会員さま向け先行受付のご案内です。
会場：東京ドーム【東京都】
対戦カード：[中日] 5/16(金)〜18(日) [ヤクルト] 5/23(金)〜25(日)
受付期間：4/5(土)12:00〜8(火)12:00　※抽選制
【詳細・お申込み】 ...""",
        "expect": {
            "isTicketRelated": False,  # 宣伝＋スポーツ＝除外（送信元は同じe+でも本文で弾く）
        },
    },
]
