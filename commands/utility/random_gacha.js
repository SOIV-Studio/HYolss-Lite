const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('랜덤선택')
        .setDescription('여러 선택지 중에서 랜덤으로 하나를 선택합니다')
        .addStringOption(option =>
            option.setName('선택지')
                .setDescription('쉼표로 구분된 선택지들 (예: 사과, 바나나, 오렌지)')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const choices = interaction.options.getString('선택지').split(',').map(s => s.trim());
        
        if (choices.length < 2) {
            await interaction.reply('❌ 최소 2개의 선택지를 쉼표로 구분해서 입력해주세요!\n예: `사과, 바나나, 오렌지`');
            return;
        }

        const randomChoice = choices[Math.floor(Math.random() * choices.length)];
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎲 랜덤 선택 결과')
            .setDescription(`**선택된 항목:** ${randomChoice}`)
            .addFields({ name: '선택지 목록', value: choices.join(', ') })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};