# 🖼️ 이미지 추가하는 방법

## 📋 방법 1: 드래그 앤 드롭 (가장 쉬운 방법)

1. `npm run dev`로 서버 실행
2. 브라우저에서 오른쪽 컨트롤 패널의 "이미지를 드래그하여 추가" 영역에 이미지 파일을 끌어다 놓기
3. 자동으로 새 레이어로 추가됨

**지원 형식**: JPG, PNG, GIF, WebP

---

## 📁 방법 2: 키뷰 세트로 추가 (권장)

### 폴더 구조
```
public/assets/
├── keyviews/
│   ├── keyview-0.json    # 정면 (0도)
│   ├── keyview-90.json   # 우측 (90도)  
│   ├── keyview-180.json  # 후면 (180도)
│   └── keyview-270.json  # 좌측 (270도)
└── images/
    ├── character_front_body.png
    ├── character_front_head.png
    ├── character_right_body.png
    └── ...
```

### 키뷰 JSON 파일 예시
```json
{
  "angle": 0,
  "layers": [
    {
      "id": "body",
      "vertices": [-0.3, -0.5, 0.3, -0.5, 0.3, 0.2, -0.3, 0.2],
      "uv": [0, 1, 1, 1, 1, 0, 0, 0],
      "textureUrl": "/assets/images/character_front_body.png",
      "color": [1.0, 0.8, 0.6, 1.0],
      "zIndex": 1
    },
    {
      "id": "head", 
      "vertices": [-0.2, 0.1, 0.2, 0.1, 0.2, 0.6, -0.2, 0.6],
      "uv": [0, 1, 1, 1, 1, 0, 0, 0],
      "textureUrl": "/assets/images/character_front_head.png",
      "color": [1.0, 0.9, 0.7, 1.0],
      "zIndex": 2
    }
  ]
}
```

### 필드 설명
- **id**: 레이어 고유 식별자
- **vertices**: 사각형 좌표 [x1,y1, x2,y2, x3,y3, x4,y4] (-1~1 범위)
- **uv**: 텍스처 좌표 [u1,v1, u2,v2, u3,v3, u4,v4]
- **textureUrl**: 이미지 파일 경로
- **color**: RGBA 색상 (옵션)
- **zIndex**: 깊이 순서 (낮을수록 뒤)

---

## 🎨 방법 3: 코드로 직접 추가

`src/main.ts`의 `createDummyKeyView` 함수를 수정:

```typescript
private async loadDefaultKeyViews() {
    try {
        // 실제 키뷰 파일 로드
        const keyView0 = await this.loader.loadKeyView('/assets/keyviews/keyview-0.json');
        const keyView90 = await this.loader.loadKeyView('/assets/keyviews/keyview-90.json');
        const keyView180 = await this.loader.loadKeyView('/assets/keyviews/keyview-180.json');
        const keyView270 = await this.loader.loadKeyView('/assets/keyviews/keyview-270.json');
        
        this.keyViews.set(0, keyView0);
        this.keyViews.set(90, keyView90);
        this.keyViews.set(180, keyView180);
        this.keyViews.set(270, keyView270);
    } catch (error) {
        console.warn('키뷰 로드 실패, 더미 데이터 사용:', error);
        // 더미 데이터 폴백
        const angles = [0, 90, 180, 270];
        for (const angle of angles) {
            const keyView = this.createDummyKeyView(angle);
            this.keyViews.set(angle, keyView);
        }
    }
}
```

---

## 🖼️ 이미지 준비 가이드

### 권장 사양
- **해상도**: 512x512px ~ 1024x1024px
- **형식**: PNG (투명 배경 지원)
- **파일 크기**: 500KB 이하
- **색상**: sRGB

### 레이어 분리 팁
1. **배경**: 고정 배경 요소
2. **몸통**: 주요 형태
3. **머리**: 별도 레이어로 Z-순서 제어
4. **팔**: 회전시 가림 처리를 위해 분리
5. **액세서리**: 추가 커스터마이징 요소

### 키뷰 각도별 가이드라인
- **0° (정면)**: 대칭적, 모든 파츠 보임
- **90° (우측)**: 오른쪽 측면, 팔 순서 변경
- **180° (후면)**: 뒷모습, 일부 파츠 숨김
- **270° (좌측)**: 왼쪽 측면, 팔 순서 반대

---

## 🔧 트러블슈팅

### 이미지가 안 보여요
1. 파일 경로 확인: `/assets/images/` 경로가 맞는지
2. 브라우저 개발자 도구에서 404 에러 확인
3. 이미지 형식이 지원되는지 확인

### 이미지가 깨져 보여요
1. vertices 좌표가 -1~1 범위인지 확인
2. uv 좌표가 0~1 범위인지 확인
3. 종횡비 고려해서 vertices 조정

### 순서가 이상해요
1. zIndex 값 확인 (낮을수록 뒤)
2. 레이어 ID가 고유한지 확인

---

## ⚡ 성능 최적화 팁

- **텍스처 크기**: 1024x1024 이하 권장
- **압축**: TinyPNG 등으로 압축
- **형식**: WebP 사용 고려 (최신 브라우저)
- **아틀라스**: 여러 텍스처를 하나로 합치기

---

## 🎯 예제 파일

`public/assets/keyviews/example-keyview-0.json` 파일이 생성되어 있으니 참고하세요!

실제 이미지 파일만 준비해서 `public/assets/images/` 폴더에 넣으면 바로 작동합니다.