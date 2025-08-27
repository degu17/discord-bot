/**
 * 型定義のメインエクスポートファイル
 * 各ドメインの型定義を再エクスポートし、統一されたインポートインターフェースを提供
 */

// ゲーム関連の型定義を再エクスポート
export * from './game';

// タスク管理関連の型定義を再エクスポート
export * from './task';

// Discord関連の型定義を再エクスポート
export * from './discord';

// モデレーション関連の型定義を再エクスポート
export * from './moderation';

/**
 * Bot設定を表すインターフェース
 */
export interface BotConfig {
  /** モデレーションルール */
  moderationRules: ModerationRules;
  /** ゲーム設定 */
  gameSettings: {
    /** 最大参加者数 */
    maxParticipants: number;
    /** タイムアウト時間（分） */
    timeoutMinutes: number;
    /** 数字の桁数 */
    digitCount: number;
  };
}

/**
 * 汎用的な操作結果を表すインターフェース
 */
export interface OperationResult<T = any> {
  /** 処理が成功したか */
  success: boolean;
  /** 結果データ（成功時のみ） */
  data?: T;
  /** エラーメッセージ（失敗時のみ） */
  error?: string;
}

/**
 * バリデーション結果を表すインターフェース
 */
export interface ValidationResult<T = any> {
  /** バリデーションが成功したか */
  isValid: boolean;
  /** バリデーション済みデータ（成功時のみ） */
  data?: T;
  /** エラーメッセージのリスト（失敗時のみ） */
  errors?: string[];
}