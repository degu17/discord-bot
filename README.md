# Discord Bot - 統合版（モデレーション & ゲーム & タスク管理）

Discord上でモデレーション、Hit&Blowゲーム、タスク管理機能を提供する統合型TypeScript製ボットです。

## 🚀 機能

- **自動モデレーション**: 不適切なメッセージの自動検出・対応（警告・削除・タイムアウト）
- **Hit&Blow ゲーム**: 4桁の数字を当てるクラシックゲーム  
- **タスク管理**: Notion APIと連携したタスク作成・管理機能（オプション）
- **スラッシュコマンド**: Discord の最新UI対応
- **NextJS Web機能**: 統合されたWebアプリケーション（ダッシュボード等）

## 📋 必要要件

- Node.js 18.0.0 以上
- npm または yarn
- Discord Bot Token（必須）
- Notion Integration Token（タスク機能使用時のみ）

## 🛠️ セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd discordBotDevelop
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

#### 基本設定（Hit&Blowゲームのみ）

```bash
# .env.example をコピー
cp .env.example .env
```

`.env` ファイルを編集して以下を設定：

```env
# Discord設定（必須）
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_id_here

# Notion設定（オプション - タスク機能使用時のみ）
# NOTION_TOKEN=your_notion_integration_token_here
# NOTION_TASK_DB_ID=your_notion_database_id_here

# 開発環境設定
NODE_ENV=development
```

#### Discord Bot の作成手順

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリックして新しいアプリケーションを作成
3. 左メニューから「Bot」を選択
4. 「Add Bot」をクリック
5. **Token** をコピーして `DISCORD_TOKEN` に設定
6. 左メニューから「General Information」を選択
7. **Application ID** をコピーして `CLIENT_ID` に設定
8. 左メニューから「Bot」に戻り、以下を有効化：
   - `MESSAGE CONTENT INTENT`
   - `SERVER MEMBERS INTENT`
   - `GUILD MESSAGES INTENT`

#### サーバーへの招待

以下のURLでボットをサーバーに招待（`YOUR_CLIENT_ID`を実際のIDに置換）：

```
https://discord.com/api/oauth2/authorize?client_id=1402102684705886228&permissions=274877908992&scope=bot%20applications.commands
```

**重要**: 権限整数は`274877908992`を使用してください（Botに必要な権限の組み合わせ）

### 4. TypeScriptのコンパイル

```bash
# Bot用コンパイル
npm run bot:build

# Web用コンパイル（Next.js）
npm run build
```

### 5. スラッシュコマンドの登録

```bash
npm run register-commands
```

### 6. ボットの起動

```bash
# Bot起動
npm run bot:start

# Web+Bot起動（開発環境）
npm run dev

# Web本番起動
npm run start
```

## 🌐 Railway デプロイ・ローカル開発

### Railway CLI セットアップ

```bash
# Railway CLI インストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクトにリンク
railway link --project YOUR_PROJECT_ID
```

### 環境変数設定（Railway）

```bash
# 必須設定
railway variables set DISCORD_TOKEN="your_discord_token"
railway variables set DISCORD_CLIENT_ID="your_client_id"
railway variables set DISCORD_PUBLIC_KEY="your_public_key"
railway variables set NODE_ENV="production"

# タスク機能使用時
railway variables set NOTION_TOKEN="your_notion_token"
railway variables set NOTION_TASK_DB_ID="your_database_id"
```

### ローカル開発（Railway環境変数使用）⭐ 推奨

Railwayの環境変数をローカル開発で使用する方法：

```bash
# Railway環境変数を使用してBot実行
railway run npm run bot:start

# Railway環境変数を使用してBot開発モード
railway run npm run bot:dev

# Railway環境変数を使用してWeb+Bot開発モード
railway run npm run dev

# Railway環境変数を使用してTypeScriptコンパイル
railway run npm run bot:build
```

**メリット:**
- 本番環境と同じ環境変数でテスト可能
- ローカルで`.env`ファイルを作成する必要なし
- 環境変数の管理が一元化

### デプロイ

```bash
# Railwayにデプロイ
railway up
```

## 🎮 使用方法

### モデレーション機能

**自動機能（設定により動作）:**
- レベル1: 不適切語検出で警告メッセージ表示
- レベル2: 不適切語検出でメッセージ削除
- レベル3: 不適切語検出でユーザータイムアウト（10分）

**テストコマンド:**
- `/modtest permissions` - Bot権限の確認
- `/modtest channel` - チャンネル権限の確認

### Hit&Blow ゲーム

- `/hitblow start` - ゲーム開始
- `/hitblow join` - ゲーム参加
- `/hitblow send [数字]` - 数字を予想（例: `/hitblow send 1234`）
- `/hitblow history` - ゲーム履歴表示

### タスク管理（Notion設定時のみ）

- `/task create [タイトル]` - タスク作成
- `/task confirm [タイトル]` - タスク詳細確認
- `/task update title [現在のタイトル] [新しいタイトル]` - タイトル変更
- `/task update priority [タイトル] [優先度]` - 優先度変更
- `/task update deadline [タイトル] [期限]` - 期限変更
- `/task delete [タイトル]` - タスク削除

## 🔧 開発用コマンド

```bash
# Bot開発モード（ファイル監視 + 自動再起動）
npm run bot:dev

# Web+Bot開発モード（Next.js + Bot同時実行）
npm run dev

# Railway環境変数を使用したBot開発モード ⭐
railway run npm run bot:dev

# TypeScriptコンパイル
npm run bot:build

# スラッシュコマンド登録
npm run register-commands

# Bot本番起動
npm run bot:start

# Web本番起動
npm start

# Railway環境変数を使用したBot起動 ⭐
railway run npm run bot:start
```

## 🔗 Notion 設定（オプション）

タスク管理機能を使用する場合のみ必要です。

### 1. Notion Integration 作成

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「New integration」をクリック
3. Integration名を入力して作成
4. **Internal Integration Token** をコピー → `NOTION_TOKEN`

### 2. データベース作成

Notionで以下の項目を持つデータベースを作成：

| プロパティ名 | タイプ | 説明 |
|------------|-------|------|
| Title | タイトル | タスク名 |
| Priority | セレクト | 高, 中, 低 |
| Status | セレクト | 未着手, 進行中, 完了 |
| Deadline | 日付 | 期限 |
| Creator | テキスト | 作成者 |

### 3. データベースの共有

1. データベースページで「共有」をクリック
2. 作成したIntegrationを招待
3. データベースIDをURLから取得 → `NOTION_TASK_DB_ID`

例: `https://notion.so/workspace/DATABASE_ID?v=...`

## 📁 プロジェクト構造

```
discordBotDevelop/
├── src/                   # Discord Bot関連
│   ├── commands/          # スラッシュコマンドハンドラー
│   │   ├── hitblow.ts     # Hit&Blowゲーム
│   │   ├── task.ts        # タスク管理
│   │   └── modtest.ts     # モデレーションテスト
│   ├── services/          # ビジネスロジック
│   │   ├── moderation/    # モデレーション機能
│   │   │   ├── ModerationService.ts    # メインサービス
│   │   │   ├── WordDetector.ts         # 不適切語検出
│   │   │   ├── ActionExecutor.ts       # アクション実行
│   │   │   └── ModerationLogger.ts     # ログ管理
│   │   ├── gameManager.ts # ゲーム管理
│   │   ├── taskService.ts # タスク管理サービス
│   │   ├── notionClient.ts# Notion API クライアント
│   │   └── commandRegistry.ts # コマンド登録
│   ├── types/             # 型定義
│   │   ├── index.ts       # 共通型
│   │   ├── discord.ts     # Discord関連型
│   │   ├── game.ts        # ゲーム型
│   │   └── task.ts        # タスク型
│   ├── utils/             # ユーティリティ
│   │   ├── ConfigManager.ts    # 設定管理
│   │   ├── gameLogic.ts        # ゲームロジック
│   │   ├── validation.ts       # バリデーション
│   │   └── permissionChecker.ts # 権限チェック
│   ├── config/            # 設定ファイル
│   │   ├── gameSettings.json      # ゲーム設定
│   │   └── moderationRules.json   # モデレーション設定
│   ├── scripts/           # スクリプト
│   │   └── registerCommands.ts # コマンド登録
│   └── index.ts           # Botメインエントリーポイント
├── app/                   # Next.js Web機能
│   ├── api/               # Web API
│   └── dashboard/         # ダッシュボード
├── lib/                   # 共有ライブラリ
│   ├── discord.ts         # 統合Bot クライアント
│   ├── auth.ts           # 認証
│   └── gcp.ts            # Google Cloud
├── convex/               # Convex データベース
├── types/                # 共通型定義
├── dist/                 # コンパイル済みJavaScript
├── TEST.md              # 統合テストケース
├── package.json         # プロジェクト設定
├── tsconfig.json        # TypeScript設定（Web用）
├── tsconfig.bot.json    # TypeScript設定（Bot用）
├── railway.json         # Railway デプロイ設定
└── README.md            # このファイル
```

## 🐛 トラブルシューティング

### ボットが応答しない

1. **Discord Developer Portal** でBot設定を確認
2. 必要なIntentsが有効になっているか確認
3. ボットがサーバーに正しく招待されているか確認
4. 権限整数が`274877908992`に設定されているか確認
5. `DISCORD_TOKEN`と`DISCORD_CLIENT_ID`が正しく設定されているか確認

### コマンドが表示されない

```bash
# スラッシュコマンドを再登録
npm run register-commands
```

### 環境変数が取得できない（ローカル開発時）

```bash
# Railwayプロジェクトにリンクされているか確認
railway link

# 環境変数を確認
railway variables

# Railway環境変数を使用して実行
railway run npm run dev
```

### Notion機能でエラーが発生

1. `NOTION_TOKEN`と`NOTION_TASK_DB_ID`が正しく設定されているか確認
2. NotionデータベースでIntegrationが共有されているか確認
3. データベースの各プロパティが正しく設定されているか確認

### TypeScriptコンパイルエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScriptを再コンパイル
npm run build
```

## 📞 サポート

- **Issues**: GitHub Issues でバグ報告や機能要望をお願いします
- **Pull Requests**: コントリビューションをお待ちしています

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

## 💻 開発者向け情報

### コーディング規約

#### 命名規則
- **クラス名：** PascalCase
- **変数・関数：** camelCase
- **インターフェース：** PascalCase（`I`プレフィックスなし）
- **ファイル名：** camelCase （例：`gameLogic.ts`）

#### フォーマット規則
- **引用符：** シングルクォート（`'`）を使用
- **インデント：** 2スペース
- **セミコロン：** 必須
- **配列型：** `Foo[]` を `Array<Foo>` より優先

#### 変数とメソッド
- 変数名は省略せず、完全な単語を使用
- 必ず型定義を行い、`any` 型は避ける
- 戻り値と引数に型定義を必須とする
- 厳密等価演算子（`===`）を使用

### 機能詳細設計

#### 自動モデレーション機能（将来実装予定）

**レベル1: 警告の自動発行**
- 警告メッセージを表示
- 検出例：「ばか」等の軽度な不適切語

**レベル2: メッセージの自動削除**
- 検出ワードが含まれたメッセージを自動削除
- 削除通知メッセージを表示

**レベル3: 一時的なアカウントの制限**
- 該当ユーザーを10分間タイムアウト
- 警告メッセージを表示

#### Hit&Blowゲーム機能

- ゲーム状態はメモリ内で管理
- 複数のゲームの同時進行に対応
- タイムアウト機能（5分間無操作で自動終了）

#### タスク管理機能

- Notion APIを使用したCRUD操作
- エラーハンドリング（API制限、ネットワークエラー）
- 入力値の検証

### セキュリティ考慮事項

- ボットトークンとAPIキーは環境変数で管理
- `.env`ファイルは`.gitignore`に追加
- ユーザー入力の検証とサニタイズ
- コマンド実行のレート制限
- エラーメッセージに機密情報を含めない

### エラーハンドリング

- try-catchによる適切なエラー処理
- ユーザーフレンドリーなエラーメッセージ
- エラーログの記録
- 復旧可能なエラーの自動リトライ

### 設計方針

- 可読性と保守性を重視したコード
- 機能ごとのモジュール分離
- 拡張性を考慮した設計
- 1～2回程度のリファクタリングを想定

---

**注意**: 
- Notion機能を使用しない場合は、Hit&Blowゲーム機能のみが利用可能です
- 環境変数 `NOTION_TOKEN` と `NOTION_TASK_DB_ID` が未設定でもボットは正常に動作します
- **ローカル開発では `railway run` コマンドを使用することで、Railwayの環境変数を簡単に利用できます**
- 本設計は初期段階のものであり、開発過程で適宜更新される予定です