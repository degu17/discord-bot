import { Client } from '@notionhq/client';
import { Task, TaskCreateRequest, TaskUpdateRequest } from '../types';

export class NotionClient {
  private static instance: NotionClient | null = null;
  private notion: Client | null = null;
  private databaseId: string | null = null;
  private initialized: boolean = false;

  private constructor() {
    // 遅延初期化のため、ここでは何もしない
  }

  static getInstance(): NotionClient {
    if (!NotionClient.instance) {
      NotionClient.instance = new NotionClient();
    }
    return NotionClient.instance;
  }

  private initialize(): void {
    if (this.initialized) return;

    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_TASK_DB_ID;

    if (!token) {
      throw new Error('NOTION_TOKEN environment variable is not set');
    }
    if (!databaseId) {
      throw new Error('NOTION_TASK_DB_ID environment variable is not set');
    }

    this.notion = new Client({ auth: token });
    this.databaseId = databaseId;
    this.initialized = true;
  }

  static isConfigured(): boolean {
    return !!(process.env.NOTION_TOKEN && process.env.NOTION_TASK_DB_ID);
  }

  async createTask(request: TaskCreateRequest, creator: string): Promise<Task> {
    this.initialize();
    
    try {
      const response = await this.notion!.pages.create({
        parent: { database_id: this.databaseId! },
        properties: {
          'Task name': {
            title: [
              {
                text: {
                  content: request.title
                }
              }
            ]
          },
          'Priority': {
            select: {
              name: this.mapPriorityToNotion(request.priority || 'medium')
            }
          },
          ...(request.deadline && {
            'Due date': {
              date: {
                start: request.deadline.toISOString().split('T')[0]
              }
            }
          }),
          'Description': {
            rich_text: [
              {
                text: {
                  content: `作成者: ${creator}`
                }
              }
            ]
          },
          'Status': {
            status: {
              name: '未着手'
            }
          }
        }
      });

      return this.mapNotionPageToTask(response);
    } catch (error) {
      console.error('Error creating task in Notion:', error);
      throw new Error('タスクの作成に失敗しました');
    }
  }

  async updateTask(title: string, updates: TaskUpdateRequest): Promise<Task | null> {
    this.initialize();
    
    try {
      // タイトルでタスクを検索
      const existingTask = await this.findTaskByTitle(title);
      if (!existingTask) {
        throw new Error('指定されたタスクが見つかりません');
      }

      // Notion APIの複雑な型構造のため一時的にanyを使用
      // TODO: @notionhq/clientの型定義が改善されたら具体的な型に変更
      const properties: Record<string, any> = {};

      if (updates.title) {
        properties['Task name'] = {
          title: [
            {
              text: {
                content: updates.title
              }
            }
          ]
        };
      }

      if (updates.priority) {
        properties['Priority'] = {
          select: {
            name: this.mapPriorityToNotion(updates.priority)
          }
        };
      }

      if (updates.deadline) {
        properties['Due date'] = {
          date: {
            start: updates.deadline.toISOString().split('T')[0]
          }
        };
      }

      if (updates.status) {
        properties['Status'] = {
          status: {
            name: this.mapStatusToNotion(updates.status)
          }
        };
      }

      const response = await this.notion!.pages.update({
        page_id: existingTask.id,
        properties
      });

      return this.mapNotionPageToTask(response);
    } catch (error) {
      console.error('Error updating task in Notion:', error);
      throw new Error('タスクの更新に失敗しました');
    }
  }

  async deleteTask(title: string): Promise<boolean> {
    this.initialize();
    
    try {
      const existingTask = await this.findTaskByTitle(title);
      if (!existingTask) {
        throw new Error('指定されたタスクが見つかりません');
      }

      await this.notion!.pages.update({
        page_id: existingTask.id,
        archived: true
      });

      return true;
    } catch (error) {
      console.error('Error deleting task in Notion:', error);
      throw new Error('タスクの削除に失敗しました');
    }
  }

  async getTask(title: string): Promise<Task | null> {
    this.initialize();
    
    try {
      return await this.findTaskByTitle(title);
    } catch (error) {
      console.error('Error getting task from Notion:', error);
      throw new Error('タスクの取得に失敗しました');
    }
  }

  async getAllTasks(): Promise<Task[]> {
    this.initialize();
    
    try {
      const response = await this.notion!.databases.query({
        database_id: this.databaseId!,
        page_size: 100
      });

      return response.results.map(page => this.mapNotionPageToTask(page));
    } catch (error) {
      console.error('Error getting all tasks from Notion:', error);
      throw new Error('タスク一覧の取得に失敗しました');
    }
  }

  private async findTaskByTitle(title: string): Promise<Task | null> {
    const response = await this.notion!.databases.query({
      database_id: this.databaseId!,
      filter: {
        property: 'Task name',
        title: {
          equals: title
        }
      }
    });

    if (response.results.length === 0) {
      return null;
    }

    return this.mapNotionPageToTask(response.results[0]);
  }

  private mapNotionPageToTask(page: unknown): Task {
    // 型ガード関数でNotionページの構造を確認
    if (!this.isValidNotionPage(page)) {
      throw new Error('Invalid Notion page structure');
    }

    const properties = page.properties;
    const deadline = this.extractDate(properties['Due date']);
    
    const task: Task = {
      id: page.id,
      title: this.extractText(properties['Task name']),
      priority: this.mapNotionToPriority(this.extractSelect(properties.Priority)),
      creator: this.extractCreatorFromDescription(this.extractText(properties.Description)),
      status: this.mapNotionToStatus(this.extractStatus(properties.Status)),
      createdAt: new Date(page.created_time),
      updatedAt: new Date(page.last_edited_time)
    };

    if (deadline) {
      task.deadline = deadline;
    }

    return task;
  }

  private isValidNotionPage(page: unknown): page is {
    id: string;
    created_time: string;
    last_edited_time: string;
    properties: Record<string, unknown>;
  } {
    return (
      typeof page === 'object' &&
      page !== null &&
      'id' in page &&
      'created_time' in page &&
      'last_edited_time' in page &&
      'properties' in page &&
      typeof (page as any).id === 'string' &&
      typeof (page as any).created_time === 'string' &&
      typeof (page as any).last_edited_time === 'string' &&
      typeof (page as any).properties === 'object'
    );
  }

  private extractText(property: unknown): string {
    if (!property || typeof property !== 'object') return '';
    
    const prop = property as Record<string, unknown>;
    
    if ('title' in prop && Array.isArray(prop.title)) {
      return prop.title.map((t: any) => t?.text?.content || '').join('');
    }
    if ('rich_text' in prop && Array.isArray(prop.rich_text)) {
      return prop.rich_text.map((t: any) => t?.text?.content || '').join('');
    }
    return '';
  }

  private extractSelect(property: unknown): string {
    if (!property || typeof property !== 'object') return '';
    
    const prop = property as Record<string, unknown>;
    
    if ('select' in prop && prop.select && typeof prop.select === 'object') {
      const select = prop.select as Record<string, unknown>;
      return typeof select.name === 'string' ? select.name : '';
    }
    return '';
  }

  private extractStatus(property: unknown): string {
    if (!property || typeof property !== 'object') return '';
    
    const prop = property as Record<string, unknown>;
    
    if ('status' in prop && prop.status && typeof prop.status === 'object') {
      const status = prop.status as Record<string, unknown>;
      return typeof status.name === 'string' ? status.name : '';
    }
    return '';
  }

  private extractCreatorFromDescription(description: string): string {
    // "作成者: ユーザー名" の形式から作成者名を抽出
    const match = description.match(/作成者: (.+)/);
    return match ? match[1] : description;
  }

  private extractDate(property: unknown): Date | undefined {
    if (!property || typeof property !== 'object') return undefined;
    
    const prop = property as Record<string, unknown>;
    
    if ('date' in prop && prop.date && typeof prop.date === 'object') {
      const date = prop.date as Record<string, unknown>;
      if (typeof date.start === 'string') {
        return new Date(date.start);
      }
    }
    return undefined;
  }

  private mapPriorityToNotion(priority: 'high' | 'medium' | 'low'): string {
    const map = {
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return map[priority];
  }

  private mapNotionToPriority(notionPriority: string): 'high' | 'medium' | 'low' {
    const map: Record<string, 'high' | 'medium' | 'low'> = {
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };
    return map[notionPriority] || 'medium';
  }

  private mapStatusToNotion(status: 'not_started' | 'in_progress' | 'completed'): string {
    const map = {
      'not_started': '未着手',
      'in_progress': '進行中',
      'completed': '完了'
    };
    return map[status];
  }

  private mapNotionToStatus(notionStatus: string): 'not_started' | 'in_progress' | 'completed' {
    const map: Record<string, 'not_started' | 'in_progress' | 'completed'> = {
      '未着手': 'not_started',
      '進行中': 'in_progress',
      '完了': 'completed'
    };
    return map[notionStatus] || 'not_started';
  }

  async testConnection(): Promise<boolean> {
    this.initialize();
    
    try {
      await this.notion!.databases.retrieve({ database_id: this.databaseId! });
      return true;
    } catch (error) {
      console.error('Notion connection test failed:', error);
      return false;
    }
  }
}