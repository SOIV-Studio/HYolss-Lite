const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 연결 설정
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseSecret = process.env.SUPABASE_SECRET;

// 환경 변수 검증
if (!supabaseUrl || !supabaseKey) {
  console.error('[ERROR] SUPABASE_URL 또는 SUPABASE_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

// 일반 Supabase 클라이언트 생성 (RLS 정책 적용)
const supabase = createClient(supabaseUrl, supabaseKey);

// 관리자 Supabase 클라이언트 생성 (RLS 정책 우회)
const supabaseAdmin = supabaseSecret
  ? createClient(supabaseUrl, supabaseSecret, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;

// Supabase 연결 테스트
const testConnection = async () => {
  try {
    // 간단한 연결 테스트
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('[INFO] Supabase 데이터베이스에 성공적으로 연결되었습니다.');
    return true;
  } catch (err) {
    console.error('[ERROR] Supabase 데이터베이스 연결 오류:', err);
    return false;
  }
};

// 테이블 초기화 함수 (SQL 스크립트 제공)
const getInitializationSQL = () => {
  return `
-- 서버 입장 기록을 저장하는 테이블
CREATE TABLE IF NOT EXISTS bot_server_history (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(20) NOT NULL,
  first_join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_leave_date TIMESTAMP WITH TIME ZONE NULL,
  join_count INTEGER DEFAULT 1,
  current_status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id)
);

-- 초대자 정보를 저장하는 테이블
CREATE TABLE IF NOT EXISTS bot_inviter_tracking (
  id BIGSERIAL PRIMARY KEY,
  inviter_id VARCHAR(20) NOT NULL,
  guild_id VARCHAR(20) NOT NULL,
  invite_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(inviter_id, guild_id)
);

-- 유저 정보를 저장하는 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  username VARCHAR(100),
  email VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- 서버별 봇 설정을 저장하는 테이블
CREATE TABLE IF NOT EXISTS bot_server_settings (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(20) NOT NULL,
  prefix VARCHAR(10) DEFAULT '!',
  language VARCHAR(10) DEFAULT 'ko-KR',
  enabled_features JSONB DEFAULT '{"welcome": true, "logging": true, "automod": false}'::jsonb,
  custom_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(guild_id)
);

-- RLS 정책 설정 (필요한 경우)
-- ALTER TABLE bot_server_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bot_inviter_tracking ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bot_server_settings ENABLE ROW LEVEL SECURITY;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_bot_server_history_guild_id ON bot_server_history(guild_id);
CREATE INDEX IF NOT EXISTS idx_bot_inviter_tracking_guild_id ON bot_inviter_tracking(guild_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_server_settings_guild_id ON bot_server_settings(guild_id);
  `;
};

// 기본 설정 객체
const getDefaultServerSettings = (guildId) => ({
  guild_id: guildId,
  prefix: '!',
  language: 'ko-KR',
  enabled_features: {
    welcome: true,
    logging: true,
    automod: false
  },
  custom_settings: {}
});

// 서버 입장 기록 추가/업데이트
const updateServerHistory = async (guildId, isJoining = true) => {
  try {
    if (isJoining) {
      // 서버에 입장한 경우
      const { data: existingRecord, error: selectError } = await supabase
        .from('bot_server_history')
        .select('*')
        .eq('guild_id', guildId)
        .maybeSingle();
      
      if (selectError) {
        console.error('[ERROR] 서버 기록 조회 오류:', selectError);
        throw selectError;
      }
      
      if (existingRecord) {
        // 기존 기록이 있는 경우 업데이트
        const { error: updateError } = await supabase
          .from('bot_server_history')
          .update({
            join_count: existingRecord.join_count + 1,
            current_status: true,
            last_leave_date: null,
            updated_at: new Date().toISOString()
          })
          .eq('guild_id', guildId);
        
        if (updateError) throw updateError;
        console.log(`[INFO] 서버 ${guildId} 재입장 기록 업데이트 (총 ${existingRecord.join_count + 1}회)`);
      } else {
        // 새 기록 생성
        const { error: insertError } = await supabase
          .from('bot_server_history')
          .insert([{ 
            guild_id: guildId, 
            current_status: true,
            join_count: 1
          }]);
        
        if (insertError) throw insertError;
        console.log(`[INFO] 서버 ${guildId} 신규 입장 기록 생성`);
      }
    } else {
      // 서버에서 퇴장한 경우
      const { error: updateError } = await supabase
        .from('bot_server_history')
        .update({
          current_status: false,
          last_leave_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('guild_id', guildId);
      
      if (updateError) throw updateError;
      console.log(`[INFO] 서버 ${guildId} 퇴장 기록 업데이트`);
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
      .upsert(
        { inviter_id: inviterId, guild_id: guildId },
        { 
          onConflict: 'inviter_id,guild_id',
          ignoreDuplicates: true 
        }
      );
    
    if (error) throw error;
    
    console.log(`[INFO] 초대자 ${inviterId} 정보가 서버 ${guildId}에 추가되었습니다.`);
    return true;
  } catch (err) {
    console.error('[ERROR] 초대자 정보 추가 오류:', err);
    return false;
  }
};

// 서버 설정 가져오기
const getServerSettings = async (guildId) => {
  try {
    const { data, error } = await supabase
      .from('bot_server_settings')
      .select('*')
      .eq('guild_id', guildId)
      .maybeSingle();
    
    if (error) {
      console.error('[ERROR] 서버 설정 조회 오류:', error);
      throw error;
    }
    
    if (!data) {
      // 기본 설정으로 새 레코드 생성
      const defaultSettings = getDefaultServerSettings(guildId);
      
      const { data: newData, error: insertError } = await supabase
        .from('bot_server_settings')
        .insert([defaultSettings])
        .select()
        .single();
      
      if (insertError) {
        console.error('[ERROR] 서버 설정 생성 오류:', insertError);
        return defaultSettings;
      }
      
      console.log(`[INFO] 서버 ${guildId}의 기본 설정이 생성되었습니다.`);
      return newData;
    }
    
    return data;
  } catch (err) {
    console.error('[ERROR] 서버 설정 가져오기 오류:', err);
    return getDefaultServerSettings(guildId);
  }
};

// 서버 설정 업데이트
const updateServerSettings = async (guildId, settings) => {
  try {
    const { error } = await supabase
      .from('bot_server_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('guild_id', guildId);
    
    if (error) throw error;
    
    console.log(`[INFO] 서버 ${guildId} 설정이 업데이트되었습니다.`);
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
      .maybeSingle();
    
    if (error) {
      console.error('[ERROR] 유저 프로필 조회 오류:', error);
      throw error;
    }
    
    if (!data) {
      // 새 유저 프로필 생성
      const newUserData = {
        user_id: userId,
        username: userData.username || null,
        avatar_url: userData.avatar_url || null,
        email: userData.email || null,
        ...userData
      };
      
      const { data: newData, error: insertError } = await supabase
        .from('user_profiles')
        .insert([newUserData])
        .select()
        .single();
      
      if (insertError) {
        console.error('[ERROR] 유저 프로필 생성 오류:', insertError);
        throw insertError;
      }
      
      console.log(`[INFO] 유저 ${userId}의 프로필이 생성되었습니다.`);
      return newData;
    }
    
    // 기존 프로필 업데이트 (필요한 경우)
    if (userData && Object.keys(userData).length > 0) {
      const updateData = {
        ...userData,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('[ERROR] 유저 프로필 업데이트 오류:', updateError);
        throw updateError;
      }
      
      return { ...data, ...updateData };
    }
    
    return data;
  } catch (err) {
    console.error('[ERROR] 유저 프로필 가져오기/생성 오류:', err);
    return null;
  }
};

// 통계 정보 가져오기
const getStatistics = async () => {
  try {
    const [serverCount, userCount, activeServers] = await Promise.all([
      // 총 서버 수
      supabase
        .from('bot_server_history')
        .select('*', { count: 'exact', head: true }),
      
      // 총 유저 수
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),
      
      // 현재 활성 서버 수
      supabase
        .from('bot_server_history')
        .select('*', { count: 'exact', head: true })
        .eq('current_status', true)
    ]);
    
    return {
      totalServers: serverCount.count || 0,
      totalUsers: userCount.count || 0,
      activeServers: activeServers.count || 0
    };
  } catch (err) {
    console.error('[ERROR] 통계 정보 가져오기 오류:', err);
    return {
      totalServers: 0,
      totalUsers: 0,
      activeServers: 0
    };
  }
};

// 서버 목록 가져오기
const getServerList = async (activeOnly = false) => {
  try {
    let query = supabase
      .from('bot_server_history')
      .select('*')
      .order('first_join_date', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('current_status', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('[ERROR] 서버 목록 가져오기 오류:', err);
    return [];
  }
};

// 데이터베이스 초기화 체크
const initializeTables = async () => {
  try {
    console.log('[INFO] Supabase 테이블 존재 여부 확인 중...');
    
    // 각 테이블에 대해 간단한 쿼리를 실행하여 존재 여부 확인
    const tables = ['bot_server_history', 'bot_inviter_tracking', 'user_profiles', 'bot_server_settings'];
    const tableStatus = {};
    
    for (const table of tables) {
      try {
        await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
        tableStatus[table] = true;
      } catch (error) {
        tableStatus[table] = false;
      }
    }
    
    const missingTables = Object.entries(tableStatus)
      .filter(([table, exists]) => !exists)
      .map(([table]) => table);
    
    if (missingTables.length > 0) {
      console.log('[WARN] 다음 테이블들이 존재하지 않습니다:', missingTables.join(', '));
      console.log('[INFO] Supabase 대시보드의 SQL 에디터에서 다음 SQL을 실행해 주세요:');
      console.log(getInitializationSQL());
    } else {
      console.log('[INFO] 모든 필요한 테이블이 존재합니다.');
    }
    
    return true;
  } catch (err) {
    console.error('[ERROR] 테이블 초기화 확인 오류:', err);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  initializeTables,
  getInitializationSQL,
  updateServerHistory,
  addInviterInfo,
  getServerSettings,
  updateServerSettings,
  getUserProfile,
  getStatistics,
  getServerList,
  getDefaultServerSettings
};