// 統合版: モデレーション機能 + ゲーム・タスク機能
import { DiscordBot } from '../lib/discord';

console.log('=== Discord Bot Starting (統合版) ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment:', process.env.NODE_ENV || 'development');

// 環境変数の存在確認（詳細版）
const envVars = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY,
  NOTION_TOKEN: process.env.NOTION_TOKEN,
  NOTION_TASK_DB_ID: process.env.NOTION_TASK_DB_ID,
};

console.log('\n--- Environment Variables Status ---');
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    // セキュリティのため、トークンは最初の4文字と最後の4文字のみ表示
    if (key.includes('TOKEN')) {
      const maskedValue =
        value.length > 8
          ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
          : '***';
      console.log(`${key}: ✓ (${maskedValue})`);
    } else {
      console.log(`${key}: ✓ (${value})`);
    }
  } else {
    console.log(`${key}: ✗ (undefined)`);
  }
});

// 必須環境変数のチェック
const requiredVars = ['DISCORD_TOKEN'];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:', missingVars);
  console.error('Please check your Railway configuration.');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set');
}

console.log('\n=== Starting Discord Bot (統合版) ===\n');

// 統合BOTクライアント
const bot = new DiscordBot();

// 統合BOTの起動
const token = process.env.DISCORD_TOKEN;
if (token) {
  // 統合BOTを起動（モデレーション + コマンド機能）
  bot.start(token).catch((error) => {
    console.error('❌ Failed to start Discord Bot:', error.message);
    process.exit(1);
  });
} else {
  console.error('❌ DISCORD_TOKEN is not set');
  process.exit(1);
}
