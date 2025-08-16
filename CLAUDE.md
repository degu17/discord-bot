# CLAUDE.md

このファイルは、Claude Code (claude.ai/code)がこのリポジトリのコードを扱う際のガイダンスを提供します。

## Project Overview

Discordボット開発プロジェクトで、コミュニティの活性化を目的とした3つの機能を実装します。TypeScript、Discord.js、Node.jsを基盤とし、拡張可能な設計を重視しています。

## 開発目的

1. コミュニティの活性化のため
2. 今後の機能展開を見据えた追加を可能にするため

## 実装機能

1. **自動モデレーション機能** - 不適切なメッセージの自動検出と対応
2. **Hit&Blowゲーム機能** - メンバー同士で楽しめる数字当てゲーム
3. **タスク管理・返答機能** - Notion連携によるタスク管理

## 技術スタック

### コア技術
- TypeScript
- Node.js
- Discord.js

### 外部連携
- Notion API (タスク管理連携)

### データ管理
- メモリ内キャッシュ (ゲーム状態管理)
- JSON形式での設定管理

## Project Structure

```
discord-bot/
├── src/
│   ├── commands/           # Discordコマンド実装
│   │   ├── moderation/     # モデレーション関連
│   │   ├── game/          # Hit&Blowゲーム関連
│   │   └── task/          # タスク管理関連
│   ├── events/            # Discordイベントハンドラー
│   ├── services/          # 外部サービス連携
│   │   └── notion.ts      # Notion API連携
│   ├── utils/             # ユーティリティ関数
│   └── config/            # 設定ファイル
├── types/                 # TypeScript型定義
└── .env                   # 環境変数
```

## Development Setup

```bash
# プロジェクトの初期化
npm init -y

# 必要な依存関係のインストール
npm install discord.js typescript @types/node
npm install @notionhq/client dotenv
npm install --save-dev nodemon ts-node

# TypeScript設定の初期化
npx tsc --init

# プロジェクト構造の作成
mkdir -p src/commands/{moderation,game,task}
mkdir -p src/{events,services,utils,config}
mkdir types
```

## Common Commands

```bash
# 開発モードでボットを起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションモードで起動
npm start

# 型チェック
npm run type-check
```

## 環境変数設定

`.env`ファイルに以下を設定：

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id
```

## コーディング規約

### 命名規則
- **クラス名：** PascalCase
- **変数・関数：** camelCase
- **インターフェース：** PascalCase（`I`プレフィックスなし）
- **ファイル名：** camelCase （例：`gameLogic.ts`）

### フォーマット規則
- **引用符：** シングルクォート（`'`）を使用
- **インデント：** 2スペース
- **セミコロン：** 必須
- **配列型：** `Foo[]` を `Array<Foo>` より優先

### 変数とメソッド
- 変数名は省略せず、完全な単語を使用
- 必ず型定義を行い、`any` 型は避ける
- 戻り値と引数に型定義を必須とする
- 厳密等価演算子（`===`）を使用

## 機能詳細

### 1. 自動モデレーション機能

不適切な内容を検出し、自動的に対応を行います。

#### 制限レベル

**レベル1: 警告の自動発行**
- 警告メッセージを表示
- 検出例：「ばか」等の軽度な不適切語

**レベル2: メッセージの自動削除**
- 検出ワードが含まれたメッセージを自動削除
- 削除通知メッセージを表示

**レベル3: 一時的なアカウントの制限**
- 該当ユーザーを10分間タイムアウト
- 警告メッセージを表示

#### 実装要件
- 検出ワードは設定ファイルで管理
- 各レベルごとに異なる単語リストを設定可能
- ログ記録機能

### 2. Hit&Blowゲーム機能

数字当てゲームをDiscord上で実装します。

#### 実行コマンド
```
/hitblow start      - ゲーム開始・参加募集
/hitblow join       - ゲームに参加（オプション：リアクションでも参加可能）
/hitblow send [数字] - 予想数字送信
/hitblow history    - 過去のゲーム履歴表示
```

#### ゲームフロー
1. **参加募集フェーズ**
   - ゲーム開始コマンドで募集開始
   - 参加方法は以下の2つから選択可能：
     - `/hitblow join`コマンドで参加
     - 募集メッセージへのリアクション（✅等）で参加

2. **ゲーム進行フェーズ**
   - 4桁の数字を当てる
   - Hit（位置と数字が一致）とBlow（数字のみ一致）を表示

3. **結果表示フェーズ**
   - 正解者と試行回数を表示
   - ゲーム統計の記録

#### 実装要件
- ゲーム状態はメモリ内で管理
- 複数のゲームの同時進行に対応
- タイムアウト機能（5分間無操作で自動終了）

### 3. タスク管理・返答機能（Notion連携）

Discord上からNotionデータベースにタスクを登録・管理します。

#### 実行コマンド
```
/task create [タイトル]           - タスク追加
/task update title [タイトル]     - タイトル編集
/task update priority [優先度]    - 優先度編集（高/中/低）
/task update limit [日時]         - 期限設定
/task delete [タイトル]          - タスク削除
/task confirm [タイトル]         - タスク詳細確認
```

#### Notion連携仕様
- タスクはNotionデータベースに保存
- 以下のプロパティを管理：
  - タイトル（Title）
  - 優先度（Select: 高/中/低）
  - 期限（Date）
  - 作成者（Text）
  - ステータス（Select: 未着手/進行中/完了）

#### 実装要件
- Notion APIを使用したCRUD操作
- エラーハンドリング（API制限、ネットワークエラー）
- 入力値の検証

## セキュリティ考慮事項

- ボットトークンとAPIキーは環境変数で管理
- `.env`ファイルは`.gitignore`に追加
- ユーザー入力の検証とサニタイズ
- コマンド実行のレート制限
- エラーメッセージに機密情報を含めない

## エラーハンドリング

- try-catchによる適切なエラー処理
- ユーザーフレンドリーなエラーメッセージ
- エラーログの記録
- 復旧可能なエラーの自動リトライ

## 設計方針

- 可読性と保守性を重視したコード
- 機能ごとのモジュール分離
- 拡張性を考慮した設計
- 1～2回程度のリファクタリングを想定

## package.json スクリプト例

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  }
}
```

## 注意事項

- 本設計は初期段階のものであり、開発過程で適宜更新される
- パフォーマンスの問題が発生した場合は、データベースの導入を検討
- Discord APIのレート制限に注意して実装