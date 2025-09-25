"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const ModerationService_1 = require("../src/services/moderation/ModerationService");
const ConfigManager_1 = require("../src/utils/ConfigManager");
const WordDetector_1 = require("../src/services/moderation/WordDetector");
const ActionExecutor_1 = require("../src/services/moderation/ActionExecutor");
const ModerationLogger_1 = require("../src/services/moderation/ModerationLogger");
const commandRegistry_1 = require("../src/services/commandRegistry");
const hitblow_1 = require("../src/commands/hitblow");
const task_1 = require("../src/commands/task");
const modtest_1 = require("../src/commands/modtest");
const permissionChecker_1 = require("../src/utils/permissionChecker");
class DiscordBot {
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildMessageReactions,
                discord_js_1.GatewayIntentBits.GuildMembers, // タイムアウト機能に必要
            ],
        });
        // モデレーションサービスの初期化
        this.moderationService = this.initializeModerationService();
        this.setupEventHandlers();
    }
    /**
     * モデレーションサービスを初期化する
     */
    initializeModerationService() {
        const configManager = new ConfigManager_1.ConfigManager();
        const wordDetector = new WordDetector_1.WordDetector(configManager);
        const actionExecutor = new ActionExecutor_1.ActionExecutor();
        const moderationLogger = new ModerationLogger_1.ModerationLogger();
        // ActionExecutorにDiscordクライアントを設定
        actionExecutor.setClient(this.client);
        return new ModerationService_1.ModerationService(configManager, wordDetector, actionExecutor, moderationLogger);
    }
    setupEventHandlers() {
        this.client.once(discord_js_1.Events.ClientReady, async (readyClient) => {
            console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
            console.log(`🆔 Client ID: ${readyClient.user.id}`);
            console.log(`📱 Bot is online and ready to receive commands`);
            console.log(`🔍 DEBUG: Setting up message event handler...`);
            // モデレーションサービスを初期化
            try {
                await this.moderationService.initialize();
                console.log('🛡️  Moderation service initialized successfully');
            }
            catch (error) {
                console.error('❌ Failed to initialize moderation service:', error);
            }
            // スラッシュコマンドの登録
            try {
                const commandRegistry = new commandRegistry_1.CommandRegistry(process.env.DISCORD_TOKEN, process.env.DISCORD_CLIENT_ID);
                const commands = commandRegistry_1.CommandRegistry.getAllCommands();
                console.log('📋 Registering commands:', commands.map(c => c.name));
                await commandRegistry.registerCommands(commands);
                console.log('✅ Slash commands registered successfully');
            }
            catch (error) {
                console.error('❌ Failed to register commands:', error);
            }
            // 権限チェック実行
            console.log('\n🔍 Starting permission check...');
            try {
                await permissionChecker_1.PermissionChecker.checkBotPermissions(readyClient);
                const hasPermissions = await permissionChecker_1.PermissionChecker.quickPermissionTest(readyClient);
                if (hasPermissions) {
                    console.log('✅ モデレーション機能準備完了: メッセージ管理・タイムアウト権限を確認しました');
                }
                else {
                    console.log('⚠️ モデレーション権限が不足している可能性があります');
                }
            }
            catch (error) {
                console.error('❌ Permission check failed:', error);
            }
        });
        this.client.on(discord_js_1.Events.MessageCreate, async (message) => {
            console.log(`🔍 DEBUG: Message event received! Author: ${message.author.tag}, Bot: ${message.author.bot}, Content: "${message.content}"`);
            if (message.author.bot) {
                console.log('⏭️ DEBUG: Skipping bot message');
                return;
            }
            // モデレーション処理を実行（1回のみ）
            try {
                console.log(`🎯 Processing message once: "${message.content}" from ${message.author.tag}`);
                await this.moderationService.processMessage(message);
            }
            catch (error) {
                console.error('Error in moderation processing:', error);
            }
        });
        // スラッシュコマンドとボタンのインタラクション処理
        this.client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
            try {
                // スラッシュコマンドの処理
                if (interaction.isChatInputCommand()) {
                    const { commandName } = interaction;
                    if (commandName === 'hitblow') {
                        const subcommand = interaction.options.getSubcommand();
                        switch (subcommand) {
                            case 'start':
                                await hitblow_1.HitBlowCommand.handleStart(interaction);
                                break;
                            case 'join':
                                await hitblow_1.HitBlowCommand.handleJoin(interaction);
                                break;
                            case 'send':
                                await hitblow_1.HitBlowCommand.handleSend(interaction);
                                break;
                            case 'history':
                                await hitblow_1.HitBlowCommand.handleHistory(interaction);
                                break;
                            default:
                                await interaction.reply({
                                    content: '❌ 不明なサブコマンドです。',
                                    flags: discord_js_1.MessageFlags.Ephemeral
                                });
                        }
                    }
                    else if (commandName === 'task') {
                        const subcommandGroup = interaction.options.getSubcommandGroup();
                        const subcommand = interaction.options.getSubcommand();
                        if (subcommand === 'create') {
                            await task_1.TaskCommand.handleCreate(interaction);
                        }
                        else if (subcommandGroup === 'update') {
                            switch (subcommand) {
                                case 'title':
                                    await task_1.TaskCommand.handleUpdateTitle(interaction);
                                    break;
                                case 'priority':
                                    await task_1.TaskCommand.handleUpdatePriority(interaction);
                                    break;
                                case 'deadline':
                                    await task_1.TaskCommand.handleUpdateDeadline(interaction);
                                    break;
                            }
                        }
                        else if (subcommand === 'delete') {
                            await task_1.TaskCommand.handleDelete(interaction);
                        }
                        else if (subcommand === 'confirm') {
                            await task_1.TaskCommand.handleConfirm(interaction);
                        }
                        else {
                            await interaction.reply({
                                content: '❌ 不明なサブコマンドです。',
                                flags: discord_js_1.MessageFlags.Ephemeral
                            });
                        }
                    }
                    else if (commandName === 'modtest') {
                        console.log('modtest command received');
                        const subcommand = interaction.options.getSubcommand();
                        switch (subcommand) {
                            case 'permissions':
                                await modtest_1.ModTestCommand.handlePermissions(interaction);
                                break;
                            case 'channel':
                                await modtest_1.ModTestCommand.handleChannel(interaction);
                                break;
                            default:
                                await interaction.reply({
                                    content: '❌ 不明なサブコマンドです。',
                                    flags: discord_js_1.MessageFlags.Ephemeral
                                });
                        }
                    }
                    else {
                        console.log(`Unknown command: ${commandName}`);
                        await interaction.reply({
                            content: `❌ 不明なコマンドです: ${commandName}`,
                            flags: discord_js_1.MessageFlags.Ephemeral
                        });
                    }
                }
                // ボタンインタラクションの処理
                else if (interaction.isButton()) {
                    const customId = interaction.customId;
                    if (customId.startsWith('hitblow_join_')) {
                        const gameId = customId.replace('hitblow_join_', '');
                        const userId = interaction.user.id;
                        const { GameManager } = await Promise.resolve().then(() => __importStar(require('../src/services/gameManager')));
                        const gameManager = GameManager.getInstance();
                        const game = gameManager.getGame(gameId);
                        if (!game) {
                            await interaction.reply({
                                content: '❌ ゲームが見つかりません。',
                                flags: discord_js_1.MessageFlags.Ephemeral
                            });
                            return;
                        }
                        const result = gameManager.addParticipant(gameId, userId);
                        await interaction.reply({
                            content: result.success ? `🎮 ${result.message}` : `❌ ${result.message}`,
                            flags: discord_js_1.MessageFlags.Ephemeral
                        });
                        if (result.success) {
                            console.log(`👤 ${interaction.user.tag} joined game ${gameId} via button`);
                        }
                    }
                    else if (customId.startsWith('hitblow_start_')) {
                        const gameId = customId.replace('hitblow_start_', '');
                        const { GameManager } = await Promise.resolve().then(() => __importStar(require('../src/services/gameManager')));
                        const gameManager = GameManager.getInstance();
                        const game = gameManager.getGame(gameId);
                        if (!game) {
                            await interaction.reply({
                                content: '❌ ゲームが見つかりません。',
                                flags: discord_js_1.MessageFlags.Ephemeral
                            });
                            return;
                        }
                        const result = gameManager.startGame(gameId);
                        if (result.success) {
                            const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                            const embed = new EmbedBuilder()
                                .setTitle('🚀 ゲーム開始！')
                                .setDescription(`参加者: ${game.participants.length}人\n\n4桁の数字を予想して \`/hitblow send\` コマンドで送信してください！`)
                                .addFields({ name: '制限時間', value: '⏰ 5分', inline: true }, { name: '参加者数', value: `👥 ${game.participants.length}人`, inline: true })
                                .setColor(0x00FF00)
                                .setTimestamp();
                            await interaction.reply({
                                embeds: [embed]
                            });
                            console.log(`🚀 Game ${gameId} started by ${interaction.user.tag}`);
                        }
                        else {
                            await interaction.reply({
                                content: `❌ ${result.message}`,
                                flags: discord_js_1.MessageFlags.Ephemeral
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.error('Interaction handling error:', error);
                // インタラクションが既に応答済みかチェック
                if (interaction.isChatInputCommand() || interaction.isButton()) {
                    // 既に応答済みの場合は何もしない（ログのみ出力）
                    if (interaction.replied || interaction.deferred) {
                        console.log('Interaction already responded, skipping error response');
                        return;
                    }
                    // 未応答の場合のみエラーメッセージを送信
                    try {
                        await interaction.reply({
                            content: '❌ 処理中にエラーが発生しました。',
                            flags: discord_js_1.MessageFlags.Ephemeral
                        });
                    }
                    catch (replyError) {
                        console.error('Reply error:', replyError);
                    }
                }
            }
        });
        // イベントハンドラーの登録確認
        console.log('📋 Event handlers registered:');
        console.log(`  - ClientReady: ${this.client.listenerCount(discord_js_1.Events.ClientReady)} listeners`);
        console.log(`  - MessageCreate: ${this.client.listenerCount(discord_js_1.Events.MessageCreate)} listeners`);
        console.log(`  - InteractionCreate: ${this.client.listenerCount(discord_js_1.Events.InteractionCreate)} listeners`);
    }
    async start(token) {
        try {
            await this.client.login(token);
        }
        catch (error) {
            console.error('❌ Failed to login to Discord:', error);
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
    /**
     * モデレーションサービスを取得する
     */
    getModerationService() {
        return this.moderationService;
    }
    /**
     * モデレーション設定を再読み込みする
     */
    async reloadModerationConfig() {
        try {
            await this.moderationService.reloadConfiguration();
            console.log('🔄 Moderation configuration reloaded successfully');
        }
        catch (error) {
            console.error('❌ Failed to reload moderation configuration:', error);
            throw error;
        }
    }
    /**
     * モデレーションサービスの健全性をチェックする
     */
    async checkModerationHealth() {
        return await this.moderationService.healthCheck();
    }
}
exports.DiscordBot = DiscordBot;
