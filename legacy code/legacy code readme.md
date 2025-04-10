# Legacy code 관련 전문

Legacy code는 사용하지 않는 코드 및 파일을 하나에 모아둔 코드 뭉치입니다.
사용에는 문제는 없으나 현제 제작되는 파일과는 연결이 되어 있지 않습니다.

# 각 파일 설명

## config.json
이전에 github repository를 private 설정해 두었을 당시 임시로 사용했었던 config 파일입니다.
현제는 사용하지 않으며 토큰은 삭제 처리해두었습니다.

또한 config.json를 사용하기 이전에는 .env를 사용하였으며
github에 업로드 되어 있지 않은 .env를 다시 사용중입니다
.env의 예시본은 .env.example을 참고 바랍니다.

## deploy-commands.js
제작 당시 처음에 사용되었던 명령어 등록하는 이벤트 파일입니다.
명령어 등록 및 업데이트에 사용되었으며 현제는 index.js에 병합되었습니다.

## DB
아레 코드 파일 리스트는 기존 PostgreSQL를 사용중인 파일들입니다.
database.js
db_setup.sql
setup_database.js

현제는 Supabase와 MongoDB Atlas으로 이전 및 마이그레이션되었습니다.