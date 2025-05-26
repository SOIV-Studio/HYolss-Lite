require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { testConnection: testSupabaseConnection } = require('./database/sql-supabase'); // Supabase 연결 테스트
const { testConnection: testMongoConnection, connect: connectMongo } = require('./database/nosql-mongodb'); // MongoDB 연결 테스트 및 연결
const { scheduleUpdateCheck } = require('./utils/auto-updater'); // 자동 업데이트 기능
const { startStatusServer, setBotClient } = require('./utils/status-server'); // 경로는 실제 파일 위치에 맞게 조정

// 환경 변수에 따라 토큰과 clientId 선택
const token = process.env.NODE_ENV === 'development' 
    ? process.env.DEV_DISCORD_TOKEN 
    : process.env.DISCORD_TOKEN;

const clientId = process.env.NODE_ENV === 'development'
    ? process.env.DEV_DISCORD_CLIENT_ID
    : process.env.DISCORD_CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
client.commands = new Collection();

// 명령어 파일 로드 및 등록 함수
async function loadAndDeployCommands() {
    const commands = [];
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                client.commands.set(command.data.name, command);
                console.log(`[INFO] Loaded command: ${command.data.name}`);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }

    // 명령어 등록
    const rest = new REST().setToken(token);
    try {
        console.log(`[INFO] Started refreshing ${commands.length} application (/) commands globally.`);
        console.log('[INFO] Commands to be registered:', commands.map(cmd => cmd.name).join(', '));
        console.log(`[INFO] Using ${process.env.NODE_ENV} environment`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`[INFO] Successfully reloaded ${data.length} application (/) commands globally.`);
        console.log('[INFO] Registered commands:', data.map(cmd => cmd.name).join(', '));
    } catch (error) {
        console.error('[ERROR] Failed to deploy commands:');
        console.error(error);
        if (error.rawError) {
            console.error('[ERROR] API Error details:', error.rawError);
        }
    }
}

// 이벤트 핸들러 등록
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// 봇 시작
async function startBot() {
    try {
        // Supabase 데이터베이스 연결 테스트
        console.log('[INFO] Supabase 데이터베이스 연결 테스트 중...');
        const supabaseConnected = await testSupabaseConnection();
        
        // MongoDB Atlas 연결 테스트
        console.log('[INFO] MongoDB Atlas 연결 테스트 중...');
        const mongoConnected = await testMongoConnection();
        
        // MongoDB는 반드시 연결되어야 함
        if (!mongoConnected) {
            console.error('[ERROR] MongoDB Atlas 연결에 실패했습니다. 봇을 시작할 수 없습니다.');
            process.exit(1);
        }
        
        // Supabase 연결 상태 로깅
        if (!supabaseConnected) {
            console.warn('[WARN] Supabase 데이터베이스 연결에 실패했습니다. 일부 기능이 제한될 수 있습니다.');
        }
        
        // MongoDB에 연결
        await connectMongo();
        
        // 데이터베이스 테이블 초기화 (Supabase가 연결된 경우에만)
        if (supabaseConnected) {
            const guildCreateEvent = require('./events/guildCreate');
            console.log('[INFO] 데이터베이스 테이블 초기화 중...');
            await guildCreateEvent.initializeBotServerTables();
        }
        
        // 명령어 등록
        await loadAndDeployCommands();
        
        // 봇 로그인
        await client.login(token);
        console.log(`[INFO] 봇이 성공적으로 로그인되었습니다.`);
        
        // 데이터베이스 연결 상태 저장
        client.databaseStatus = {
            supabase: supabaseConnected,
            mongodb: mongoConnected
        };

        // 상태 서버 시작을 위해 봇 클라이언트 설정
        setBotClient(client);

        // 상태 서버 시작
        await startStatusServer();
        console.log('[INFO] 상태 확인 서버가 시작되었습니다.');
        
    } catch (error) {
        console.error('[ERROR] Error starting bot:', error);
        process.exit(1);
    }
}

startBot();

/*
// 자동 업데이트 체크 예약 (12시간마다 실행)
if (process.env.NODE_ENV !== 'development') {
    console.log('[INFO] 자동 업데이트 체크 예약 중...');
    scheduleUpdateCheck(6); // 6시간에서 12시간으로 변경
}
*/