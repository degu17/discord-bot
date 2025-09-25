import {
  IWordDetector,
  DetectionResult,
  ModerationRules,
  ModerationRule,
  ModerationAction,
} from '../../types/moderation';
import { ConfigManager } from '../../utils/ConfigManager';

/**
 * 不適切語の検出を担当するクラス
 */
export class WordDetector implements IWordDetector {
  private configManager: ConfigManager;
  private rules: ModerationRule[] = [];

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  /**
   * メッセージ内容から不適切なコンテンツを検出する
   */
  public detectInappropriateContent(content: string): DetectionResult | null {
    console.log(`🔍 Detecting inappropriate content in: "${content}"`);

    if (!content || typeof content !== 'string') {
      console.log('⚠️ Content is empty or not a string');
      return null;
    }

    // メッセージ内容を小文字に変換して検出しやすくする
    const normalizedContent = content.toLowerCase();
    console.log(`🔤 Normalized content: "${normalizedContent}"`);
    console.log(`📝 Checking against ${this.rules.length} rules`);

    // 最も高いレベルの検出結果を保持
    let highestDetection: DetectionResult | null = null;

    // 各ルールに対してチェック
    for (const rule of this.rules) {
      console.log(
        `🔎 Checking rule level ${rule.level} with words: [${rule.words.join(', ')}]`
      );
      const detectedWords = this.checkWordsInContent(
        normalizedContent,
        rule.words
      );

      if (detectedWords.length > 0) {
        console.log(
          `⚠️ Detected inappropriate words: [${detectedWords.join(', ')}]`
        );
        const detection: DetectionResult = {
          level: rule.level,
          detectedWords,
          action: rule.action,
          timeoutDuration: rule.timeoutDuration,
        };

        // より高いレベルの検出があった場合は置き換える
        if (!highestDetection || rule.level > highestDetection.level) {
          highestDetection = detection;
        }
      } else {
        console.log(`✅ No match for rule level ${rule.level}`);
      }
    }

    if (!highestDetection) {
      console.log('✅ No inappropriate content detected');
    }

    return highestDetection;
  }

  /**
   * 指定された単語リストがコンテンツに含まれているかチェック
   */
  private checkWordsInContent(content: string, words: string[]): string[] {
    const detectedWords: string[] = [];

    for (const word of words) {
      const normalizedWord = word.toLowerCase().trim();

      if (normalizedWord === '') {
        continue;
      }

      // 単語が含まれているかチェック
      if (this.isWordInContent(content, normalizedWord)) {
        detectedWords.push(word);
      }
    }

    return detectedWords;
  }

  /**
   * 特定の単語がコンテンツに含まれているかチェック
   * 部分一致で検出する
   */
  private isWordInContent(content: string, word: string): boolean {
    // シンプルな部分一致検索
    // 将来的には正規表現や単語境界を考慮したより高度な検索に拡張可能
    return content.includes(word);
  }

  /**
   * 設定からルールを読み込む
   */
  public async loadRules(): Promise<void> {
    try {
      const config = await this.configManager.loadModerationRules();
      this.rules = config.rules || [];

      console.log(`📋 Loaded ${this.rules.length} moderation rules:`);
      this.rules.forEach((rule, index) => {
        console.log(
          `  ${index + 1}. Level ${rule.level}: ${rule.words.join(', ')} -> ${rule.action}`
        );
      });

      // ルールをレベル順でソート（高いレベルが優先されるように）
      this.rules.sort((a, b) => b.level - a.level);
    } catch (error) {
      console.error('Error loading moderation rules:', error);

      // エラーが発生した場合はデフォルトルールを使用
      this.rules = this.getDefaultRules();
      console.log('Using default moderation rules due to loading error.');
    }
  }

  /**
   * ルールを再読み込みする
   */
  public async reloadRules(): Promise<void> {
    try {
      await this.configManager.reloadConfig();
      await this.loadRules();
      console.log('Moderation rules reloaded successfully.');
    } catch (error) {
      console.error('Error reloading moderation rules:', error);
      throw error;
    }
  }

  /**
   * デフォルトルールを取得する
   */
  private getDefaultRules(): ModerationRule[] {
    return [
      {
        level: 1,
        words: ['spam', 'test'],
        action: ModerationAction.WARN,
      },
    ];
  }

  /**
   * 現在読み込まれているルールの数を取得する
   */
  public getRuleCount(): number {
    return this.rules.length;
  }

  /**
   * 特定のレベルのルールを取得する
   */
  public getRulesByLevel(level: number): ModerationRule[] {
    return this.rules.filter((rule) => rule.level === level);
  }

  /**
   * すべてのルールを取得する（デバッグ用）
   */
  public getAllRules(): ModerationRule[] {
    return [...this.rules]; // コピーを返してカプセル化を維持
  }

  /**
   * 検出結果の詳細情報を取得する（デバッグ用）
   */
  public getDetectionDetails(content: string): {
    originalContent: string;
    normalizedContent: string;
    rulesChecked: number;
    detectionsByLevel: { [level: number]: string[] };
  } {
    const normalizedContent = content.toLowerCase();
    const detectionsByLevel: { [level: number]: string[] } = {};

    for (const rule of this.rules) {
      const detectedWords = this.checkWordsInContent(
        normalizedContent,
        rule.words
      );
      if (detectedWords.length > 0) {
        detectionsByLevel[rule.level] = detectedWords;
      }
    }

    return {
      originalContent: content,
      normalizedContent,
      rulesChecked: this.rules.length,
      detectionsByLevel,
    };
  }
}
