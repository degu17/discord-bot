/**
 * タスク管理関連の型定義
 * Notion APIと連携したタスク管理機能の型を定義
 */

/**
 * タスクを表すインターフェース
 */
export interface Task {
  /** タスクの一意識別子（Notion Page ID） */
  id: string;
  /** タスクのタイトル */
  title: string;
  /** タスクの優先度 */
  priority: TaskPriority;
  /** タスクの期限（オプション） */
  deadline?: Date;
  /** タスクの作成者 */
  creator: string;
  /** タスクの現在のステータス */
  status: TaskStatus;
  /** タスクの作成日時 */
  createdAt: Date;
  /** タスクの最終更新日時 */
  updatedAt: Date;
}

/**
 * タスク作成リクエストを表すインターフェース
 */
export interface TaskCreateRequest {
  /** タスクのタイトル */
  title: string;
  /** タスクの優先度（デフォルト: medium） */
  priority?: TaskPriority;
  /** タスクの期限（オプション） */
  deadline?: Date;
}

/**
 * タスク更新リクエストを表すインターフェース
 */
export interface TaskUpdateRequest {
  /** 新しいタスクタイトル */
  title?: string;
  /** 新しい優先度 */
  priority?: TaskPriority;
  /** 新しい期限 */
  deadline?: Date;
  /** 新しいステータス */
  status?: TaskStatus;
}

/**
 * タスクの優先度を表す型エイリアス
 */
export type TaskPriority = 'high' | 'medium' | 'low';

/**
 * タスクのステータスを表す型エイリアス
 */
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * タスク操作結果を表すインターフェース
 */
export interface TaskOperationResult {
  /** 処理が成功したか */
  success: boolean;
  /** 処理されたタスク（成功時のみ） */
  task?: Task;
  /** エラーメッセージ（失敗時のみ） */
  error?: string;
}

/**
 * タスク一覧取得結果を表すインターフェース
 */
export interface TaskListResult {
  /** 処理が成功したか */
  success: boolean;
  /** タスクのリスト（成功時のみ） */
  tasks?: Task[];
  /** エラーメッセージ（失敗時のみ） */
  error?: string;
}

/**
 * タスク統計情報を表すインターフェース
 */
export interface TaskStats {
  /** 総タスク数 */
  total: number;
  /** 未着手タスク数 */
  notStarted: number;
  /** 進行中タスク数 */
  inProgress: number;
  /** 完了タスク数 */
  completed: number;
  /** 高優先度タスク数 */
  highPriority: number;
  /** 期限切れタスク数 */
  overdue: number;
}

/**
 * タスク統計取得結果を表すインターフェース
 */
export interface TaskStatsResult {
  /** 処理が成功したか */
  success: boolean;
  /** 統計情報（成功時のみ） */
  stats?: TaskStats;
  /** エラーメッセージ（失敗時のみ） */
  error?: string;
}

/**
 * Notion設定を表すインターフェース
 */
export interface NotionConfig {
  /** Notion Integration Token */
  token?: string;
  /** タスク管理用データベースID */
  taskDbId?: string;
  /** Notion機能が有効かどうか */
  isEnabled: boolean;
}

/**
 * タスクフィルター条件を表すインターフェース
 */
export interface TaskFilter {
  /** 優先度でフィルター */
  priority?: TaskPriority;
  /** ステータスでフィルター */
  status?: TaskStatus;
  /** 作成者でフィルター */
  creator?: string;
  /** 期限でフィルター（指定日以前） */
  deadlineBefore?: Date;
  /** 期限でフィルター（指定日以降） */
  deadlineAfter?: Date;
}

/**
 * タスクソート条件を表すインターフェース
 */
export interface TaskSort {
  /** ソートするフィールド */
  field: 'title' | 'priority' | 'deadline' | 'createdAt' | 'updatedAt';
  /** ソート順序 */
  order: 'asc' | 'desc';
}