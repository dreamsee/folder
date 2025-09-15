# 달력 가계부

달력 인터페이스를 활용한 간편한 가계부 애플리케이션입니다.

## 주요 기능

### 📅 달력 기능
- 월별 달력 보기
- 지출이 있는 날짜 시각적 표시
- 일별 총 지출 금액 표시

### 💰 지출 관리
- 카테고리별 지출 분류 (식비, 자동차, 주차비, 보험료 등)
- 접기/펼치기 기능으로 상세 내역 확인
- 월별 지출 요약

### 🛍️ 특정 물품 구입 기록
- TV, 휴대폰 등 특별한 구입 기록
- 구입 날짜와 가격 저장
- 별도 목록으로 관리

### 💾 데이터 저장
- 브라우저 로컬스토리지 활용
- 데이터 영구 보존 (브라우저 데이터 삭제 전까지)

## 사용 방법

1. **지출 추가**
   - 우측 패널에서 항목명, 카테고리, 금액, 날짜 입력
   - '추가' 버튼 클릭

2. **특정 물품 구입 기록**
   - 물품명, 구입가격, 구입날짜 입력
   - '기록' 버튼 클릭

3. **월별 조회**
   - 달력 상단의 < > 버튼으로 월 이동
   - 카테고리별 접기/펼치기로 상세 내역 확인

## 무료 서버 배포 방법

### 1. GitHub Pages
```bash
# GitHub 저장소 생성 후
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/calendar-expense-tracker.git
git push -u origin main

# GitHub Pages 활성화
# Settings > Pages > Source: Deploy from a branch > main
```

### 2. Netlify
1. [Netlify](https://netlify.com) 가입
2. 프로젝트 폴더를 드래그&드롭으로 배포
3. 자동으로 URL 생성됨

### 3. Vercel
```bash
npm install -g vercel
vercel --prod
```

### 4. Surge.sh
```bash
npm install -g surge
surge
```

## 로컬 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 또는 간단한 서버 실행
npm start
```

## 파일 구조

```
달력 가계부/
├── index.html          # 메인 HTML 파일
├── style.css           # 스타일시트
├── script.js           # JavaScript 로직
├── package.json        # 프로젝트 설정
└── README.md           # 이 파일
```

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **저장소**: LocalStorage
- **배포**: GitHub Pages / Netlify / Vercel

## 브라우저 지원

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 라이선스

MIT License