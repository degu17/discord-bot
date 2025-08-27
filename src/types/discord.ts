/**
 * Discord.js関連の型定義
 * スラッシュコマンド、ボタンインタラクション、コマンドモジュールの型を定義
 */

import { ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';

/**
 * スラッシュコマンドのオプションを表すインターフェース
 */
export interface SlashCommandOption {
  /** オプション名 */
  name: string;
  /** オプションの説明 */
  description: string;
  /** オプションのタイプ（Discord APIの型番号） */
  type: number;
  /** 必須オプションかどうか */
  required?: boolean;
  /** 選択肢（セレクト型の場合） */
  choices?: SlashCommandChoice[];
  /** サブオプション（グループ型の場合） */
  options?: SlashCommandOption[];
}

/**
 * スラッシュコマンドの選択肢を表すインターフェース
 */
export interface SlashCommandChoice {
  /** 表示名 */
  name: string;
  /** 実際の値 */
  value: string | number;
}

/**
 * コマンドデータを表すインターフェース
 */
export interface CommandData {
  /** コマンド名 */
  name: string;
  /** コマンドの説明 */
  description: string;
  /** コマンドオプション */
  options?: SlashCommandOption[];
}

/**
 * コマンドモジュールを表すインターフェース
 */
export interface CommandModule {
  /** コマンドデータ */
  data: CommandData;
  /** コマンド実行関数 */
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

/**
 * ボタンモジュールを表すインターフェース
 */
export interface ButtonModule {
  /** ボタンのカスタムIDパターン（正規表現） */
  customIdPattern: RegExp;
  /** ボタン実行関数 */
  execute(interaction: ButtonInteraction): Promise<void>;
}

// Notion API関連の型定義
export interface NotionProperty {
  type: string;
  [key: string]: any; // Notion APIの複雑な構造のため一時的に許可
}

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: {
    [key: string]: NotionProperty;
  };
}

export interface NotionTextContent {
  text: {
    content: string;
  };
}

export interface NotionRichTextProperty {
  rich_text: NotionTextContent[];
  type: 'rich_text';
}

export interface NotionTitleProperty {
  title: NotionTextContent[];
  type: 'title';
}

export interface NotionSelectProperty {
  select: {
    name: string;
  } | null;
  type: 'select';
}

export interface NotionDateProperty {
  date: {
    start: string;
  } | null;
  type: 'date';
}