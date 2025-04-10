require('dotenv').config();
const { connect, testConnection } = require('./mongodb');

async function setupMongoDB() {
  console.log('[INFO] MongoDB Atlas 데이터베이스 초기화를 시작합니다...');
  
  try {
    // MongoDB 연결 테스트
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('[ERROR] MongoDB Atlas에 연결할 수 없습니다. 환경 변수를 확인하세요.');
      return;
    }
    
    // MongoDB 연결
    await connect();
    
    console.log('[INFO] MongoDB Atlas 데이터베이스가 성공적으로 초기화되었습니다.');
    console.log('[INFO] 다음 컬렉션이 준비되었습니다:');
    console.log('- command_logs: 명령어 사용 기록');
    console.log('- error_logs: 오류 로그');
    console.log('- notifications: 알림 시스템');
    
    // 샘플 데이터 삽입 (테스트용)
    if (process.env.NODE_ENV === 'development') {
      console.log('[INFO] 개발 환경에서 샘플 데이터를 생성합니다...');
      
      const { MongoClient } = require('mongodb');
      const uri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DB_NAME || 'hyolss_bot';
      
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db(dbName);
      
      // 샘플 명령어 로그
      await db.collection('command_logs').insertOne({
        userId: 'sample_user_id',
        username: 'sample_user',
        guildId: 'sample_guild_id',
        guildName: 'Sample Server',
        channelId: 'sample_channel_id',
        channelName: 'general',
        commandName: 'help',
        commandOptions: {},
        isSuccess: true,
        executionTime: 150,
        timestamp: new Date()
      });
      
      // 샘플 오류 로그
      await db.collection('error_logs').insertOne({
        errorType: 'command_execution',
        errorMessage: 'Sample error message',
        stack: 'Sample stack trace',
        userId: 'sample_user_id',
        guildId: 'sample_guild_id',
        channelId: 'sample_channel_id',
        commandName: 'sample_command',
        additionalInfo: {},
        timestamp: new Date()
      });
      
      // 샘플 알림
      await db.collection('notifications').insertOne({
        type: 'post',
        guildId: 'sample_guild_id',
        channelId: 'sample_channel_id',
        title: 'Sample Notification',
        content: 'This is a sample notification content',
        url: 'https://example.com',
        authorId: 'sample_author_id',
        authorName: 'Sample Author',
        targetUsers: [{ userId: 'sample_user_id', username: 'sample_user' }],
        status: 'pending',
        timestamp: new Date()
      });
      
      console.log('[INFO] 샘플 데이터가 성공적으로 생성되었습니다.');
      await client.close();
    }
    
  } catch (error) {
    console.error('[ERROR] MongoDB Atlas 초기화 중 오류가 발생했습니다:', error);
  }
}

// 스크립트 실행
setupMongoDB();