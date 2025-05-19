const { SlashCommandBuilder, EmbedBuilder, InteractionResponseFlags } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Supabase에서 랜덤 메뉴를 가져오는 함수
async function getRandomMenu() {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .select('name')
            .eq('type', 'menu');
            
        if (error) {
            console.error('[ERROR] Supabase 조회 중 오류:', error);
            throw error;
        }
        
        if (!data || data.length === 0) {
            throw new Error('[ERROR] No menu items found in the database');
        }
        
        // 랜덤으로 메뉴 선택
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex].name;
    } catch (error) {
        console.error('[ERROR] Error in getRandomMenu:', error);
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
            const randomMenu = await getRandomMenu();
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🍽️ 오늘의 메뉴 추천')
                .setDescription(`${userMention} 님 ${randomMenu} 어때?`)
                .setTimestamp()
                .setFooter({ text: 'HYolss' });

            return interaction.reply({
                embeds: [embed]
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