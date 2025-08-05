# Smart Note App - Vercel 배포 가이드

## 1단계: 사전 준비

### 필요한 것들:
- GitHub 계정 (코드 저장소용)
- Vercel 계정 (무료 가입)
- Supabase 프로젝트 (이미 사용 중)

## 2단계: GitHub에 코드 업로드

1. GitHub에서 새 저장소 생성
   - Repository name: `smart-note-app`
   - Public 선택 (무료 호스팅용)

2. 로컬 프로젝트를 GitHub에 연결:
```bash
cd /mnt/c/Users/ksj/OneDrive/바탕\ 화면/gemini/제작파일/smart-note-app

# Git 초기화 (아직 안했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: Smart Note App"

# GitHub 저장소 연결
git remote add origin https://github.com/YOUR_USERNAME/smart-note-app.git

# 코드 푸시
git push -u origin main
```

## 3단계: Vercel 설정

1. [vercel.com](https://vercel.com) 접속 후 로그인
2. "New Project" 클릭
3. GitHub 연동 및 `smart-note-app` 저장소 선택
4. 프레임워크는 자동으로 "Create React App" 감지됨
5. 환경 변수 설정:

### 환경 변수 추가하기:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4단계: 빌드 설정

Vercel은 자동으로 다음 설정을 사용합니다:
- Build Command: `npm run build`
- Output Directory: `build`
- Install Command: `npm install`

## 5단계: 배포

1. "Deploy" 버튼 클릭
2. 첫 배포는 2-3분 소요
3. 완료되면 자동으로 URL 생성됨:
   - 예: `https://smart-note-app.vercel.app`

## 6단계: 환경 변수 보안 설정

### .env.local 파일 생성 (로컬 개발용):
```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### .gitignore에 추가:
```
.env.local
```

## 자동 배포 설정

GitHub에 코드를 푸시할 때마다 자동으로 재배포됩니다:
```bash
git add .
git commit -m "Update features"
git push
```

## 커스텀 도메인 설정 (선택사항)

1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Domains
3. 커스텀 도메인 추가
4. DNS 설정 안내 따르기

## 성능 최적화 팁

1. **이미지 최적화**: Vercel의 자동 이미지 최적화 활용
2. **캐싱**: 정적 자산에 대한 캐싱 헤더 자동 설정됨
3. **CDN**: 전 세계 엣지 네트워크 자동 활용

## 모니터링

Vercel 대시보드에서 확인 가능:
- 실시간 방문자 수
- 성능 메트릭
- 빌드 로그
- 함수 사용량

## 문제 해결

### 빌드 실패 시:
1. Vercel 대시보드에서 빌드 로그 확인
2. 로컬에서 `npm run build` 테스트
3. TypeScript 에러 확인

### 환경 변수 문제:
1. Vercel 대시보드 → Settings → Environment Variables
2. 변수명이 `REACT_APP_`으로 시작하는지 확인
3. 재배포 필요

## 대안: Netlify 배포

Netlify를 선호한다면:
1. [netlify.com](https://netlify.com) 가입
2. GitHub 연동
3. 동일한 환경 변수 설정
4. 자동 배포 완료

---

이제 smart-note-app이 전 세계 어디서든 접속 가능합니다! 🌍