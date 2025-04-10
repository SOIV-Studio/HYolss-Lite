const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('조작하기 힘든 명령어나 일부 설명이 필요한 명령어들을 알려줍니다.'),
    
    // 접두사 명령어 설정
    prefixCommand: {
        name: 'help',
        aliases: ['도움말', '도움', '명령어'], // 한글 별칭 추가
        description: '조작하기 힘든 명령어나 일부 설명이 필요한 명령어들을 알려줍니다.'
    },
    
    // 슬래시 명령어 실행 함수
    async execute(interaction) {
        // 기본 도움말 Embed
        const helpEmbed = new EmbedBuilder()
            .setColor('#517200')
            .setTitle('HYolss 도움말')
            .setDescription('아래 메뉴에서 카테고리를 선택하여 해당 명령어들의 설명을 확인하세요.')
            .addFields(
                { name: '기본 명령어', value: '`/info`, `/support`, `/dashboard`, `/help`, `/ping`' },
                { name: '도움이 더 필요하신가요?', value: '자세한 도움말은 `/support` 명령어를 통해 지원 서버에 참여하시거나, `/dashboard` 명령어로 대시보드를 방문해보세요.' }
            )
            .setTimestamp()
            .setFooter({ text: 'SOIV Studio', iconURL: interaction.client.user.displayAvatarURL() });
        
        // 카테고리 선택 메뉴
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_category')
                    .setPlaceholder('명령어 카테고리 선택')
                    .addOptions([
                        {
                            label: '기본 명령어',
                            description: '기본적인 봇 정보 및 도움말 명령어',
                            value: 'basic',
                        },
                        {
                            label: '유틸리티',
                            description: '유용한 유틸리티 기능 명령어',
                            value: 'utility',
                        },
                        {
                            label: '서버 관리',
                            description: '서버 관리 및 모더레이션 명령어',
                            value: 'moderation',
                        },
                        {
                            label: '알림 시스템',
                            description: '플랫폼 알림 관련 명령어',
                            value: 'notifications',
                        },
                        {
                            label: '기타 기능',
                            description: '그 외 다양한 기능들',
                            value: 'misc',
                        },
                    ]),
            );
        
        // 기본 도움말 메시지 전송
        const response = await interaction.reply({ 
            embeds: [helpEmbed], 
            components: [row],
            ephemeral: false // 모든 사람이 볼 수 있게 설정
        });
        
        // 선택 메뉴 상호작용 수집기 생성
        const collector = response.createMessageComponentCollector({ 
            time: 60000 // 1분 동안 상호작용 수집
        });
        
        // 선택 메뉴 상호작용 처리
        collector.on('collect', async (i) => {
            if (i.customId === 'help_category') {
                // 선택된 카테고리에 따라 다른 Embed 생성
                const categoryEmbed = new EmbedBuilder()
                    .setColor('#517200')
                    .setTimestamp()
                    .setFooter({ text: 'SOIV Studio', iconURL: interaction.client.user.displayAvatarURL() });
                
                switch (i.values[0]) {
                    case 'basic':
                        categoryEmbed
                            .setTitle('기본 명령어 도움말')
                            .setDescription('HYolss의 기본적인 명령어들입니다.')
                            .addFields(
                                { name: '/info', value: '봇의 버전, 개발자, 업타임 등 기본 정보를 보여줍니다.' },
                                { name: '/support', value: '지원 서버 초대 링크를 제공합니다.' },
                                { name: '/dashboard', value: '봇 대시보드 링크를 제공합니다.' },
                                { name: '/help', value: '이 도움말을 보여줍니다.' },
                                { name: '/ping', value: '봇의 응답 시간을 확인합니다.' }
                            );
                        break;
                    
                    // 다른 카테고리들은 나중에 구현할 예정
                    default:
                        categoryEmbed
                            .setTitle('준비 중인 기능')
                            .setDescription('이 카테고리의 도움말은 아직 준비 중입니다. 나중에 다시 확인해주세요!');
                        break;
                }
                
                await i.update({ embeds: [categoryEmbed], components: [row] });
            }
        });
        
        // 시간 초과 처리
        collector.on('end', async (collected) => {
            if (collected.size === 0) {
                // 아무 상호작용이 없었을 경우 컴포넌트 비활성화
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        StringSelectMenuBuilder.from(row.components[0])
                            .setDisabled(true)
                            .setPlaceholder('시간 초과 - 다시 /help를 사용하세요')
                    );
                
                await interaction.editReply({ components: [disabledRow] });
            }
        });
    },
    
    // 접두사 명령어 실행 함수
    async executePrefix(message, args) {
        // 기본 도움말 Embed
        const helpEmbed = new EmbedBuilder()
            .setColor('#517200')
            .setTitle('HYolss 도움말')
            .setDescription('아래는 사용 가능한 명령어 카테고리입니다. 자세한 도움말은 슬래시 명령어 `/help`를 사용해주세요.')
            .addFields(
                { name: '기본 명령어', value: '`!정보`, `!지원`, `!대시보드`, `!도움말`, `!핑`' },
                { name: '유틸리티', value: '오늘의 메뉴, 오늘의 편의점 등의 유틸리티 기능' },
                { name: '서버 관리', value: '서버 관리 및 모더레이션 관련 기능' },
                { name: '알림 시스템', value: '플랫폼 알림 관련 기능' },
                { name: '기타 기능', value: '그 외 다양한 기능들' },
                { name: '도움이 더 필요하신가요?', value: '자세한 도움말은 `/help` 슬래시 명령어를 사용하거나, `!지원` 명령어를 통해 지원 서버에 참여하세요.' }
            )
            .setTimestamp()
            .setFooter({ text: 'SOIV Studio', iconURL: message.client.user.displayAvatarURL() });
        
        await message.reply({ embeds: [helpEmbed] });
    },
};