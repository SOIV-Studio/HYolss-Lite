const { Events, ActivityType } = require('discord.js');
const { supabase } = require('../database/sql/supabase.js');
const mongodb = require('../database/nosql/mongodb.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Supabase와 MongoDB 클라이언트를 client 객체에 추가
        client.supabase = supabase;
        client.mongodb = mongodb;
        
        // 서버 수 로깅
        const serverCount = client.guilds.cache.size;
        console.log(`[INFO] 봇이 ${serverCount}개의 서버에서 활동 중입니다.`);
        
        // MongoDB에 봇 시작 로그 기록
        try {
            await mongodb.logCommand({
                userId: client.user.id,
                username: client.user.username,
                guildId: 'global',
                guildName: 'Global',
                channelId: 'system',
                channelName: 'System',
                commandName: 'bot_start',
                commandOptions: {
                    version: process.env.npm_package_version || '1.0.0',
                    environment: process.env.NODE_ENV || 'production',
                    serverCount: serverCount
                },
                isSuccess: true,
                executionTime: 0
            });
        } catch (error) {
            console.error('[ERROR] 봇 시작 로그 기록 오류:', error);
        }
        
        // 상태 메시지 배열
        // Playing : 게임 중
        // Streaming : 방송 중
        // Listening : 듣기 중
        // Watching : 시청 중
        // Custom : 사용자 정의
        // Competing : 경쟁 중
        const activities = [
            { name: '동행자님! 무엇을 도와드릴까요?', type: ActivityType.Custom },
            { name: '열심히 성장 중! 같이 성장할 개발자를 찼아요!', type: ActivityType.Custom },
            { name: '저는 SOIV Studio에 소속된 Discord BOT이에요!', type: ActivityType.Custom },
            { name: `${serverCount}개의 서버에서 활동 중!`, type: ActivityType.Custom },
            { name: '지금은 GCP에서 테스트와 임시 운영을 하고 있어요!', type: ActivityType.Custom },
            { name: '(/☆ワ☆)/~~☆’.･.･:★’.･.･:☆ MIKU MIKU BEAAAAAAAAAAAAAM!☆', type: ActivityType.Custom },
            { name: '88☆彡 듣는 중', type: ActivityType.Custom }
        ];
        
        /* 이전 상테 메시지
            { name: '지옥에서 살아 돌아왔다!', type: ActivityType.Custom },
            { name: '저는 열심히 성장하고 여러가지를 해보고 싶어요!', type: ActivityType.Custom },
            { name: '저의 성정과 함께 키워나갈 개발자는 없나요?', type: ActivityType.Custom },
            { name: '서버 이전 및 호스팅 업체 탐색 중!', type: ActivityType.Custom },
        */

        /* 상태 메시지 : 안내 및 점검, 평상시에는 사용을 하지 않음
        const activities = [
            { name: '<안내> 봇 점검중입니다. 잠시만 기달려 주세요.', type: ActivityType.Custom },
            { name: '<안내> DEV버전의 봇입니다. 재부팅 또는 정상 작동이 안될 수 있습니다.', type: ActivityType.Custom }
        ];
        */
        
        // 10초마다 랜덤으로 상태 메시지 변경
        setInterval(() => {
            // 0부터 activities.length - 1 사이의 랜덤 인덱스 생성
            const randomIndex = Math.floor(Math.random() * activities.length);
            const activity = activities[randomIndex];
            client.user.setActivity(activity.name, { type: activity.type });
        }, 10000); // 10초 = 10000ms
    },
};