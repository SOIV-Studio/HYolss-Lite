const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { runUpdateProcess, getCurrentVersion, getLatestVersion, getLatestCommitInfo, isNewerVersion } = require('../../events/auto-updater');

// 개발자 ID 목록 가져오기
const developerIds = process.env.BOT_DEVELOPER_IDS ? process.env.BOT_DEVELOPER_IDS.split(',') : [];

// 개발자 권한 확인 함수
function isDeveloper(userId) {
    return developerIds.includes(userId);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('봇을 최신 버전으로 업데이트합니다 (관리자 전용)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option => 
            option.setName('force')
                .setDescription('최신 버전이 아니더라도 강제로 업데이트를 실행합니다')
                .setRequired(false)),
    
    // 접두사 명령어 설정
    prefixCommand: {
        name: 'update',
        aliases: ['업데이트'], // 한글 별칭 추가
        description: '봇을 최신 버전으로 업데이트합니다 (관리자 전용)'
    },
    
    // 슬래시 명령어 실행 함수
    async execute(interaction) {
        // 관리자 권한 및 개발자 ID 확인
        const isAdmin = interaction.memberPermissions.has(PermissionFlagsBits.Administrator);
        const isDevUser = isDeveloper(interaction.user.id);
        
        if (!isAdmin) {
            return interaction.reply({
                content: '⚠️ 이 명령어는 관리자 권한이 필요합니다.',
                ephemeral: true
            });
        }
        
        if (!isDevUser) {
            return interaction.reply({
                content: '⚠️ 이 명령어는 봇 개발자만 사용할 수 있습니다.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // 현재 버전과 최신 버전 확인
            const currentVersion = getCurrentVersion();
            const latestVersion = await getLatestVersion();
            const force = interaction.options.getBoolean('force') || false;
            
            // 최신 커밋 정보 가져오기
            let commitInfo = null;
            try {
                commitInfo = await getLatestCommitInfo();
            } catch (error) {
                console.error('[ERROR] 최신 커밋 정보 가져오기 실패:', error);
                // 오류가 발생해도 명령어 실행은 계속 진행
                commitInfo = {
                    message: '커밋 정보를 가져올 수 없습니다',
                    author: '알 수 없음',
                    date: new Date().toLocaleString('ko-KR'),
                    url: 'https://github.com/SOIV-Studio/HYolss-Lite',
                    hash: '알 수 없음'
                };
            }
            
            // 버전 비교
            if (!isNewerVersion(currentVersion, latestVersion) && !force) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ 이미 최신 버전을 사용 중입니다')
                    .setDescription('업데이트가 필요하지 않습니다.\n강제 업데이트를 원하시면 `/update force:true` 명령어를 사용하세요.')
                    .addFields(
                        { name: '현재 버전', value: currentVersion || '알 수 없음', inline: true },
                        { name: 'GitHub 버전', value: latestVersion || '알 수 없음', inline: true }
                    )
                    .setTimestamp();
                
                if (commitInfo) {
                    embed.addFields(
                        { name: '최신 커밋 메시지', value: commitInfo.message || '알 수 없음' },
                        { name: '커밋 해시', value: commitInfo.hash || '알 수 없음', inline: true },
                        { name: '커밋 작성자', value: commitInfo.author || '알 수 없음', inline: true },
                        { name: '커밋 날짜', value: commitInfo.date || '알 수 없음', inline: true }
                    )
                    .setURL(commitInfo.url || 'https://github.com/SOIV-Studio/HYolss-Lite');
                }
                
                return interaction.editReply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🔄 업데이트를 시작합니다')
                .setDescription('잠시 후 봇이 재시작됩니다.')
                .addFields(
                    { name: '현재 버전', value: currentVersion || '알 수 없음', inline: true },
                    { name: 'GitHub 버전', value: latestVersion || '확인 중...', inline: true }
                )
                .setTimestamp();
            
            if (commitInfo) {
                embed.addFields(
                    { name: '최신 커밋 메시지', value: commitInfo.message || '알 수 없음' },
                    { name: '커밋 해시', value: commitInfo.hash || '알 수 없음', inline: true },
                    { name: '커밋 작성자', value: commitInfo.author || '알 수 없음', inline: true },
                    { name: '커밋 날짜', value: commitInfo.date || '알 수 없음', inline: true }
                )
                .setURL(commitInfo.url || 'https://github.com/SOIV-Studio/HYolss-Lite');
            }
            
            await interaction.editReply({ embeds: [embed] });

            // 잠깐 대기 후 재시작 (응답 유실 방지)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 업데이트 프로세스 실행
            runUpdateProcess(force);
            
        } catch (error) {
            console.error('[ERROR] 업데이트 명령어 실행 중 오류:', error);
            await interaction.editReply(`⚠️ 업데이트 확인 중 오류가 발생했습니다: ${error.message}`);
        }
    },
    
    // 접두사 명령어 실행 함수
    async executePrefix(message, args) {
        // 관리자 권한 및 개발자 ID 확인
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
        const isDevUser = isDeveloper(message.author.id);
        
        if (!isAdmin) {
            return message.reply('⚠️ 이 명령어는 관리자 권한이 필요합니다.');
        }
        
        if (!isDevUser) {
            return message.reply('⚠️ 이 명령어는 봇 개발자만 사용할 수 있습니다.');
        }

        const reply = await message.reply('🔄 업데이트 확인 중...');

        try {
            // 현재 버전과 최신 버전 확인
            const currentVersion = getCurrentVersion();
            const latestVersion = await getLatestVersion();
            const force = args.includes('force');
            
            // 최신 커밋 정보 가져오기
            let commitInfo = null;
            try {
                commitInfo = await getLatestCommitInfo();
            } catch (error) {
                console.error('[ERROR] 최신 커밋 정보 가져오기 실패:', error);
                // 오류가 발생해도 명령어 실행은 계속 진행
                commitInfo = {
                    message: '커밋 정보를 가져올 수 없습니다',
                    author: '알 수 없음',
                    date: new Date().toLocaleString('ko-KR'),
                    url: 'https://github.com/SOIV-Studio/HYolss-Lite',
                    hash: '알 수 없음'
                };
            }
            
            // 버전 비교
            if (!isNewerVersion(currentVersion, latestVersion) && !force) {
                let replyContent = `✅ 이미 최신 버전을 사용 중입니다. 업데이트가 필요하지 않습니다.\n`;
                replyContent += `현재 버전: ${currentVersion}\nGitHub 버전: ${latestVersion}\n`;
                
                if (commitInfo) {
                    replyContent += `\n최신 커밋 정보:\n`;
                    replyContent += `메시지: ${commitInfo.message}\n`;
                    replyContent += `커밋 해시: ${commitInfo.hash}\n`;
                    replyContent += `작성자: ${commitInfo.author}\n`;
                    replyContent += `날짜: ${commitInfo.date}\n`;
                    replyContent += `URL: ${commitInfo.url}\n`;
                }
                
                replyContent += `\n강제 업데이트를 원하시면 \`!update force\` 명령어를 사용하세요.`;
                
                return reply.edit(replyContent);
            }
            
            let replyContent = `🔄 업데이트를 시작합니다.\n`;
            replyContent += `현재 버전: ${currentVersion}\nGitHub 버전: ${latestVersion || '확인 중...'}\n`;
            
            if (commitInfo) {
                replyContent += `\n최신 커밋 정보:\n`;
                replyContent += `메시지: ${commitInfo.message}\n`;
                replyContent += `커밋 해시: ${commitInfo.hash}\n`;
                replyContent += `작성자: ${commitInfo.author}\n`;
                replyContent += `날짜: ${commitInfo.date}\n`;
                replyContent += `URL: ${commitInfo.url}\n`;
            }
            
            replyContent += `\n잠시 후 봇이 재시작됩니다.`;
            
            await reply.edit(replyContent);

            // 잠깐 대기 후 재시작 (응답 유실 방지)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 업데이트 프로세스 실행
            runUpdateProcess(force);
            
        } catch (error) {
            console.error('[ERROR] 업데이트 명령어 실행 중 오류:', error);
            await reply.edit(`⚠️ 업데이트 확인 중 오류가 발생했습니다: ${error.message}`);
        }
    }
};