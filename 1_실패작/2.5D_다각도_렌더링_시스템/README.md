# 🎨 2.5D 다각도 렌더링 시스템

실시간 2.5D 다각도 렌더링 시스템으로, 키뷰 이미지들을 보간하여 360도 회전 뷰를 생성합니다.

## ✨ 주요 기능

- **실시간 360도 회전**: 마우스 드래그 또는 슬라이더로 부드러운 회전
- **키뷰 보간**: 4방향(0°, 90°, 180°, 270°) 키뷰 간 선형 보간
- **WebGL2 렌더링**: 하드웨어 가속 렌더링으로 60fps 목표
- **반응형 UI**: 데스크톱 및 모바일 지원
- **성능 모니터링**: 실시간 FPS, 레이어 수, 드로우콜 표시
- **애니메이션 제어**: 자동 회전 재생/일시정지/리셋
- **레이어 관리**: 개별 레이어 가시성 제어

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속

### 3. 빌드
```bash
npm run build
```

## 🎮 사용법

### 기본 조작
- **마우스 드래그**: 캔버스에서 좌우로 드래그하여 회전
- **터치 드래그**: 모바일에서 터치로 회전
- **각도 슬라이더**: 정확한 각도 설정 (0°-360°)

### 애니메이션 제어
- **재생**: 자동 회전 시작
- **일시정지**: 애니메이션 멈춤
- **리셋**: 0도로 초기화

### 렌더링 모드
- **와이어프레임**: 메시 구조 표시
- **텍스처**: 기본 렌더링 모드
- **혼합**: 와이어프레임 + 텍스처

## 🏗️ 아키텍처

```
src/
├── main.ts                 # 메인 시스템 진입점
├── renderer/
│   └── WebGLRenderer.ts    # WebGL2 렌더링 엔진
├── core/
│   └── KeyViewLoader.ts    # 키뷰 데이터 로더
├── interpolation/
│   └── LinearInterpolator.ts # 선형 보간 알고리즘
├── animation/
│   └── AnimationController.ts # 애니메이션 제어
├── ui/
│   └── UIController.ts     # UI 인터랙션 관리
└── utils/
    └── PerformanceMonitor.ts # 성능 모니터링
```

## 🎯 현재 구현 상태

### ✅ 완료된 기능
- WebGL2 기반 렌더링 파이프라인
- 4방향 키뷰 시스템 (더미 데이터)
- 선형 보간 알고리즘
- 마우스/터치 드래그 인터랙션
- 실시간 성능 모니터링
- 애니메이션 제어
- 반응형 UI

### 🚧 진행 중
- 실제 이미지 텍스처 지원
- 드래그 앤 드롭 파일 업로드
- 고급 보간 알고리즘 (ARAP, RBF)

### 📋 향후 계획
- Z-순서 자동 전환
- 텍스처 블렌딩
- 파츠별 커스터마이징
- 애니메이션 시퀀스

## 🔧 기술 스택

- **렌더링**: WebGL2
- **언어**: TypeScript
- **번들러**: Vite
- **수학**: 자체 구현 (gl-matrix 준비)
- **UI**: Vanilla JavaScript + CSS

## 📊 성능 목표

- **FPS**: 60fps 안정적 유지
- **로딩**: <3초 초기 로딩
- **메모리**: <100MB 모바일
- **지연시간**: <16ms 인터랙션 응답

## 🛠️ 개발 가이드

### 새 키뷰 추가
```typescript
const keyView = {
    angle: 45,
    layers: [
        {
            id: 'body',
            vertices: new Float32Array([...]),
            uvs: new Float32Array([...]),
            texture: await createImageBitmap(blob),
            zIndex: 0
        }
    ]
};
```

### 커스텀 보간 알고리즘
```typescript
class CustomInterpolator extends LinearInterpolator {
    interpolate(kv1, kv2, t) {
        // 커스텀 로직 구현
        return super.interpolate(kv1, kv2, t);
    }
}
```

## 🐛 알려진 이슈

- 텍스처 로딩이 아직 더미 데이터
- 모바일에서 성능 최적화 필요
- Z-순서 전환 미구현

## 📄 라이선스

MIT License

## 🤝 기여

이슈 리포트나 풀 리퀘스트는 언제나 환영입니다!

---

**현재 버전**: 1.0.0 (MVP)  
**마지막 업데이트**: 2025-08-20