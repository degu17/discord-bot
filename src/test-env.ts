/**
 * Railway環境変数テスト用ファイル
 * このファイルは環境変数が正しく設定されているかを確認するために使用します
 */

console.log('🚀 Railway Environment Variables Test Started');
console.log('==========================================');

// 基本情報
console.log(`📋 Node.js Version: ${process.version}`);
console.log(`🖥️  Platform: ${process.platform}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`⏰ Current Time: ${new Date().toISOString()}`);

// Railway環境変数の確認
const railwayVars = {
  'DISCORD_TOKEN': {
    value: process.env.DISCORD_TOKEN,
    required: true,
    description: 'Discord Bot Token'
  },
  'DISCORD_CLIENT_ID': {
    value: process.env.DISCORD_CLIENT_ID,
    required: false,
    description: 'Discord Application Client ID'
  },
  'DISCORD_PUBLIC_KEY': {
    value: process.env.DISCORD_PUBLIC_KEY,
    required: false,
    description: 'Discord Application Public Key'
  },
  'NOTION_TOKEN': {
    value: process.env.NOTION_TOKEN,
    required: false,
    description: 'Notion Integration Token'
  },
  'NOTION_TASK_DB_ID': {
    value: process.env.NOTION_TASK_DB_ID,
    required: false,
    description: 'Notion Task Database ID'
  }
};

console.log('\n🔍 Environment Variables Check:');
console.log('================================');

let allRequiredVarsSet = true;

Object.entries(railwayVars).forEach(([key, config]) => {
  const { value, required, description } = config;
  
  if (value) {
    if (key.includes('TOKEN')) {
      // セキュリティのため、トークンは最初と最後の数文字のみ表示
      const maskedValue = value.length > 8 ? 
        `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : 
        '***';
      console.log(`✅ ${key}: ${maskedValue} (${description})`);
    } else {
      console.log(`✅ ${key}: ${value} (${description})`);
    }
  } else {
    if (required) {
      console.log(`❌ ${key}: MISSING - ${description} (REQUIRED)`);
      allRequiredVarsSet = false;
    } else {
      console.log(`⚠️  ${key}: NOT SET - ${description} (optional)`);
    }
  }
});

// 結果サマリー
console.log('\n📊 Test Results Summary:');
console.log('========================');

if (allRequiredVarsSet) {
  console.log('🎉 SUCCESS: All required environment variables are set');
  console.log('✅ Your Railway configuration is ready for deployment');
} else {
  console.log('💥 FAILURE: Some required environment variables are missing');
  console.log('❌ Please check your Railway project settings');
  console.log('🔧 Go to Railway Dashboard > Your Project > Variables tab');
}

// 環境変数の詳細情報（デバッグ用）
console.log('\n🔧 Debug Information:');
console.log('=====================');
console.log('Total environment variables:', Object.keys(process.env).length);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID);

console.log('\n🏁 Environment test completed');
console.log('==========================================');

// テスト完了後、プロセスを終了
process.exit(allRequiredVarsSet ? 0 : 1);
