import { Client, PermissionsBitField } from 'discord.js';

export class PermissionChecker {
  static async checkBotPermissions(client: Client): Promise<void> {
    console.log('\n🔍 === ボット権限チェック開始 ===');
    
    if (!client.user) {
      console.log('❌ ボットユーザー情報を取得できません');
      return;
    }
    
    console.log(`🤖 ボット: ${client.user.tag} (ID: ${client.user.id})`);
    
    // 全ギルドでの権限チェック
    const guilds = client.guilds.cache;
    console.log(`🏰 サーバー数: ${guilds.size}`);
    
    for (const [guildId, guild] of guilds) {
      console.log(`\n📍 サーバー: ${guild.name} (ID: ${guildId})`);
      
      try {
        const botMember = await guild.members.fetchMe();
        
        // 必要な権限をチェック
        const requiredPermissions = [
          { flag: PermissionsBitField.Flags.ManageMessages, name: 'メッセージ管理' },
          { flag: PermissionsBitField.Flags.ModerateMembers, name: 'メンバー管理(タイムアウト)' }
        ];
        
        let hasAllPermissions = true;
        
        for (const permission of requiredPermissions) {
          const hasPermission = botMember.permissions.has(permission.flag);
          const status = hasPermission ? '✅' : '❌';
          console.log(`  ${status} ${permission.name}: ${hasPermission ? '有効' : '無効'}`);
          
          if (!hasPermission) {
            hasAllPermissions = false;
          }
        }
        
        console.log(`  📋 総合: ${hasAllPermissions ? '✅ 全権限OK' : '❌ 権限不足'}`);
        
      } catch (error) {
        console.log(`  ❌ 権限チェック失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('\n🔍 === ボット権限チェック完了 ===\n');
  }
  
  static async quickPermissionTest(client: Client): Promise<boolean> {
    if (!client.user) return false;
    
    const guilds = client.guilds.cache;
    let hasPermissions = false;
    
    for (const [, guild] of guilds) {
      try {
        const botMember = await guild.members.fetchMe();
        const hasManageMessages = botMember.permissions.has(PermissionsBitField.Flags.ManageMessages);
        const hasModerateMembers = botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers);
        
        if (hasManageMessages && hasModerateMembers) {
          hasPermissions = true;
          console.log(`✅ ${guild.name}: モデレーション権限確認完了`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    return hasPermissions;
  }
}