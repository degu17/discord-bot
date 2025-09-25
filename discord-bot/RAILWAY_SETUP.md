# Railway 環境変数設定ガイド

## 概要
このプロジェクトはRailwayでホストされるDiscord Bot + Next.js管理画面です。

## Railwayでの環境変数設定手順

### 1. Railwayダッシュボードにアクセス
- [Railway Dashboard](https://railway.app/dashboard) にログイン
- プロジェクトを選択または新規作成

### 2. 環境変数の設定
プロジェクトの「Variables」タブで以下の環境変数を設定：

#### Discord Bot設定
```
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_PUBLIC_KEY=your_discord_public_key
```

#### Notion統合
```
NOTION_TOKEN=your_notion_integration_token
NOTION_TASK_DB_ID=your_notion_database_id
```

#### GCP設定
```
GCP_PROJECT_ID=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account_key.json
```

#### Clerk認証
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

#### Convexデータベース
```
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
```

#### Railway固有設定
```
NODE_ENV=production
PORT=3000
RAILWAY_ENVIRONMENT=production
```

### 3. デプロイ
- 環境変数を設定後、自動的にデプロイが開始されます
- デプロイ完了後、提供されるURLでアクセス可能

### 4. 動作確認
- `/api/status` エンドポイントで環境変数の設定状況を確認
- 管理画面（`/dashboard`）でBotの状態を確認

## 注意事項
- 機密情報（トークンなど）は必ずRailwayの環境変数で管理
- `.env.local`ファイルはローカル開発用のみ使用
- 本番環境では`NODE_ENV=production`を設定
