import { Message, User } from 'discord.js';

/**
 * モデレーションアクション列挙型
 */
export enum ModerationAction {
  WARN = 'warn',
  DELETE = 'delete',
  TIMEOUT = 'timeout',
}

/**
 * 検出結果インターフェース
 */
export interface DetectionResult {
  level: number;
  detectedWords: string[];
  action: ModerationAction;
  timeoutDuration?: number;
}

/**
 * ログエントリインターフェース
 */
export interface LogEntry {
  timestamp: Date;
  userId: string;
  username: string;
  messageContent: string;
  detectedWords: string[];
  action: ModerationAction;
  level: number;
  success: boolean;
  error?: string;
}

/**
 * アクションコンテキストインターフェース
 */
export interface ActionContext {
  userId: string;
  messageId: string;
  action: ModerationAction;
  error: string;
}

/**
 * モデレーションルールインターフェース
 */
export interface ModerationRule {
  level: number;
  words: string[];
  action: ModerationAction;
  timeoutDuration?: number;
}

/**
 * モデレーション設定インターフェース
 */
export interface ModerationSettings {
  logRotationSize: number;
  exemptRoles: string[];
  exemptChannels: string[];
  defaultTimeoutDuration: number;
  administratorNotificationChannel: string | null;
}

/**
 * モデレーションルール全体の設定インターフェース
 */
export interface ModerationRules {
  rules: ModerationRule[];
  settings?: ModerationSettings;
  defaultRules?: ModerationRule[];
}

/**
 * ModerationServiceインターフェース
 */
export interface IModerationService {
  processMessage(message: Message): Promise<void>;
  isExemptUser(user: User): boolean;
  getDetectionResult(content: string): DetectionResult | null;
  reloadConfiguration(): Promise<void>;
}

/**
 * WordDetectorインターフェース
 */
export interface IWordDetector {
  detectInappropriateContent(content: string): DetectionResult | null;
  loadRules(): Promise<void>;
  reloadRules(): Promise<void>;
}

/**
 * ActionExecutorインターフェース
 */
export interface IActionExecutor {
  executeWarning(message: Message, detectedWords: string[]): Promise<void>;
  executeDelete(message: Message, detectedWords: string[]): Promise<void>;
  executeTimeout(message: Message, detectedWords: string[], duration: number): Promise<void>;
  notifyAdministrators(error: string, context: ActionContext): Promise<void>;
}

/**
 * ConfigManagerインターフェース
 */
export interface IConfigManager {
  loadModerationRules(): Promise<ModerationRules>;
  reloadConfig(): Promise<void>;
  validateConfig(rules: ModerationRules): boolean;
}

/**
 * ModerationLoggerインターフェース
 */
export interface IModerationLogger {
  logAction(action: LogEntry): Promise<void>;
  rotateLogFile(): Promise<void>;
}