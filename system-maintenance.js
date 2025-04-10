require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

// 환경 변수에 따라 토큰 선택
const token = process.env.NODE_ENV === 'development' 
    ? process.env.DEV_DISCORD_TOKEN 
    : process.env.DISCORD_TOKEN;

const client = new Client({
    intents: [GatewayIntentBits.Guilds]  // 메인 봇과 동일한 인텐트 설정
});

client.once('ready', () => {
    console.log(`[INFO] Using ${process.env.NODE_ENV} environment`);
    console.log('[INFO] 서버 점검 모드가 활성화되었습니다.');
    
    // 봇 상태를 "점검 중"으로 설정
    // DEV전용 메시지 : <안내> DEV버전의 봇입니다. 재부팅 또는 정상 작동이 안될 수 있습니다.
    client.user.setPresence({
        activities: [
            { name: '<안내> 봇 점검 모드 활성화! 잠시만 기달려 주세요.', type: ActivityType.Custom }
        ],
        status: 'dnd'
    });
});

// 모든 명령어 상호작용에 대해 점검 중 메시지 응답
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    await interaction.reply({
        content: '🔧 현재 서비스 점검 중입니다.\n잠시 후 다시 이용해 주시기 바랍니다.',
        ephemeral: true
    });
});

// 에러 핸들링
client.on('error', error => {
    console.error('[ERROR] 봇 에러 발생:', error);
});

// 봇 시작
async function startBot() {
    try {
        await client.login(token);
        console.log(`Ready! Logged in as ${client.user.tag}`);
    } catch (error) {
        console.error('[ERROR] 점검 모드로 로그인 실패:', error);
    }
}

startBot();