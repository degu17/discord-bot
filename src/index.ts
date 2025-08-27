import { DiscordBot } from '../lib/discord';

// Railway環境変数テスト
console.log('=== Railway Environment Variables Test ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment:', process.env.NODE_ENV || 'development');

// 環境変数の存在確認
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

console.log('\n=== Starting Discord Bot ===\n');

// DiscordBotクラスのインスタンスを作成
const bot = new DiscordBot();

// Botを起動
const token = process.env.DISCORD_TOKEN;
if (token) {
  bot.start(token).catch((error) => {
    console.error('❌ Failed to start Discord Bot:', error.message);
    process.exit(1);
  });
} else {
  console.error('❌ DISCORD_TOKEN is not set');
  process.exit(1);
}
