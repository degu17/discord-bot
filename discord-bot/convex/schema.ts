import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Discord Bot関連のテーブル
  botConfigs: defineTable({
    guildId: v.string(),
    prefix: v.string(),
    enabled: v.boolean(),
    moderationEnabled: v.boolean(),
    gameEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_guild', ['guildId']),

  // モデレーション履歴
  moderationLogs: defineTable({
    guildId: v.string(),
    userId: v.string(),
    messageId: v.string(),
    channelId: v.string(),
    content: v.string(),
    action: v.string(),
    reason: v.string(),
    moderatorId: v.string(),
    timestamp: v.number(),
  })
    .index('by_guild', ['guildId'])
    .index('by_user', ['userId']),

  // ゲーム履歴
  gameHistory: defineTable({
    guildId: v.string(),
    channelId: v.string(),
    gameType: v.string(),
    participants: v.array(v.string()),
    winner: v.optional(v.string()),
    score: v.optional(v.number()),
    duration: v.number(),
    startedAt: v.number(),
    endedAt: v.number(),
  })
    .index('by_guild', ['guildId'])
    .index('by_channel', ['channelId']),

  // タスク管理
  tasks: defineTable({
    guildId: v.string(),
    channelId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    status: v.union(
      v.literal('not_started'),
      v.literal('in_progress'),
      v.literal('completed')
    ),
    assigneeId: v.optional(v.string()),
    creatorId: v.string(),
    deadline: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_guild', ['guildId'])
    .index('by_status', ['status']),
});
