import { Client, GatewayIntentBits, Events, MessageFlags } from 'discord.js';
import { CommandRegistry } from './services/commandRegistry';
import { HitBlowCommand } from './commands/hitblow';
import { TaskCommand } from './commands/task';
import { ModTestCommand } from './commands/modtest';
import { PermissionChecker } from './utils/permissionChecker';

// Railway環境変数テスト
console.log('=== Discord Bot Starting ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Environment:', process.env.NODE_ENV || 'development');

// 環境変数の設定状況をログ出力
console.log('🔧 環境変数設定状況:');
console.log('- DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ 設定済み' : '❌ 未設定');
console.log('- CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? '✅ 設定済み' : '❌ 未設定');
console.log('- NOTION_TOKEN:', process.env.NOTION_TOKEN ? '✅ 設定済み' : '❌ 未設定');
console.log('- NOTION_TASK_DB_ID:', process.env.NOTION_TASK_DB_ID ? '✅ 設定済み' : '❌ 未設定');

// Discord Bot クライアントの作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`🆔 Client ID: ${readyClient.user.id}`);
  
  // スラッシュコマンドの登録
  try {
    const commandRegistry = new CommandRegistry(
      process.env.DISCORD_TOKEN!,
      process.env.DISCORD_CLIENT_ID!
    );
    
    const commands = CommandRegistry.getAllCommands();
    console.log('📋 Registering commands:', commands.map(c => c.name));
    await commandRegistry.registerCommands(commands);
    console.log('✅ Slash commands registered successfully');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
  
  // 権限チェック実行
  console.log('\n🔍 Starting permission check...');
  try {
    await PermissionChecker.checkBotPermissions(readyClient);
    const hasPermissions = await PermissionChecker.quickPermissionTest(readyClient);
    
    if (hasPermissions) {
      console.log('✅ モデレーション機能準備完了: メッセージ管理・タイムアウト権限を確認しました');
    } else {
      console.log('⚠️ モデレーション権限が不足している可能性があります');
    }
  } catch (error) {
    console.error('❌ Permission check failed:', error);
  }
  
  console.log(`📱 Bot is online and ready to receive commands`);
});

// スラッシュコマンドとボタンのインタラクション処理を統合
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // スラッシュコマンドの処理
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'hitblow') {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
          case 'start':
            await HitBlowCommand.handleStart(interaction);
            break;
          case 'join':
            await HitBlowCommand.handleJoin(interaction);
            break;
          case 'send':
            await HitBlowCommand.handleSend(interaction);
            break;
          case 'history':
            await HitBlowCommand.handleHistory(interaction);
            break;
          default:
            await interaction.reply({
              content: '❌ 不明なサブコマンドです。',
              flags: MessageFlags.Ephemeral
            });
        }
      } else if (commandName === 'task') {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'create') {
          await TaskCommand.handleCreate(interaction);
        } else if (subcommandGroup === 'update') {
          switch (subcommand) {
            case 'title':
              await TaskCommand.handleUpdateTitle(interaction);
              break;
            case 'priority':
              await TaskCommand.handleUpdatePriority(interaction);
              break;
            case 'deadline':
              await TaskCommand.handleUpdateDeadline(interaction);
              break;
          }
        } else if (subcommand === 'delete') {
          await TaskCommand.handleDelete(interaction);
        } else if (subcommand === 'confirm') {
          await TaskCommand.handleConfirm(interaction);
        } else {
          await interaction.reply({
            content: '❌ 不明なサブコマンドです。',
            flags: MessageFlags.Ephemeral
          });
        }
      } else if (commandName === 'modtest') {
        console.log('modtest command received');
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
          case 'permissions':
            await ModTestCommand.handlePermissions(interaction);
            break;
          case 'channel':
            await ModTestCommand.handleChannel(interaction);
            break;
          default:
            await interaction.reply({
              content: '❌ 不明なサブコマンドです。',
              flags: MessageFlags.Ephemeral
            });
        }
      } else {
        console.log(`Unknown command: ${commandName}`);
        await interaction.reply({
          content: `❌ 不明なコマンドです: ${commandName}`,
          flags: MessageFlags.Ephemeral
        });
      }
    }
    // ボタンインタラクションの処理
    else if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId.startsWith('hitblow_join_')) {
        const gameId = customId.replace('hitblow_join_', '');
        const userId = interaction.user.id;

        const { GameManager } = await import('./services/gameManager');
        const gameManager = GameManager.getInstance();

        const game = gameManager.getGame(gameId);
        if (!game) {
          await interaction.reply({
            content: '❌ ゲームが見つかりません。',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const result = gameManager.addParticipant(gameId, userId);
        
        await interaction.reply({
          content: result.success ? `🎮 ${result.message}` : `❌ ${result.message}`,
          flags: MessageFlags.Ephemeral
        });

        if (result.success) {
          console.log(`👤 ${interaction.user.tag} joined game ${gameId} via button`);
        }
      } else if (customId.startsWith('hitblow_start_')) {
        const gameId = customId.replace('hitblow_start_', '');

        const { GameManager } = await import('./services/gameManager');
        const gameManager = GameManager.getInstance();

        const game = gameManager.getGame(gameId);
        if (!game) {
          await interaction.reply({
            content: '❌ ゲームが見つかりません。',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        const result = gameManager.startGame(gameId);
        
        if (result.success) {
          const { EmbedBuilder } = await import('discord.js');
          
          const embed = new EmbedBuilder()
            .setTitle('🚀 ゲーム開始！')
            .setDescription(`参加者: ${game.participants.length}人\n\n4桁の数字を予想して \`/hitblow send\` コマンドで送信してください！`)
            .addFields(
              { name: '制限時間', value: '⏰ 5分', inline: true },
              { name: '参加者数', value: `👥 ${game.participants.length}人`, inline: true }
            )
            .setColor(0x00FF00)
            .setTimestamp();

          await interaction.reply({
            embeds: [embed]
          });

          console.log(`🚀 Game ${gameId} started by ${interaction.user.tag}`);
        } else {
          await interaction.reply({
            content: `❌ ${result.message}`,
            flags: MessageFlags.Ephemeral
          });
        }
      }
    }
  } catch (error) {
    console.error('Interaction handling error:', error);
    
    // インタラクションが既に応答済みかチェック
    if (interaction.isChatInputCommand() || interaction.isButton()) {
      // 既に応答済みの場合は何もしない（ログのみ出力）
      if (interaction.replied || interaction.deferred) {
        console.log('Interaction already responded, skipping error response');
        return;
      }
      
      // 未応答の場合のみエラーメッセージを送信
      try {
        await interaction.reply({
          content: '❌ 処理中にエラーが発生しました。',
          flags: MessageFlags.Ephemeral
        });
      } catch (replyError) {
        console.error('Reply error:', replyError);
      }
    }
  }
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) return;
  
  // Placeholder for moderation functionality (handled by other member)
  console.log(`Message from ${message.author.tag}: ${message.content}`);
});

const token = process.env.DISCORD_TOKEN;
client.login(token).catch(error => {
  console.error('❌ Failed to login to Discord:', error.message);
  process.exit(1);
});