# 2.5D 다각도 렌더링 시스템 아키텍처

## 📊 전체 아키텍처 개요

```
[데이터 준비]        [각도 계산]         [형태 보간]
    ↓                    ↓                   ↓
키뷰 로딩 ──→ 인접 키뷰 선택 ──→ 메쉬 변형 계산
    ↓                    ↓                   ↓
파츠 분리        보간 비율(t)         ARAP/RBF 적용
    ↓                    ↓                   ↓
[텍스처 합성]      [Z-순서 처리]        [최종 출력]
    ↓                    ↓                   ↓
UV 매핑 ──────→ 가림 처리 ──────→ 프레임버퍼
    ↓                    ↓                   ↓
감마 보정         깊이 정렬           60fps 렌더링
```

## 🔧 각 단계별 구현 방법

### 1. 데이터 준비 단계
```javascript
// 키뷰 데이터 구조
KeyView = {
    angle: 0|90|180|270,  // 각도
    layers: [
        {
            id: "head",
            mesh: Float32Array,      // 버텍스 좌표
            uv: Float32Array,        // UV 좌표
            texture: ImageBitmap,    // 텍스처
            zIndex: Number,          // 깊이 순서
            controlPoints: Array     // 변형 제어점
        }
    ]
}
```

**수학적 기반:**
- 메쉬 표현: Delaunay 삼각분할
- 제어점: 2D 베지어 곡선 컨트롤 포인트

### 2. 각도 계산 단계
```
목표 각도 θ = 137° 일 때:
- 인접 키뷰: θ₁ = 90°, θ₂ = 180°
- 보간 비율: t = (137 - 90) / (180 - 90) = 0.522
- 감마 보정: t' = pow(t, 2.2) = 0.256
```

**각도 구간별 인접 키뷰 매핑:**
| 각도 범위 | 키뷰 1 | 키뷰 2 | 특이사항 |
|-----------|--------|--------|----------|
| 0°~90° | 정면(0°) | 우측(90°) | 표준 보간 |
| 90°~180° | 우측(90°) | 후면(180°) | Z-순서 전환 |
| 180°~270° | 후면(180°) | 좌측(270°) | 가림 처리 |
| 270°~360° | 좌측(270°) | 정면(360°) | 순환 보간 |

### 3. 형태 보간 단계

**ARAP (As-Rigid-As-Possible) 변형:**
```glsl
// 버텍스 셰이더 의사코드
attribute vec2 position1, position2;
uniform float t;

void main() {
    // 선형 보간
    vec2 pos = mix(position1, position2, t);
    
    // ARAP 변형 행렬 적용
    mat2 rotation = getARAPRotation(controlPoints, t);
    vec2 finalPos = rotation * pos + translation;
    
    gl_Position = projectionMatrix * vec4(finalPos, 0.0, 1.0);
}
```

**RBF (Radial Basis Function) 보간:**
```
φ(r) = r² * log(r)  // Thin-plate spline
w = Φ⁻¹ * y        // 가중치 계산
p(x) = Σ wᵢ * φ(||x - xᵢ||)  // 보간값
```

### 4. 텍스처 합성 단계
```glsl
// 프래그먼트 셰이더
uniform sampler2D texture1, texture2;
uniform float t, gamma;

void main() {
    vec4 color1 = texture2D(texture1, vUV);
    vec4 color2 = texture2D(texture2, vUV);
    
    // 감마 보정 블렌딩
    vec3 blend = pow(mix(
        pow(color1.rgb, vec3(gamma)),
        pow(color2.rgb, vec3(gamma)),
        t
    ), vec3(1.0/gamma));
    
    gl_FragColor = vec4(blend, mix(color1.a, color2.a, t));
}
```

### 5. Z-순서 처리
```javascript
// 각도별 Z-순서 규칙 테이블
const zOrderRules = {
    "0-45": ["배경", "몸통", "팔_뒤", "다리", "머리", "팔_앞"],
    "45-90": ["배경", "팔_뒤", "몸통", "다리", "머리", "팔_앞"],
    "90-135": ["배경", "팔_왼쪽", "몸통", "다리", "머리", "팔_오른쪽"],
    // ... 더 많은 규칙
};

// 부드러운 Z-순서 전환
function smoothZTransition(angle, transitionRange = 5) {
    const alpha = clamp((angle % 45) / transitionRange, 0, 1);
    return lerp(prevZOrder, nextZOrder, smoothstep(alpha));
}
```

## 📋 기능 목록과 구현 난이도

| 기능 | 설명 | 난이도 | 예상 시간 |
|------|------|--------|-----------|
| 키뷰 로딩 시스템 | 4방향 이미지 로딩 및 파츠 분리 | 하 | 2일 |
| 선형 보간 | 기본 형태/텍스처 보간 | 하 | 1일 |
| ARAP 메쉬 변형 | 자연스러운 형태 변형 | 상 | 5일 |
| RBF 보간 | 고급 형태 보간 | 상 | 4일 |
| 감마 보정 블렌딩 | 자연스러운 색상 전환 | 중 | 1일 |
| Z-순서 자동 전환 | 각도별 깊이 정렬 | 중 | 3일 |
| 가림 처리 | 파츠 간 occlusion | 상 | 4일 |
| GPU 셰이더 최적화 | WebGL2 버텍스 셰이더 | 상 | 5일 |
| 커스터마이징 UI | 드래그&드롭, 색상 선택기 | 중 | 4일 |
| 실시간 프리뷰 | 60fps 렌더링 | 중 | 3일 |
| 리소스 검증 | 포맷/구조 검증 | 하 | 1일 |
| 모바일 최적화 | 터치 인터페이스, 메모리 관리 | 중 | 3일 |

## 🗺️ 개발 로드맵

### Phase 1: MVP (2주)
```
✅ 기본 키뷰 로딩
✅ 선형 보간 구현
✅ 간단한 Z-순서
✅ 데스크톱 웹 렌더링
```

### Phase 2: 반커스터마이징 (3주)
```
⬜ ARAP 메쉬 변형
⬜ 감마 보정 블렌딩
⬜ 색상 변경 기능
⬜ 프리셋 시스템
```

### Phase 3: 완전 커스터마이징 (4주)
```
⬜ RBF 고급 보간
⬜ 파츠 교체 시스템
⬜ 드래그&드롭 UI
⬜ 사용자 리소스 업로드
⬜ 가림 처리 완성
```

### Phase 4: 고급 자동화 (3주)
```
⬜ AI 기반 중간 각도 생성
⬜ 애니메이션 시스템
⬜ 품질 자동 보정
⬜ 배치 처리
```

## ⚡ 성능 최적화 전략

### GPU 최적화
```javascript
// 인스턴싱으로 드로우콜 최소화
gl.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, instanceCount);

// 텍스처 아틀라스 사용
const atlas = createTextureAtlas(layers);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas);

// VAO로 상태 변경 최소화
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
```

### 메모리 최적화
```javascript
// 적응형 품질 조정
const quality = {
    mobile: { textureSize: 512, meshDensity: 0.5 },
    tablet: { textureSize: 1024, meshDensity: 0.75 },
    desktop: { textureSize: 2048, meshDensity: 1.0 }
};

// 뷰포트 밖 리소스 언로드
const frustumCulling = new FrustumCuller();
layers.filter(layer => frustumCulling.isVisible(layer));
```

### 웹 환경 최적화
- **WebGL2** 우선, WebGL1 폴백
- **OffscreenCanvas** 활용한 워커 렌더링
- **ImageBitmap** 으로 텍스처 디코딩 최적화
- **requestAnimationFrame** 스케줄링

### 모바일 대응
```javascript
// 터치 제스처 처리
hammer.on('rotate', (e) => {
    targetAngle = e.rotation % 360;
    requestRender();
});

// 적응형 프레임레이트
const adaptiveFPS = performance.memory.usedJSHeapSize > threshold ? 30 : 60;
```

## 🚀 확장 아이디어

### 1. 애니메이션 통합
```javascript
class AnimationSystem {
    // 키프레임 기반 애니메이션
    keyframes: [
        { time: 0, angle: 0, scale: 1.0 },
        { time: 1000, angle: 180, scale: 1.2 },
        { time: 2000, angle: 360, scale: 1.0 }
    ],
    
    // 물리 기반 움직임
    physics: {
        gravity: vec2(0, -9.8),
        wind: vec2(2, 0),
        springConstant: 0.1
    }
}
```

### 2. AI 기반 품질 보정
- **중간 각도 자동 생성**: StyleGAN 기반 보간
- **텍스처 업스케일링**: ESRGAN 활용
- **리깅 자동화**: 스켈레톤 자동 추출

### 3. 고급 렌더링 효과
- **PBR 셰이딩**: 금속성, 거칠기 맵
- **서브서피스 스캐터링**: 피부 표현
- **실시간 그림자**: Shadow mapping
- **후처리 효과**: Bloom, DOF, Color grading

## 📁 프로젝트 구조
```
2.5D_다각도_렌더링_시스템/
├── src/
│   ├── core/           # 핵심 렌더링 엔진
│   ├── interpolation/  # 보간 알고리즘
│   ├── shaders/        # WebGL 셰이더
│   └── ui/             # 커스터마이징 인터페이스
├── assets/
│   ├── keyviews/       # 키뷰 이미지
│   └── presets/        # 프리셋 데이터
└── docs/               # 기술 문서
```

## 🔍 핵심 기술 스택
- **렌더링**: WebGL2, Three.js (옵션)
- **수학 라이브러리**: glMatrix, Sylvester
- **UI 프레임워크**: React/Vue + Canvas
- **번들러**: Vite, Webpack
- **타입**: TypeScript
- **테스트**: Jest, Puppeteer (E2E)