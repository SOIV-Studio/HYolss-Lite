require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { WebhookClient, EmbedBuilder } = require('discord.js');

// 환경 변수에서 관리 서버 웹훅 URL 가져오기
const adminWebhookUrl = process.env.ADMIN_WEBHOOK_URL;
const webhookClient = adminWebhookUrl ? new WebhookClient({ url: adminWebhookUrl }) : null;

// 현재 버전 가져오기
function getCurrentVersion() {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        return packageJson.version;
    } catch (error) {
        console.error('[ERROR] 현재 버전 가져오기 실패:', error);
        return null;
    }
}

// GitHub에서 최신 버전 가져오기
function getLatestVersion() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'raw.githubusercontent.com',
            path: '/SOIV-Studio/HYolss-Lite/main/package.json',
            method: 'GET',
            headers: {
                'User-Agent': 'HYolss-Bot-Updater'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const packageJson = JSON.parse(data);
                    resolve(packageJson.version);
                } catch (error) {
                    reject(new Error(`GitHub 패키지 정보 파싱 실패: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`GitHub 최신 버전 확인 실패: ${error.message}`));
        });

        req.end();
    });
}

// GitHub에서 최신 커밋 정보 가져오기
function getLatestCommitInfo() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/repos/SOIV-Studio/HYolss-Lite/commits/main',
            method: 'GET',
            headers: {
                'User-Agent': 'HYolss-Bot-Updater',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    // 응답 데이터 로깅
                    console.log('[DEBUG] GitHub API 응답:', data.substring(0, 500) + '...');
                    
                    const commitInfo = JSON.parse(data);
                    
                    // 응답 구조 확인
                    if (!commitInfo) {
                        return reject(new Error('GitHub API 응답이 비어 있습니다.'));
                    }
                    
                    // API 오류 확인
                    if (commitInfo.message && commitInfo.documentation_url) {
                        return reject(new Error(`GitHub API 오류: ${commitInfo.message}`));
                    }
                    
                    // 필요한 필드 확인
                    if (!commitInfo.commit) {
                        console.log('[DEBUG] 전체 응답 구조:', JSON.stringify(commitInfo, null, 2));
                        return reject(new Error('GitHub API 응답에 commit 필드가 없습니다.'));
                    }
                    
                    resolve({
                        message: commitInfo.commit.message || '커밋 메시지 없음',
                        author: commitInfo.commit.author ? commitInfo.commit.author.name || '작성자 정보 없음' : '작성자 정보 없음',
                        date: commitInfo.commit.author ? new Date(commitInfo.commit.author.date).toLocaleString('ko-KR') : '날짜 정보 없음',
                        url: commitInfo.html_url || 'https://github.com/SOIV-Studio/HYolss-Lite',
                        hash: commitInfo.sha ? commitInfo.sha.substring(0, 7) : '알 수 없음' // 커밋 해시 추가 (7자리로 축약)
                    });
                } catch (error) {
                    console.error('[ERROR] GitHub 커밋 정보 파싱 실패:', error);
                    console.error('[ERROR] 원본 데이터:', data);
                    reject(new Error(`GitHub 커밋 정보 파싱 실패: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('[ERROR] GitHub API 요청 실패:', error);
            reject(new Error(`GitHub 커밋 정보 확인 실패: ${error.message}`));
        });

        // 타임아웃 설정
        req.setTimeout(10000, () => {
            req.abort();
            reject(new Error('GitHub API 요청 타임아웃'));
        });

        req.end();
    });
}

// 버전 비교 (semver 형식: x.y.z)
function isNewerVersion(current, latest) {
    if (!current || !latest) return false;
    
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
        if (latestParts[i] > currentParts[i]) return true;
        if (latestParts[i] < currentParts[i]) return false;
    }
    
    return false; // 버전이 동일한 경우
}

// 관리 서버에 로그 전송
async function sendLogToAdminServer(message, isError = false) {
    console.log('--------------------------------------------');
    console.log('[DEBUG] sendLogToAdminServer 실행됨');
    console.log('[DEBUG] ADMIN_WEBHOOK_URL:', process.env.ADMIN_WEBHOOK_URL);
    console.log('[DEBUG] webhookClient 존재 여부:', !!webhookClient);
    console.log('[DEBUG] 전송할 메시지:', message);

    if (!webhookClient) {
        console.log('[INFO] 관리 서버 웹훅이 설정되지 않았습니다. 로그 전송을 건너뜁니다.');
        console.log('--------------------------------------------');
        return;
    }

    try {
        await webhookClient.send({
            content: isError ? `⚠️ **오류**: ${message}` : `🔄 **업데이트**: ${message}`,
            username: 'HYolss 업데이트 시스템',
            avatarURL: 'https://github.com/SOIV-Studio/HYolss-Lite/raw/main/assets/logo.png'
        });

        console.log('[DEBUG] 웹훅 전송 성공!');
    } catch (error) {
        console.error('[ERROR] 웹훅 전송 중 오류 발생:', error);
    }

    console.log('--------------------------------------------');
}

/*
async function sendLogToAdminServer(message, isError = false) {
    if (!webhookClient) {
        console.log('[INFO] 관리 서버 웹훅이 설정되지 않았습니다. 로그 전송을 건너뜁니다.');
        return;
    }

    try {
        await webhookClient.send({
            content: isError ? `⚠️ **오류**: ${message}` : `🔄 **업데이트**: ${message}`,
            username: 'HYolss 업데이트 시스템',
            avatarURL: 'https://github.com/SOIV-Studio/HYolss-Lite/raw/main/assets/logo.png'
        });
    } catch (error) {
        console.error('[ERROR] 관리 서버에 로그 전송 실패:', error);
    }
}
*/

// 명령 실행 함수
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`명령 실행 실패: ${error.message}\n${stderr}`));
                return;
            }
            resolve(stdout);
        });
    });
}

// 업데이트 프로세스 실행
async function runUpdateProcess() {
    try {
        // 1. 현재 버전과 최신 버전 확인
        const currentVersion = getCurrentVersion();
        const latestVersion = await getLatestVersion();
        
        // 최신 커밋 정보 가져오기
        let commitInfo = null;
        try {
            commitInfo = await getLatestCommitInfo();
            console.log('[INFO] 최신 커밋 정보:', commitInfo);
        } catch (error) {
            console.error('[ERROR] 최신 커밋 정보 가져오기 실패:', error);
            // 오류가 발생해도 업데이트 프로세스는 계속 진행
            commitInfo = {
                message: '커밋 정보를 가져올 수 없습니다',
                author: '알 수 없음',
                date: new Date().toLocaleString('ko-KR'),
                url: 'https://github.com/SOIV-Studio/HYolss-Lite',
                hash: '알 수 없음'
            };
        }
        
        console.log(`[INFO] 현재 버전: ${currentVersion}, GitHub 버전: ${latestVersion}`);
        
        // 2. 버전 비교
        if (!isNewerVersion(currentVersion, latestVersion)) {
            console.log('[INFO] 이미 최신 버전입니다. 업데이트가 필요하지 않습니다.');
            return false;
        }
        
        // 3. 관리 서버에 업데이트 시작 로그 전송
        if (webhookClient) {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🔄 업데이트 시작')
                .addFields(
                    { name: '현재 버전', value: currentVersion || '알 수 없음', inline: true },
                    { name: 'GitHub 버전', value: latestVersion || '알 수 없음', inline: true }
                )
                .setTimestamp();
            
            if (commitInfo) {
                embed.addFields(
                    { name: '최신 커밋 메시지', value: commitInfo.message || '알 수 없음' },
                    { name: '커밋 해시', value: commitInfo.hash || '알 수 없음', inline: true },
                    { name: '커밋 작성자', value: commitInfo.author || '알 수 없음', inline: true },
                    { name: '커밋 날짜', value: commitInfo.date || '알 수 없음', inline: true }
                )
                .setURL(commitInfo.url || 'https://github.com/SOIV-Studio/HYolss-Lite');
            }
            
            await webhookClient.send({
                username: 'HYolss 업데이트 시스템',
                avatarURL: 'https://github.com/SOIV-Studio/HYolss-Lite/raw/main/assets/logo.png',
                embeds: [embed]
            });
        } else {
            console.log('[INFO] 관리 서버 웹훅이 설정되지 않았습니다. 로그 전송을 건너뜁니다.');
        }
        
        // 4. 점검 모드 실행 (system-maintenance.js)
        console.log('[INFO] 점검 모드로 전환 중...');
        const maintenanceProcess = exec('node system-maintenance.js');
        
        // 5. 잠시 대기 (점검 모드가 시작될 시간 부여)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // 6. Git pull 명령 실행
        console.log('[INFO] GitHub에서 최신 코드 가져오는 중...');
        await sendLogToAdminServer(`GitHub에서 최신 코드 가져오는 중...`);
        
        try {
            const gitOutput = await executeCommand('git pull origin main');
            console.log('[INFO] Git pull 결과:', gitOutput);
            await sendLogToAdminServer(`Git pull 완료: ${gitOutput.trim()}`);
        } catch (gitError) {
            console.error('[ERROR] Git pull 실패:', gitError);
            await sendLogToAdminServer(`Git pull 실패: ${gitError.message}`, true);
            throw gitError;
        }
        
        // 7. npm 패키지 업데이트 (필요한 경우)
        console.log('[INFO] 의존성 패키지 업데이트 중...');
        await sendLogToAdminServer(`의존성 패키지 업데이트 중...`);
        
        try {
            const npmOutput = await executeCommand('npm install');
            console.log('[INFO] npm install 결과:', npmOutput);
            await sendLogToAdminServer(`패키지 업데이트 완료`);
        } catch (npmError) {
            console.error('[ERROR] npm install 실패:', npmError);
            await sendLogToAdminServer(`패키지 업데이트 실패: ${npmError.message}`, true);
            throw npmError;
        }
        
        // 8. 점검 모드 종료 및 메인 봇 재시작
        console.log('[INFO] 점검 모드 종료 및 메인 봇 재시작 중...');
        await sendLogToAdminServer(`업데이트 완료. 버전 ${currentVersion} → ${latestVersion}으로 봇 재시작 중...`);
        
        // 점검 모드 프로세스 종료
        if (maintenanceProcess && maintenanceProcess.pid) {
            process.kill(maintenanceProcess.pid);
        }
        
        // 메인 봇 재시작
        setTimeout(() => {
            const mainProcess = exec('node index.js');
            mainProcess.stdout.on('data', (data) => {
                console.log(data);
            });
            mainProcess.stderr.on('data', (data) => {
                console.error(data);
            });
        }, 2000);
        
        return true;
    } catch (error) {
        console.error('[ERROR] 업데이트 프로세스 실패:', error);
        await sendLogToAdminServer(`업데이트 프로세스 실패: ${error.message}`, true);
        
        // 오류 발생 시 메인 봇 재시작
        setTimeout(() => {
            exec('node index.js');
        }, 5000);
        
        return false;
    }
}

// 자동 업데이트 체크 (주기적으로 실행)
function scheduleUpdateCheck(intervalHours = 6) { // 6시간에서 12시간으로 변경
    console.log(`[INFO] 자동 업데이트 체크 예약됨: 봇 시작 1분 후 첫 체크, 이후 ${intervalHours}시간마다 체크`);
    
    // 초기 실행
    setTimeout(async () => {
        console.log('[INFO] 자동 업데이트 첫 체크 실행 중...');
        await runUpdateProcess();
        
        // 주기적 실행 설정
        const intervalId = setInterval(async () => {
            console.log(`[INFO] 자동 업데이트 정기 체크 실행 중... (${intervalHours}시간 간격)`);
            await runUpdateProcess();
        }, intervalHours * 60 * 60 * 1000);
        
        // 인터벌 ID 로깅 (디버깅용)
        console.log(`[DEBUG] 업데이트 체크 인터벌 ID: ${intervalId}`);
    }, 60 * 1000); // 봇 시작 1분 후 첫 체크
}

module.exports = {
    getCurrentVersion,
    getLatestVersion,
    getLatestCommitInfo,
    isNewerVersion,
    runUpdateProcess,
    scheduleUpdateCheck,
    sendLogToAdminServer
};