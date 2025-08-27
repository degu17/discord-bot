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

// 共通型定義（複数ドメインで使用される型）

/**
 * モデレーション機能関連の型定義
 * 将来的にmoderation.tsファイルに分離予定
 */
export interface ModerationRule {
  /** モデレーションレベル（1: 警告, 2: 削除, 3: タイムアウト） */
  level: 1 | 2 | 3;
  /** 検出対象の単語リスト */
  words: string[];
  /** 実行するアクション */
  action: 'warn' | 'delete' | 'timeout';
  /** タイムアウト時間（分）- アクションがtimeoutの場合のみ */
  timeoutDuration?: number;
}

/**
 * モデレーションログを表すインターフェース
 */
export interface ModerationLog {
  /** 対象ユーザーID */
  userId: string;
  /** 対象メッセージID */
  messageId: string;
  /** 対象チャンネルID */
  channelId: string;
  /** メッセージ内容 */
  content: string;
  /** 発動したルール */
  triggeredRule: ModerationRule;
  /** 実行されたアクション */
  action: string;
  /** ログ記録時刻 */
  timestamp: Date;
}

/**
 * Bot設定を表すインターフェース
 */
export interface BotConfig {
  /** モデレーションルール */
  moderationRules: ModerationRule[];
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