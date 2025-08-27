import * as fs from 'fs';
import * as path from 'path';
import { IConfigManager, ModerationRules, ModerationRule, ModerationAction } from '../types/moderation';

/**
 * 設定ファイルの管理を担当するクラス
 */
export class ConfigManager implements IConfigManager {
  private configPath: string;
  private cachedConfig: ModerationRules | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'src', 'config', 'moderationRules.json');
  }

  /**
   * モデレーションルールを読み込む
   */
  public async loadModerationRules(): Promise<ModerationRules> {
    try {
      // キャッシュがある場合はそれを返す
      if (this.cachedConfig) {
        return this.cachedConfig;
      }

      // ファイルが存在するかチェック
      if (!fs.existsSync(this.configPath)) {
        console.warn(`Config file not found at ${this.configPath}. Using default configuration.`);
        return this.getDefaultConfig();
      }

      // ファイルを読み込み
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      const parsedConfig = JSON.parse(configData) as ModerationRules;

      // 設定を検証
      if (!this.validateConfig(parsedConfig)) {
        console.error('Invalid configuration format. Using default configuration.');
        return this.getDefaultConfig();
      }

      // 設定をキャッシュ
      this.cachedConfig = parsedConfig;
      console.log('Moderation rules loaded successfully.');
      
      return parsedConfig;
    } catch (error) {
      console.error('Error loading moderation rules:', error);
      console.log('Falling back to default configuration.');
      return this.getDefaultConfig();
    }
  }

  /**
   * 設定を再読み込みする
   */
  public async reloadConfig(): Promise<void> {
    try {
      // キャッシュをクリア
      this.cachedConfig = null;
      
      // 設定を再読み込み
      await this.loadModerationRules();
      console.log('Configuration reloaded successfully.');
    } catch (error) {
      console.error('Error reloading configuration:', error);
      throw error;
    }
  }

  /**
   * 設定ファイルの形式を検証する
   */
  public validateConfig(rules: ModerationRules): boolean {
    try {
      // rulesプロパティが存在し、配列であることを確認
      if (!rules.rules || !Array.isArray(rules.rules)) {
        console.error('Configuration validation failed: rules property is missing or not an array.');
        return false;
      }

      // 各ルールを検証
      for (const rule of rules.rules) {
        if (!this.validateRule(rule)) {
          return false;
        }
      }

      // settings が存在する場合は検証
      if (rules.settings) {
        if (!this.validateSettings(rules.settings)) {
          return false;
        }
      }

      // defaultRules が存在する場合は検証
      if (rules.defaultRules) {
        if (!Array.isArray(rules.defaultRules)) {
          console.error('Configuration validation failed: defaultRules is not an array.');
          return false;
        }
        
        for (const rule of rules.defaultRules) {
          if (!this.validateRule(rule)) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating configuration:', error);
      return false;
    }
  }

  /**
   * 個別のルールを検証する
   */
  private validateRule(rule: ModerationRule): boolean {
    // level が数値であることを確認
    if (typeof rule.level !== 'number' || rule.level < 1 || rule.level > 3) {
      console.error(`Configuration validation failed: invalid level ${rule.level}. Must be 1, 2, or 3.`);
      return false;
    }

    // words が配列で、空でないことを確認
    if (!Array.isArray(rule.words) || rule.words.length === 0) {
      console.error('Configuration validation failed: words must be a non-empty array.');
      return false;
    }

    // 各単語が文字列であることを確認
    for (const word of rule.words) {
      if (typeof word !== 'string' || word.trim() === '') {
        console.error('Configuration validation failed: all words must be non-empty strings.');
        return false;
      }
    }

    // action が有効な値であることを確認
    const validActions = Object.values(ModerationAction);
    if (!validActions.includes(rule.action)) {
      console.error(`Configuration validation failed: invalid action ${rule.action}.`);
      return false;
    }

    // timeout アクションの場合、timeoutDuration が存在することを確認
    if (rule.action === ModerationAction.TIMEOUT) {
      if (typeof rule.timeoutDuration !== 'number' || rule.timeoutDuration <= 0) {
        console.error('Configuration validation failed: timeout action requires a positive timeoutDuration.');
        return false;
      }
    }

    return true;
  }

  /**
   * 設定の settings 部分を検証する
   */
  private validateSettings(settings: any): boolean {
    const requiredProps = ['logRotationSize', 'exemptRoles', 'exemptChannels', 'defaultTimeoutDuration'];
    
    for (const prop of requiredProps) {
      if (!(prop in settings)) {
        console.error(`Configuration validation failed: missing required settings property: ${prop}`);
        return false;
      }
    }

    // logRotationSize の検証
    if (typeof settings.logRotationSize !== 'number' || settings.logRotationSize <= 0) {
      console.error('Configuration validation failed: logRotationSize must be a positive number.');
      return false;
    }

    // exemptRoles の検証
    if (!Array.isArray(settings.exemptRoles)) {
      console.error('Configuration validation failed: exemptRoles must be an array.');
      return false;
    }

    // exemptChannels の検証
    if (!Array.isArray(settings.exemptChannels)) {
      console.error('Configuration validation failed: exemptChannels must be an array.');
      return false;
    }

    // defaultTimeoutDuration の検証
    if (typeof settings.defaultTimeoutDuration !== 'number' || settings.defaultTimeoutDuration <= 0) {
      console.error('Configuration validation failed: defaultTimeoutDuration must be a positive number.');
      return false;
    }

    return true;
  }

  /**
   * デフォルト設定を取得する
   */
  private getDefaultConfig(): ModerationRules {
    return {
      rules: [
        {
          level: 1,
          words: ['spam', 'test'],
          action: ModerationAction.WARN,
        },
      ],
      settings: {
        logRotationSize: 10485760, // 10MB
        exemptRoles: [],
        exemptChannels: [],
        defaultTimeoutDuration: 600000, // 10分
        administratorNotificationChannel: null,
      },
      defaultRules: [
        {
          level: 1,
          words: ['spam', 'test'],
          action: ModerationAction.WARN,
        },
      ],
    };
  }

  /**
   * 現在のキャッシュされた設定を取得する
   */
  public getCachedConfig(): ModerationRules | null {
    return this.cachedConfig;
  }

  /**
   * 設定ファイルのパスを取得する
   */
  public getConfigPath(): string {
    return this.configPath;
  }
}