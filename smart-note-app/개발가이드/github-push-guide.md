# GitHub 푸시 및 Vercel 재배포 가이드

## 현재 상황
- Git 저장소: 이미 초기화됨 ✅
- 원격 저장소: `dreamsee/dream` 연결됨 ✅
- 변경사항: 커밋 대기 중

## 1단계: 변경사항 커밋하기

### smart-note-app 관련 파일만 추가:
```bash
cd "/mnt/c/Users/ksj/OneDrive/바탕 화면/gemini/제작파일/smart-note-app"

# smart-note-app 파일들만 추가
git add .env.example
git add vercel.json
git add vercel-deployment-guide.md
git add src/
git add "*.md"
git add "*.sql"
git add package.json
git add package-lock.json
git add tsconfig.json
git add public/
git add .gitignore

# 또는 모든 현재 디렉토리 파일 추가 (다른 프로젝트 제외)
git add .

# 커밋
git commit -m "feat: Vercel 배포 설정 추가 및 프로젝트 업데이트"
```

## 2단계: GitHub에 푸시

```bash
git push origin main
```

만약 오류가 발생하면:
```bash
# 강제 푸시 (주의: 기존 코드 덮어쓸 수 있음)
git push -f origin main

# 또는 pull 후 병합
git pull origin main --rebase
git push origin main
```

## 3단계: Vercel에서 재배포 확인

1. [vercel.com](https://vercel.com) 접속
2. 프로젝트 대시보드 확인
3. 자동 재배포 시작됨 (2-3분 소요)
4. 배포 완료 후 제공된 URL로 접속

## 트러블슈팅

### GitHub 토큰 만료 시:
1. GitHub → Settings → Developer settings → Personal access tokens
2. 새 토큰 생성
3. 원격 URL 업데이트:
```bash
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/dreamsee/dream.git
```

### Vercel 연동 문제:
1. Vercel 대시보드 → Settings → Git
2. GitHub 저장소 재연결
3. 수동 재배포: "Redeploy" 버튼 클릭

### 환경 변수 확인:
Vercel 대시보드에서 반드시 설정:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

## 성공 확인 체크리스트
- [ ] GitHub에 코드 푸시 완료
- [ ] Vercel 빌드 성공
- [ ] 환경 변수 설정 확인
- [ ] 배포된 URL 접속 가능
- [ ] 404 오류 해결됨