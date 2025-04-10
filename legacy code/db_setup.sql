-- 서버 입장 시스템을 위한 데이터베이스 테이블 생성 스크립트

-- 서버 입장 기록을 저장하는 테이블
CREATE TABLE IF NOT EXISTS bot_server_history (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,      -- 서버 ID
    first_join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 최초 입장 날짜
    last_leave_date TIMESTAMP WITH TIME ZONE NULL,  -- 마지막 퇴장 날짜
    join_count INTEGER DEFAULT 1,        -- 총 입장 횟수
    current_status BOOLEAN DEFAULT TRUE, -- 현재 입장 상태
    UNIQUE(guild_id)
);

-- 초대자 정보를 저장하는 테이블
CREATE TABLE IF NOT EXISTS bot_inviter_tracking (
    id SERIAL PRIMARY KEY,
    inviter_id VARCHAR(20) NOT NULL,    -- 초대한 유저 ID
    guild_id VARCHAR(20) NOT NULL,      -- 서버 ID
    invite_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- 초대 날짜
    UNIQUE(inviter_id, guild_id)
);

-- 테이블 생성 확인
SELECT '[INFO-DB] bot_server_history 테이블이 생성되었습니다.' AS message
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'bot_server_history'
);

SELECT '[INFO-DB] bot_inviter_tracking 테이블이 생성되었습니다.' AS message
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'bot_inviter_tracking'
);