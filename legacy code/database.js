const { Pool } = require('pg');

// PostgreSQL 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'bot_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hyolssdb',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// 데이터베이스 연결 테스트
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('[INFO] PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.');
    client.release();
    return true;
  } catch (err) {
    console.error('[ERROR] PostgreSQL 데이터베이스 연결 오류:', err);
    return false;
  }
};

// 테이블 초기화 함수
async function initializeBotServerTables() {
  try {
    // 서버 입장 기록 테이블 확인
    const checkHistoryTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'bot_server_history'
      );
    `;
    
    const historyTableExists = await pool.query(checkHistoryTableQuery);
    
    if (!historyTableExists.rows[0].exists) {
      console.log('[INFO-DB] bot_server_history 테이블이 존재하지 않습니다. 테이블을 생성합니다.');
      const createHistoryTableQuery = `
        CREATE TABLE bot_server_history (
          id SERIAL PRIMARY KEY,
          guild_id VARCHAR(20) NOT NULL,
          first_join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_leave_date TIMESTAMP WITH TIME ZONE NULL,
          join_count INTEGER DEFAULT 1,
          current_status BOOLEAN DEFAULT TRUE,
          UNIQUE(guild_id)
        );
      `;
      await pool.query(createHistoryTableQuery);
      console.log('[INFO-DB] bot_server_history 테이블이 생성되었습니다.');
    } else {
      console.log('[INFO-DB] bot_server_history 테이블이 이미 존재합니다.');
    }
    
    // 초대자 정보 테이블 확인
    const checkInviterTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'bot_inviter_tracking'
      );
    `;
    
    const inviterTableExists = await pool.query(checkInviterTableQuery);
    
    if (!inviterTableExists.rows[0].exists) {
      console.log('[INFO-DB] bot_inviter_tracking 테이블이 존재하지 않습니다. 테이블을 생성합니다.');
      const createInviterTableQuery = `
        CREATE TABLE bot_inviter_tracking (
          id SERIAL PRIMARY KEY,
          inviter_id VARCHAR(20) NOT NULL,
          guild_id VARCHAR(20) NOT NULL,
          invite_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(inviter_id, guild_id)
        );
      `;
      await pool.query(createInviterTableQuery);
      console.log('[INFO-DB] bot_inviter_tracking 테이블이 생성되었습니다.');
    } else {
      console.log('[INFO-DB] bot_inviter_tracking 테이블이 이미 존재합니다.');
    }
    
    return true;
  } catch (err) {
    console.error('[ERROR] 테이블 초기화 오류:', err);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeBotServerTables
};