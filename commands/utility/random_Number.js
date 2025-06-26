const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('랜덤숫자')
        .setDescription('지정된 범위에서 랜덤 숫자를 생성합니다')
        .addIntegerOption(option =>
            option.setName('최솟값')
                .setDescription('최솟값 (기본값: 1)')
        )
        .addIntegerOption(option =>
            option.setName('최댓값')
                .setDescription('최댓값 (기본값: 100)')
        ),
    
    async execute(interaction) {
        const min = interaction.options.getInteger('최솟값') || 1;
        const max = interaction.options.getInteger('최댓값') || 100;
        
        if (min >= max) {
            await interaction.reply('❌ 최솟값은 최댓값보다 작아야 합니다!');
            return;
        }

        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const embed = new EmbedBuilder()
            .setColor('#4a90e2')
            .setTitle('🎲 랜덤 숫자')
            .setDescription(`**결과:** ${randomNumber}`)
            .addFields({ name: '범위', value: `${min} ~ ${max}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};