# 7차원 노트 시스템 Phase 2 UI/UX 구현 준비

## 📋 프로젝트 개요

### 목표
Phase 1의 데이터 모델을 기반으로 직관적이고 혁신적인 7차원 노트 시스템의 UI/UX 구현

### 범위
- 다차원 데이터 입력 인터페이스
- 7차원 시각화 컴포넌트
- 차원별 필터링 및 검색 시스템
- 사용자 경험 최적화

### 기간
3주 (2025년 3월 1일 ~ 2025년 3월 21일)

## 🎨 UI/UX 디자인 원칙

### 문고리 철학 적용
```yaml
최소개입_최대효과:
  - 복잡한 7차원을 단순하게 표현
  - 필요할 때만 보이는 정보 계층
  - 자연스러운 진입점 제공

점진적_복잡성:
  - 초보자: 기본 3차원만 표시
  - 중급자: 5차원까지 확장
  - 전문가: 전체 7차원 활용

감정적_연결:
  - 색상으로 감정 직관적 표현
  - 부드러운 애니메이션
  - 개인화된 시각적 피드백
```

## 🏗️ 주요 UI 컴포넌트 설계

### 1. 메시지 입력 확장 인터페이스

#### 1.1 스마트 입력 바
```typescript
// src/컴포넌트/스마트입력바.tsx
interface 스마트입력바Props {
  기본모드: '단순' | '확장' | '전문가';
  활성차원목록: 차원타입[];
  onDimensionToggle: (차원: 차원타입) => void;
}

// UI 구조
<입력컨테이너>
  <메인입력필드 />
  
  <차원버튼그룹>
    <중요도버튼 active={중요도활성} />
    <감정버튼 active={감정활성} />
    <맥락버튼 active={맥락활성} />
    <더보기버튼 />
  </차원버튼그룹>
  
  {활성차원패널 && (
    <확장패널>
      {중요도활성 && <중요도선택기 />}
      {감정활성 && <감정선택기 />}
      {맥락활성 && <맥락입력기 />}
    </확장패널>
  )}
</입력컨테이너>
```

#### 1.2 차원별 입력 컴포넌트

**중요도 입력기**
```typescript
// src/컴포넌트/차원입력/중요도입력기.tsx
export const 중요도입력기: React.FC = () => {
  return (
    <div className="중요도-입력기">
      {/* 별점 방식 중요도 */}
      <div className="중요도-레벨">
        {[1,2,3,4,5].map(level => (
          <Star 
            key={level}
            filled={level <= 선택된중요도}
            onClick={() => set중요도(level)}
          />
        ))}
      </div>
      
      {/* 긴급도 토글 */}
      <div className="긴급도-섹션">
        <label>긴급</label>
        <토글스위치 checked={긴급} onChange={set긴급} />
      </div>
      
      {/* 데드라인 (선택적) */}
      {긴급 && (
        <DatePicker
          selected={데드라인}
          onChange={set데드라인}
          placeholderText="마감일"
        />
      )}
    </div>
  );
};
```

**감정 입력기**
```typescript
// src/컴포넌트/차원입력/감정입력기.tsx
const 감정이모지맵 = {
  기쁨: '😊',
  슬픔: '😢',
  분노: '😠',
  놀람: '😮',
  두려움: '😨',
  혐오: '🤢',
  중립: '😐'
};

export const 감정입력기: React.FC = () => {
  return (
    <div className="감정-입력기">
      {/* 감정 선택 */}
      <div className="감정-선택">
        {Object.entries(감정이모지맵).map(([감정, 이모지]) => (
          <button
            key={감정}
            className={`감정-버튼 ${선택된감정 === 감정 ? 'active' : ''}`}
            onClick={() => set감정(감정)}
          >
            <span className="이모지">{이모지}</span>
            <span className="레이블">{감정}</span>
          </button>
        ))}
      </div>
      
      {/* 강도 슬라이더 */}
      <div className="감정-강도">
        <label>강도</label>
        <input
          type="range"
          min="1"
          max="5"
          value={감정강도}
          onChange={(e) => set감정강도(Number(e.target.value))}
        />
        <span>{감정강도}</span>
      </div>
      
      {/* 톤 선택 */}
      <div className="톤-선택">
        <select value={톤} onChange={(e) => set톤(e.target.value)}>
          <option value="공식">공식적</option>
          <option value="비공식">비공식적</option>
          <option value="유머">유머러스</option>
          <option value="진지">진지한</option>
          <option value="캐주얼">캐주얼</option>
        </select>
      </div>
    </div>
  );
};
```

### 2. 7차원 시각화 컴포넌트

#### 2.1 차원 레이더 차트
```typescript
// src/컴포넌트/시각화/차원레이더차트.tsx
import { Radar } from 'react-chartjs-2';

export const 차원레이더차트: React.FC<{메시지: 채팅메시지타입}> = ({ 메시지 }) => {
  const 차트데이터 = {
    labels: ['시간', '공간', '분류', '관계', '중요도', '감정', '맥락'],
    datasets: [{
      label: '차원 점수',
      data: [
        메시지.7차원데이터?.시간점수 || 0,
        메시지.7차원데이터?.공간점수 || 0,
        메시지.7차원데이터?.분류점수 || 0,
        메시지.7차원데이터?.관계점수 || 0,
        메시지.7차원데이터?.중요도점수 || 0,
        메시지.7차원데이터?.감정점수 || 0,
        메시지.7차원데이터?.맥락점수 || 0
      ],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2
    }]
  };
  
  return (
    <div className="차원-레이더-차트">
      <Radar data={차트데이터} options={차트옵션} />
    </div>
  );
};
```

#### 2.2 감정 색상 코딩 시스템
```typescript
// src/유틸/감정색상유틸.ts
export const 감정색상맵: Record<기본감정타입, 색상설정> = {
  기쁨: {
    배경: '#FFF4E6',
    테두리: '#FFB74D',
    텍스트: '#E65100',
    그라데이션: 'linear-gradient(135deg, #FFF4E6 0%, #FFE0B2 100%)'
  },
  슬픔: {
    배경: '#E3F2FD',
    테두리: '#64B5F6',
    텍스트: '#1565C0',
    그라데이션: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)'
  },
  분노: {
    배경: '#FFEBEE',
    테두리: '#EF5350',
    텍스트: '#B71C1C',
    그라데이션: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)'
  },
  // ... 다른 감정들
};

// 감정 강도에 따른 투명도 조절
export const 감정강도투명도 = (강도: number): number => {
  return 0.2 + (강도 / 5) * 0.6; // 0.2 ~ 0.8
};
```

### 3. 다차원 필터링 시스템

#### 3.1 고급 필터 패널
```typescript
// src/컴포넌트/다차원필터패널.tsx
export const 다차원필터패널: React.FC = () => {
  const [활성필터, set활성필터] = useState<필터설정>({
    시간범위: null,
    중요도최소: 1,
    감정목록: [],
    맥락목록: [],
    관계깊이: 1
  });
  
  return (
    <div className="다차원-필터-패널">
      {/* 시간 필터 */}
      <필터섹션 제목="시간 범위">
        <DateRangePicker
          startDate={활성필터.시간범위?.시작}
          endDate={활성필터.시간범위?.끝}
          onChange={handle시간범위변경}
        />
      </필터섹션>
      
      {/* 중요도 필터 */}
      <필터섹션 제목="최소 중요도">
        <슬라이더
          min={1}
          max={5}
          value={활성필터.중요도최소}
          onChange={set중요도최소}
        />
      </필터섹션>
      
      {/* 감정 필터 */}
      <필터섹션 제목="감정 상태">
        <다중선택버튼그룹
          옵션들={Object.keys(감정이모지맵)}
          선택된것들={활성필터.감정목록}
          onChange={set감정목록}
        />
      </필터섹션>
      
      {/* 맥락 필터 */}
      <필터섹션 제목="상황/맥락">
        <태그입력
          태그목록={활성필터.맥락목록}
          onChange={set맥락목록}
          자동완성목록={사용가능한맥락목록}
        />
      </필터섹션>
      
      {/* 관계 필터 */}
      <필터섹션 제목="연결 깊이">
        <라디오그룹
          옵션들={[
            { value: 1, label: '직접 연결만' },
            { value: 2, label: '2단계까지' },
            { value: 3, label: '3단계까지' }
          ]}
          value={활성필터.관계깊이}
          onChange={set관계깊이}
        />
      </필터섹션>
      
      <div className="필터-액션">
        <button onClick={필터적용}>적용</button>
        <button onClick={필터초기화}>초기화</button>
      </div>
    </div>
  );
};
```

### 4. 메시지 카드 확장

#### 4.1 7차원 정보 표시
```typescript
// src/컴포넌트/확장된메시지카드.tsx
export const 확장된메시지카드: React.FC<{메시지: 채팅메시지타입}> = ({ 메시지 }) => {
  const 감정색상 = 메시지.감정 ? 감정색상맵[메시지.감정.기본감정] : null;
  
  return (
    <div 
      className="메시지-카드"
      style={{
        borderLeft: 감정색상 ? `4px solid ${감정색상.테두리}` : undefined,
        backgroundColor: 감정색상 ? 감정색상.배경 : undefined
      }}
    >
      {/* 상단 메타정보 */}
      <div className="메시지-헤더">
        <시간표시 시간={메시지.생성시간} />
        {메시지.중요도 && (
          <중요도배지 레벨={메시지.중요도.레벨} 긴급={메시지.중요도.긴급도} />
        )}
        {메시지.맥락 && (
          <맥락태그 상황={메시지.맥락.상황} />
        )}
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="메시지-본문">
        {메시지.텍스트}
      </div>
      
      {/* 하단 차원 정보 */}
      <div className="메시지-차원정보">
        {메시지.감정 && (
          <감정표시 
            감정={메시지.감정.기본감정} 
            강도={메시지.감정.강도}
            톤={메시지.감정.톤}
          />
        )}
        {메시지.연결된메시지목록 && 메시지.연결된메시지목록.length > 0 && (
          <연결표시 개수={메시지.연결된메시지목록.length} />
        )}
        <차원점수미니표시 점수데이터={메시지.7차원데이터} />
      </div>
      
      {/* 호버 시 상세 정보 */}
      <툴팁컨텐츠>
        <차원레이더차트미니 메시지={메시지} />
      </툴팁컨텐츠>
    </div>
  );
};
```

### 5. 관계 네트워크 시각화

#### 5.1 2D 네트워크 뷰 (기본)
```typescript
// src/컴포넌트/시각화/관계네트워크2D.tsx
import { ForceGraph2D } from 'react-force-graph';

export const 관계네트워크2D: React.FC = () => {
  const 그래프데이터 = use관계그래프데이터();
  
  return (
    <ForceGraph2D
      graphData={그래프데이터}
      nodeLabel="텍스트"
      nodeColor={node => 감정색상맵[node.감정]?.테두리 || '#999'}
      nodeRelSize={6}
      linkColor={() => 'rgba(0,0,0,0.2)'}
      linkWidth={1}
      onNodeClick={handle노드클릭}
      onNodeHover={handle노드호버}
    />
  );
};
```

#### 5.2 3D 네트워크 뷰 (고급)
```typescript
// src/컴포넌트/시각화/관계네트워크3D.tsx
import { ForceGraph3D } from 'react-force-graph';

export const 관계네트워크3D: React.FC = () => {
  const 그래프데이터 = use관계그래프데이터();
  
  return (
    <ForceGraph3D
      graphData={그래프데이터}
      nodeThreeObject={node => {
        // 중요도에 따른 크기
        const 크기 = (node.중요도 || 1) * 2;
        const geometry = new THREE.SphereGeometry(크기);
        const material = new THREE.MeshBasicMaterial({ 
          color: 감정색상맵[node.감정]?.테두리 || '#999' 
        });
        return new THREE.Mesh(geometry, material);
      }}
      linkOpacity={0.4}
      enableNodeDrag={true}
      enableNavigationControls={true}
    />
  );
};
```

## 🎯 UI/UX 구현 우선순위

### 즉시 구현 (1주차)
1. **스마트 입력 바**: 기본 차원 입력 UI
2. **중요도 입력기**: 별점 + 긴급도
3. **감정 입력기**: 이모지 + 강도
4. **확장된 메시지 카드**: 7차원 정보 표시

### 단기 구현 (2주차)
1. **다차원 필터 패널**: 고급 검색 기능
2. **차원 레이더 차트**: 시각화
3. **감정 색상 코딩**: 시각적 피드백
4. **맥락 입력기**: 상황 태깅

### 중기 구현 (3주차)
1. **2D 관계 네트워크**: 기본 시각화
2. **3D 관계 네트워크**: 고급 시각화
3. **차원별 대시보드**: 분석 뷰
4. **성능 최적화**: 대용량 데이터 처리

## 📊 디자인 시스템 확장

### 새로운 디자인 토큰
```scss
// 7차원 색상 팔레트
$dimension-colors: (
  time: #4A90E2,      // 파랑 - 시간
  space: #50E3C2,     // 청록 - 공간
  category: #F5A623,  // 주황 - 분류
  relation: #BD10E0,  // 보라 - 관계
  priority: #D0021B,  // 빨강 - 중요도
  emotion: #F8E71C,   // 노랑 - 감정
  context: #7ED321    // 초록 - 맥락
);

// 감정 색상 시스템
$emotion-colors: (
  joy: #FFB74D,
  sadness: #64B5F6,
  anger: #EF5350,
  surprise: #FFD54F,
  fear: #9575CD,
  disgust: #81C784,
  neutral: #BDBDBD
);

// 중요도 색상 그라데이션
$priority-gradient: (
  1: #E0E0E0,
  2: #BDBDBD,
  3: #FFB74D,
  4: #FF7043,
  5: #F44336
);
```

### 애니메이션 가이드라인
```typescript
// 차원 전환 애니메이션
export const 차원전환애니메이션 = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // 차원 추가 시
  추가: {
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' }
  },
  
  // 차원 제거 시
  제거: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.8)' }
  }
};
```

## 🚀 성능 고려사항

### 가상화 전략
- 대량 메시지 렌더링 시 react-window 활용
- 3D 시각화는 LOD (Level of Detail) 적용
- 레이더 차트는 디바운싱으로 업데이트 최적화

### 점진적 로딩
- 초기 로드 시 최근 100개 메시지만
- 스크롤 시 추가 로딩
- 7차원 데이터는 필요 시 lazy loading

### 메모리 관리
- 3D 뷰는 사용하지 않을 때 dispose
- 큰 네트워크는 클러스터링으로 단순화
- 이미지/이모지는 sprite 사용

## 📅 Phase 2 완료 기준

### 필수 완료 항목
- [ ] 7차원 입력 인터페이스 완성
- [ ] 메시지 카드 7차원 정보 표시
- [ ] 다차원 필터링 시스템 작동
- [ ] 기본 시각화 컴포넌트 구현

### 성공 지표
- 사용자 테스트 만족도 > 80%
- 7차원 데이터 입력률 > 70%
- 성능 목표 달성 (응답시간 < 300ms)

---

**작성일**: 2025-01-31
**작성자**: 스마트 노트 개발팀
**다음 단계**: Phase 3 - 지능형 연결 시스템