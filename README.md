# SOOP Bot
SOOP 라이브 방송 상태를 감지하여 디스코드로 자동 알림을 보내는 봇

![git readme image-001](https://github.com/user-attachments/assets/761f6860-b005-463b-9d4a-061db5340271)

────────────────────────
## [시작 방법]
- Node.js 설치
- start.bat 실행

### 또는 수동 설치
- npm install discord.js
- npm install dotenv
- npm install cheerio
- -node index.js

────────────────────────

## [구성]
- index.js      : 방송 체크 / 알림 전송
- commands.js   : 명령어 처리 / 파싱 / 봇 초기화
- logger.js     : 로그 출력 + 파일 저장
- utils.js      : 파일 / 시간 / 인코딩
- category.json : 방송 카테고리 정보 관리
- config.json   : 스트리머 목록 (ID : 닉네임)
- .env          : 봇 설정

────────────────────────

## [동작 방식]
1. config.json 에서 스트리머 목록 로드
2. 일정 시간마다 SOOP 방송 페이지 크롤링
3. 방송 상태 변화 감지
4. 변경 발생 시 디스코드 채널에 알림 전송

────────────────────────

## [기능]
- 방송 시작 / 진행 / 종료 / 오프라인 감지
- 방송 제목 변경 감지
- 방송 카테고리 변경 감지

### 슬래시 명령어
- /soop    : 특정 스트리머 상태 확인
- /refresh : 설정 및 명령어 새로고침
- /list    : 스트리머 상태 목록 조회

### 기타
- 로그 자동 저장 (logs/YYYY-MM-DD.log)

────────────────────────

## [.env 설정]
- 봇 실행에 필요한 환경 변수 설정

# 봇 토큰
```env
TOKEN=0
```

# 클라이언트 ID
```env
CLIENT_ID=0
```

# 서버 ID
```env
SERVER_ID=0
```

# 채널 ID
```env
CHANNEL_ID=0
```

# 첫 실행 (True / False)
```env
INITIAL=True
```

# 반복 (True / False)
```env
LOOP=True
```

# 딜레이 (1000 = 1초)
```env
DELAY=30000
```

# 상태
- online     : 온라인
- idle       : 자리 비움
- dnd        : 방해 금지
- invisible  : 오프라인 표시

### 설정 값
```env
STATE=online
```

────────────────────────

## [상태]
- 🟢 방송 시작
- 🟢 방송 진행
- 🟡 제목 변경 
- 🔵 카테고리 변경
- 🔴 방송 종료
- ⚫ 오프라인

────────────────────────
