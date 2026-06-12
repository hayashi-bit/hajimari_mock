# LiveLog 仕様書 ① Google ログイン化(Manusアカウント不要化)

> 対象アプリ: **LiveLog**(Manus WebDev プロジェクト / 本リポジトリとは別)
> この文書は **Manus に実装を依頼するための実装指示書** です。
> 優先度: **最高**(マネタイズ前提の基盤づくり)
> 前提: 課金なし・無料で誰でも使える / データ保持 / マルチデバイス対応

---

## 0. ゴール

| 項目 | 現状 | 変更後 |
|---|---|---|
| ログイン | Manus OAuth 必須 | **Google アカウントでログイン** |
| データ紐付け | Manus `openId` | **Google `sub`(googleId)** |
| マルチデバイス | ○ | ○(維持) |
| 課金 | なし | なし(今回スコープ外) |
| 既存データ | Manusユーザーに紐付き | **email照合で自動引き継ぎ** |

**設計方針:** 後続の ③ Gmail連携 と同じ Google OAuth 基盤を使う。
今回は認証スコープを最小(`openid email profile`)に留め、Gmail連携時に**スコープ追加だけ**で拡張できるようにする。

---

## 1. 認証フロー(Google OAuth 2.0 / OpenID Connect)

```
[ユーザー] --「Googleでログイン」--> [Google 認可画面]
        <-- 認可コード(code) --
[client] --> /api/oauth/google/callback?code=...
[server] code -> Googleトークンエンドポイントで id_token/access_token 取得
         id_token 検証 -> { sub, email, name, picture }
         users を email で照合 -> googleId 紐付け or 新規作成
         JWT を発行して Cookie(httpOnly) にセット
        --> / または /upcoming へリダイレクト
```

- セッションは現状同様 **JWT Cookie**(`JWT_SECRET` を流用)。
- `id_token` の署名・`aud`(=GOOGLE_CLIENT_ID)・`iss`・`exp` を必ず検証する。
- 既存の `protectedProcedure` / `adminProcedure` はそのまま使える(`ctx.user` の作り方だけ変更)。

---

## 2. DB スキーマ変更(`drizzle/schema.ts` + migration)

`users` テーブルにカラムを追加。**既存行は削除せず維持**(子テーブルが内部 `userId` に紐付くため)。

| カラム | 型 | 変更 | 用途 |
|---|---|---|---|
| `googleId` | varchar, unique, nullable | **追加** | Google の `sub`。新しい紐付けキー |
| `openId` | 既存 | **残す** | 既存Manusユーザーの移行照合・後方互換 |
| `email` | 既存 | 変更なし | **移行照合キー**(unique 推奨) |
| `avatarUrl` | varchar, nullable | 追加 | Googleプロフィール画像 |
| `authProvider` | enum(`manus`,`google`) | 追加 | 認証元の識別(既定は `manus`) |

マイグレーション注意:
- `googleId` は **nullable + unique**(既存ユーザーは初回ログインまで NULL)。
- `email` に unique 制約が無い場合、移行ロジックの前に重複が無いか確認する。

---

## 3. 既存ユーザーのデータ引き継ぎ(移行ロジック)

初回 Google ログイン時、`server` の callback 内で以下を実行:

```
function resolveUser({ sub, email, name, picture }) {
  // 1) すでに googleId 紐付け済みなら、それを返す
  let user = findUserByGoogleId(sub);
  if (user) return user;

  // 2) email 一致の既存ユーザーがいれば、googleId を追記して引き継ぎ
  user = findUserByEmail(email);
  if (user) {
    updateUser(user.id, { googleId: sub, avatarUrl: picture, authProvider: 'google' });
    return user;            // ★ ライブデータはそのまま引き継がれる
  }

  // 3) いなければ新規作成
  return createUser({ googleId: sub, email, name, avatarUrl: picture, authProvider: 'google' });
}
```

→ **メールアドレスが同じならユーザー操作ゼロで自動移行**。lives / artists / setlist_items / memos は `userId`(内部ID)に紐付くため**移行不要**。

### 補助(email 不一致ケース・任意)
Manus登録時のメールと Googleメールが違う少数ケース向けに、設定画面に
「既存データを引き継ぐ(引き継ぎコード入力)」フォームを用意してもよい。
- オーナーが旧アカウントで一時コードを発行 → 新Googleアカウントで入力 → `userId` を付け替え。
- ※ 利用者がオーナー中心の少数であれば後回し可。まずは email 自動照合で十分。

---

## 4. 変更対象ファイル(Manus 作業範囲)

### バックエンド
| ファイル | 変更内容 |
|---|---|
| `server/_core/oauth.ts` | Manus OAuth → **Google OAuth** に差し替え。認可URL生成・callback・id_token検証・`resolveUser` |
| `server/_core/context.ts` | `ctx.user` を Google JWT ベースで構築(構造は現状維持: id/openId/name/email/role) |
| `server/_core/env.ts` | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` を追加 |
| `drizzle/schema.ts` + migration | §2 のカラム追加 |
| `server/db.ts` | `findUserByGoogleId` / `findUserByEmail` ヘルパー追加、`resolveUser` ロジック |

### フロントエンド
| ファイル | 変更内容 |
|---|---|
| `client/src/const`(`getLoginUrl`) | ログインURLを **Google 認可URL** に変更 |
| `client/src/pages/Home.tsx` | CTA を「**Googleでログイン**」ボタンに(Googleブランドガイド準拠の表記) |
| `client/src/hooks/useAuth.ts` | 変更なし想定(`auth.me` の戻り値構造を維持) |

### 認証エンドポイント
- `GET /api/oauth/google/login` — Google 認可画面へリダイレクト(state/PKCE付与)
- `GET /api/oauth/google/callback` — code 受領 → トークン交換 → JWT発行 → リダイレクト
- 既存 `/api/oauth/callback`(Manus)は移行期間中のみ残し、後で削除可。

---

## 5. 環境変数(追加)

| 変数 | 説明 | 例 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | callback URL | `https://<本番ドメイン>/api/oauth/google/callback` |

Google Cloud Console 側設定(オーナー作業):
1. OAuth 同意画面を構成(External / テスト→本番公開)。
2. OAuth クライアントID(ウェブアプリ)を作成。
3. 承認済みリダイレクトURI に本番 + ローカル(`http://localhost:3000/api/oauth/google/callback`)を登録。
4. スコープは今回 `openid email profile` のみ(Gmail連携時に追加)。

---

## 6. セキュリティ要件

- `id_token` の **署名検証**(Google JWKS)・`aud`/`iss`/`exp` 検証は必須。
- OAuth **state** パラメータで CSRF 対策、可能なら **PKCE** を併用。
- JWT Cookie は `httpOnly` / `Secure` / `SameSite=Lax`。
- `GOOGLE_CLIENT_SECRET` はサーバー専用(クライアントに露出させない)。

---

## 7. テスト観点(Vitest + 手動)

- [ ] 新規 Google ログイン → users 新規作成 → /upcoming 表示。
- [ ] **既存 email と一致する Google ログイン → googleId 紐付け → 既存ライブが全件見える**(最重要)。
- [ ] 2台目デバイスで同じ Google ログイン → 同一データが見える(マルチデバイス)。
- [ ] ログアウト → Cookie 削除 → 保護ページにアクセス不可。
- [ ] 不正/期限切れ id_token → 401。
- [ ] `protectedProcedure` / `adminProcedure` が従来通り機能。

---

## 8. 完了の定義(DoD)

- Manus アカウントなしで、Google アカウントだけでログイン・利用できる。
- 既存ユーザーが email 一致で自動的にデータ引き継ぎできている。
- マルチデバイスで同一データが同期表示される。
- 課金導線は追加しない(今回スコープ外)。

---

## 9. 次フェーズへの布石

- **③ Gmail連携**: 本実装の Google OAuth に `https://www.googleapis.com/auth/gmail.readonly` 等のスコープを追加し、`gmail_tokens` テーブル(既存)に refresh_token を保存する形へ拡張。
- **② Stripe課金**: `users` に紐づく `subscriptions` テーブルを追加し、プラン制限ロジックを乗せる(Google認証はそのまま流用)。
