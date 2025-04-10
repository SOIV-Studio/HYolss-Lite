// legacy code - 명령어를 등록하는 코드입니다.
// 이 코드는 더 이상 사용되지 않습니다.
// config.json 파일도 더 이상 사용되지 않습니다.
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// 환경 변수에 따라 토큰과 clientId 선택
const token = process.env.NODE_ENV === 'development' 
    ? process.env.DEV_DISCORD_TOKEN 
    : process.env.DISCORD_TOKEN;

const clientId = process.env.NODE_ENV === 'development'
    ? process.env.DEV_DISCORD_CLIENT_ID
    : process.env.DISCORD_CLIENT_ID;

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`[INFO] Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands globally.`);
        console.log('Commands to be registered:', commands.map(cmd => cmd.name).join(', '));
        console.log(`Using ${process.env.NODE_ENV} environment`);

        // The put method is used to fully refresh all commands globally with the current set
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands globally.`);
        console.log('Registered commands:', data.map(cmd => cmd.name).join(', '));
    } catch (error) {
        // More detailed error logging
        console.error('Failed to deploy commands:');
        console.error(error);
        if (error.rawError) {
            console.error('API Error details:', error.rawError);
        }
    }
})();