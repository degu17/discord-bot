import { CommandRegistry } from '../services/commandRegistry';

async function main() {
  console.log('🔄 Starting command registration...');

  // 環境変数チェック
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error('❌ Missing required environment variables:');
    console.error('- DISCORD_TOKEN:', token ? '✅' : '❌');
    console.error('- DISCORD_CLIENT_ID:', clientId ? '✅' : '❌');
    process.exit(1);
  }

  try {
    const registry = new CommandRegistry(token, clientId);
    const commands = CommandRegistry.getAllCommands();

    console.log(
      '📋 Commands to register:',
      commands.map((c) => c.name)
    );

    await registry.registerCommands(commands);
    console.log('✅ All commands registered successfully!');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
    process.exit(1);
  }
}

main();
