# 노트 정비소 (Note Garage) 🚗✨

AI와 함께하는 실시간 코드 편집 시스템

## 🎯 핵심 기능
- **실시간 AI 채팅**: "배경색을 파란색으로 바꿔줘" → 즉시 적용
- **라이브 미리보기**: 코드 변경사항 실시간 반영
- **스마트노트앱 연동**: 원클릭으로 정비소 입장
- **범용 정비소**: 모든 웹사이트 편집 가능

## 📁 프로젝트 구조
```
note-garage/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── services/       # API 통신
│   │   └── App.tsx
│   └── package.json
├── server/                 # Node.js 백엔드
│   ├── routes/            # API 라우트
│   ├── services/          # Claude 통합
│   └── server.js
└── workspace/             # 작업 공간
    ├── current-note/      # 현재 편집 중인 파일
    └── backups/           # 백업 파일

```

## 🚀 실행 방법
1. 서버: `cd server && npm install && npm start`
2. 클라이언트: `cd client && npm install && npm start`
3. 브라우저에서 http://localhost:3000 접속

## 🔗 스마트노트앱 연동
스마트노트앱에서 "정비소 가기" 버튼으로 원클릭 연동