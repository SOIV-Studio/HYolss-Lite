const { Events, MessageFlags } = require('discord.js');
const { logCommand, logError } = require('../database/nosql-mongodb.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// 슬래시 명령어가 아니면 무시
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
			return;
		}

		// 명령어 실행 시작 시간 기록
		const startTime = Date.now();
		let isSuccess = false;

		try {
			await command.execute(interaction);
			isSuccess = true;
			
			// MongoDB에 명령어 사용 로그 기록
			await logCommand({
				userId: interaction.user.id,
				username: interaction.user.username,
				guildId: interaction.guild ? interaction.guild.id : 'DM',
				guildName: interaction.guild ? interaction.guild.name : 'Direct Message',
				channelId: interaction.channel ? interaction.channel.id : 'unknown',
				channelName: interaction.channel ? interaction.channel.name : 'Unknown Channel',
				commandName: interaction.commandName,
				commandOptions: interaction.options ? Object.fromEntries(
					interaction.options._hoistedOptions.map(option => [option.name, option.value])
				) : {},
				isSuccess: true,
				executionTime: Date.now() - startTime
			});
		} catch (error) {
			console.error('[ERROR] Error executing command:', error);
			
			// MongoDB에 오류 로그 기록
			await logError({
				errorType: 'command_execution',
				errorMessage: error.message,
				stack: error.stack,
				userId: interaction.user.id,
				guildId: interaction.guild ? interaction.guild.id : 'DM',
				channelId: interaction.channel ? interaction.channel.id : 'unknown',
				commandName: interaction.commandName,
				additionalInfo: {
					options: interaction.options ? Object.fromEntries(
						interaction.options._hoistedOptions.map(option => [option.name, option.value])
					) : {}
				}
			});
			
			// MongoDB에 명령어 사용 로그 기록 (실패)
			await logCommand({
				userId: interaction.user.id,
				username: interaction.user.username,
				guildId: interaction.guild ? interaction.guild.id : 'DM',
				guildName: interaction.guild ? interaction.guild.name : 'Direct Message',
				channelId: interaction.channel ? interaction.channel.id : 'unknown',
				channelName: interaction.channel ? interaction.channel.name : 'Unknown Channel',
				commandName: interaction.commandName,
				commandOptions: interaction.options ? Object.fromEntries(
					interaction.options._hoistedOptions.map(option => [option.name, option.value])
				) : {},
				isSuccess: false,
				executionTime: Date.now() - startTime,
				errorMessage: error.message
			});
			
			const errorMessage = {
				content: '명령어 실행 중 오류가 발생했습니다.',
				flags: MessageFlags.Ephemeral
			};

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(errorMessage);
			} else {
				await interaction.reply(errorMessage);
			}
		}
	},
};