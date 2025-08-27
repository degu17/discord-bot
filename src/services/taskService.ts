import { NotionClient } from './notionClient';
import { Task, TaskCreateRequest } from '../types';
import { ValidationUtils } from '../utils/validation';

export class TaskService {
  private static instance: TaskService;
  private notionClient: NotionClient;

  private constructor() {
    this.notionClient = NotionClient.getInstance();
  }

  static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  static isConfigured(): boolean {
    return NotionClient.isConfigured();
  }

  async createTask(request: TaskCreateRequest, _creatorId: string, creatorName: string): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    try {
      // バリデーション
      const titleValidation = ValidationUtils.validateTaskTitle(request.title);
      if (!titleValidation.isValid) {
        return { success: false, error: titleValidation.error! };
      }

      if (request.priority) {
        const priorityValidation = ValidationUtils.validateTaskPriority(request.priority);
        if (!priorityValidation.isValid) {
          return { success: false, error: priorityValidation.error! };
        }
      }

      if (request.deadline) {
        const dateValidation = ValidationUtils.validateDate(request.deadline.toISOString().split('T')[0]);
        if (!dateValidation.isValid) {
          return { success: false, error: dateValidation.error! };
        }
      }

      // 既存タスクのチェック
      const existingTask = await this.notionClient.getTask(request.title);
      if (existingTask) {
        return { success: false, error: '同じタイトルのタスクが既に存在します。' };
      }

      // タスク作成
      const task = await this.notionClient.createTask(request, creatorName);
      return { success: true, task };

    } catch (error) {
      console.error('Error in TaskService.createTask:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスクの作成に失敗しました' 
      };
    }
  }

  async updateTaskTitle(currentTitle: string, newTitle: string): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    try {
      // バリデーション
      const titleValidation = ValidationUtils.validateTaskTitle(newTitle);
      if (!titleValidation.isValid) {
        return { success: false, error: titleValidation.error! };
      }

      // 新しいタイトルでの重複チェック
      if (currentTitle !== newTitle) {
        const existingTask = await this.notionClient.getTask(newTitle);
        if (existingTask) {
          return { success: false, error: '同じタイトルのタスクが既に存在します。' };
        }
      }

      const task = await this.notionClient.updateTask(currentTitle, { title: newTitle });
      if (!task) {
        return { success: false, error: '指定されたタスクが見つかりません。' };
      }

      return { success: true, task };

    } catch (error) {
      console.error('Error in TaskService.updateTaskTitle:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスクタイトルの更新に失敗しました' 
      };
    }
  }

  async updateTaskPriority(title: string, priority: 'high' | 'medium' | 'low'): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    try {
      // バリデーション
      const priorityValidation = ValidationUtils.validateTaskPriority(priority);
      if (!priorityValidation.isValid) {
        return { success: false, error: priorityValidation.error! };
      }

      const task = await this.notionClient.updateTask(title, { priority });
      if (!task) {
        return { success: false, error: '指定されたタスクが見つかりません。' };
      }

      return { success: true, task };

    } catch (error) {
      console.error('Error in TaskService.updateTaskPriority:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスク優先度の更新に失敗しました' 
      };
    }
  }

  async updateTaskDeadline(title: string, deadline: Date): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    try {
      // バリデーション
      const dateValidation = ValidationUtils.validateDate(deadline.toISOString().split('T')[0]);
      if (!dateValidation.isValid) {
        return { success: false, error: dateValidation.error! };
      }

      const task = await this.notionClient.updateTask(title, { deadline });
      if (!task) {
        return { success: false, error: '指定されたタスクが見つかりません。' };
      }

      return { success: true, task };

    } catch (error) {
      console.error('Error in TaskService.updateTaskDeadline:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスク期限の更新に失敗しました' 
      };
    }
  }

  async deleteTask(title: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // バリデーション
      const titleValidation = ValidationUtils.validateTaskTitle(title);
      if (!titleValidation.isValid) {
        return { success: false, error: titleValidation.error! };
      }

      const success = await this.notionClient.deleteTask(title);
      return { success };

    } catch (error) {
      console.error('Error in TaskService.deleteTask:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスクの削除に失敗しました' 
      };
    }
  }

  async getTask(title: string): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    try {
      // バリデーション
      const titleValidation = ValidationUtils.validateTaskTitle(title);
      if (!titleValidation.isValid) {
        return { success: false, error: titleValidation.error! };
      }

      const task = await this.notionClient.getTask(title);
      if (!task) {
        return { success: false, error: '指定されたタスクが見つかりません。' };
      }

      return { success: true, task };

    } catch (error) {
      console.error('Error in TaskService.getTask:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスクの取得に失敗しました' 
      };
    }
  }

  async getAllTasks(): Promise<{
    success: boolean;
    tasks?: Task[];
    error?: string;
  }> {
    try {
      const tasks = await this.notionClient.getAllTasks();
      return { success: true, tasks };

    } catch (error) {
      console.error('Error in TaskService.getAllTasks:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスク一覧の取得に失敗しました' 
      };
    }
  }

  async completeTask(title: string): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    try {
      const task = await this.notionClient.updateTask(title, { status: 'completed' });
      if (!task) {
        return { success: false, error: '指定されたタスクが見つかりません。' };
      }

      return { success: true, task };

    } catch (error) {
      console.error('Error in TaskService.completeTask:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスクの完了処理に失敗しました' 
      };
    }
  }

  async getTasksByPriority(priority: 'high' | 'medium' | 'low'): Promise<{
    success: boolean;
    tasks?: Task[];
    error?: string;
  }> {
    try {
      const allTasksResult = await this.getAllTasks();
      if (!allTasksResult.success || !allTasksResult.tasks) {
        return { success: false, error: allTasksResult.error || '優先度別タスクの取得に失敗しました' };
      }

      const filteredTasks = allTasksResult.tasks.filter(task => task.priority === priority);
      return { success: true, tasks: filteredTasks };

    } catch (error) {
      console.error('Error in TaskService.getTasksByPriority:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '優先度別タスクの取得に失敗しました' 
      };
    }
  }

  async getTaskStats(): Promise<{
    success: boolean;
    stats?: {
      total: number;
      notStarted: number;
      inProgress: number;
      completed: number;
      highPriority: number;
      overdue: number;
    };
    error?: string;
  }> {
    try {
      const allTasksResult = await this.getAllTasks();
      if (!allTasksResult.success || !allTasksResult.tasks) {
        return { success: false, error: allTasksResult.error || 'タスク統計の取得に失敗しました' };
      }

      const tasks = allTasksResult.tasks;
      const now = new Date();

      const stats = {
        total: tasks.length,
        notStarted: tasks.filter(t => t.status === 'not_started').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        overdue: tasks.filter(t => t.deadline && t.deadline < now && t.status !== 'completed').length
      };

      return { success: true, stats };

    } catch (error) {
      console.error('Error in TaskService.getTaskStats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'タスク統計の取得に失敗しました' 
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.notionClient.testConnection();
    } catch (error) {
      console.error('Error testing Notion connection:', error);
      return false;
    }
  }
}