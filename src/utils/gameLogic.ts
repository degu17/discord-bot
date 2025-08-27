import { GameAttempt } from '../types';

export class GameLogic {
  static calculateHitBlow(answer: string, guess: string): { hit: number; blow: number } {
    if (answer.length !== 4 || guess.length !== 4) {
      throw new Error('Both answer and guess must be 4 digits');
    }

    let hit = 0;
    let blow = 0;

    const answerDigits = answer.split('');
    const guessDigits = guess.split('');
    
    // まずHitを計算
    const answerRemaining: string[] = [];
    const guessRemaining: string[] = [];

    for (let i = 0; i < 4; i++) {
      if (answerDigits[i] === guessDigits[i]) {
        hit++;
      } else {
        answerRemaining.push(answerDigits[i]);
        guessRemaining.push(guessDigits[i]);
      }
    }

    // Blowを計算（Hitではない部分で数字が含まれる数）
    for (const digit of guessRemaining) {
      const index = answerRemaining.indexOf(digit);
      if (index !== -1) {
        blow++;
        answerRemaining.splice(index, 1);
      }
    }

    return { hit, blow };
  }

  static generateUniqueAnswer(): string {
    const digits: number[] = [];
    const available = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // 重複なし4桁数字生成
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      digits.push(available.splice(randomIndex, 1)[0]);
    }
    
    return digits.join('');
  }

  static validateGuess(guess: string, allowDuplicates: boolean = false): { 
    isValid: boolean; 
    error?: string 
  } {
    // 4桁の数字チェック
    if (!/^\d{4}$/.test(guess)) {
      return {
        isValid: false,
        error: '4桁の数字を入力してください。'
      };
    }

    // 重複チェック（設定による）
    if (!allowDuplicates) {
      const digits = guess.split('');
      const uniqueDigits = new Set(digits);
      
      if (uniqueDigits.size !== digits.length) {
        return {
          isValid: false,
          error: '重複する数字は使用できません。'
        };
      }
    }

    return { isValid: true };
  }

  static formatAttemptHistory(attempts: GameAttempt[]): string {
    if (attempts.length === 0) {
      return '試行履歴なし';
    }

    return attempts
      .map((attempt, index) => {
        const time = attempt.timestamp.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        return `${index + 1}. ${attempt.guess} → ${attempt.hit}H ${attempt.blow}B (${time})`;
      })
      .join('\n');
  }

  static calculateGameScore(attempts: number, participants: number, duration: number): number {
    // スコア計算式: 基本点 - 試行回数ペナルティ + 参加者ボーナス - 時間ペナルティ
    const baseScore = 1000;
    const attemptPenalty = attempts * 50;
    const participantBonus = Math.min(participants * 10, 100);
    const timePenalty = Math.floor(duration / (60 * 1000)) * 5; // 1分ごとに5点減点

    return Math.max(0, baseScore - attemptPenalty + participantBonus - timePenalty);
  }

  static getGameDifficulty(answer: string): 'easy' | 'medium' | 'hard' {
    const digits = answer.split('').map(Number);
    
    // 連続した数字が多いほど簡単
    let consecutiveCount = 0;
    for (let i = 0; i < digits.length - 1; i++) {
      if (Math.abs(digits[i] - digits[i + 1]) === 1) {
        consecutiveCount++;
      }
    }

    // 0が含まれると少し難しい
    const hasZero = digits.includes(0);
    
    if (consecutiveCount >= 2) {
      return 'easy';
    } else if (consecutiveCount === 1 && !hasZero) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  static generateHint(answer: string, attempts: GameAttempt[]): string | null {
    if (attempts.length < 5) {
      return null; // 5回以上試行してからヒント
    }

    const usedDigits = new Set(
      attempts.flatMap(attempt => attempt.guess.split(''))
    );

    // まだ試していない数字があればヒント
    const unusedDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .filter(d => !usedDigits.has(d.toString()));

    if (unusedDigits.length > 0) {
      return `ヒント: まだ試していない数字があります (残り${unusedDigits.length}個)`;
    }

    // 位置のヒント
    const correctPositions = attempts
      .flatMap(attempt => {
        const positions: number[] = [];
        for (let i = 0; i < 4; i++) {
          if (attempt.guess[i] === answer[i]) {
            positions.push(i + 1);
          }
        }
        return positions;
      });

    if (correctPositions.length > 0) {
      const uniquePositions = [...new Set(correctPositions)];
      return `ヒント: ${uniquePositions.join('、')}番目の位置は正解した履歴があります`;
    }

    return 'ヒント: 過去の試行結果をよく見直してみてください';
  }

  static isGameWon(hit: number): boolean {
    return hit === 4;
  }

  static getNextGuessRecommendation(attempts: GameAttempt[]): string | null {
    if (attempts.length === 0) {
      return null;
    }

    const lastAttempt = attempts[attempts.length - 1];
    
    if (lastAttempt.hit === 0 && lastAttempt.blow === 0) {
      return '前回の数字はすべて不正解です。まったく違う数字を試してみてください。';
    }

    if (lastAttempt.hit > 0) {
      return `${lastAttempt.hit}個の数字の位置が正解です。その数字は固定して他を変更してみてください。`;
    }

    if (lastAttempt.blow > 0) {
      return `${lastAttempt.blow}個の数字は答えに含まれますが位置が違います。位置を変更してみてください。`;
    }

    return null;
  }
}