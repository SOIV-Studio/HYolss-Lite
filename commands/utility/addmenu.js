const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function appendToFile(filePath, newMenu) {
    try {
        // 파일 내용 읽기
        const content = fs.readFileSync(filePath, 'utf8');
        const menus = content.split('\n').map(menu => menu.trim()).filter(menu => menu !== '');
        
        // 중복 체크
        if (menus.includes(newMenu)) {
            return { success: false, message: '이미 존재하는 메뉴입니다.' };
        }

        // 새 메뉴 추가
        fs.appendFileSync(filePath, `\n${newMenu}`);
        return { success: true, message: '메뉴가 성공적으로 추가되었습니다.' };
    } catch (error) {
        console.error('[ERROR] Error in appendToFile:', error);
        return { success: false, message: '메뉴 추가 중 오류가 발생했습니다.' };
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('메뉴추가')
        .setDescription('[개발자 전용 명령어] 새로운 메뉴를 추가합니다.')
        .addStringOption(option =>
            option.setName('메뉴이름')
                .setDescription('추가할 메뉴의 이름을 입력하세요.')
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
        
        // 파일 경로 설정
        const fileName = menuType === 'menu' ? 'menu.txt' : 'convenience.txt';
        const filePath = path.join(__dirname, '..', '..', 'random-words-store', fileName);
        
        // 메뉴 추가
        const result = await appendToFile(filePath, menuName);
        
        const embed = new EmbedBuilder()
            .setColor(result.success ? '#00FF00' : '#FF0000')
            .setTitle('📝 메뉴 추가 결과')
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