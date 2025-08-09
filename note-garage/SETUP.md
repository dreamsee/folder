# 노트 정비소 설치 및 실행 가이드 🚗

## 🚀 빠른 시작 가이드

### 1단계: 환경 준비
```bash
# Node.js 18+ 설치 확인
node --version
npm --version

# Git 클론 (이미 있다면 생략)
cd 제작파일/note-garage
```

### 2단계: 서버 설정
```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 환경 변수 설정
copy .env.example .env
# .env 파일에서 ANTHROPIC_API_KEY를 실제 Claude API 키로 변경
```

### 3단계: 클라이언트 설정  
```bash
# 새 터미널에서 클라이언트 디렉토리로 이동
cd client

# 의존성 설치
npm install
```

### 4단계: 실행
```bash
# 터미널 1: 서버 실행
cd server
npm start

# 터미널 2: 클라이언트 실행  
cd client
npm start
```

### 5단계: 접속
- 🌐 **노트 정비소**: http://localhost:3000
- 🔧 **API 서버**: http://localhost:3001
- 📝 **스마트노트앱**: 정비소 버튼으로 원클릭 연동!

---

## ⚙️ Claude API 키 설정

1. **Anthropic 계정 생성**: https://console.anthropic.com
2. **API 키 발급**: Console → API Keys → Create Key
3. **환경 변수 설정**:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxx...
   ```

---

## 🧪 테스트 방법

### 기본 워크플로우 테스트
1. **정비소 접속**: http://localhost:3000
2. **AI 채팅**: "배경색을 파란색으로 바꿔줘"
3. **실시간 미리보기**: 변경사항 즉시 확인
4. **파일 저장**: 자동 백업 생성

### 스마트노트앱 연동 테스트
1. 스마트노트앱 실행
2. 우상단 "정비소 가기" 버튼 클릭
3. 새 창에서 정비소 열림
4. AI와 대화하며 노트 꾸미기

---

## 🔧 문제 해결

### 자주 발생하는 오류

**1. API 키 오류**
```
Error: Claude API 오류: Invalid API key
```
→ .env 파일의 ANTHROPIC_API_KEY 확인

**2. 포트 충돌**
```
Error: EADDRINUSE: address already in use :::3001
```
→ 이미 실행 중인 프로세스 종료 또는 포트 변경

**3. 파일 권한 오류**
```
Error: EACCES: permission denied
```
→ workspace 폴더 권한 확인

**4. 클라이언트 연결 실패**
```
Failed to fetch
```
→ 서버가 먼저 실행되었는지 확인

### 로그 확인
- **서버 로그**: 터미널에서 실시간 확인
- **클라이언트 로그**: 브라우저 개발자 도구 → Console
- **파일 백업**: `workspace/backups/` 폴더 확인

---

## 🌟 사용 팁

### AI 채팅 예시
```
"제목을 더 크게 만들어줘"
"배경을 그라데이션으로 바꿔줘"  
"버튼을 중앙에 배치해줘"
"새로운 섹션을 추가해줘"
"모바일에서도 잘 보이게 해줘"
```

### 고급 기능
- **다중 뷰포트**: 데스크톱/태블릿/모바일 미리보기
- **실시간 동기화**: 파일 변경사항 즉시 반영
- **백업 시스템**: 모든 변경사항 자동 백업
- **코드 검증**: AI가 안전성 검사 수행

---

## 📞 지원

문제가 발생하면:
1. **로그 확인**: 터미널과 브라우저 콘솔
2. **환경 체크**: Node.js 버전, API 키, 포트 상태
3. **재시작**: 서버와 클라이언트 모두 재시작

**개발 모드 실행**:
```bash
# 서버
npm run dev

# 클라이언트  
npm start
```

---

## 🎯 다음 단계

정비소가 정상 작동하면:
1. **외부 웹사이트 편집** 기능 추가
2. **템플릿 시스템** 구축
3. **사용자 인증** 시스템 
4. **클라우드 배포** 준비

---

**🚗 즐거운 정비소 경험 되세요! ✨**