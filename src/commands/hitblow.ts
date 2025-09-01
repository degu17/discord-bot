import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { GameManager } from '../services/gameManager';
import { GameLogic } from '../utils/gameLogic';
import gameSettings from '../config/gameSettings.json';

export class HitBlowCommand {
  private static gameManager = GameManager.getInstance();

  static async handleStart(interaction: ChatInputCommandInteraction) {
    try {
      const channelId = interaction.channelId;

      // 既存のゲームチェック
      const existingGame = this.gameManager.getActiveGameByChannel(channelId);
      if (existingGame) {
        await interaction.reply({
          content: '❌ このチャンネルで既にゲームが進行中です。',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // 新しいゲーム作成
      const gameId = this.gameManager.createGame(channelId);

      const embed = new EmbedBuilder()
        .setTitle('🎯 Hit&Blow ゲーム開始！')
        .setDescription('4桁の数字を当てるゲームです！参加者を募集中...')
        .addFields(
          {
            name: '参加方法',
            value: '✅ 下のボタンまたは `/hitblow join` コマンド',
            inline: true,
          },
          {
            name: '募集時間',
            value: `⏰ ${gameSettings.recruitmentTimeMinutes}分間`,
            inline: true,
          },
          {
            name: '最大参加者',
            value: `👥 ${gameSettings.maxParticipants}人`,
            inline: true,
          },
          {
            name: 'ルール',
            value:
              '• 4桁の重複なし数字を予想\n• Hit: 位置と数字が一致\n• Blow: 数字のみ一致\n• 制限時間: 5分',
            inline: false,
          },
          { name: 'ゲームID', value: `\`${gameId}\``, inline: false }
        )
        .setColor(0x00ae86)
        .setTimestamp();

      const joinButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`hitblow_join_${gameId}`)
          .setLabel('ゲームに参加')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎮'),
        new ButtonBuilder()
          .setCustomId(`hitblow_start_${gameId}`)
          .setLabel('ゲーム開始')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🚀')
      );

      await interaction.reply({
        embeds: [embed],
        components: [joinButton],
      });

      console.log(
        `🎮 Game created by ${interaction.user.tag} in channel ${channelId}`
      );
    } catch (error) {
      console.error('Error in hitblow start:', error);
      throw error;
    }
  }

  static async handleJoin(interaction: ChatInputCommandInteraction) {
    try {
      const channelId = interaction.channelId;
      const userId = interaction.user.id;

      // アクティブなゲームを取得
      const game = this.gameManager.getActiveGameByChannel(channelId);
      if (!game) {
        await interaction.reply({
          content: '❌ このチャンネルで進行中のゲームが見つかりません。',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // ゲームに参加
      const result = this.gameManager.addParticipant(game.id, userId);

      await interaction.reply({
        content: result.success
          ? `🎮 ${result.message}`
          : `❌ ${result.message}`,
        flags: MessageFlags.Ephemeral,
      });

      if (result.success) {
        console.log(`👤 ${interaction.user.tag} joined game ${game.id}`);
      }
    } catch (error) {
      console.error('Error in hitblow join:', error);
      throw error;
    }
  }

  static async handleSend(interaction: ChatInputCommandInteraction) {
    try {
      const number = interaction.options.getString('number', true);
      const channelId = interaction.channelId;
      const userId = interaction.user.id;

      // 入力値検証
      const validation = GameLogic.validateGuess(
        number,
        gameSettings.allowDuplicateDigits
      );
      if (!validation.isValid) {
        await interaction.reply({
          content: `❌ ${validation.error}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // アクティブなゲームを取得
      const game = this.gameManager.getActiveGameByChannel(channelId);
      if (!game) {
        await interaction.reply({
          content: '❌ このチャンネルで進行中のゲームが見つかりません。',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // 予想を送信
      const result = this.gameManager.submitGuess(game.id, userId, number);

      if (!result.success) {
        await interaction.reply({
          content: `❌ ${result.message}`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🎯 予想結果')
        .addFields(
          { name: '予想', value: number, inline: true },
          { name: 'Hit', value: result.hit!.toString(), inline: true },
          { name: 'Blow', value: result.blow!.toString(), inline: true }
        )
        .setColor(result.isWinner ? 0x00ff00 : 0x0099ff)
        .setTimestamp();

      if (result.isWinner) {
        embed.setDescription('🎉 **正解です！おめでとうございます！**');

        // ゲーム終了の公開メッセージ
        const winEmbed = new EmbedBuilder()
          .setTitle('🏆 ゲーム終了！')
          .setDescription(
            `${interaction.user.displayName} さんが正解しました！`
          )
          .addFields(
            { name: '答え', value: number, inline: true },
            {
              name: '試行回数',
              value: game.attempts.length.toString(),
              inline: true,
            }
          )
          .setColor(0x00ff00)
          .setTimestamp();

        // 2つのEmbedを1つのメッセージに統合
        await interaction.reply({
          embeds: [embed, winEmbed],
        });
      } else {
        embed.setDescription(
          `${result.message}\n\n継続してがんばってください！`
        );

        // ヒントを追加
        const hint = GameLogic.generateHint(game.answer, game.attempts);
        if (hint) {
          embed.addFields({ name: 'ヒント', value: hint, inline: false });
        }

        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }

      console.log(
        `🎯 ${interaction.user.tag} guessed ${number}: ${result.hit}H ${result.blow}B`
      );
    } catch (error) {
      console.error('Error in hitblow send:', error);
      throw error;
    }
  }

  static async handleHistory(interaction: ChatInputCommandInteraction) {
    try {
      const userId = interaction.user.id;
      const history = this.gameManager.getGameHistory(10);
      const playerStats = this.gameManager.getPlayerStats(userId);

      const embed = new EmbedBuilder()
        .setTitle('📊 Hit&Blow ゲーム履歴')
        .setDescription('あなたの戦績と最近のゲーム結果')
        .addFields(
          {
            name: '参加ゲーム数',
            value: playerStats.totalGames.toString(),
            inline: true,
          },
          { name: '勝利数', value: playerStats.wins.toString(), inline: true },
          {
            name: '勝率',
            value:
              playerStats.totalGames > 0
                ? `${Math.round((playerStats.wins / playerStats.totalGames) * 100)}%`
                : '0%',
            inline: true,
          },
          {
            name: '平均試行回数',
            value: playerStats.averageAttempts.toString(),
            inline: true,
          },
          {
            name: '最短クリア',
            value:
              playerStats.bestScore > 0 ? `${playerStats.bestScore}回` : '-',
            inline: true,
          }
        )
        .setColor(0x0099ff)
        .setTimestamp();

      if (history.length > 0) {
        const recentGames = history
          .slice(0, 5)
          .map((game, index) => {
            const winnerText = game.winner
              ? `勝者: <@${game.winner}>`
              : '勝者なし';
            const duration = Math.round(game.duration / (60 * 1000));
            return `${index + 1}. ${winnerText} (${game.totalAttempts}回, ${duration}分)`;
          })
          .join('\n');

        embed.addFields({
          name: '最近のゲーム',
          value: recentGames,
          inline: false,
        });
      } else {
        embed.addFields({
          name: '最近のゲーム',
          value: 'まだゲーム履歴がありません',
          inline: false,
        });
      }

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error('Error in hitblow history:', error);
      throw error;
    }
  }
}
