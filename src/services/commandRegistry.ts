import { REST, Routes } from 'discord.js';
import type { CommandData } from '../types/discord';

export class CommandRegistry {
  private rest: REST;
  private clientId: string;

  constructor(token: string, clientId: string) {
    this.rest = new REST({ version: '10' }).setToken(token);
    this.clientId = clientId;
  }

  async registerCommands(commands: CommandData[]) {
    try {
      console.log('🔄 Started refreshing application (/) commands.');

      const data = await this.rest.put(
        Routes.applicationCommands(this.clientId),
        { body: commands }
      ) as CommandData[];

      console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
      return data;
    } catch (error) {
      console.error('❌ Error registering commands:', error);
      throw error;
    }
  }

  static createHitBlowCommands(): CommandData[] {
    return [
      {
        name: 'hitblow',
        description: 'Hit&Blowゲームコマンド',
        options: [
          {
            name: 'start',
            description: 'ゲームを開始して参加者を募集',
            type: 1 // SUB_COMMAND
          },
          {
            name: 'join',
            description: 'ゲームに参加',
            type: 1 // SUB_COMMAND
          },
          {
            name: 'send',
            description: '予想数字を送信',
            type: 1, // SUB_COMMAND
            options: [
              {
                name: 'number',
                description: '4桁の数字を入力',
                type: 3, // STRING
                required: true
              }
            ]
          },
          {
            name: 'history',
            description: '過去のゲーム履歴を表示',
            type: 1 // SUB_COMMAND
          }
        ]
      }
    ];
  }

  static createTaskCommands(): CommandData[] {
    return [
      {
        name: 'task',
        description: 'タスク管理コマンド',
        options: [
          {
            name: 'create',
            description: '新しいタスクを作成',
            type: 1, // SUB_COMMAND
            options: [
              {
                name: 'title',
                description: 'タスクのタイトル',
                type: 3, // STRING
                required: true
              },
              {
                name: 'priority',
                description: 'タスクの優先度',
                type: 3, // STRING
                required: false,
                choices: [
                  { name: '高', value: 'high' },
                  { name: '中', value: 'medium' },
                  { name: '低', value: 'low' }
                ]
              },
              {
                name: 'deadline',
                description: '期限 (YYYY-MM-DD形式)',
                type: 3, // STRING
                required: false
              }
            ]
          },
          {
            name: 'update',
            description: 'タスクを更新',
            type: 2, // SUB_COMMAND_GROUP
            options: [
              {
                name: 'title',
                description: 'タスクのタイトルを更新',
                type: 1, // SUB_COMMAND
                options: [
                  {
                    name: 'current_title',
                    description: '現在のタスクタイトル',
                    type: 3, // STRING
                    required: true
                  },
                  {
                    name: 'new_title',
                    description: '新しいタスクタイトル',
                    type: 3, // STRING
                    required: true
                  }
                ]
              },
              {
                name: 'priority',
                description: 'タスクの優先度を更新',
                type: 1, // SUB_COMMAND
                options: [
                  {
                    name: 'title',
                    description: 'タスクタイトル',
                    type: 3, // STRING
                    required: true
                  },
                  {
                    name: 'priority',
                    description: '新しい優先度',
                    type: 3, // STRING
                    required: true,
                    choices: [
                      { name: '高', value: 'high' },
                      { name: '中', value: 'medium' },
                      { name: '低', value: 'low' }
                    ]
                  }
                ]
              },
              {
                name: 'deadline',
                description: 'タスクの期限を更新',
                type: 1, // SUB_COMMAND
                options: [
                  {
                    name: 'title',
                    description: 'タスクタイトル',
                    type: 3, // STRING
                    required: true
                  },
                  {
                    name: 'deadline',
                    description: '新しい期限 (YYYY-MM-DD形式)',
                    type: 3, // STRING
                    required: true
                  }
                ]
              }
            ]
          },
          {
            name: 'delete',
            description: 'タスクを削除',
            type: 1, // SUB_COMMAND
            options: [
              {
                name: 'title',
                description: '削除するタスクのタイトル',
                type: 3, // STRING
                required: true
              }
            ]
          },
          {
            name: 'confirm',
            description: 'タスクの詳細を確認',
            type: 1, // SUB_COMMAND
            options: [
              {
                name: 'title',
                description: '確認するタスクのタイトル',
                type: 3, // STRING
                required: true
              }
            ]
          }
        ]
      }
    ];
  }

  static createModTestCommands(): CommandData[] {
    return [
      {
        name: 'modtest',
        description: 'モデレーション権限テストコマンド',
        options: [
          {
            name: 'permissions',
            description: 'ボットの権限をチェックします',
            type: 1 // SUB_COMMAND
          },
          {
            name: 'channel',
            description: '現在のチャンネルでの権限をチェックします',
            type: 1 // SUB_COMMAND
          }
        ]
      }
    ];
  }

  static getAllCommands(): CommandData[] {
    return [
      ...CommandRegistry.createHitBlowCommands(),
      ...CommandRegistry.createTaskCommands(),
      ...CommandRegistry.createModTestCommands()
    ];
  }
}