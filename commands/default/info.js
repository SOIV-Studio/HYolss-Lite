const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('봇 정보를 보여줍니다.'),
    
    // 접두사 명령어 설정
    prefixCommand: {
        name: 'info',
        aliases: ['정보'], // 한글 별칭 추가
        description: '봇 정보를 보여줍니다.'
    },
    
    // 슬래시 명령어 실행 함수
    async execute(interaction) {
        // 봇 버전 정보
        const botVersion = '4.0.0'; // 현재 봇 버전
        const nodeVersion = process.version; // Node.js 버전
        const discordJsVersion = require('discord.js').version; // Discord.js 버전
        
        // 개발자 정보
        const developer = 'SOIV Studio';
        
        // 업타임 계산
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime % 86400 / 3600);
        const minutes = Math.floor(uptime % 3600 / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
        
        // Embed 생성
        const infoEmbed = new EmbedBuilder()
            .setColor('#517200') // 봇의 테마 색상
            .setTitle('HYolss 봇 정보')
            .setDescription('하나의 작은 별과 꿈을 가지고 나아가는 동행자 HYolss입니다!')
            .addFields(
                { name: '버전 정보', value:
                  `• 봇 버전: ${botVersion}\n• Node.js 버전: ${nodeVersion}\n• Discord.js 버전: ${discordJsVersion}`, inline: true },
                { name: '개발자', value: developer, inline: true },
                { name: '업타임', value: uptimeString }
            )
            .setTimestamp()
            .setFooter({ text: 'SOIV Studio', iconURL: interaction.client.user.displayAvatarURL() });
        
        await interaction.reply({ embeds: [infoEmbed] });
    },
    
    // 접두사 명령어 실행 함수
    async executePrefix(message, args) {
        // 봇 버전 정보
        const botVersion = '4.0.0'; // 현재 봇 버전
        const nodeVersion = process.version; // Node.js 버전
        const discordJsVersion = require('discord.js').version; // Discord.js 버전
        
        // 개발자 정보
        const developer = 'SOIV Studio';
        
        // 업타임 계산
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime % 86400 / 3600);
        const minutes = Math.floor(uptime % 3600 / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}일 ${hours}시간 ${minutes}분 ${seconds}초`;
        
        // Embed 생성
        const infoEmbed = new EmbedBuilder()
            .setColor('#517200') // 봇의 테마 색상
            .setTitle('HYolss 봇 정보')
            .setDescription('하나의 작은 별과 꿈을 가지고 나아가는 동행자 HYolss입니다!')
            .addFields(
                { name: '버전 정보', value:
                  `• 봇 버전: ${botVersion}\n• Node.js 버전: ${nodeVersion}\n• Discord.js 버전: ${discordJsVersion}`, inline: true },
                { name: '개발자', value: developer, inline: true },
                { name: '업타임', value: uptimeString }
            )
            .setTimestamp()
            .setFooter({ text: 'SOIV Studio', iconURL: message.client.user.displayAvatarURL() });
        
        await message.reply({ embeds: [infoEmbed] });
    },
};