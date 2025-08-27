import { Client, GatewayIntentBits, Events, MessageFlags } from 'discord.js';
import { ModerationService } from '../src/services/moderation/ModerationService';
import { ConfigManager } from '../src/utils/ConfigManager';
import { WordDetector } from '../src/services/moderation/WordDetector';
import { ActionExecutor } from '../src/services/moderation/ActionExecutor';
import { ModerationLogger } from '../src/services/moderation/ModerationLogger';
import { CommandRegistry } from '../src/services/commandRegistry';
import { HitBlowCommand } from '../src/commands/hitblow';
import { TaskCommand } from '../src/commands/task';
import { ModTestCommand } from '../src/commands/modtest';
import { PermissionChecker } from '../src/utils/permissionChecker';

export class DiscordBot {
  private client: Client;
  private moderationService: ModerationService;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers, // タイムアウト機能に必要
      ],
    });

    // モデレーションサービスの初期化
    this.moderationService = this.initializeModerationService();
    this.setupEventHandlers();
  }

  /**
   * モデレーションサービスを初期化する
   */
  private initializeModerationService(): ModerationService {
    const configManager = new ConfigManager();
    const wordDetector = new WordDetector(configManager);
    const actionExecutor = new ActionExecutor();
    const moderationLogger = new ModerationLogger();

    // ActionExecutorにDiscordクライアントを設定
    actionExecutor.setClient(this.client);

    return new ModerationService(
      configManager,
      wordDetector,
      actionExecutor,
      moderationLogger
    );
  }

  private setupEventHandlers(): void {
    this.client.once(Events.ClientReady, async (readyClient) => {
      console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
      console.log(`🆔 Client ID: ${readyClient.user.id}`);
      console.log(`📱 Bot is online and ready to receive commands`);
      console.log(`🔍 DEBUG: Setting up message event handler...`);
      
      // モデレーションサービスを初期化
      try {
        await this.moderationService.initialize();
        console.log('🛡️  Moderation service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize moderation service:', error);
      }

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
    });

    this.client.on(Events.MessageCreate, async (message) => {
      console.log(`🔍 DEBUG: Message event received! Author: ${message.author.tag}, Bot: ${message.author.bot}, Content: "${message.content}"`);
      
      if (message.author.bot) {
        console.log('⏭️ DEBUG: Skipping bot message');
        return;
      }

      // モデレーション処理を実行（1回のみ）
      try {
        console.log(`🎯 Processing message once: "${message.content}" from ${message.author.tag}`);
        await this.moderationService.processMessage(message);
      } catch (error) {
        console.error('Error in moderation processing:', error);
      }
    });

    // スラッシュコマンドとボタンのインタラクション処理
    this.client.on(Events.InteractionCreate, async (interaction) => {
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

            const { GameManager } = await import('../src/services/gameManager');
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

            const { GameManager } = await import('../src/services/gameManager');
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

    // イベントハンドラーの登録確認
    console.log('📋 Event handlers registered:');
    console.log(`  - ClientReady: ${this.client.listenerCount(Events.ClientReady)} listeners`);
    console.log(`  - MessageCreate: ${this.client.listenerCount(Events.MessageCreate)} listeners`);
    console.log(`  - InteractionCreate: ${this.client.listenerCount(Events.InteractionCreate)} listeners`);
  }

  public async start(token: string): Promise<void> {
    try {
      await this.client.login(token);
    } catch (error) {
      console.error('❌ Failed to login to Discord:', error);
      throw error;
    }
  }

  public getClient(): Client {
    return this.client;
  }

  /**
   * モデレーションサービスを取得する
   */
  public getModerationService(): ModerationService {
    return this.moderationService;
  }

  /**
   * モデレーション設定を再読み込みする
   */
  public async reloadModerationConfig(): Promise<void> {
    try {
      await this.moderationService.reloadConfiguration();
      console.log('🔄 Moderation configuration reloaded successfully');
    } catch (error) {
      console.error('❌ Failed to reload moderation configuration:', error);
      throw error;
    }
  }

  /**
   * モデレーションサービスの健全性をチェックする
   */
  public async checkModerationHealth(): Promise<any> {
    return await this.moderationService.healthCheck();
  }
}
