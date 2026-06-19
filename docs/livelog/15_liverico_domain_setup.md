# liverico.app セットアップ完全ガイド（アプリURL＋メール）

作成: 2026-06-18 ／ クロコ確認済み（このガイドで進めてOK）。インフラ作業＆依頼書 `13_domain_email_handover.md` と併用。

> ✅ **クロコ確認結果：このまま進めて良い。** 唯一の要確認＝「ルート(apex)のDNSレコード型」（下の STEP2 と「⚠️クロコ注記」参照）。

## 0. 全体像（このドメインで何をするか）
| 用途 | 中身 | 設定先 |
|---|---|---|
| A. アプリのURL | `https://liverico.app` で Manusアプリを表示（livelogapp-…manus.space の独自ドメイン化） | Manus + お名前DNS |
| B. メール | `admin@ / hello@ / support@liverico.app` を Google Workspace で | Workspace + お名前DNS |

A（Web=Aレコード）と B（メール=MXレコード）は同じDNSに共存できる。お名前.comのDNS設定で一緒に入れる。

---

## STEP 1　ドメイン取得（お名前.com・約5分）
- お名前.com → 「liverico」検索 → **.app** を取得・決済（年 約¥1,400〜2,000）
- ⚠️ .app は**常時HTTPS必須**（TLD仕様でHSTS強制）。SSLが無いとページが表示すらされない → STEP2でManusが自動SSL発行するので問題なし。

## STEP 2　アプリに接続（Manus）
1. Manus管理画面 → Settings → Domains →「ドメイン追加」→ `liverico.app`
2. Manusが登録すべきDNSレコードを表示（通常：Aレコード or CNAME ＋ 検証用TXT）→ お名前.comのDNSに貼る
3. SSL証明書はManusが自動発行（数分〜数十分）
4. `https://liverico.app` でアプリが出れば成功

> ⚠️ **クロコ注記（最重要・先に確認）**：ルート(`liverico.app`)は仕様上 **CNAMEを置けない**。
> - Manusが **IP(Aレコード)** をくれる → ルートに **A** で設定（素直・推奨）
> - Manusが **ホスト名(CNAME)しかくれない** → `www.liverico.app` をCNAME、**ルートはwwwへURL転送**。
>   - さらに .appはHTTPS必須なので、お名前のURL転送がHTTPS非対応だと崩れることあり → その場合 **DNSをCloudflareに移すと apexのCNAMEフラット化で一発**（任意・必要時）。
> - → **まずManusのDomains画面でA(IP)かCNAME(ホスト名)かを確認**してから設定する。

## STEP 3　メール（Google Workspace・約15分＋反映待ち）
既存Workspaceに**セカンダリドメイン追加**＝新席なしで**追加¥0**。

1. admin.google.com（管理者）→ アカウント → ドメイン → ドメインの管理 →「ドメインを追加」
2. `liverico.app` → **「セカンダリ ドメイン」を選択**（⚠️「ドメインエイリアス」ではない）
3. 所有権確認：表示される **TXT** をお名前.comのDNSに登録
4. **MX** を登録（新方式なら `smtp.google.com`（優先度1）1本でOK。※管理画面が5本(ASPMX…)を指示したらそちらに従う）
5. 迷惑メール対策（実質必須）：
   - **SPF**(TXT @)：`v=spf1 include:_spf.google.com ~all`
   - **DKIM**：管理コンソール → アプリ → Gmail → メール認証 → `liverico.app` で生成 → 出たTXTを `google._domainkey` に登録
   - **DMARC**(TXT `_dmarc`)：`v=DMARC1; p=none; rua=mailto:admin@liverico.app`（p=noneは監視のみで開始＝正解）
6. アドレス作成（追加¥0）：
   - **admin@liverico.app**（登録/復旧用）＝既存ユーザーに**エイリアス追加**（無料）
   - **hello@ / support@liverico.app**（公開サポート）＝**グループ（共有受信箱）**（無料）

## STEP 4　運用ルール
- 各種サービス/SNS登録 → **admin@liverico.app**（あなたのGmail受信箱に届く）
- ユーザー対応 → **hello@ / support@liverico.app**（Gmailで返信・複数人・検索）

---

## 📋 お名前.com DNS「全レコードまとめ」（一気に登録）
| ホスト | タイプ | 値 | 用途 |
|---|---|---|---|
| @（ルート） | A | ManusのIP（パネル表示値） | アプリ |
| www | CNAME | Manusのホスト名（任意・必要時） | アプリ |
| @ | TXT | google-site-verification=…（Workspace表示値） | 所有権確認 |
| @ | MX | smtp.google.com（優先度1） | メール受信 |
| @ | TXT | v=spf1 include:_spf.google.com ~all | SPF |
| google._domainkey | TXT | DKIM値（管理コンソール生成） | DKIM |
| _dmarc | TXT | v=DMARC1; p=none; rua=mailto:admin@liverico.app | DMARC |
| （Manus検証用TXT があれば） | TXT | パネル表示値 | アプリ所有権 |

A（Web）とMX（メール）は用途が違うので衝突しない。複数TXTも共存OK。

---

## ✅ 反映待ち＆確認
- DNS反映：お名前.comは比較的早い（数十分〜数時間）
- アプリ：`https://liverico.app` 表示 → 鍵マーク(SSL)確認
- メール：別アドレスから admin@ 宛に送信→受信確認 → admin@ から返信→送信確認
- 確認ツール：dnschecker.org で A/MX/TXT の反映確認

## 💰 費用
| 項目 | 費用 |
|---|---|
| ドメイン .app | 年 約¥1,400〜2,000 |
| Manusカスタムドメイン | 通常 ¥0（プラン次第） |
| メール（エイリアス＋グループ） | ¥0（既存Workspaceに追加・新席なし） |

→ 実質ドメイン代だけで、アプリURL＋独自メールが両方そろう。

## ⚠️ つまずきポイント
- .appはHTTPS必須 → SSL未発行だと真っ白。Manusの証明書発行を待つ
- ルートのCNAME不可 → AレコードかURL転送でwww運用（クロコ注記参照）
- DNS反映ラグ → 設定直後に動かなくても数時間待つ
- 「セカンダリ」を選ぶ（エイリアスだと独自アドレスが作れない）
- SPF/DKIM/DMARCを省かない → 省くと不達/迷惑判定
- Workspace本体の月額は別（既存なら追加0）

## ⬇️ 下流の注意（ドメイン稼働後に対応・忘れない）
- **Google OAuthの「承認済みリダイレクトURI」に `https://liverico.app/...` を追加**（Gmail連携でハマった所）。
- App Store/Play・各SNSのリンクを liverico.app に更新（リブランド時）。

## 進める順番
① ドメイン取得 → ② **Manusでapex型(A/CNAME)を確認** → ③ DNSにアプリ＋メールを一気に登録 → ④ Manus/Workspaceで「確認」 → ⑤ 反映待ち → ⑥ アプリ表示＆メール送受信テスト
