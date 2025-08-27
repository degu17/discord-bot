/**
 * ゲーム関連の型定義
 * Hit&Blowゲームの状態管理、履歴、統計に関する型を定義
 */

/**
 * ゲームの状態を表すインターフェース
 */
export interface GameState {
  /** ゲームの一意識別子 */
  id: string;
  /** ゲームが実行されているDiscordチャンネルID */
  channelId: string;
  /** 正解の4桁数字 */
  answer: string;
  /** ゲーム参加者のユーザーIDリスト */
  participants: string[];
  /** ゲーム中の全ての予想試行 */
  attempts: GameAttempt[];
  /** 現在のゲーム状態 */
  status: GameStatus;
  /** ゲーム開始時刻 */
  startTime: Date;
  /** 最後の活動時刻 */
  lastActivity: Date;
}

/**
 * プレイヤーの予想試行を表すインターフェース
 */
export interface GameAttempt {
  /** 予想したユーザーのID */
  userId: string;
  /** 予想した4桁数字 */
  guess: string;
  /** Hit数（位置と数字が一致） */
  hit: number;
  /** Blow数（数字のみ一致） */
  blow: number;
  /** 予想した時刻 */
  timestamp: Date;
}

/**
 * 完了したゲームの履歴を表すインターフェース
 */
export interface GameHistory {
  /** ゲームID */
  gameId: string;
  /** 勝者のユーザーID（勝者がいない場合はnull） */
  winner: string | null;
  /** ゲーム中の総試行回数 */
  totalAttempts: number;
  /** ゲーム継続時間（ミリ秒） */
  duration: number;
  /** 参加者のユーザーIDリスト */
  participants: string[];
  /** ゲーム終了時刻 */
  finishedAt: Date;
}

/**
 * プレイヤーの統計情報を表すインターフェース
 */
export interface PlayerStats {
  /** 参加したゲーム総数 */
  totalGames: number;
  /** 勝利数 */
  wins: number;
  /** 平均試行回数 */
  averageAttempts: number;
  /** 最短クリア回数 */
  bestScore: number;
}

/**
 * ゲームの状態を表す型エイリアス
 */
export type GameStatus = 'recruiting' | 'playing' | 'finished';

/**
 * ゲームの難易度を表す型エイリアス
 */
export type GameDifficulty = 'easy' | 'medium' | 'hard';

/**
 * ゲーム終了理由を表す型エイリアス
 */
export type GameEndReason = 'winner' | 'timeout' | 'cancelled';

/**
 * ゲーム設定を表すインターフェース
 */
export interface GameSettings {
  /** 最大参加者数 */
  maxParticipants: number;
  /** ゲームタイムアウト時間（分） */
  timeoutMinutes: number;
  /** 数字の桁数 */
  digitCount: number;
  /** 重複する数字を許可するか */
  allowDuplicateDigits: boolean;
  /** 参加者募集時間（分） */
  recruitmentTimeMinutes: number;
}

/**
 * ゲーム結果を表すインターフェース
 */
export interface GameResult {
  /** 処理が成功したか */
  success: boolean;
  /** Hit数（成功時のみ） */
  hit?: number;
  /** Blow数（成功時のみ） */
  blow?: number;
  /** 勝者かどうか（成功時のみ） */
  isWinner?: boolean;
  /** 結果メッセージ */
  message: string;
}

/**
 * ゲーム操作結果を表すインターフェース
 */
export interface GameOperationResult {
  /** 処理が成功したか */
  success: boolean;
  /** 結果メッセージ */
  message: string;
}