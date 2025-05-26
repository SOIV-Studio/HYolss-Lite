const { Events } = require('discord.js');
const { updateServerHistory } = require('../database/sql-supabase.js');
const { logCommand } = require('../database/nosql-mongodb.js');

// 서버 퇴장 로그 기록 함수
async function logGuildLeave(guild) {
  try {
    await logCommand({
      userId: guild.client.user.id,
      username: guild.client.user.username,
      guildId: guild.id,
      guildName: guild.name,
      channelId: 'unknown',
      channelName: 'unknown',
      commandName: 'guild_leave',
      commandOptions: {
        memberCount: guild.memberCount,
        guildOwnerId: guild.ownerId
      },
      isSuccess: true,
      executionTime: 0
    });
    return true;
  } catch (err) {
    console.error('[ERROR] 서버 퇴장 로그 기록 오류:', err);
    return false;
  }
}

module.exports = {
  name: Events.GuildDelete,
  async execute(guild) {
    try {
      console.log(`[WAN-DB] 봇이 서버에서 제거되었습니다: ${guild.name} (ID: ${guild.id})`);
      
      // 데이터베이스 연결 상태 확인
      const supabaseConnected = guild.client.databaseStatus && guild.client.databaseStatus.supabase;
      
      // Supabase가 연결된 경우에만 서버 퇴장 기록 업데이트
      if (supabaseConnected) {
        // 서버 퇴장 기록 업데이트 (Supabase)
        const isJoining = false;
        await updateServerHistory(guild.id, isJoining);
        console.log(`[WAN-DB] 서버 ${guild.name} (ID: ${guild.id})에서 퇴장 기록이 Supabase에 업데이트되었습니다.`);
      }
      
      // MongoDB에 서버 퇴장 로그 기록 (항상 실행)
      await logGuildLeave(guild);
      console.log(`[WAN-DB] 서버 ${guild.name} (ID: ${guild.id})에서 퇴장 로그가 MongoDB에 기록되었습니다.`);
      
      // 여기서는 메시지를 보낼 수 없음 (이미 서버에서 퇴장했기 때문)
      
    } catch (error) {
      console.error('[ERROR] 서버 퇴장 처리 오류:', error);
    }
  }
};