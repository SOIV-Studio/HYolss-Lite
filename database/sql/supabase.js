const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 연결 설정
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseSecret = process.env.SUPABASE_SECRET;

// 일반 Supabase 클라이언트 생성 (RLS 정책 적용)
const supabase = createClient(supabaseUrl, supabaseKey);

// 관리자 Supabase 클라이언트 생성 (RLS 정책 우회)
const supabaseAdmin = supabaseSecret
  ? createClient(supabaseUrl, supabaseSecret)
  : supabase; // 서비스 역할 키가 없으면 일반 클라이언트 사용

// Supabase 연결 테스트
const testConnection = async () => {
  try {
    // 테이블 존재 여부와 관계없이 연결 테스트
    const { error } = await supabase.from('_dummy_query').select('*', { count: 'exact', head: true }).limit(1);
    
    // 테이블이 없는 경우의 오류는 무시 (404 오류)
    if (error && error.code === 'PGRST116') {
      console.log('[INFO] Supabase 데이터베이스에 성공적으로 연결되었습니다. (테이블이 아직 생성되지 않았습니다)');
      return true;
    } else if (error) {
      throw error;
    }
    
    console.log('[INFO] Supabase 데이터베이스에 성공적으로 연결되었습니다.');
    return true;
  } catch (err) {
    console.error('[ERROR] Supabase 데이터베이스 연결 오류:', err);
    return false;
  }
};

// 테이블 초기화 함수 (Supabase는 SQL 에디터나 대시보드에서 테이블을 생성하는 것이 일반적이지만,
// 여기서는 참조용으로 필요한 테이블 구조를 제공합니다)
const initializeTables = async () => {
  try {
    console.log('[INFO] Supabase 테이블 초기화 중...');
    
    // 참고: 실제로는 Supabase 대시보드에서 이러한 테이블을 생성하는 것이 좋습니다.
    // 이 코드는 테이블 구조를 문서화하는 용도로만 사용됩니다.
    
    /* 
    Supabase SQL 에디터에서 실행할 SQL 스크립트:
    
    -- 서버 입장 기록을 저장하는 테이블
    CREATE TABLE IF NOT EXISTS bot_server_history (
      id SERIAL PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      first_join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_leave_date TIMESTAMP WITH TIME ZONE NULL,
      join_count INTEGER DEFAULT 1,
      current_status BOOLEAN DEFAULT TRUE,
      UNIQUE(guild_id)
    );

    -- 초대자 정보를 저장하는 테이블
    CREATE TABLE IF NOT EXISTS bot_inviter_tracking (
      id SERIAL PRIMARY KEY,
      inviter_id VARCHAR(20) NOT NULL,
      guild_id VARCHAR(20) NOT NULL,
      invite_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(inviter_id, guild_id)
    );

    -- 유저 정보를 저장하는 테이블
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(20) NOT NULL,
      username VARCHAR(100),
      email VARCHAR(255),
      avatar_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    );

    -- 서버별 봇 설정을 저장하는 테이블
    CREATE TABLE IF NOT EXISTS bot_server_settings (
      id SERIAL PRIMARY KEY,
      guild_id VARCHAR(20) NOT NULL,
      prefix VARCHAR(10) DEFAULT '!',
      language VARCHAR(10) DEFAULT 'ko-KR',
      enabled_features JSONB DEFAULT '{"welcome": true, "logging": true, "automod": false}',
      custom_settings JSONB,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id)
    );
    */
    
    console.log('[INFO] Supabase 테이블 초기화 완료 (참고용 SQL 스크립트 제공)');
    return true;
  } catch (err) {
    console.error('[ERROR] Supabase 테이블 초기화 오류:', err);
    return false;
  }
};

// 서버 입장 기록 추가/업데이트
const updateServerHistory = async (guildId, isJoining = true) => {
  try {
    if (isJoining) {
      // 서버에 입장한 경우
      const { data: existingRecord, error: selectError } = await supabase
        .from('bot_server_history')
        .select('*')
        .eq('guild_id', guildId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') { // PGRST116는 결과가 없는 경우
        throw selectError;
      }
      
      if (existingRecord) {
        // 기존 기록이 있는 경우 업데이트
        const { error: updateError } = await supabase
          .from('bot_server_history')
          .update({
            join_count: existingRecord.join_count + 1,
            current_status: true,
            last_leave_date: null
          })
          .eq('guild_id', guildId);
        
        if (updateError) throw updateError;
      } else {
        // 새 기록 생성
        const { error: insertError } = await supabase
          .from('bot_server_history')
          .insert([{ guild_id: guildId, current_status: true }]);
        
        if (insertError) throw insertError;
      }
    } else {
      // 서버에서 퇴장한 경우
      const { error: updateError } = await supabase
        .from('bot_server_history')
        .update({
          current_status: false,
          last_leave_date: new Date().toISOString()
        })
        .eq('guild_id', guildId);
      
      if (updateError) throw updateError;
    }
    
    return true;
  } catch (err) {
    console.error(`[ERROR] 서버 ${isJoining ? '입장' : '퇴장'} 기록 업데이트 오류:`, err);
    return false;
  }
};

// 초대자 정보 추가
const addInviterInfo = async (inviterId, guildId) => {
  try {
    const { error } = await supabase
      .from('bot_inviter_tracking')
      .insert([{ inviter_id: inviterId, guild_id: guildId }])
      .onConflict(['inviter_id', 'guild_id'])
      .ignore();
    
    if (error) throw error;
    
    return true;
  } catch (err) {
    console.error('[ERROR] 초대자 정보 추가 오류:', err);
    return false;
  }
};

// 서버 설정 가져오기
const getServerSettings = async (guildId) => {
  try {
    // 먼저 일반 클라이언트로 조회 시도
    const { data, error } = await supabase
      .from('bot_server_settings')
      .select('*')
      .eq('guild_id', guildId)
      .single();
    
    // 일반 조회에 성공한 경우
    if (!error && data) {
      return data;
    }
    
    // 결과가 없는 경우 (PGRST116)는 무시하고 계속 진행
    if (error && error.code !== 'PGRST116') {
      console.warn('[WARN] 일반 클라이언트로 서버 설정 조회 실패:', error);
    }
    
    // 관리자 클라이언트로 조회 시도
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('bot_server_settings')
      .select('*')
      .eq('guild_id', guildId)
      .single();
    
    if (adminError && adminError.code !== 'PGRST116') {
      throw adminError;
    }
    
    if (!adminData) {
      // 기본 설정으로 새 레코드 생성 (관리자 클라이언트 사용)
      const defaultSettings = {
        guild_id: guildId,
        prefix: '!',
        language: 'ko-KR',
        enabled_features: {
          welcome: true,
          logging: true,
          automod: false
        }
      };
      
      const { data: newData, error: insertError } = await supabaseAdmin
        .from('bot_server_settings')
        .insert([defaultSettings])
        .select()
        .single();
      
      if (insertError) {
        console.error('[ERROR] 서버 설정 생성 오류:', insertError);
        // 오류 발생 시 기본 설정 객체 반환
        return defaultSettings;
      }
      
      return newData;
    }
    
    return adminData;
  } catch (err) {
    console.error('[ERROR] 서버 설정 가져오기 오류:', err);
    // 오류 발생 시 기본 설정 객체 반환
    return {
      guild_id: guildId,
      prefix: '!',
      language: 'ko-KR',
      enabled_features: {
        welcome: true,
        logging: true,
        automod: false
      }
    };
  }
};

// 서버 설정 업데이트
const updateServerSettings = async (guildId, settings) => {
  try {
    // 먼저 일반 클라이언트로 업데이트 시도
    const { error } = await supabase
      .from('bot_server_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('guild_id', guildId);
    
    // 일반 업데이트에 성공한 경우
    if (!error) {
      return true;
    }
    
    console.warn('[WARN] 일반 클라이언트로 서버 설정 업데이트 실패:', error);
    
    // 관리자 클라이언트로 업데이트 시도
    const { error: adminError } = await supabaseAdmin
      .from('bot_server_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('guild_id', guildId);
    
    if (adminError) throw adminError;
    
    return true;
  } catch (err) {
    console.error('[ERROR] 서버 설정 업데이트 오류:', err);
    return false;
  }
};

// 유저 정보 가져오기 또는 생성
const getUserProfile = async (userId, userData = {}) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // 새 유저 프로필 생성
      const newUserData = {
        user_id: userId,
        username: userData.username || null,
        avatar_url: userData.avatar_url || null,
        ...userData
      };
      
      const { data: newData, error: insertError } = await supabase
        .from('user_profiles')
        .insert([newUserData])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      return newData;
    }
    
    // 기존 프로필 업데이트 (필요한 경우)
    if (userData && Object.keys(userData).length > 0) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          ...userData,
          last_login: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      return { ...data, ...userData, last_login: new Date().toISOString() };
    }
    
    return data;
  } catch (err) {
    console.error('[ERROR] 유저 프로필 가져오기/생성 오류:', err);
    return null;
  }
};

// PostgreSQL에서 Supabase로 데이터 마이그레이션 (필요한 경우)
const migrateFromPostgres = async (pgPool) => {
  try {
    console.log('[INFO] PostgreSQL에서 Supabase로 데이터 마이그레이션 시작...');
    
    // 서버 기록 마이그레이션
    const serverHistoryResult = await pgPool.query('SELECT * FROM bot_server_history');
    if (serverHistoryResult.rows.length > 0) {
      const { error: serverHistoryError } = await supabase
        .from('bot_server_history')
        .insert(serverHistoryResult.rows);
      
      if (serverHistoryError) throw serverHistoryError;
      console.log(`[INFO] ${serverHistoryResult.rows.length}개의 서버 기록이 마이그레이션되었습니다.`);
    }
    
    // 초대자 정보 마이그레이션
    const inviterTrackingResult = await pgPool.query('SELECT * FROM bot_inviter_tracking');
    if (inviterTrackingResult.rows.length > 0) {
      const { error: inviterTrackingError } = await supabase
        .from('bot_inviter_tracking')
        .insert(inviterTrackingResult.rows);
      
      if (inviterTrackingError) throw inviterTrackingError;
      console.log(`[INFO] ${inviterTrackingResult.rows.length}개의 초대자 정보가 마이그레이션되었습니다.`);
    }
    
    console.log('[INFO] PostgreSQL에서 Supabase로 데이터 마이그레이션 완료');
    return true;
  } catch (err) {
    console.error('[ERROR] 데이터 마이그레이션 오류:', err);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  initializeTables,
  updateServerHistory,
  addInviterInfo,
  getServerSettings,
  updateServerSettings,
  getUserProfile,
  migrateFromPostgres
};