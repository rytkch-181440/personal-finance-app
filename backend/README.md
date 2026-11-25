## 起動方法

```bash
uv run --no-editable backend
```

起動後、Swagger UI は http://127.0.0.1:8000/docs で確認できます。
ヘルスチェックは http://127.0.0.1:8000/health です。
`src` 配下の Python ファイルを変更すると、サーバーが自動で再起動します。

`POST /auth/token` にメールアドレスとパスワードを送信すると、Supabase の認証を行い access token と有効秒数を返します。レスポンスの access token を使い、`GET /categories` に `Authorization: Bearer <access_token>` ヘッダーを付けてください。Supabase 側の RLS は認証したユーザーの権限で評価されます。access token の有効期限が切れた場合は再認証してください。パスワードやトークンをログに出力したり、保存・共有したりしないでください。

`GET /auth/me` はtokenのユーザーIDを返します。categoriesが空の場合はこのIDと各行の `user_id` が一致しているか確認してください。RLSのSELECTポリシーにも `user_id = (select auth.uid())` の条件が必要です。
