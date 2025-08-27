import { Message, TextChannel, GuildMember, PermissionsBitField, Client } from 'discord.js';
import { IActionExecutor, ActionContext, ModerationAction } from '../../../types/moderation';

/**
 * モデレーションアクションの実行を担当するクラス
 */
export class ActionExecutor implements IActionExecutor {
  private administratorNotificationChannelId: string | null;
  private retryAttempts: number;
  private retryDelay: number;
  private client: Client | null;

  constructor(administratorNotificationChannelId?: string | null, retryAttempts: number = 3, retryDelay: number = 1000) {
    this.administratorNotificationChannelId = administratorNotificationChannelId || null;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
    this.client = null;
  }

  /**
   * レベル1: 警告メッセージを送信する
   */
  public async executeWarning(message: Message, detectedWords: string[]): Promise<void> {
    try {
      console.log(`⚠️ Executing warning action...`);
      console.log(`📝 Message: "${message.content}"`);
      console.log(`🎯 Detected words: [${detectedWords.join(', ')}]`);
      console.log(`👤 User: ${message.author.tag}`);

      // 動的権限チェック
      await this.checkPermissionsForWarning(message);

      const warningMessage = this.createWarningMessage(message.author.username, detectedWords);
      
      await this.executeWithRetry(async () => {
        console.log(`📤 Sending warning message...`);
        await message.reply(warningMessage);
        console.log(`✅ Warning message sent successfully`);
      });

      console.log(`✅ Warning issued to user ${message.author.tag} for words: ${detectedWords.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Failed to execute warning:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
      });
      
      const context: ActionContext = {
        userId: message.author.id,
        messageId: message.id,
        action: ModerationAction.WARN,
        error: error instanceof Error ? error.message : String(error),
      };
      
      await this.notifyAdministrators('Failed to send warning message', context);
      throw error;
    }
  }

  /**
   * レベル2: メッセージを削除し、削除通知を送信する
   */
  public async executeDelete(message: Message, detectedWords: string[]): Promise<void> {
    try {
      console.log(`🗑️ Attempting to delete message from ${message.author.tag}`);
      console.log(`📝 Message content: "${message.content}"`);
      console.log(`🎯 Detected words: [${detectedWords.join(', ')}]`);
      
      // 権限チェック
      if (message.guild && message.guild.members.me) {
        const botMember = message.guild.members.me;
        const hasDeletePermission = botMember.permissions.has('ManageMessages');
        console.log(`🔒 Bot has delete permission: ${hasDeletePermission}`);
        
        if (!hasDeletePermission) {
          throw new Error('Bot lacks ManageMessages permission');
        }
      }

      // メッセージ削除の実行
      await this.executeWithRetry(async () => {
        console.log(`🗑️ Executing message deletion...`);
        await message.delete();
        console.log(`✅ Message deleted successfully`);
      });

      // 削除通知メッセージを送信
      const deleteNotification = this.createDeleteNotification(message.author.username, detectedWords);
      
      await this.executeWithRetry(async () => {
        if (message.channel instanceof TextChannel) {
          console.log(`📢 Sending delete notification...`);
          await message.channel.send(deleteNotification);
          console.log(`✅ Delete notification sent`);
        }
      });

      console.log(`✅ Delete action completed for user ${message.author.tag}`);
      
    } catch (error) {
      console.error('❌ Failed to execute delete:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const context: ActionContext = {
        userId: message.author.id,
        messageId: message.id,
        action: ModerationAction.DELETE,
        error: error instanceof Error ? error.message : String(error),
      };
      
      // 要件2.4対応: 削除失敗時の管理者通知
      await this.notifyAdministrators('Failed to delete message', context);
      throw error;
    }
  }

  /**
   * レベル3: ユーザーをタイムアウトし、メッセージを削除し、制限通知を送信する
   */
  public async executeTimeout(message: Message, detectedWords: string[], duration: number): Promise<void> {
    try {
      console.log(`⏱️ Attempting to timeout user ${message.author.tag}`);
      console.log(`📝 Message content: "${message.content}"`);
      console.log(`🎯 Detected words: [${detectedWords.join(', ')}]`);
      console.log(`⏰ Timeout duration: ${duration}ms (${Math.ceil(duration / 60000)} minutes)`);
      
      const member = message.member;
      
      if (!member) {
        throw new Error('Member not found for timeout action');
      }

      console.log(`👤 Member found: ${member.user.tag}`);

      // 権限チェック
      if (!message.guild?.members.me) {
        throw new Error('Bot member not found in guild');
      }

      const botMember = message.guild.members.me;
      console.log(`🔒 Checking timeout permissions...`);
      console.log(`  - Bot has ModerateMembers permission: ${botMember.permissions.has('ModerateMembers')}`);
      console.log(`  - Bot role position: ${botMember.roles.highest.position}`);
      console.log(`  - Target role position: ${member.roles.highest.position}`);
      console.log(`  - Target is admin: ${member.permissions.has('Administrator')}`);

      if (!this.canTimeoutUser(botMember, member)) {
        throw new Error('Insufficient permissions to timeout user');
      }

      console.log(`✅ Permission check passed`);

      // ユーザーをタイムアウト
      await this.executeWithRetry(async () => {
        console.log(`⏱️ Executing timeout...`);
        await member.timeout(duration, `Inappropriate language: ${detectedWords.join(', ')}`);
        console.log(`✅ Timeout applied successfully`);
      });

      // メッセージを削除
      await this.executeWithRetry(async () => {
        console.log(`🗑️ Deleting message...`);
        await message.delete();
        console.log(`✅ Message deleted`);
      });

      // 制限通知メッセージを送信
      const timeoutNotification = this.createTimeoutNotification(message.author.username, detectedWords, duration);
      
      await this.executeWithRetry(async () => {
        if (message.channel instanceof TextChannel) {
          console.log(`📢 Sending timeout notification...`);
          await message.channel.send(timeoutNotification);
          console.log(`✅ Timeout notification sent`);
        }
      });

      console.log(`✅ Timeout action completed for user ${message.author.tag}`);
      
    } catch (error) {
      console.error('❌ Failed to execute timeout:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const context: ActionContext = {
        userId: message.author.id,
        messageId: message.id,
        action: ModerationAction.TIMEOUT,
        error: error instanceof Error ? error.message : String(error),
      };
      
      // 要件3.4対応: タイムアウト失敗時の管理者通知
      await this.notifyAdministrators('Failed to timeout user', context);
      throw error;
    }
  }

  /**
   * 管理者に通知メッセージを送信する
   */
  public async notifyAdministrators(error: string, context: ActionContext): Promise<void> {
    try {
      if (!this.administratorNotificationChannelId) {
        console.warn('Administrator notification channel not configured');
        return;
      }

      // 通知メッセージの作成
      const notificationMessage = this.createAdministratorNotification(error, context);
      
      // 管理者チャンネルへの送信は重要なので、リトライを行う
      await this.executeWithRetry(async () => {
        if (this.client) {
          const channel = await this.client.channels.fetch(this.administratorNotificationChannelId!);
          if (channel && channel.isTextBased() && 'send' in channel) {
            await channel.send(notificationMessage);
          }
        } else {
          console.log('Administrator notification:', notificationMessage);
        }
      });
      
    } catch (notificationError) {
      console.error('Failed to notify administrators:', notificationError);
      
      // 管理者通知に失敗した場合は、より詳細な情報をコンソールに出力
      console.error('Original error:', error);
      console.error('Context:', JSON.stringify(context, null, 2));
    }
  }

  /**
   * 指数バックオフでリトライを実行する
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryAttempts - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt); // 指数バックオフ
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * 指定した時間だけ待機する
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 警告メッセージを作成する
   */
  private createWarningMessage(username: string, detectedWords: string[]): string {
    return `⚠️ ${username} さん、メッセージに不適切な表現が含まれています。\n` +
           `検出された単語: ${detectedWords.join(', ')}\n` +
           `コミュニティガイドラインをお守りください。`;
  }

  /**
   * 削除通知メッセージを作成する
   */
  private createDeleteNotification(username: string, detectedWords: string[]): string {
    return `🗑️ ${username} さんのメッセージが自動削除されました。\n` +
           `理由: 不適切な表現（${detectedWords.join(', ')}）\n` +
           `コミュニティガイドラインをお守りください。`;
  }

  /**
   * タイムアウト通知メッセージを作成する
   */
  private createTimeoutNotification(username: string, detectedWords: string[], duration: number): string {
    const minutes = Math.ceil(duration / 60000);
    return `⏱️ ${username} さんは一時的に制限されました。\n` +
           `期間: ${minutes}分\n` +
           `理由: 不適切な表現（${detectedWords.join(', ')}）\n` +
           `制限解除後は、コミュニティガイドラインをお守りください。`;
  }

  /**
   * 管理者通知メッセージを作成する
   */
  private createAdministratorNotification(error: string, context: ActionContext): string {
    return `🚨 **モデレーション処理エラー**\n` +
           `エラー: ${error}\n` +
           `ユーザーID: ${context.userId}\n` +
           `メッセージID: ${context.messageId}\n` +
           `アクション: ${context.action}\n` +
           `詳細: ${context.error}`;
  }

  /**
   * ユーザーをタイムアウトする権限があるかチェックする
   */
  private canTimeoutUser(botMember: GuildMember | null, targetMember: GuildMember): boolean {
    if (!botMember) {
      return false;
    }

    // ボットがタイムアウト権限を持っているかチェック
    if (!botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return false;
    }

    // 対象ユーザーがボットより上位の役職を持っていないかチェック
    if (targetMember.roles.highest.position >= botMember.roles.highest.position) {
      return false;
    }

    // 対象ユーザーが管理者権限を持っていないかチェック
    if (targetMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return false;
    }

    return true;
  }

  /**
   * Discordクライアントを設定する
   */
  public setClient(client: Client): void {
    this.client = client;
  }

  /**
   * 管理者通知チャンネルIDを設定する
   */
  public setAdministratorNotificationChannel(channelId: string | null): void {
    this.administratorNotificationChannelId = channelId;
  }

  /**
   * リトライ回数を設定する
   */
  public setRetryAttempts(attempts: number): void {
    this.retryAttempts = Math.max(1, attempts);
  }

  /**
   * リトライ間隔を設定する
   */
  public setRetryDelay(delay: number): void {
    this.retryDelay = Math.max(100, delay);
  }

  /**
   * 警告アクション用の権限チェック
   */
  private async checkPermissionsForWarning(message: Message): Promise<void> {
    if (!message.guild) {
      console.log('🔍 DM channel - permission check skipped');
      return;
    }

    const botMember = message.guild.members.me;
    if (!botMember) {
      throw new Error('Bot member not found in guild');
    }

    // ギルド内のテキストチャンネルかどうかをチェック
    if (!message.channel.isTextBased() || message.channel.isDMBased()) {
      console.log('🔍 Non-guild text channel - permission check skipped');
      return;
    }

    // チャンネル固有の権限をチェック
    const channel = message.channel as TextChannel;
    const channelPermissions = channel.permissionsFor(botMember);
    const channelName = 'name' in channel ? channel.name : 'Unknown';
    
    console.log('🔐 Permission check for warning:');
    console.log(`  - Channel: #${channelName}`);
    console.log(`  - SendMessages: ${channelPermissions?.has('SendMessages') ? '✅' : '❌'}`);
    console.log(`  - ViewChannel: ${channelPermissions?.has('ViewChannel') ? '✅' : '❌'}`);

    if (!channelPermissions?.has('SendMessages')) {
      throw new Error(`Bot lacks SendMessages permission in channel #${channelName}`);
    }

    if (!channelPermissions?.has('ViewChannel')) {
      throw new Error(`Bot lacks ViewChannel permission in channel #${channelName}`);
    }
  }
}