const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteMenuFromSupabase(menuName, menuType) {
    try {
        // 메뉴 존재 여부 확인
        const { data: existingMenu, error: checkError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('name', menuName)
            .eq('type', menuType);
            
        if (checkError) {
            console.error('[ERROR] 메뉴 조회 중 오류:', checkError);
            return { success: false, message: '데이터베이스 조회 중 오류가 발생했습니다.' };
        }
        
        if (!existingMenu || existingMenu.length === 0) {
            return { success: false, message: '해당 메뉴가 존재하지 않습니다.' };
        }
        
        // 메뉴 삭제
        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('name', menuName)
            .eq('type', menuType);
            
        if (error) {
            console.error('[ERROR] 메뉴 삭제 중 오류:', error);
            return { success: false, message: '데이터베이스에서 메뉴 삭제 중 오류가 발생했습니다.' };
        }
        
        return { success: true, message: '메뉴가 성공적으로 삭제되었습니다.' };
    } catch (error) {
        console.error('[ERROR] Error in deleteMenuFromSupabase:', error);
        return { success: false, message: '메뉴 삭제 중 오류가 발생했습니다.' };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('메뉴삭제')
        .setDescription('[개발자 전용 명령어] 기존 메뉴를 삭제합니다.')
        .addStringOption(option =>
            option.setName('메뉴이름')
                .setDescription('삭제할 메뉴의 이름을 입력하세요.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('메뉴종류')
                .setDescription('메뉴의 종류를 선택하세요.')
                .setRequired(true)
                .addChoices(
                    { name: '일반메뉴', value: 'menu' },
                    { name: '편의점메뉴', value: 'convenience' }
                )),

    async execute(interaction) {
        // 권한 체크
        const allowedUserId = '336746851971891203';
        if (interaction.user.id !== allowedUserId) {
            const noPermissionEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ 권한 없음')
                .setDescription('이 명령어를 사용할 권한이 없습니다.')
                .setTimestamp()
                .setFooter({ text: 'HYolss' });

            return interaction.reply({
                embeds: [noPermissionEmbed],
                ephemeral: true
            });
        }

        const menuName = interaction.options.getString('메뉴이름');
        const menuType = interaction.options.getString('메뉴종류');
        
        // Supabase에서 메뉴 삭제
        const result = await deleteMenuFromSupabase(menuName, menuType);
        
        const embed = new EmbedBuilder()
            .setColor(result.success ? '#00FF00' : '#FF0000')
            .setTitle('🗑️ 메뉴 삭제 결과')
            .addFields(
                { name: '메뉴', value: menuName, inline: true },
                { name: '종류', value: menuType === 'menu' ? '일반메뉴' : '편의점메뉴', inline: true },
                { name: '결과', value: result.message }
            )
            .setTimestamp()
            .setFooter({ text: 'HYolss' });

        return interaction.reply({
            embeds: [embed],
            ephemeral: false
        });
    },
};