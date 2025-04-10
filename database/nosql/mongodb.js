const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Atlas 연결 설정
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'hyolss_bot';

// MongoDB 클라이언트 생성
const client = new MongoClient(uri);

// 데이터베이스 및 컬렉션 참조
let db;
let commandLogs;
let errorLogs;
let notifications;

// MongoDB 연결 및 초기화
const connect = async () => {
  try {
    await client.connect();
    console.log('[INFO] MongoDB Atlas에 성공적으로 연결되었습니다.');
    
    db = client.db(dbName);
    
    // 컬렉션 참조 설정
    commandLogs = db.collection('command_logs');
    errorLogs = db.collection('error_logs');
    notifications = db.collection('notifications');
    
    // 인덱스 생성
    await createIndexes();
    
    return true;
  } catch (err) {
    console.error('[ERROR] MongoDB Atlas 연결 오류:', err);
    return false;
  }
};

// 연결 테스트
const testConnection = async () => {
  try {
    // 이미 연결되어 있는지 확인
    if (!db) {
      await connect();
    }
    
    // 간단한 ping 명령으로 연결 테스트
    await db.command({ ping: 1 });
    console.log('[INFO] MongoDB Atlas 연결이 활성 상태입니다.');
    return true;
  } catch (err) {
    console.error('[ERROR] MongoDB Atlas 연결 테스트 오류:', err);
    return false;
  }
};

// 인덱스 생성
const createIndexes = async () => {
  try {
    // 명령어 로그 인덱스
    await commandLogs.createIndex({ timestamp: -1 }); // 시간 역순 정렬을 위한 인덱스
    await commandLogs.createIndex({ userId: 1 }); // 사용자별 조회를 위한 인덱스
    await commandLogs.createIndex({ guildId: 1 }); // 서버별 조회를 위한 인덱스
    await commandLogs.createIndex({ commandName: 1 }); // 명령어별 조회를 위한 인덱스
    
    // 오류 로그 인덱스
    await errorLogs.createIndex({ timestamp: -1 }); // 시간 역순 정렬을 위한 인덱스
    await errorLogs.createIndex({ errorType: 1 }); // 오류 유형별 조회를 위한 인덱스
    
    // 알림 인덱스
    await notifications.createIndex({ timestamp: -1 }); // 시간 역순 정렬을 위한 인덱스
    await notifications.createIndex({ guildId: 1 }); // 서버별 조회를 위한 인덱스
    await notifications.createIndex({ type: 1 }); // 알림 유형별 조회를 위한 인덱스
    await notifications.createIndex({ status: 1 }); // 알림 상태별 조회를 위한 인덱스
    await notifications.createIndex({ "targetUsers.userId": 1 }); // 대상 사용자별 조회를 위한 인덱스
    
    console.log('[INFO] MongoDB 인덱스가 성공적으로 생성되었습니다.');
  } catch (err) {
    console.error('[ERROR] MongoDB 인덱스 생성 오류:', err);
  }
};

// 명령어 사용 로그 추가
const logCommand = async (logData) => {
  try {
    const log = {
      userId: logData.userId,
      username: logData.username,
      guildId: logData.guildId,
      guildName: logData.guildName,
      channelId: logData.channelId,
      channelName: logData.channelName,
      commandName: logData.commandName,
      commandOptions: logData.commandOptions || {},
      isSuccess: logData.isSuccess !== false, // 기본값은 true
      executionTime: logData.executionTime || 0, // 실행 시간 (ms)
      timestamp: new Date()
    };
    
    await commandLogs.insertOne(log);
    return true;
  } catch (err) {
    console.error('[ERROR] 명령어 로그 저장 오류:', err);
    return false;
  }
};

// 오류 로그 추가
const logError = async (errorData) => {
  try {
    const log = {
      errorType: errorData.errorType,
      errorMessage: errorData.errorMessage,
      stack: errorData.stack,
      userId: errorData.userId,
      guildId: errorData.guildId,
      channelId: errorData.channelId,
      commandName: errorData.commandName,
      additionalInfo: errorData.additionalInfo || {},
      timestamp: new Date()
    };
    
    await errorLogs.insertOne(log);
    return true;
  } catch (err) {
    console.error('[ERROR] 오류 로그 저장 오류:', err);
    return false;
  }
};

// 알림 생성
const createNotification = async (notificationData) => {
  try {
    const notification = {
      type: notificationData.type, // 'post', 'stream', 'event' 등
      guildId: notificationData.guildId,
      channelId: notificationData.channelId,
      title: notificationData.title,
      content: notificationData.content,
      url: notificationData.url,
      imageUrl: notificationData.imageUrl,
      authorId: notificationData.authorId,
      authorName: notificationData.authorName,
      targetUsers: notificationData.targetUsers || [], // 알림을 받을 사용자 목록
      status: 'pending', // 'pending', 'sent', 'failed'
      scheduledFor: notificationData.scheduledFor || new Date(), // 예약 발송 시간
      timestamp: new Date(),
      metadata: notificationData.metadata || {}
    };
    
    const result = await notifications.insertOne(notification);
    return result.insertedId;
  } catch (err) {
    console.error('[ERROR] 알림 생성 오류:', err);
    return null;
  }
};

// 알림 상태 업데이트
const updateNotificationStatus = async (notificationId, status, additionalData = {}) => {
  try {
    await notifications.updateOne(
      { _id: notificationId },
      { 
        $set: { 
          status: status,
          ...additionalData,
          updatedAt: new Date()
        } 
      }
    );
    return true;
  } catch (err) {
    console.error('[ERROR] 알림 상태 업데이트 오류:', err);
    return false;
  }
};

// 사용자별 알림 조회
const getNotificationsForUser = async (userId, options = {}) => {
  try {
    const query = { "targetUsers.userId": userId };
    
    if (options.type) {
      query.type = options.type;
    }
    
    if (options.status) {
      query.status = options.status;
    }
    
    const limit = options.limit || 50;
    const skip = options.skip || 0;
    
    const result = await notifications
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return result;
  } catch (err) {
    console.error('[ERROR] 사용자별 알림 조회 오류:', err);
    return [];
  }
};

// 서버별 알림 조회
const getNotificationsForGuild = async (guildId, options = {}) => {
  try {
    const query = { guildId: guildId };
    
    if (options.type) {
      query.type = options.type;
    }
    
    if (options.status) {
      query.status = options.status;
    }
    
    const limit = options.limit || 50;
    const skip = options.skip || 0;
    
    const result = await notifications
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return result;
  } catch (err) {
    console.error('[ERROR] 서버별 알림 조회 오류:', err);
    return [];
  }
};

// 명령어 사용 통계 조회
const getCommandStats = async (options = {}) => {
  try {
    const matchStage = {};
    
    if (options.guildId) {
      matchStage.guildId = options.guildId;
    }
    
    if (options.startDate && options.endDate) {
      matchStage.timestamp = {
        $gte: new Date(options.startDate),
        $lte: new Date(options.endDate)
      };
    } else if (options.startDate) {
      matchStage.timestamp = { $gte: new Date(options.startDate) };
    } else if (options.endDate) {
      matchStage.timestamp = { $lte: new Date(options.endDate) };
    }
    
    const pipeline = [
      { $match: matchStage },
      { $group: {
          _id: "$commandName",
          count: { $sum: 1 },
          successCount: { $sum: { $cond: ["$isSuccess", 1, 0] } },
          failureCount: { $sum: { $cond: ["$isSuccess", 0, 1] } },
          avgExecutionTime: { $avg: "$executionTime" },
          users: { $addToSet: "$userId" }
        }
      },
      { $project: {
          _id: 0,
          commandName: "$_id",
          count: 1,
          successCount: 1,
          failureCount: 1,
          successRate: { $multiply: [{ $divide: ["$successCount", "$count"] }, 100] },
          avgExecutionTime: 1,
          uniqueUsers: { $size: "$users" }
        }
      },
      { $sort: { count: -1 } }
    ];
    
    const result = await commandLogs.aggregate(pipeline).toArray();
    return result;
  } catch (err) {
    console.error('[ERROR] 명령어 사용 통계 조회 오류:', err);
    return [];
  }
};

// 오류 통계 조회
const getErrorStats = async (options = {}) => {
  try {
    const matchStage = {};
    
    if (options.errorType) {
      matchStage.errorType = options.errorType;
    }
    
    if (options.startDate && options.endDate) {
      matchStage.timestamp = {
        $gte: new Date(options.startDate),
        $lte: new Date(options.endDate)
      };
    } else if (options.startDate) {
      matchStage.timestamp = { $gte: new Date(options.startDate) };
    } else if (options.endDate) {
      matchStage.timestamp = { $lte: new Date(options.endDate) };
    }
    
    const pipeline = [
      { $match: matchStage },
      { $group: {
          _id: "$errorType",
          count: { $sum: 1 },
          recentErrors: { $push: { message: "$errorMessage", timestamp: "$timestamp" } }
        }
      },
      { $project: {
          _id: 0,
          errorType: "$_id",
          count: 1,
          recentErrors: { $slice: ["$recentErrors", 5] }
        }
      },
      { $sort: { count: -1 } }
    ];
    
    const result = await errorLogs.aggregate(pipeline).toArray();
    return result;
  } catch (err) {
    console.error('[ERROR] 오류 통계 조회 오류:', err);
    return [];
  }
};

// 데이터베이스 연결 종료
const close = async () => {
  try {
    await client.close();
    console.log('[INFO] MongoDB 연결이 종료되었습니다.');
    return true;
  } catch (err) {
    console.error('[ERROR] MongoDB 연결 종료 오류:', err);
    return false;
  }
};

module.exports = {
  connect,
  testConnection,
  logCommand,
  logError,
  createNotification,
  updateNotificationStatus,
  getNotificationsForUser,
  getNotificationsForGuild,
  getCommandStats,
  getErrorStats,
  close
};