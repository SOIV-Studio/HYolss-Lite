const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('서버와의 핑 테스트를 보여줍니다.'),
    
    // 접두사 명령어 설정
    prefixCommand: {
        name: 'ping',
        aliases: ['핑'], // 한글 별칭 추가
        description: '서버와의 핑 테스트를 보여줍니다.'
    },
    
    // 슬래시 명령어 실행 함수
    async execute(interaction) {
        const ping = interaction.client.ws.ping;
        await interaction.reply(`Pong!🏓 (${ping}ms)`);
    },
    
    // 접두사 명령어 실행 함수
    async executePrefix(message, args) {
        const ping = message.client.ws.ping;
        await message.reply(`Pong!🏓 (${ping}ms)`);
    }
};