import { GameState, GameAttempt, GameHistory } from '../types';
import gameSettings from '../config/gameSettings.json';

export class GameManager {
  private static instance: GameManager;
  private activeGames: Map<string, GameState> = new Map();
  private gameHistory: GameHistory[] = [];
  private gameTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  createGame(channelId: string): string {
    // 既存のゲームが進行中の場合は終了
    this.endGameIfExists(channelId);

    const gameId = this.generateGameId();
    const answer = this.generateAnswer();

    const gameState: GameState = {
      id: gameId,
      channelId,
      answer,
      participants: [],
      attempts: [],
      status: 'recruiting',
      startTime: new Date(),
      lastActivity: new Date(),
    };

    this.activeGames.set(gameId, gameState);

    // 募集タイムアウトを設定
    const recruitmentTimeout = setTimeout(
      () => {
        this.endGame(gameId, 'timeout');
      },
      gameSettings.recruitmentTimeMinutes * 60 * 1000
    );

    this.gameTimeouts.set(gameId, recruitmentTimeout);

    console.log(`🎮 New game created: ${gameId} for channel ${channelId}`);
    return gameId;
  }

  addParticipant(
    gameId: string,
    userId: string
  ): { success: boolean; message: string } {
    const game = this.activeGames.get(gameId);

    if (!game) {
      return { success: false, message: 'ゲームが見つかりません。' };
    }

    if (game.status !== 'recruiting') {
      return { success: false, message: 'このゲームは既に開始されています。' };
    }

    if (game.participants.includes(userId)) {
      return { success: false, message: '既に参加済みです。' };
    }

    if (game.participants.length >= gameSettings.maxParticipants) {
      return { success: false, message: '参加者が上限に達しています。' };
    }

    game.participants.push(userId);
    game.lastActivity = new Date();

    console.log(`👤 User ${userId} joined game ${gameId}`);
    return { success: true, message: 'ゲームに参加しました！' };
  }

  startGame(gameId: string): { success: boolean; message: string } {
    const game = this.activeGames.get(gameId);

    if (!game) {
      return { success: false, message: 'ゲームが見つかりません。' };
    }

    if (game.status !== 'recruiting') {
      return { success: false, message: 'このゲームは既に開始されています。' };
    }

    if (game.participants.length === 0) {
      return { success: false, message: '参加者がいません。' };
    }

    game.status = 'playing';
    game.lastActivity = new Date();

    // 募集タイムアウトをクリアして、ゲームタイムアウトを設定
    const recruitmentTimeout = this.gameTimeouts.get(gameId);
    if (recruitmentTimeout) {
      clearTimeout(recruitmentTimeout);
    }

    const gameTimeout = setTimeout(
      () => {
        this.endGame(gameId, 'timeout');
      },
      gameSettings.timeoutMinutes * 60 * 1000
    );

    this.gameTimeouts.set(gameId, gameTimeout);

    console.log(
      `🚀 Game ${gameId} started with ${game.participants.length} participants`
    );
    return { success: true, message: 'ゲームが開始されました！' };
  }

  submitGuess(
    gameId: string,
    userId: string,
    guess: string
  ): {
    success: boolean;
    hit?: number;
    blow?: number;
    isWinner?: boolean;
    message: string;
  } {
    const game = this.activeGames.get(gameId);

    if (!game) {
      return { success: false, message: 'ゲームが見つかりません。' };
    }

    if (game.status !== 'playing') {
      return { success: false, message: 'ゲームが開始されていません。' };
    }

    if (!game.participants.includes(userId)) {
      return { success: false, message: 'このゲームに参加していません。' };
    }

    // Hit&Blow計算
    const { hit, blow } = this.calculateHitBlow(game.answer, guess);

    const attempt: GameAttempt = {
      userId,
      guess,
      hit,
      blow,
      timestamp: new Date(),
    };

    game.attempts.push(attempt);
    game.lastActivity = new Date();

    const isWinner = hit === 4;

    if (isWinner) {
      this.endGame(gameId, 'winner', userId);
    }

    console.log(`🎯 User ${userId} guessed ${guess}: ${hit}H ${blow}B`);

    return {
      success: true,
      hit,
      blow,
      isWinner,
      message: isWinner ? '🎉 正解です！' : `${hit}H ${blow}B`,
    };
  }

  private calculateHitBlow(
    answer: string,
    guess: string
  ): { hit: number; blow: number } {
    let hit = 0;
    let blow = 0;

    const answerDigits = answer.split('');
    const guessDigits = guess.split('');

    // Hit計算
    for (let i = 0; i < 4; i++) {
      if (answerDigits[i] === guessDigits[i]) {
        hit++;
      }
    }

    // Blow計算
    for (let i = 0; i < 4; i++) {
      if (
        answerDigits[i] !== guessDigits[i] &&
        answerDigits.includes(guessDigits[i])
      ) {
        blow++;
      }
    }

    return { hit, blow };
  }

  endGame(
    gameId: string,
    reason: 'winner' | 'timeout',
    winnerId?: string
  ): void {
    const game = this.activeGames.get(gameId);

    if (!game) {
      console.log(`⚠️ Attempted to end non-existent game: ${gameId}`);
      return;
    }

    game.status = 'finished';

    // タイムアウトをクリア
    const timeout = this.gameTimeouts.get(gameId);
    if (timeout) {
      clearTimeout(timeout);
      this.gameTimeouts.delete(gameId);
    }

    // 履歴に記録
    const history: GameHistory = {
      gameId,
      winner: winnerId || null,
      totalAttempts: game.attempts.length,
      duration: Date.now() - game.startTime.getTime(),
      participants: [...game.participants],
      finishedAt: new Date(),
    };

    this.gameHistory.push(history);

    // アクティブゲームから削除
    this.activeGames.delete(gameId);

    console.log(
      `🏁 Game ${gameId} ended (${reason}), winner: ${winnerId || 'none'}`
    );
  }

  private endGameIfExists(channelId: string): void {
    this.activeGames.forEach((game, gameId) => {
      if (game.channelId === channelId) {
        this.endGame(gameId, 'timeout');
      }
    });
  }

  getActiveGameByChannel(channelId: string): GameState | null {
    let foundGame: GameState | null = null;
    this.activeGames.forEach((game) => {
      if (game.channelId === channelId && !foundGame) {
        foundGame = game;
      }
    });
    return foundGame;
  }

  getGame(gameId: string): GameState | null {
    return this.activeGames.get(gameId) || null;
  }

  getGameHistory(limit: number = 10): GameHistory[] {
    return this.gameHistory
      .sort((a, b) => b.finishedAt.getTime() - a.finishedAt.getTime())
      .slice(0, limit);
  }

  getPlayerStats(userId: string): {
    totalGames: number;
    wins: number;
    averageAttempts: number;
    bestScore: number;
  } {
    const playerGames = this.gameHistory.filter((h) =>
      h.participants.includes(userId)
    );
    const wins = this.gameHistory.filter((h) => h.winner === userId);

    const totalAttempts = playerGames.reduce(
      (sum, game) => sum + game.totalAttempts,
      0
    );
    const averageAttempts =
      playerGames.length > 0 ? totalAttempts / playerGames.length : 0;

    const bestScore =
      wins.length > 0 ? Math.min(...wins.map((w) => w.totalAttempts)) : 0;

    return {
      totalGames: playerGames.length,
      wins: wins.length,
      averageAttempts: Math.round(averageAttempts * 10) / 10,
      bestScore,
    };
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnswer(): string {
    const digits = [];
    const available = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    // 重複なし4桁数字生成
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      digits.push(available.splice(randomIndex, 1)[0]);
    }

    return digits.join('');
  }

  // デバッグ用（本番では削除）
  getAnswer(gameId: string): string | null {
    const game = this.activeGames.get(gameId);
    return game ? game.answer : null;
  }
}
