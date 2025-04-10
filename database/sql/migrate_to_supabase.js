require('dotenv').config();
const { Pool } = require('pg');
const { supabase, migrateFromPostgres } = require('./supabase');

// PostgreSQL 연결 설정
const pool = new Pool({
  user: process.env.DB_USER || 'bot_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hyolssdb',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

async function migrateData() {
  console.log('[INFO] PostgreSQL에서 Supabase로 데이터 마이그레이션을 시작합니다...');
  
  try {
    // PostgreSQL 연결 테스트
    const client = await pool.connect();
    console.log('[INFO] PostgreSQL 데이터베이스에 성공적으로 연결되었습니다.');
    
    // 테이블 존재 여부 확인
    const checkTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('bot_server_history', 'bot_inviter_tracking');
    `;
    
    const result = await client.query(checkTablesQuery);
    
    if (result.rows.length === 0) {
      console.log('[ERROR] 마이그레이션할 테이블이 존재하지 않습니다.');
      client.release();
      await pool.end();
      return;
    }
    
    console.log('[INFO] 마이그레이션할 테이블 목록:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // 데이터 마이그레이션 실행
    const migrationResult = await migrateFromPostgres(pool);
    
    if (migrationResult) {
      console.log('[INFO] 데이터 마이그레이션이 성공적으로 완료되었습니다.');
    } else {
      console.log('[ERROR] 데이터 마이그레이션 중 오류가 발생했습니다.');
    }
    
    // 연결 종료
    client.release();
    await pool.end();
    console.log('[INFO] PostgreSQL 연결이 종료되었습니다.');
    
  } catch (error) {
    console.error('[ERROR] 데이터 마이그레이션 중 오류가 발생했습니다:', error);
  }
}

// 스크립트 실행
migrateData();