const { SlashCommandBuilder, EmbedBuilder, InteractionResponseFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 랜덤 단어 파일에서 단어들을 읽어오는 함수
function getRandomWord() {
    try {
        const wordsPath = path.join(__dirname, '..', '..', 'random-words-store', 'menu.txt');
        console.log('[INFO] Reading file from path:', wordsPath);
        
        const fileContent = fs.readFileSync(wordsPath, 'utf8');
        const words = fileContent.split('\n').map(word => word.trim()).filter(word => word !== '');
        
        if (words.length === 0) {
            throw new Error('[ERROR] No words found in the file');
        }
        
        return words[Math.floor(Math.random() * words.length)];
    } catch (error) {
        console.error('[ERROR] Error in getRandomWord:', error);
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('오늘의메뉴')
        .setDescription('오늘의 메뉴를 추천해줍니다.'),
    async execute(interaction) {
        try {
            // 사용자 ID를 가져와 멘션 형식으로 변환
            const userMention = `<@${interaction.user.id}>`;
            const randomWord = getRandomWord();
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🍽️ 오늘의 메뉴 추천')
                .setDescription(`${userMention} 님 ${randomWord} 어때?`)
                .setTimestamp()
                .setFooter({ text: 'HYolss' });

            return interaction.reply({
                embeds: [embed]
                // ephemeral: false 옵션 제거 (기본값이 false이므로 생략 가능)
            });
        } catch (error) {
            console.error('[ERROR] Error in 오늘의메뉴 command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ 오류 발생')
                .setDescription('메뉴를 추천하는 중에 오류가 발생했습니다.')
                .setTimestamp()
                .setFooter({ text: 'HYolss' });

            if (!interaction.replied) {
                return interaction.reply({
                    embeds: [errorEmbed],
                    flags: [InteractionResponseFlags.Ephemeral]
                });
            }
        }
    },
};
