import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { TaskService } from '../services/taskService';
import { ValidationUtils } from '../utils/validation';
import { TaskCreateRequest } from '../types';

export class TaskCommand {
  private static taskService = TaskService.getInstance();

  static async handleCreate(interaction: ChatInputCommandInteraction) {
    // Notion設定チェック
    if (!TaskService.isConfigured()) {
      await interaction.reply({
        content:
          '❌ タスク管理機能が設定されていません。NOTION_TOKEN と NOTION_TASK_DB_ID の環境変数を設定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const title = ValidationUtils.sanitizeInput(
        interaction.options.getString('title', true)
      );
      const priority = interaction.options.getString('priority') as
        | 'high'
        | 'medium'
        | 'low'
        | null;
      const deadlineStr = interaction.options.getString('deadline');

      let deadline: Date | undefined;
      if (deadlineStr) {
        const dateValidation = ValidationUtils.validateDate(deadlineStr);
        if (!dateValidation.isValid) {
          await interaction.reply({
            content: `❌ ${dateValidation.error}`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        deadline = dateValidation.date;
      }

      // Notion API経由でタスク作成
      const taskRequest: TaskCreateRequest = {
        title,
        priority: priority || 'medium',
      };

      if (deadline) {
        taskRequest.deadline = deadline;
      }

      // 先に応答してタイムアウトを防ぐ
      await interaction.deferReply();

      const result = await this.taskService.createTask(
        taskRequest,
        interaction.user.id,
        interaction.user.displayName
      );

      if (!result.success) {
        await interaction.editReply({
          content: `❌ ${result.error}`,
        });
        return;
      }

      const task = result.task!;
      const embed = new EmbedBuilder()
        .setTitle('✅ タスクが作成されました')
        .addFields(
          { name: 'タイトル', value: task.title, inline: false },
          {
            name: '優先度',
            value: this.formatPriority(task.priority),
            inline: true,
          },
          {
            name: '期限',
            value: task.deadline
              ? task.deadline.toLocaleDateString('ja-JP')
              : '未設定',
            inline: true,
          },
          { name: '作成者', value: task.creator, inline: true },
          {
            name: 'ステータス',
            value: this.formatStatus(task.status),
            inline: true,
          }
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });

      console.log(`📋 Task created by ${interaction.user.tag}: ${task.title}`);
    } catch (error) {
      console.error('Error in task create:', error);
      throw error;
    }
  }

  static async handleUpdateTitle(interaction: ChatInputCommandInteraction) {
    // Notion設定チェック
    if (!TaskService.isConfigured()) {
      await interaction.reply({
        content:
          '❌ タスク管理機能が設定されていません。NOTION_TOKEN と NOTION_TASK_DB_ID の環境変数を設定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      // 先に応答してタイムアウトを防ぐ
      await interaction.deferReply();

      const currentTitle = ValidationUtils.sanitizeInput(
        interaction.options.getString('current_title', true)
      );
      const newTitle = ValidationUtils.sanitizeInput(
        interaction.options.getString('new_title', true)
      );

      const result = await this.taskService.updateTaskTitle(
        currentTitle,
        newTitle
      );

      if (!result.success) {
        await interaction.editReply({
          content: `❌ ${result.error}`,
        });
        return;
      }

      const task = result.task!;
      const embed = new EmbedBuilder()
        .setTitle('📝 タスクタイトルが更新されました')
        .addFields(
          { name: '変更前', value: currentTitle, inline: false },
          { name: '変更後', value: task.title, inline: false },
          {
            name: '更新日時',
            value: task.updatedAt.toLocaleString('ja-JP'),
            inline: true,
          }
        )
        .setColor(0x0099ff)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });

      console.log(
        `📝 Task title updated by ${interaction.user.tag}: ${currentTitle} -> ${task.title}`
      );
    } catch (error) {
      console.error('Error in task update title:', error);
      throw error;
    }
  }

  static async handleUpdatePriority(interaction: ChatInputCommandInteraction) {
    // Notion設定チェック
    if (!TaskService.isConfigured()) {
      await interaction.reply({
        content:
          '❌ タスク管理機能が設定されていません。NOTION_TOKEN と NOTION_TASK_DB_ID の環境変数を設定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      // 先に応答してタイムアウトを防ぐ
      await interaction.deferReply();
      const title = ValidationUtils.sanitizeInput(
        interaction.options.getString('title', true)
      );
      const priority = interaction.options.getString('priority', true) as
        | 'high'
        | 'medium'
        | 'low';

      const result = await this.taskService.updateTaskPriority(title, priority);

      if (!result.success) {
        await interaction.editReply({
          content: `❌ ${result.error}`,
        });
        return;
      }

      const task = result.task!;
      const embed = new EmbedBuilder()
        .setTitle('🏷️ タスク優先度が更新されました')
        .addFields(
          { name: 'タスク', value: task.title, inline: false },
          {
            name: '新しい優先度',
            value: this.formatPriority(task.priority),
            inline: true,
          },
          {
            name: '更新日時',
            value: task.updatedAt.toLocaleString('ja-JP'),
            inline: true,
          }
        )
        .setColor(0x0099ff)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });

      console.log(
        `🏷️ Task priority updated by ${interaction.user.tag}: ${task.title} -> ${priority}`
      );
    } catch (error) {
      console.error('Error in task update priority:', error);
      throw error;
    }
  }

  static async handleUpdateDeadline(interaction: ChatInputCommandInteraction) {
    // Notion設定チェック
    if (!TaskService.isConfigured()) {
      await interaction.reply({
        content:
          '❌ タスク管理機能が設定されていません。NOTION_TOKEN と NOTION_TASK_DB_ID の環境変数を設定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      // 先に応答してタイムアウトを防ぐ
      await interaction.deferReply();

      const title = ValidationUtils.sanitizeInput(
        interaction.options.getString('title', true)
      );
      const deadlineStr = interaction.options.getString('deadline', true);

      const dateValidation = ValidationUtils.validateDate(deadlineStr);
      if (!dateValidation.isValid) {
        await interaction.editReply({
          content: `❌ ${dateValidation.error}`,
        });
        return;
      }

      const result = await this.taskService.updateTaskDeadline(
        title,
        dateValidation.date!
      );

      if (!result.success) {
        await interaction.editReply({
          content: `❌ ${result.error}`,
        });
        return;
      }

      const task = result.task!;
      const embed = new EmbedBuilder()
        .setTitle('📅 タスク期限が更新されました')
        .addFields(
          { name: 'タスク', value: task.title, inline: false },
          {
            name: '新しい期限',
            value: task.deadline
              ? task.deadline.toLocaleDateString('ja-JP')
              : '未設定',
            inline: true,
          },
          {
            name: '更新日時',
            value: task.updatedAt.toLocaleString('ja-JP'),
            inline: true,
          }
        )
        .setColor(0x0099ff)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });

      console.log(
        `📅 Task deadline updated by ${interaction.user.tag}: ${task.title}`
      );
    } catch (error) {
      console.error('Error in task update deadline:', error);
      throw error;
    }
  }

  static async handleDelete(interaction: ChatInputCommandInteraction) {
    // Notion設定チェック
    if (!TaskService.isConfigured()) {
      await interaction.reply({
        content:
          '❌ タスク管理機能が設定されていません。NOTION_TOKEN と NOTION_TASK_DB_ID の環境変数を設定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      // 先に応答してタイムアウトを防ぐ
      await interaction.deferReply();

      const title = ValidationUtils.sanitizeInput(
        interaction.options.getString('title', true)
      );

      const result = await this.taskService.deleteTask(title);

      if (!result.success) {
        await interaction.editReply({
          content: `❌ ${result.error}`,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🗑️ タスクが削除されました')
        .addFields(
          { name: '削除されたタスク', value: title, inline: false },
          { name: '削除者', value: interaction.user.displayName, inline: true },
          {
            name: '削除日時',
            value: new Date().toLocaleString('ja-JP'),
            inline: true,
          }
        )
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });

      console.log(`🗑️ Task deleted by ${interaction.user.tag}: ${title}`);
    } catch (error) {
      console.error('Error in task delete:', error);
      throw error;
    }
  }

  static async handleConfirm(interaction: ChatInputCommandInteraction) {
    // Notion設定チェック
    if (!TaskService.isConfigured()) {
      await interaction.reply({
        content:
          '❌ タスク管理機能が設定されていません。NOTION_TOKEN と NOTION_TASK_DB_ID の環境変数を設定してください。',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      // 先に応答してタイムアウトを防ぐ
      await interaction.deferReply();

      const title = ValidationUtils.sanitizeInput(
        interaction.options.getString('title', true)
      );

      const result = await this.taskService.getTask(title);

      if (!result.success) {
        await interaction.editReply({
          content: `❌ ${result.error}`,
        });
        return;
      }

      const task = result.task!;
      const embed = new EmbedBuilder()
        .setTitle('📋 タスク詳細')
        .addFields(
          { name: 'タイトル', value: task.title, inline: false },
          {
            name: '優先度',
            value: this.formatPriority(task.priority),
            inline: true,
          },
          {
            name: '期限',
            value: task.deadline
              ? task.deadline.toLocaleDateString('ja-JP')
              : '未設定',
            inline: true,
          },
          {
            name: 'ステータス',
            value: this.formatStatus(task.status),
            inline: true,
          },
          { name: '作成者', value: task.creator, inline: true },
          {
            name: '作成日',
            value: task.createdAt.toLocaleDateString('ja-JP'),
            inline: true,
          },
          {
            name: '最終更新',
            value: task.updatedAt.toLocaleString('ja-JP'),
            inline: true,
          }
        )
        .setColor(this.getStatusColor(task.status))
        .setTimestamp();

      // 期限が近い場合は警告を追加
      if (task.deadline) {
        const daysUntilDeadline = Math.ceil(
          (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDeadline <= 3 && daysUntilDeadline > 0) {
          embed.addFields({
            name: '⚠️ 注意',
            value: `期限まで${daysUntilDeadline}日です`,
            inline: false,
          });
        } else if (daysUntilDeadline <= 0) {
          embed.addFields({
            name: '🚨 警告',
            value: '期限を過ぎています',
            inline: false,
          });
        }
      }

      await interaction.editReply({
        embeds: [embed],
      });

      console.log(
        `📋 Task details viewed by ${interaction.user.tag}: ${task.title}`
      );
    } catch (error) {
      console.error('Error in task confirm:', error);
      throw error;
    }
  }

  private static formatPriority(priority: 'high' | 'medium' | 'low'): string {
    const map = {
      high: '🔴 高',
      medium: '🟡 中',
      low: '🟢 低',
    };
    return map[priority];
  }

  private static formatStatus(
    status: 'not_started' | 'in_progress' | 'completed'
  ): string {
    const map = {
      not_started: '⚪ 未着手',
      in_progress: '🔵 進行中',
      completed: '✅ 完了',
    };
    return map[status];
  }

  private static getStatusColor(
    status: 'not_started' | 'in_progress' | 'completed'
  ): number {
    const map = {
      not_started: 0x999999,
      in_progress: 0x0099ff,
      completed: 0x00ff00,
    };
    return map[status];
  }
}
