const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// PostgreSQL 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'bot_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hyolssdb',
  password: process.env.DB_PASSWORD || 'hyolssdb25',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  try {
    console.log('[INFO] 데이터베이스 테이블 생성을 시작합니다...');
    
    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, 'db_setup.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // SQL 스크립트 실행
    await pool.query(sqlScript);
    
    console.log('[INFO] 데이터베이스 테이블이 성공적으로 생성되었습니다.');
    
    // 테이블 확인
    const checkTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('bot_server_history', 'bot_inviter_tracking');
    `;
    
    const result = await pool.query(checkTablesQuery);
    
    if (result.rows.length > 0) {
      console.log('[INFO] 생성된 테이블 목록:');
      result.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    } else {
      console.log('[ERROR] 테이블이 생성되지 않았습니다. 오류를 확인하세요.');
    }
    
  } catch (error) {
    console.error('[ERROR] 데이터베이스 설정 중 오류가 발생했습니다:', error);
  } finally {
    // 연결 종료
    await pool.end();
  }
}

// 스크립트 실행
setupDatabase();