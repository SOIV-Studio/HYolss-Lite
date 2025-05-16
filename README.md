# HYolss Lite (from HYolss Project) [Discord BOT]

HYolss Project의 HYolss Lite에 오신것을 환영합니다!

HYolss는 처음에는 개인 즉 재가 사용하려고 제작을 시작했던 디스코드 봇입니다.

그러나 지금 개발중인 봇이 너무나도 거대해저 무료 자원으로 봇을 운영하기 힘든 상황에 노여 다음과 같은 Lite버전이 나오게 되었습니다.

이 디스코드 봇은 누구나 사용가능하고 누구나 직접 봇을 구동하실 수 있어요!

디스코드 봇 추가는 아레 링크에서 가능합니다.

[Discord Bot Add Link](https://discord.com/oauth2/authorize?client_id=888061096441819166)

- HYolss Discord Bot Info
    * Discord API : Discord.js
    * Languages : node.js(JavaScript)
    * locales : ko_KR
        - 다국어 지원은 Lite 버전에서 지원 예정이 없습니다.
    * version : lite-3.3.1
        - 현재는 Releases 버전만 제공중이며 Beta 버전은 지원 예정이 없습니다.
    * Hosting Server : Lite버전의 디스코드 봇은 [Railway](https://railway.com/)에서 운영중입니다.
        - 24/7 운영 중 / 상시 무료 서비스 사용중
        - Lite 버전은 지속적인 장기간 운영을 시행중입니다!

## Community[커뮤니티]

<div align="center">
  <a href="https://discord.gg/tVnhbaB9yY">
    <img src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
  </a>
  <a href="https://x.com/SOIV_Studio">
    <img src="https://img.shields.io/badge/X-%23000000.svg?style=for-the-badge&logo=X&logoColor=white" alt="X">
  </a>
  <a href="https://instagram.com/DocuVerseOfficial">
    <img src="https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white" alt="Instagram">
  </a>
  <a href="https://youtube.com/@SOIV_Studio_official">
    <img src="https://img.shields.io/badge/YouTube-%23FF0000.svg?style=for-the-badge&logo=YouTube&logoColor=white" alt="YouTube">
  </a>
</div>

## announcements 📢

이 봇은 HYolss의 Lite 버전. 즉 일부 분리된 버전임을 말합니다.

개발중인 봇의 레포는 아레 링크에서 확인해주세요

https://github.com/SOIV-Studio/HYolss

---
아쉽개도 Lite 버전에서도 Docker파일은 제공되지 않습니다.

추후 별도로 제공될 예정은 있을 수 있으나 지금은 제공되지 않습니다.

## Features[특징] 🎉

- 오늘의 시리즈!
    * 이 시리즈에는 이스터에그가 존제해요! 명령어를 입력하고 같은 확률에 따라 나타나는 이스터에그를 확인해보세요!
    * '/오늘의메뉴'
        - 무엇을 먹을지 고민되시나요? '/오늘의메뉴'를 통하여 메뉴를 정해보세요!
        - '/오늘의메뉴'에는 지금까지 등록된 음식의 종료는 총 119개가 있어요!
    * '/오늘의편의점'
        - 편의점을 갔는데 오늘은 무엇을 사갈지 고민되시나요? '/오늘의편의점'을 통하여 선택해보세요!
        - '/오늘의편의점'에는 지금까지 등록된 리스트는 총 11개가 있어요!
        - GS25, CU, 7-ELEVEn 등의 공통된 메뉴들을 지원하고 있습니다.
    * 메뉴를 추가 하고 싶다면 '/메뉴추가' 를 사용하여 추가해보세요!
        - 현재는 명령어가 개발자 전용으로 제작되어 있지만 추후 배포 버전으로 수정하여 업데이트 예정이에요!
- 업데이트 / 자동 업데이트 기능
    * 봇을 가저와서 직접 돌리고 있는데 업데이트가 생길때마다 일일이 봇의 업데이트를 하기 귀찬으시죠? 그래서 제가 기능을 만들어 드렸습니다!
    * '/updete' 명령어를 통하여 디스코드에서 업데이트를 해보세요!
    * 이 기능을 사용하기전 .env에서 디스코드 웹훅 링크를 꼭 추가해주세요!
        - 업데이트가 작동하는 로그를 확인 하실 수 있습니다.
    * **Lite 버전에서는 자동 업데이트 기능를 지원하지 않습니다.**

## Setup 🛠️

### Prerequisites[필수 조건] 📦

Make sure you have the following installed:

- npm (Node Package Manager)
- node.js Version : v22.14.0 or above
- Discord.js Version : v14.18.0 or above
- Database(DB) Version :
    * Supabase (PostgreSQL 기반)
    * MongoDB Atlas (NoSQL)

### Development Mode 🔧

1. .env에서 구동할 Dev 봇의 대한 토큰을 입력합니다:

    [.env.example #6~9](.env.example)
    ```bash
    # Development Bot Token
    DEV_DISCORD_TOKEN=your_dev_token_here
    DEV_DISCORD_CLIENT_ID=your_dev_client_id_here
    DEV_DISCORD_GUILD_ID=your_dev_guild_id_here
    ```

2. 구동전 .env에서 다음과 같이 'NODE_ENV' 설정을 합니다:

    [.env.example #11~12](.env.example)
    ```bash
    # Environment Flag (set to 'development' or 'production')
    NODE_ENV=development
    ```

3. 필요한 종속성을 설치합니다:

   ```bash
   npm install
   ```

4. 개발 모드에서 봇을 실행합니다:

   ```bash
   node index.js

   and

   NODE_ENV=development node index.js
   ```

---

### Production Mode 💥

1. .env에서 구동할 Dev 봇의 대한 토큰을 입력합니다:

    [.env.example #1~4](.env.example)
    ```bash
    # Main Bot Token (Production)
    DISCORD_TOKEN=your_main_token_here
    DISCORD_CLIENT_ID=your_main_client_id_here
    DISCORD_GUILD_ID=your_main_guild_id_here
    ```

2. 구동전 .env에서 다음과 같이이 'NODE_ENV' 설정을 합니다:

    [.env.example #11~12](.env.example)
    ```bash
    # Environment Flag (set to 'development' or 'production')
    NODE_ENV=Production
    ```

3. 필요한 종속성을 설치합니다:

   ```bash
   npm install
   ```

4. Production 모드에서 봇을 실행합니다:

   ```bash
   node index.js

   and

   NODE_ENV=Production node index.js
   ```

## Usage[사용법] ⚙️

- Setup을 하여 디스코드 서버에 본인만의 봇을 초대하여 명령어를 입력하여 사용해보세요!
- 그 이외에 별다른 사용법은 없습니다 😄

## To-Do 📝

- [ ] 오프닝 인사 방식 수정
    * 라이트 버전에 맞는 방식으로 수정 예정
    * 기존에 사용하는 방식에 사용중인 DB 연동 제외
    * 서버 입장 오프닝 인사는 단일 한개로 변경
- [ ] auto-updater / updater
    * 월래라면 라이트 버전에 맞게 업데이트 시스템도 삭제를 해야 맞다고 생각하지만 만약을 위해 남김
    * 근대 자동 업데이트는 삭제 하고 사용자가 업데이트 요청을 하면 업데이트가 작동하는 방식으로 수정할듯
        - 이유 : 라이트 버전이라 메모리에 부담이 없어야 되는데 자동 업데이트가 작동중일때 기능 작동에 부담이 갈 수 있어서
    * [조건부 수정] ~~버전이 똑같더라도 깃허브 해쉬가 동일하지 않으면 업데이트 실행~~
        - 이거 강재 업데이트 명령어 안되던거 수정해서 버전이 같더라도 업데이트 작동하도록 수정됨
    * [조건부 수정] 깃허브 레포가 private의 조건 작업(PAT(Personal Access Token) 작업)
        - Lite 버전의 레포는 private으로 전환할 예정이 아에 없음
        - 추후 작업때에 같이 업데이트로 수정될 듯
- commands\default\help.js 관련 작업 필요
    * 깃북에서도 작업중이지만 별도 간단한 설명을 해줄수 있는 명령어가 필요
- [ ] random-words-store의 DB?
    * 기존 내부에 txt 파일에 저장된 내용을 불러오는 방식에서 DB에서 불러오는 방식으로 교채 하는 것도 생각중.
        - 사유: Lite 버전과 메인 버전의 음식 등록되는 단어 개수의 싱크를 맞추기 위해
        - 작업 확정 / txt 파일에서 supabase으로 이전 작업 준비중 / 기존 레포에서 적용 후 Lite에 적용 예정

## Contributing[기어] 💖

개발 및 계획중인 HYolss Project의 Lite 버전이므로 이 프로젝트의 기어는 다음과 같이 해주실 수 있어요!

1. 여러분들이 알고 있는 음식 메뉴들을 추가해보세요!
    - 추가 해주신 메뉴들은 한차레 확인 이후 메뉴를 추가해 드립니다!
    - 한국에 있는 음식이외에도 추가해보세요!
2. 한국어 이외에도 사용을 할 수 있도록 하고 싶으시면 저에게 개인적으로 메일을 보네주세요!
    - 보네주신 메일에는 포트폴리오와 작업하고 싶으신 언어들과 사유를 보네주시면 확인후 답장을 드림니다.
    - 메일은 여기로! 'biz@soiv-studio.xyz'
3. 디스코드 말고도 다른 플렛폼에서 사용을 원하신가요?
    - 메일로 플렛폼 이름과 사유를 알려주세요, API 및 봇 사용이 가능한지 여부에 따라 가능 여부가 달라짐니다!
    - 메일은 여기로! 'biz@soiv-studio.xyz'

가이드라인과 각종 문서는 Lite 버전에서 제공되지 않아요!

??? : 너무 Lite해서 가이드라인과 각종 문서가 필요없지 않나? 💖~

---

### FAQs ❓

**1. What operating system does HYolss support?**

> **Windows**, **Ubuntu**, **Linux**

---

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

(KR) 이 프로젝트 및 레포는 MIT 라이센스를 따라갑니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 확인 해주세요.

SOIV_Studio-Project_BOT-C_2020~2025