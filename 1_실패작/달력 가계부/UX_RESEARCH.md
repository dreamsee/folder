# UX Research & User Journey Analysis
## 달력 가계부 애플리케이션

### 🎯 Target Users

#### Primary Persona: "효율적인 민지 (27세)"
- **직업**: 직장인, 1인 가구
- **목표**: 간편하고 직관적인 가계부 관리
- **Pain Points**: 
  - 복잡한 가계부 앱에 부담감
  - 매일 기록하기 어려움
  - 월 단위 지출 패턴 파악 어려움
- **Needs**: 
  - 빠른 입력과 조회
  - 시각적으로 명확한 지출 현황
  - 카테고리별 지출 분석

#### Secondary Persona: "계획적인 준호 (35세)"
- **직업**: 자영업자, 기혼
- **목표**: 상세한 지출 분석과 예산 관리
- **Pain Points**:
  - 특별 지출 추적 어려움
  - 월별 트렌드 분석 부족
  - 가족 지출 카테고리 복잡성
- **Needs**:
  - 상세 카테고리 분류
  - 대형 구매 기록 관리
  - 월별 비교 기능

### 🗺️ User Journey Mapping

#### 1. 첫 방문 (Onboarding)
```
진입 → 앱 이해 → 첫 데이터 입력 → 결과 확인 → 지속 사용 결정
```

**개선 포인트**:
- 즉시 사용 가능한 인터페이스
- 샘플 데이터로 기능 미리보기
- 진입 장벽 최소화

#### 2. 일상 사용 (Daily Usage)
```
앱 실행 → 지출 입력 → 카테고리 선택 → 저장 → 현황 확인
```

**개선 포인트**:
- 2-클릭 이내 입력 완료
- 자동 완성 및 최근 항목
- 입력 성공 피드백

#### 3. 분석 및 리뷰 (Monthly Review)
```
월 이동 → 카테고리 확인 → 상세 내역 조회 → 패턴 파악 → 다음 계획
```

**개선 포인트**:
- 한눈에 보이는 요약
- 드릴다운 분석 가능
- 인사이트 제공

### 📊 Information Architecture

#### 기존 구조 문제점
- 입력과 조회가 분리되어 있음
- 카테고리 구조가 깊음 (3depth)
- 특별 구매와 일반 지출 분리로 혼란

#### 개선된 구조
```
Main Dashboard
├── Quick Input (floating)
├── Calendar View (primary)
├── Expense Summary (contextual)
└── Insights Panel (secondary)
```

### 🎨 Design Principles

1. **Clarity First**: 정보 우선순위 명확화
2. **Progressive Disclosure**: 필요시에만 상세 정보 노출
3. **Contextual Actions**: 상황에 맞는 액션 제공
4. **Consistent Patterns**: 일관된 상호작용 패턴
5. **Accessible Design**: 모든 사용자를 위한 접근성

### 🔄 Interaction Patterns

#### 데이터 입력
- **Quick Add**: 플로팅 버튼으로 즉시 입력
- **Smart Defaults**: 오늘 날짜, 최근 카테고리 자동 선택
- **Batch Actions**: 반복 지출 일괄 입력

#### 데이터 조회
- **Calendar-Centric**: 달력 중심 네비게이션
- **Expandable Cards**: 접기/펼치기로 상세도 조절
- **Visual Hierarchy**: 색상과 크기로 중요도 표현

#### 피드백 시스템
- **Immediate**: 입력 즉시 시각적 피드백
- **Contextual**: 상황에 맞는 안내 메시지
- **Progressive**: 단계별 성취감 제공