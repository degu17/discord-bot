import { Message, User } from 'discord.js';
import {
  IModerationService,
  DetectionResult,
  ModerationAction,
  LogEntry,
  ModerationSettings,
} from '../../types/moderation';
import { ConfigManager } from '../../utils/ConfigManager';
import { WordDetector } from './WordDetector';
import { ActionExecutor } from './ActionExecutor';
import { ModerationLogger } from './ModerationLogger';

/**
 * メインのモデレーションサービスクラス
 * WordDetector、ActionExecutor、ModerationLoggerを統合し、
 * メッセージ処理のメインフローを実装する
 */
export class ModerationService implements IModerationService {
  private configManager: ConfigManager;
  private wordDetector: WordDetector;
  private actionExecutor: ActionExecutor;
  private moderationLogger: ModerationLogger;
  private settings: ModerationSettings | null = null;
  private processedMessages: Set<string> = new Set();

  constructor(
    configManager: ConfigManager,
    wordDetector: WordDetector,
    actionExecutor: ActionExecutor,
    moderationLogger: ModerationLogger
  ) {
    this.configManager = configManager;
    this.wordDetector = wordDetector;
    this.actionExecutor = actionExecutor;
    this.moderationLogger = moderationLogger;
  }

  /**
   * 初期化処理
   * 設定ファイルとルールを読み込み、各コンポーネントを準備する
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing ModerationService...');

      // 設定を読み込み
      const config = await this.configManager.loadModerationRules();
      this.settings = config.settings || null;

      // WordDetectorのルールを読み込み
      await this.wordDetector.loadRules();

      // ActionExecutorに設定を適用
      if (this.settings?.administratorNotificationChannel) {
        this.actionExecutor.setAdministratorNotificationChannel(
          this.settings.administratorNotificationChannel
        );
      }

      console.log('ModerationService initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize ModerationService:', error);
      throw error;
    }
  }

  /**
   * メッセージを処理し、必要に応じてモデレーションを実行する
   */
  public async processMessage(message: Message): Promise<void> {
    try {
      console.log(
        `📨 Processing message: "${message.content}" from ${message.author.tag}`
      );

      // ボット自身のメッセージはスキップ
      if (message.author.bot) {
        console.log('⚠️ Skipping bot message');
        return;
      }

      // 重複処理防止チェック
      if (this.processedMessages.has(message.id)) {
        console.log('⚠️ Message already processed, skipping duplicate');
        return;
      }

      // メッセージIDを記録（重複処理防止）
      this.processedMessages.add(message.id);

      // 古いメッセージIDを定期的にクリーンアップ（メモリリーク防止）
      if (this.processedMessages.size > 1000) {
        const messagesToKeep = Array.from(this.processedMessages).slice(-500);
        this.processedMessages.clear();
        messagesToKeep.forEach((id) => this.processedMessages.add(id));
      }

      // 除外対象ユーザーのチェック
      if (this.isExemptUser(message.author)) {
        console.log('⚠️ User is exempt from moderation');
        return;
      }

      // 除外対象チャンネルのチェック
      if (this.isExemptChannel(message.channelId)) {
        console.log('⚠️ Channel is exempt from moderation');
        return;
      }

      // メッセージ内容の検出
      const detectionResult = this.getDetectionResult(message.content);
      console.log('🔍 Detection result:', detectionResult);

      if (!detectionResult) {
        // 不適切な内容が検出されなかった場合は何もしない
        return;
      }

      console.log(
        `Inappropriate content detected: Level ${detectionResult.level}, Words: ${detectionResult.detectedWords.join(', ')}`
      );

      // ログエントリの準備
      const logEntry: LogEntry = {
        timestamp: new Date(),
        userId: message.author.id,
        username: message.author.tag,
        messageContent: message.content,
        detectedWords: detectionResult.detectedWords,
        action: detectionResult.action,
        level: detectionResult.level,
        success: false,
      };

      try {
        // アクションを実行
        await this.executeAction(message, detectionResult);

        // 成功時のログエントリを更新
        logEntry.success = true;
      } catch (actionError) {
        console.error('Failed to execute moderation action:', actionError);

        // 失敗時のログエントリを更新
        logEntry.success = false;
        logEntry.error =
          actionError instanceof Error
            ? actionError.message
            : String(actionError);
      }

      // ログに記録
      await this.moderationLogger.logAction(logEntry);
    } catch (error) {
      console.error('Error processing message for moderation:', error);

      // 処理エラーの場合もログに記録
      const errorLogEntry: LogEntry = {
        timestamp: new Date(),
        userId: message.author.id,
        username: message.author.tag,
        messageContent: message.content,
        detectedWords: [],
        action: ModerationAction.WARN, // デフォルトアクション
        level: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      try {
        await this.moderationLogger.logAction(errorLogEntry);
      } catch (logError) {
        console.error('Failed to log error entry:', logError);
      }
    }
  }

  /**
   * ユーザーが除外対象かどうかをチェックする
   */
  public isExemptUser(user: User): boolean {
    if (!this.settings || !this.settings.exemptRoles) {
      return false;
    }

    // 実装注意: 実際の使用時は、Guildオブジェクトからユーザーの役職を取得して判定する必要がある
    // ここでは構造の示唆のみ
    // const member = guild.members.cache.get(user.id);
    // return member?.roles.cache.some(role => this.settings.exemptRoles.includes(role.id)) || false;

    return false;
  }

  /**
   * チャンネルが除外対象かどうかをチェックする
   */
  private isExemptChannel(channelId: string): boolean {
    if (!this.settings || !this.settings.exemptChannels) {
      return false;
    }

    return this.settings.exemptChannels.includes(channelId);
  }

  /**
   * メッセージ内容から検出結果を取得する
   */
  public getDetectionResult(content: string): DetectionResult | null {
    try {
      return this.wordDetector.detectInappropriateContent(content);
    } catch (error) {
      console.error('Error detecting inappropriate content:', error);
      return null;
    }
  }

  /**
   * 検出結果に基づいてアクションを実行する
   */
  private async executeAction(
    message: Message,
    detectionResult: DetectionResult
  ): Promise<void> {
    switch (detectionResult.action) {
      case ModerationAction.WARN:
        await this.actionExecutor.executeWarning(
          message,
          detectionResult.detectedWords
        );
        break;

      case ModerationAction.DELETE:
        await this.actionExecutor.executeDelete(
          message,
          detectionResult.detectedWords
        );
        break;

      case ModerationAction.TIMEOUT:
        const duration =
          detectionResult.timeoutDuration ||
          this.settings?.defaultTimeoutDuration ||
          600000; // 10分
        await this.actionExecutor.executeTimeout(
          message,
          detectionResult.detectedWords,
          duration
        );
        break;

      default:
        console.warn(`Unknown moderation action: ${detectionResult.action}`);
        break;
    }
  }

  /**
   * 設定を再読み込みする
   */
  public async reloadConfiguration(): Promise<void> {
    try {
      console.log('Reloading moderation configuration...');

      // ConfigManagerの設定を再読み込み
      await this.configManager.reloadConfig();

      // WordDetectorのルールを再読み込み
      await this.wordDetector.reloadRules();

      // 新しい設定を取得
      const config = await this.configManager.loadModerationRules();
      this.settings = config.settings || null;

      // ActionExecutorに新しい設定を適用
      if (this.settings?.administratorNotificationChannel) {
        this.actionExecutor.setAdministratorNotificationChannel(
          this.settings.administratorNotificationChannel
        );
      }

      console.log('Moderation configuration reloaded successfully.');
    } catch (error) {
      console.error('Failed to reload moderation configuration:', error);
      throw error;
    }
  }

  /**
   * サービスの統計情報を取得する
   */
  public getServiceStats(): {
    rulesLoaded: number;
    settingsConfigured: boolean;
    exemptChannels: number;
    exemptRoles: number;
  } {
    return {
      rulesLoaded: this.wordDetector.getRuleCount(),
      settingsConfigured: this.settings !== null,
      exemptChannels: this.settings?.exemptChannels?.length || 0,
      exemptRoles: this.settings?.exemptRoles?.length || 0,
    };
  }

  /**
   * 現在の設定を取得する（デバッグ用）
   */
  public getCurrentSettings(): ModerationSettings | null {
    return this.settings;
  }

  /**
   * テストメッセージの検出結果を取得する（デバッグ用）
   */
  public testDetection(content: string): {
    detectionResult: DetectionResult | null;
    details: any;
  } {
    const detectionResult = this.getDetectionResult(content);
    const details = this.wordDetector.getDetectionDetails(content);

    return {
      detectionResult,
      details,
    };
  }

  /**
   * ログファイルのクリーンアップを実行する
   */
  public async cleanupLogs(daysToKeep: number = 30): Promise<void> {
    try {
      await this.moderationLogger.cleanupOldLogs(daysToKeep);
      console.log(
        `Log cleanup completed. Kept logs from last ${daysToKeep} days.`
      );
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
    }
  }

  /**
   * サービスの健全性チェック
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      configManager: boolean;
      wordDetector: boolean;
      actionExecutor: boolean;
      moderationLogger: boolean;
    };
    details?: string;
  }> {
    try {
      const components = {
        configManager: this.configManager.getCachedConfig() !== null,
        wordDetector: this.wordDetector.getRuleCount() > 0,
        actionExecutor: true, // ActionExecutorは状態を持たないので常にtrue
        moderationLogger: true, // ModerationLoggerの健全性は動的チェックが必要だがここでは簡略化
      };

      const unhealthyComponents = Object.entries(components)
        .filter(([, healthy]) => !healthy)
        .map(([name]) => name);

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (unhealthyComponents.length === 0) {
        status = 'healthy';
      } else if (unhealthyComponents.length <= 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        components,
        ...(unhealthyComponents.length > 0 && {
          details: `Unhealthy components: ${unhealthyComponents.join(', ')}`,
        }),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        components: {
          configManager: false,
          wordDetector: false,
          actionExecutor: false,
          moderationLogger: false,
        },
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
