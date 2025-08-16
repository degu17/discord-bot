import { User } from 'discord.js';

// Game types
export interface GameState {
  id: string;
  channelId: string;
  answer: string;
  participants: string[];
  attempts: GameAttempt[];
  status: 'recruiting' | 'playing' | 'finished';
  startTime: Date;
  lastActivity: Date;
}

export interface GameAttempt {
  userId: string;
  guess: string;
  hit: number;
  blow: number;
  timestamp: Date;
}

export interface GameHistory {
  gameId: string;
  winner: string | null;
  totalAttempts: number;
  duration: number;
  participants: string[];
  finishedAt: Date;
}

// Moderation types
export interface ModerationRule {
  level: 1 | 2 | 3;
  words: string[];
  action: 'warn' | 'delete' | 'timeout';
  timeoutDuration?: number;
}

export interface ModerationLog {
  userId: string;
  messageId: string;
  channelId: string;
  content: string;
  triggeredRule: ModerationRule;
  action: string;
  timestamp: Date;
}

// Task management types
export interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: Date;
  creator: string;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCreateRequest {
  title: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: Date;
}

export interface TaskUpdateRequest {
  title?: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: Date;
  status?: 'not_started' | 'in_progress' | 'completed';
}

// Command types
export interface CommandData {
  name: string;
  description: string;
  options?: any[];
}

// Bot configuration types
export interface BotConfig {
  moderationRules: ModerationRule[];
  gameSettings: {
    maxParticipants: number;
    timeoutMinutes: number;
    digitCount: number;
  };
}