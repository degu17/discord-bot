import { Client, GatewayIntentBits, Events } from 'discord.js';
import { ModerationService } from '../src/services/moderation/ModerationService';
import { ConfigManager } from '../src/utils/ConfigManager';
import { WordDetector } from '../src/services/moderation/WordDetector';
import { ActionExecutor } from '../src/services/moderation/ActionExecutor';
import { ModerationLogger } from '../src/services/moderation/ModerationLogger';

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

    // イベントハンドラーの登録確認
    console.log('📋 Event handlers registered:');
    console.log(`  - ClientReady: ${this.client.listenerCount(Events.ClientReady)} listeners`);
    console.log(`  - MessageCreate: ${this.client.listenerCount(Events.MessageCreate)} listeners`);
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
