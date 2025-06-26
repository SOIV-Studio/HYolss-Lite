const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// 배열을 섞는 함수 (Fisher-Yates shuffle)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 랜덤 팀 나누기 함수
function createRandomTeams(members, teamCount) {
    if (members.length === 0) return [];
    if (teamCount <= 0) teamCount = 2;
    
    const shuffledMembers = shuffleArray(members);
    const teams = Array.from({ length: teamCount }, () => []);
    
    shuffledMembers.forEach((member, index) => {
        teams[index % teamCount].push(member);
    });
    
    return teams;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('랜덤팀')
        .setDescription('멤버들을 랜덤으로 팀을 나눕니다')
        .addIntegerOption(option =>
            option.setName('팀수')
                .setDescription('나눌 팀의 수 (기본값: 2)')
                .setMinValue(2)
                .setMaxValue(10)
        )
        .addStringOption(option =>
            option.setName('멤버')
                .setDescription('쉼표로 구분된 멤버 이름들 (비어있으면 음성채널 멤버 사용)')
        ),
    
    async execute(interaction) {
        const teamCount = interaction.options.getInteger('팀수') || 2;
        const memberInput = interaction.options.getString('멤버');
        
        let members = [];
        
        // 멤버 입력이 있으면 직접 입력된 멤버 사용
        if (memberInput) {
            members = memberInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } 
        // 멤버 입력이 없으면 음성 채널의 멤버들 사용
        else {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            const voiceChannel = member?.voice?.channel;
            
            if (!voiceChannel) {
                await interaction.reply('❌ 음성 채널에 참여하거나 멤버를 직접 입력해주세요!\n예: `멤버: 철수, 영희, 민수, 지영`');
                return;
            }
            
            members = voiceChannel.members.map(m => m.displayName);
        }

        if (members.length < teamCount) {
            await interaction.reply(`❌ 멤버 수(${members.length}명)가 팀 수(${teamCount}팀)보다 적습니다!`);
            return;
        }

        const teams = createRandomTeams(members, teamCount);

        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('⚽ 랜덤 팀 배정 결과')
            .setDescription(`총 ${members.length}명을 ${teamCount}팀으로 나누었습니다!`)
            .setTimestamp();

        teams.forEach((team, index) => {
            embed.addFields({
                name: `팀 ${index + 1} (${team.length}명)`,
                value: team.join(', ') || '없음',
                inline: true
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};