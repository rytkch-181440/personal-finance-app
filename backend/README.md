## 起動方法

```bash
uv run --no-editable backend
```

起動後、Swagger UI は http://127.0.0.1:8000/docs で確認できます。
ヘルスチェックは http://127.0.0.1:8000/health です。
`src` 配下の Python ファイルを変更すると、サーバーが自動で再起動します。
