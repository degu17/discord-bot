import { Client, GatewayIntentBits, Events } from 'discord.js';

// Railway環境変数テスト
console.log('=== Railway Environment Variables Test ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment:', process.env.NODE_ENV || 'development');

// 環境変数の存在確認
const envVars = {
  'DISCORD_TOKEN': process.env.DISCORD_TOKEN,
  'DISCORD_CLIENT_ID': process.env.DISCORD_CLIENT_ID,
  'DISCORD_PUBLIC_KEY': process.env.DISCORD_PUBLIC_KEY,
  'NOTION_TOKEN': process.env.NOTION_TOKEN,
  'NOTION_TASK_DB_ID': process.env.NOTION_TASK_DB_ID
};

console.log('\n--- Environment Variables Status ---');
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    // セキュリティのため、トークンは最初の4文字と最後の4文字のみ表示
    if (key.includes('TOKEN')) {
      const maskedValue = value.length > 8 ? 
        `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 
        '***';
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
const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:', missingVars);
  console.error('Please check your Railway configuration.');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set');
}

console.log('\n=== Starting Discord Bot ===\n');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`🆔 Client ID: ${readyClient.user.id}`);
  console.log(`📱 Bot is online and ready to receive commands`);
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  
  // Placeholder for moderation functionality
  console.log(`Message from ${message.author.tag}: ${message.content}`);
});

const token = process.env.DISCORD_TOKEN;
client.login(token).catch(error => {
  console.error('❌ Failed to login to Discord:', error.message);
  process.exit(1);
});