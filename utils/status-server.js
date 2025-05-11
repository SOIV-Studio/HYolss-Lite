// status-server.js
const express = require('express');
const app = express();
const PORT = process.env.STATUS_PORT || 3000;

// 전역 변수로 봇 클라이언트 참조 저장
let botClient = null;

// 봇 클라이언트 참조 설정 함수
function setBotClient(client) {
  botClient = client;
}

// 기본 상태 엔드포인트
app.get('/health', (req, res) => {
  try {
    // 봇 상태 확인
    const isOnline = botClient && botClient.ws.status === 0; // 0은 'READY' 상태
    
    const status = {
      status: isOnline ? 'ok' : 'error',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      discord: {
        connected: isOnline,
        ping: botClient ? botClient.ws.ping : null,
        guilds: botClient ? botClient.guilds.cache.size : 0,
        databaseStatus: botClient ? botClient.databaseStatus : { supabase: false, mongodb: false }
      }
    };
    
    res.status(200).json(status);
  } catch (error) {
    console.error('[ERROR] 상태 엔드포인트 오류:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 서버 시작 함수
function startStatusServer() {
  return new Promise((resolve, reject) => {
    try {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[INFO] 상태 서버가 포트 ${PORT}에서 실행 중입니다 (모든 인터페이스)`);
        resolve(true);
      });
    } catch (error) {
      console.error('[ERROR] 상태 서버 시작 실패:', error);
      reject(error);
    }
  });
}

module.exports = { startStatusServer, setBotClient };