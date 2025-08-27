import * as fs from 'fs';
import * as path from 'path';
import { IModerationLogger, LogEntry } from '../../../types/moderation';

/**
 * モデレーション活動のログ記録を担当するクラス
 */
export class ModerationLogger implements IModerationLogger {
  private logDirectory: string;
  private currentLogFile: string;
  private maxLogSize: number;

  constructor(logDirectory?: string, maxLogSize?: number) {
    this.logDirectory = logDirectory || path.join(process.cwd(), 'logs', 'moderation');
    this.maxLogSize = maxLogSize || 10485760; // 10MB
    this.currentLogFile = this.generateLogFileName();
    this.ensureLogDirectory();
  }

  /**
   * モデレーションアクションをログに記録する
   */
  public async logAction(action: LogEntry): Promise<void> {
    try {
      // ログエントリを JSON 形式で整形
      const logEntry = {
        timestamp: action.timestamp.toISOString(),
        userId: action.userId,
        username: action.username,
        messageContent: this.sanitizeContent(action.messageContent),
        detectedWords: action.detectedWords,
        action: action.action,
        level: action.level,
        success: action.success,
        ...(action.error && { error: action.error }),
      };

      const logLine = JSON.stringify(logEntry) + '\n';

      // ログファイルのサイズをチェックし、必要に応じてローテーション
      await this.checkAndRotateLog();

      // ログファイルに書き込み
      await this.writeToLogFile(logLine);

    } catch (error) {
      // ログ記録に失敗した場合はコンソールに出力（要件5.4対応）
      console.error('Failed to write to log file:', error);
      console.log('Log entry:', JSON.stringify({
        timestamp: action.timestamp.toISOString(),
        userId: action.userId,
        username: action.username,
        action: action.action,
        level: action.level,
        success: action.success,
      }));
    }
  }

  /**
   * ログファイルのローテーションを実行する
   */
  public async rotateLogFile(): Promise<void> {
    try {
      const currentLogPath = path.join(this.logDirectory, this.currentLogFile);
      
      // 現在のログファイルが存在する場合
      if (fs.existsSync(currentLogPath)) {
        const stats = fs.statSync(currentLogPath);
        
        // ファイルサイズが制限を超えている場合
        if (stats.size >= this.maxLogSize) {
          // タイムスタンプ付きのバックアップファイル名を生成
          const backupFileName = this.generateBackupFileName();
          const backupPath = path.join(this.logDirectory, backupFileName);
          
          // ファイルをリネーム
          fs.renameSync(currentLogPath, backupPath);
          console.log(`Log file rotated: ${this.currentLogFile} -> ${backupFileName}`);
          
          // 新しいログファイル名を生成
          this.currentLogFile = this.generateLogFileName();
        }
      }
    } catch (error) {
      console.error('Error rotating log file:', error);
      // ローテーションに失敗した場合は新しいログファイルを作成
      this.currentLogFile = this.generateLogFileName();
    }
  }

  /**
   * ログファイルに書き込みを行う
   */
  private async writeToLogFile(content: string): Promise<void> {
    const logPath = path.join(this.logDirectory, this.currentLogFile);
    
    return new Promise((resolve, reject) => {
      fs.appendFile(logPath, content, 'utf-8', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * ログファイルのサイズをチェックし、必要に応じてローテーションを実行
   */
  private async checkAndRotateLog(): Promise<void> {
    try {
      const logPath = path.join(this.logDirectory, this.currentLogFile);
      
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        
        if (stats.size >= this.maxLogSize) {
          await this.rotateLogFile();
        }
      }
    } catch (error) {
      console.error('Error checking log file size:', error);
    }
  }

  /**
   * ログディレクトリが存在することを確認し、存在しない場合は作成する
   */
  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
        console.log(`Created log directory: ${this.logDirectory}`);
      }
    } catch (error) {
      console.error('Error creating log directory:', error);
      
      // ディレクトリ作成に失敗した場合は、一時的に現在のディレクトリを使用
      this.logDirectory = process.cwd();
      console.warn(`Using current directory for logging: ${this.logDirectory}`);
    }
  }

  /**
   * 現在の日付に基づいてログファイル名を生成する
   */
  private generateLogFileName(): string {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD形式
    return `moderation-${dateString}.log`;
  }

  /**
   * バックアップファイル名を生成する
   */
  private generateBackupFileName(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
    return `moderation-${timestamp}.log`;
  }

  /**
   * メッセージ内容をサニタイズする（ログに記録する前に）
   */
  private sanitizeContent(content: string): string {
    if (!content) return '';
    
    // 改行文字を除去し、長すぎる内容は切り詰める
    return content
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500); // 最大500文字に制限
  }

  /**
   * 現在のログファイルパスを取得する
   */
  public getCurrentLogFilePath(): string {
    return path.join(this.logDirectory, this.currentLogFile);
  }

  /**
   * ログディレクトリのパスを取得する
   */
  public getLogDirectory(): string {
    return this.logDirectory;
  }

  /**
   * ログファイルのサイズ制限を取得する
   */
  public getMaxLogSize(): number {
    return this.maxLogSize;
  }

  /**
   * 指定した期間より古いログファイルを削除する
   */
  public async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const files = fs.readdirSync(this.logDirectory);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        if (file.startsWith('moderation-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDirectory, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            console.log(`Deleted old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }
}