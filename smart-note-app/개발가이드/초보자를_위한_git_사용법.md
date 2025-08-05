# 🚀 초보자를 위한 Git 사용법 (아주 쉽게!)

## Git이 뭔가요?
Git은 코드의 변경사항을 기록하고 관리하는 프로그램입니다.
GitHub는 이 코드를 인터넷에 저장하는 서비스입니다.

## 📝 Step 1: Git Bash 열기

### 방법 1: 폴더에서 직접 열기
1. **파일 탐색기**를 엽니다
2. 이 경로로 이동: `C:\Users\ksj\OneDrive\바탕 화면\gemini\제작파일\smart-note-app`
3. 폴더 안 빈 공간에서 **마우스 오른쪽 클릭**
4. **"Git Bash Here"** 클릭

### 방법 2: 시작 메뉴에서 열기
1. Windows 시작 버튼 클릭
2. "Git Bash" 검색
3. Git Bash 실행
4. 다음 명령어 입력:
```bash
cd "/mnt/c/Users/ksj/OneDrive/바탕 화면/gemini/제작파일/smart-note-app"
```

## 📤 Step 2: 코드를 GitHub에 올리기

Git Bash 창에서 다음 명령어를 **한 줄씩** 복사해서 붙여넣기하세요:

### 1️⃣ 현재 상태 확인
```bash
git status
```
빨간색으로 변경된 파일들이 보일 거예요.

### 2️⃣ 모든 파일 추가하기
```bash
git add .
```
(점(.)을 꼭 입력하세요! 모든 파일을 추가한다는 뜻입니다)

### 3️⃣ 커밋하기 (변경사항 저장)
```bash
git commit -m "Vercel 배포 설정 추가"
```
이렇게 하면 변경사항이 기록됩니다.

### 4️⃣ GitHub에 푸시하기 (업로드)
```bash
git push origin main
```

## ⚠️ 문제가 생겼을 때

### "fatal: not a git repository" 오류
```bash
git init
```

### "rejected" 오류가 나올 때
```bash
git pull origin main --rebase
git push origin main
```

### 비밀번호를 물어볼 때
- GitHub 비밀번호가 아니라 **Personal Access Token**이 필요합니다
- 이미 설정되어 있으면 자동으로 푸시됩니다

## ✅ 성공 확인하기

1. 푸시가 성공하면 이런 메시지가 나옵니다:
```
To https://github.com/dreamsee/dream.git
   abc1234..def5678  main -> main
```

2. [github.com/dreamsee/dream](https://github.com/dreamsee/dream) 접속
3. 방금 올린 파일들이 보이면 성공!

## 🎉 마지막 단계: Vercel 확인

1. [vercel.com](https://vercel.com) 접속
2. 자동으로 배포가 시작됩니다
3. 2-3분 후 사이트가 열립니다!

---

## 💡 꿀팁

### Git Bash에서 붙여넣기 방법
- **Shift + Insert** 키
- 또는 마우스 오른쪽 클릭 → Paste

### 명령어 실행 방법
- 명령어 입력 후 **Enter** 키를 누르세요
- 한 줄씩 실행하세요

### 실수했을 때
- 걱정 마세요! 다시 시도하면 됩니다
- `git status`로 현재 상태를 확인하세요