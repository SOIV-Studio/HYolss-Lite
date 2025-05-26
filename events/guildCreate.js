const { Events, EmbedBuilder } = require('discord.js');
const { updateServerHistory, addInviterInfo, initializeTables } = require('../database/sql-supabase.js');
const { logCommand } = require('../database/nosql-mongodb.js');

// 서버 입장 로그 기록 함수
async function logGuildJoin(guild, inviterId) {
  try {
    await logCommand({
      userId: guild.client.user.id,
      username: guild.client.user.username,
      guildId: guild.id,
      guildName: guild.name,
      channelId: guild.systemChannelId || 'unknown',
      channelName: guild.systemChannel ? guild.systemChannel.name : 'unknown',
      commandName: 'guild_join',
      commandOptions: {
        memberCount: guild.memberCount,
        inviterId: inviterId,
        guildOwnerId: guild.ownerId
      },
      isSuccess: true,
      executionTime: 0
    });
    return true;
  } catch (err) {
    console.error('[ERROR] 서버 입장 로그 기록 오류:', err);
    return false;
  }
}

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    try {
      console.log(`[WAN-DB] 봇이 새로운 서버에 추가되었습니다: ${guild.name} (ID: ${guild.id})`);
      
      // 데이터베이스 연결 상태 확인
      const supabaseConnected = guild.client.databaseStatus && guild.client.databaseStatus.supabase;
      
      // Supabase가 연결된 경우에만 서버 입장 기록 업데이트
      if (supabaseConnected) {
        // 서버 입장 기록 업데이트 (Supabase)
        const isJoining = true;
        await updateServerHistory(guild.id, isJoining);
        
        // 초대자 정보 (가능한 경우)
        // Discord API의 제한으로 인해 초대자 정보를 정확히 가져오기 어려울 수 있음
        // 여기서는 서버 소유자를 초대자로 가정
        const inviterId = guild.ownerId;
        await addInviterInfo(inviterId, guild.id);
      }
      
      // MongoDB에 서버 입장 로그 기록 (항상 실행)
      const inviterId = guild.ownerId;
      await logGuildJoin(guild, inviterId);
      
      // 기본 채널 찾기 (공지 채널 또는 일반 채팅 채널)
      let targetChannel = guild.systemChannel; // 시스템 메시지 채널
      
      if (!targetChannel) {
        // 시스템 채널이 없으면 일반 텍스트 채널 중 첫 번째 채널 사용
        targetChannel = guild.channels.cache
          .filter(channel => channel.type === 0) // 0은 텍스트 채널
          .sort((a, b) => a.position - b.position)
          .first();
      }
      
      if (!targetChannel) {
        console.log(`[WAN-DB] 서버 ${guild.name}에 메시지를 보낼 채널을 찾을 수 없습니다.`);
        return;
      }
      
      // 서버 기록 정보 (Supabase 연결 여부에 따라 다르게 처리)
      let isNewServer = true;
      let joinCount = 1;
      
      if (supabaseConnected) {
        try {
          // Supabase에서 서버 기록 조회
          const { data: serverHistory, error } = await guild.client.supabase
            .from('bot_server_history')
            .select('*')
            .eq('guild_id', guild.id)
            .single();
          
          if (!error && serverHistory) {
            isNewServer = serverHistory.join_count === 1;
            joinCount = serverHistory.join_count;
          }
        } catch (error) {
          console.error('[ERROR] 서버 기록 조회 오류:', error);
        }
      }
      
      // 환영 메시지 생성
      let introMessage, aboutMessage, helpMessage, serverMessage, tipMessage, warningMessage;
      
      // 공통 메시지 부분
      introMessage = `저를 대리고 와주신 유저님! ${isNewServer ? '처음' : '다시'} 뵙겠습니다!\n나는 하나의 작은 별과 꿈을 가지고 나아가는 동행자 HYolss 이라고해!\n이 서버에 대려와준 <@${inviterId}>님, 대리고 와줘서 고마워!`;
      
      helpMessage = `명령어를 사용하는데 모르는 점이 있어?\n'/help'를 사용하여 각각의 명령어에 대한 설명과 사용법을 확인해 볼 수 있어!`;
      
      tipMessage = `[TIP] 기초 작업 시작 명령어인 '/setup'를 사용하여 서버에서 봇을 사용하기 위한 작업을 간편하게 진행을 할 수 있습니다!`;
      
      warningMessage = `[!] 운영중인 HYolss은 테스트 버전 및 경험을 위해 제작 및 활동중인 봇이므로 봇이 종료되거나 버그 및 오류가 발생 할 수 있습니다.`;
      
      if (isNewServer) {
        // 신규 서버인 경우
        aboutMessage = `일단 내가 작동하는 방식에 대해 짧개 알려줄깨!\n기본은 슬레시(/)를 사용하고 다른 방식으로는\n접두사 방식인 ! or = 으로 호출 및 명령어, 기능 사용이 가능하고\n명령어를 사용하면 버튼과 메뉴 선택이라는 기능을 주로 작동되니 이점 알아줘!`;
        
        serverMessage = `여기는 처음 왔는데 어떤 서버일까? 궁굼하다! 알려줄 동행자는 없나?`;
      } else if (joinCount > 1) {
        // 기존 서버에 재입장한 경우
        aboutMessage = `날 대리고온 동행자 <@${inviterId}>님! 그리고 날 알고 있는 동행자가 보이네!\n그렇다면! 나에 대해 잘 알고 있는 동행자가 있으니 설명을 생략할깨!`;
        
        serverMessage = `글고보니 어라 여기는 와본적이 있는 것 같아!\n이 서버의 데이터가 복구 가능해! 동행자님 복구 시스템을 시작할까!?`;
      }
      
      // 임베드 메시지 생성
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('HYolss가 유저에게 인사합니다! 👋')
        .addFields(
          { name: '👋 인사', value: introMessage, inline: false },
          { name: '💫 소개', value: aboutMessage, inline: false },
          { name: '❓ 도움말', value: helpMessage, inline: false },
          { name: '🏠 서버', value: serverMessage, inline: false },
          { name: '💡 팁', value: tipMessage, inline: false },
          { name: '⚠️ 주의사항', value: warningMessage, inline: false }
        )
        .setTimestamp();
      
      // 메시지 전송
      await targetChannel.send({ embeds: [welcomeEmbed] });
      
    } catch (error) {
      console.error('[ERROR] 서버 입장 처리 오류:', error);
    }
  },
  
  // 테이블 초기화 함수 내보내기
  initializeBotServerTables: initializeTables
};