/**
 * モデレーション権限テスト用コマンド
 * ボットのメッセージ管理権限とタイムアウト権限をチェックする
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  MessageFlags,
} from 'discord.js';

/**
 * 権限チェック結果の型定義
 */
interface PermissionResult {
  hasPermission: boolean;
  permissionName: string;
  emoji: string;
  description: string;
}

export class ModTestCommand {
  /**
   * ボットの基本権限をチェックする関数
   */
  private static async checkBotPermissions(
    interaction: ChatInputCommandInteraction
  ): Promise<PermissionResult[]> {
    const guild = interaction.guild;
    if (!guild) {
      throw new Error('ギルド情報を取得できません');
    }

    try {
      // ボットのメンバー情報を取得
      const botMember = await guild.members.fetchMe();

      if (!botMember) {
        throw new Error('ボットのメンバー情報を取得できませんでした');
      }

      const results: PermissionResult[] = [];

      // メッセージ管理権限をチェック
      const hasManageMessages = botMember.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      );
      results.push({
        hasPermission: hasManageMessages,
        permissionName: 'メッセージ管理',
        emoji: hasManageMessages ? '✅' : '❌',
        description: hasManageMessages
          ? 'メッセージの削除が可能です'
          : 'メッセージ管理権限が必要です',
      });

      // タイムアウト権限をチェック
      const hasModerateMembers = botMember.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      );
      results.push({
        hasPermission: hasModerateMembers,
        permissionName: 'メンバー管理',
        emoji: hasModerateMembers ? '✅' : '❌',
        description: hasModerateMembers
          ? 'メンバーのタイムアウトが可能です'
          : 'メンバー管理権限が必要です',
      });

      return results;
    } catch (error) {
      console.error('権限チェックエラー:', error);
      throw error;
    }
  }

  /**
   * チャンネル固有の権限をチェックする関数
   */
  private static async checkChannelPermissions(
    interaction: ChatInputCommandInteraction
  ): Promise<PermissionResult[]> {
    const guild = interaction.guild;
    const channel = interaction.channel;

    if (!guild || !channel) {
      throw new Error('ギルドまたはチャンネル情報を取得できません');
    }

    try {
      const botMember = await guild.members.fetchMe();

      if (!botMember) {
        throw new Error('ボットのメンバー情報を取得できませんでした');
      }

      // ギルドチャンネルかどうかをチェック
      if (!channel.isTextBased() || !('permissionsFor' in channel)) {
        throw new Error('このチャンネルでは権限チェックができません');
      }

      // チャンネル固有の権限を取得
      const channelPermissions = channel.permissionsFor(botMember);

      if (!channelPermissions) {
        throw new Error('チャンネルの権限情報を取得できませんでした');
      }

      const results: PermissionResult[] = [];

      // チャンネルでのメッセージ管理権限
      const hasManageMessages = channelPermissions.has(
        PermissionsBitField.Flags.ManageMessages
      );
      results.push({
        hasPermission: hasManageMessages,
        permissionName: 'チャンネル内メッセージ管理',
        emoji: hasManageMessages ? '✅' : '❌',
        description: hasManageMessages
          ? 'このチャンネルでメッセージ削除が可能'
          : 'このチャンネルでメッセージ削除不可',
      });

      // チャンネルでのメンバー管理権限
      const hasModerateMembers = channelPermissions.has(
        PermissionsBitField.Flags.ModerateMembers
      );
      results.push({
        hasPermission: hasModerateMembers,
        permissionName: 'チャンネル内メンバー管理',
        emoji: hasModerateMembers ? '✅' : '❌',
        description: hasModerateMembers
          ? 'このチャンネルでタイムアウトが可能'
          : 'このチャンネルでタイムアウト不可',
      });

      return results;
    } catch (error) {
      console.error('チャンネル権限チェックエラー:', error);
      throw error;
    }
  }

  /**
   * permissionsサブコマンドの処理
   */
  static async handlePermissions(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      const results = await this.checkBotPermissions(interaction);

      // 結果をEmbedで表示
      const embed = new EmbedBuilder()
        .setTitle('🛡️ ボット権限チェック結果')
        .setDescription('モデレーション機能に必要な権限の確認状況')
        .setColor(results.every((r) => r.hasPermission) ? 0x00ff00 : 0xff9900)
        .setTimestamp();

      // 各権限の結果を追加
      results.forEach((result) => {
        embed.addFields({
          name: `${result.emoji} ${result.permissionName}`,
          value: result.description,
          inline: true,
        });
      });

      // 全体的な評価
      const allGranted = results.every((r) => r.hasPermission);
      const missingCount = results.filter((r) => !r.hasPermission).length;

      embed.addFields({
        name: '📋 総合評価',
        value: allGranted
          ? '✅ すべての権限が揃っています！自動モデレーション機能を実装できます。'
          : `❌ ${missingCount}個の権限が不足しています。サーバー管理者に権限付与を依頼してください。`,
        inline: false,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('permissions コマンドエラー:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ エラー')
        .setDescription('権限チェック中にエラーが発生しました')
        .setColor(0xff0000)
        .addFields({
          name: 'エラー詳細',
          value: error instanceof Error ? error.message : '不明なエラー',
          inline: false,
        });

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({
          embeds: [errorEmbed],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }

  /**
   * channelサブコマンドの処理
   */
  static async handleChannel(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      const results = await this.checkChannelPermissions(interaction);

      // 結果をEmbedで表示
      const embed = new EmbedBuilder()
        .setTitle('📍 チャンネル権限チェック結果')
        .setDescription(`<#${interaction.channelId}> での権限確認状況`)
        .setColor(results.every((r) => r.hasPermission) ? 0x00ff00 : 0xff9900)
        .setTimestamp();

      // 各権限の結果を追加
      results.forEach((result) => {
        embed.addFields({
          name: `${result.emoji} ${result.permissionName}`,
          value: result.description,
          inline: true,
        });
      });

      // チャンネル固有の評価
      const allGranted = results.every((r) => r.hasPermission);
      const missingCount = results.filter((r) => !r.hasPermission).length;

      embed.addFields({
        name: '📋 チャンネル評価',
        value: allGranted
          ? '✅ このチャンネルで自動モデレーション機能が利用可能です'
          : `❌ このチャンネルで${missingCount}個の権限が不足しています`,
        inline: false,
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('channel コマンドエラー:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ エラー')
        .setDescription('チャンネル権限チェック中にエラーが発生しました')
        .setColor(0xff0000)
        .addFields({
          name: 'エラー詳細',
          value: error instanceof Error ? error.message : '不明なエラー',
          inline: false,
        });

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({
          embeds: [errorEmbed],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
}
