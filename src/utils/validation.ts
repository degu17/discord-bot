export class ValidationUtils {
  static validateHitBlowNumber(input: string): { isValid: boolean; error?: string } {
    // 4桁の数字かチェック
    if (!/^\d{4}$/.test(input)) {
      return {
        isValid: false,
        error: '4桁の数字を入力してください。'
      };
    }

    // 重複する数字がないかチェック（ゲーム設定による）
    const digits = input.split('');
    const uniqueDigits = new Set(digits);
    
    if (uniqueDigits.size !== digits.length) {
      return {
        isValid: false,
        error: '重複する数字は使用できません。'
      };
    }

    return { isValid: true };
  }

  static validateTaskTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return {
        isValid: false,
        error: 'タスクタイトルは必須です。'
      };
    }

    if (title.length > 100) {
      return {
        isValid: false,
        error: 'タスクタイトルは100文字以内で入力してください。'
      };
    }

    return { isValid: true };
  }

  static validateTaskPriority(priority: string): { isValid: boolean; error?: string } {
    const validPriorities = ['high', 'medium', 'low'];
    
    if (!validPriorities.includes(priority)) {
      return {
        isValid: false,
        error: '優先度は "high", "medium", "low" のいずれかを指定してください。'
      };
    }

    return { isValid: true };
  }

  static validateDate(dateString: string): { isValid: boolean; date?: Date; error?: string } {
    // YYYY-MM-DD形式のチェック
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return {
        isValid: false,
        error: '日付はYYYY-MM-DD形式で入力してください。'
      };
    }

    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        error: '有効な日付を入力してください。'
      };
    }

    // 過去の日付チェック
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return {
        isValid: false,
        error: '過去の日付は設定できません。'
      };
    }

    return { 
      isValid: true, 
      date 
    };
  }

  static sanitizeInput(input: string): string {
    // 基本的な文字列サニタイズ
    return input
      .trim()
      .replace(/[<>]/g, '') // HTMLタグの除去
      .slice(0, 500); // 最大長制限
  }

  static validateDiscordUserId(userId: string): { isValid: boolean; error?: string } {
    // Discord IDは18桁の数字
    if (!/^\d{17,19}$/.test(userId)) {
      return {
        isValid: false,
        error: '無効なユーザーIDです。'
      };
    }

    return { isValid: true };
  }

  static validateChannelId(channelId: string): { isValid: boolean; error?: string } {
    // Discord チャンネルIDも18桁の数字
    if (!/^\d{17,19}$/.test(channelId)) {
      return {
        isValid: false,
        error: '無効なチャンネルIDです。'
      };
    }

    return { isValid: true };
  }
}