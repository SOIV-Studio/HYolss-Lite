const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('지원서버의 초대 링크를 보여줍니다.'),
    
    // 접두사 명령어 설정
    prefixCommand: {
        name: 'support',
        aliases: ['지원'], // 한글 별칭 추가
        description: '지원서버의 초대 링크를 보여줍니다.'
    },
    
    // 슬래시 명령어 실행 함수
    async execute(interaction) {
        // 지원 서버 링크
        const supportServerLink = 'https://discord.gg/tVnhbaB9yY';
        
        // Embed 생성
        const supportEmbed = new EmbedBuilder()
            .setColor('#517200')
            .setTitle('HYolss 지원 서버')
            .setDescription('문제가 있거나 도움이 필요하신가요?\n아래 버튼을 클릭하여 지원 서버에 참여하세요!')
            .setTimestamp()
            .setFooter({ text: 'SOIV Studio', iconURL: interaction.client.user.displayAvatarURL() });
        
        // 버튼 생성
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('지원 서버 참여하기')
                    .setStyle(ButtonStyle.Link)
                    .setURL(supportServerLink)
            );
        
        await interaction.reply({ embeds: [supportEmbed], components: [row] });
    },
    
    // 접두사 명령어 실행 함수
    async executePrefix(message, args) {
        // 지원 서버 링크
        const supportServerLink = 'https://discord.gg/tVnhbaB9yY';
        
        // Embed 생성
        const supportEmbed = new EmbedBuilder()
            .setColor('#517200')
            .setTitle('HYolss 지원 서버')
            .setDescription('문제가 있거나 도움이 필요하신가요?\n아래 링크를 통해 지원 서버에 참여하세요!')
            .setTimestamp()
            .setFooter({ text: 'SOIV Studio', iconURL: message.client.user.displayAvatarURL() });
        
        // 버튼 생성
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('지원 서버 참여하기')
                    .setStyle(ButtonStyle.Link)
                    .setURL(supportServerLink)
            );
        
        await message.reply({ embeds: [supportEmbed], components: [row] });
    },
};