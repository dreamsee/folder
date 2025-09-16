-- 7차원 노트 시스템 Phase 1 데이터베이스 마이그레이션
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- ==============================================
-- 1. 채팅메시지목록 테이블 확장
-- ==============================================

-- 7차원 필드 추가
ALTER TABLE 채팅메시지목록 
ADD COLUMN IF NOT EXISTS 우선순위차원 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS 감정차원 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS 맥락차원 JSONB DEFAULT NULL;

-- 4차원 확장 (관계) 필드 추가
ALTER TABLE 채팅메시지목록
ADD COLUMN IF NOT EXISTS 관련메시지목록 TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS 메시지유형 TEXT DEFAULT '일반';

-- 메시지유형 체크 제약조건 추가 (안전한 방식)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = '메시지유형_체크' 
    AND table_name = '채팅메시지목록'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE 채팅메시지목록 
    ADD CONSTRAINT 메시지유형_체크 
    CHECK (메시지유형 IN ('일반', '질문', '답변', '아이디어', '결론', '액션아이템'));
  END IF;
END $$;

-- ==============================================
-- 2. 노트목록 테이블 확장
-- ==============================================

-- 7차원 필드 추가
ALTER TABLE 노트목록
ADD COLUMN IF NOT EXISTS 우선순위차원 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS 감정차원 JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS 맥락차원 JSONB DEFAULT NULL;

-- 4차원 확장 (관계) 필드 추가
ALTER TABLE 노트목록
ADD COLUMN IF NOT EXISTS 관련노트목록 TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS 노트유형 TEXT DEFAULT '일반',
ADD COLUMN IF NOT EXISTS 참조출처 TEXT[] DEFAULT '{}';

-- 노트유형 체크 제약조건 추가 (안전한 방식)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = '노트유형_체크' 
    AND table_name = '노트목록'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE 노트목록 
    ADD CONSTRAINT 노트유형_체크 
    CHECK (노트유형 IN ('일반', '회의록', '아이디어', '계획', '학습', '일기', '프로젝트'));
  END IF;
END $$;

-- ==============================================
-- 3. 성능 최적화를 위한 인덱스 추가
-- ==============================================

-- 채팅메시지 7차원 인덱스
CREATE INDEX IF NOT EXISTS idx_message_priority ON 채팅메시지목록 USING GIN (우선순위차원);
CREATE INDEX IF NOT EXISTS idx_message_emotion ON 채팅메시지목록 USING GIN (감정차원);
CREATE INDEX IF NOT EXISTS idx_message_context ON 채팅메시지목록 USING GIN (맥락차원);
CREATE INDEX IF NOT EXISTS idx_message_type ON 채팅메시지목록 (메시지유형);

-- 노트 7차원 인덱스
CREATE INDEX IF NOT EXISTS idx_note_priority ON 노트목록 USING GIN (우선순위차원);
CREATE INDEX IF NOT EXISTS idx_note_emotion ON 노트목록 USING GIN (감정차원);
CREATE INDEX IF NOT EXISTS idx_note_context ON 노트목록 USING GIN (맥락차원);
CREATE INDEX IF NOT EXISTS idx_note_type ON 노트목록 (노트유형);

-- 관계 인덱스 (관련 메시지/노트 검색용)
CREATE INDEX IF NOT EXISTS idx_message_relations ON 채팅메시지목록 USING GIN (관련메시지목록);
CREATE INDEX IF NOT EXISTS idx_note_relations ON 노트목록 USING GIN (관련노트목록);

-- ==============================================
-- 4. 7차원 분석을 위한 뷰 생성
-- ==============================================

-- 우선순위 분석 뷰
CREATE OR REPLACE VIEW 우선순위분석뷰 AS
SELECT 
  n.폴더아이디,
  n.아이디 as 노트아이디,
  n.제목,
  n.우선순위차원->>'우선순위레벨' as 우선순위레벨,
  n.우선순위차원->>'긴급도' as 긴급도,
  (n.우선순위차원->>'마감일')::timestamp as 마감일,
  n.생성시간,
  n.수정시간,
  -- 우선순위 점수 계산 (간단 버전)
  CASE 
    WHEN n.우선순위차원->>'우선순위레벨' = '1' THEN 100
    WHEN n.우선순위차원->>'우선순위레벨' = '2' THEN 80
    WHEN n.우선순위차원->>'우선순위레벨' = '3' THEN 60
    WHEN n.우선순위차원->>'우선순위레벨' = '4' THEN 40
    WHEN n.우선순위차원->>'우선순위레벨' = '5' THEN 20
    ELSE 0
  END as 우선순위점수
FROM 노트목록 n 
WHERE n.우선순위차원 IS NOT NULL
ORDER BY 우선순위점수 DESC;

-- 감정 추이 분석 뷰
CREATE OR REPLACE VIEW 감정추이분석뷰 AS
SELECT 
  m.노트아이디,
  m.아이디 as 메시지아이디,
  m.감정차원->'기분상태'->>'주감정' as 주감정,
  (m.감정차원->'기분상태'->>'전체강도')::integer as 감정강도,
  (m.감정차원->'기분상태'->>'에너지레벨')::integer as 에너지레벨,
  m.감정차원->>'텍스트톤' as 텍스트톤,
  m.타임스탬프,
  m.텍스트,
  -- 감정 변화 추이 계산을 위한 이전 메시지와의 비교
  LAG((m.감정차원->'기분상태'->>'전체강도')::integer) OVER (
    PARTITION BY m.노트아이디 ORDER BY m.타임스탬프
  ) as 이전감정강도
FROM 채팅메시지목록 m 
WHERE m.감정차원 IS NOT NULL
ORDER BY m.노트아이디, m.타임스탬프;

-- 맥락별 활동 분석 뷰
CREATE OR REPLACE VIEW 맥락별활동분석뷰 AS
SELECT 
  m.맥락차원->>'상황유형' as 상황유형,
  m.맥락차원->>'작성목적' as 작성목적,
  m.맥락차원->'위치정보'->>'장소유형' as 장소유형,
  (m.맥락차원->'환경정보'->>'집중도')::integer as 집중도,
  COUNT(*) as 메시지수,
  AVG((m.감정차원->'기분상태'->>'전체강도')::integer) as 평균감정강도,
  DATE(m.타임스탬프) as 날짜,
  EXTRACT(HOUR FROM m.타임스탬프) as 시간대
FROM 채팅메시지목록 m 
WHERE m.맥락차원 IS NOT NULL
GROUP BY 상황유형, 작성목적, 장소유형, 집중도, DATE(m.타임스탬프), EXTRACT(HOUR FROM m.타임스탬프)
ORDER BY 날짜 DESC, 시간대;

-- 노트 유형별 통계 뷰
CREATE OR REPLACE VIEW 노트유형별통계뷰 AS
SELECT 
  n.노트유형,
  COUNT(*) as 노트수,
  AVG(array_length(n.태그목록, 1)) as 평균태그수,
  AVG(char_length(n.내용)) as 평균내용길이,
  COUNT(CASE WHEN n.우선순위차원 IS NOT NULL THEN 1 END) as 우선순위설정노트수,
  COUNT(CASE WHEN n.감정차원 IS NOT NULL THEN 1 END) as 감정설정노트수,
  COUNT(CASE WHEN n.맥락차원 IS NOT NULL THEN 1 END) as 맥락설정노트수
FROM 노트목록 n
GROUP BY n.노트유형
ORDER BY 노트수 DESC;

-- ==============================================
-- 5. 7차원 데이터 검증 함수
-- ==============================================

-- 우선순위 차원 데이터 유효성 검사 함수
CREATE OR REPLACE FUNCTION 우선순위차원유효성검사(우선순위_데이터 JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- 필수 필드 확인
  IF 우선순위_데이터 IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 우선순위레벨 범위 확인 (1-5)
  IF (우선순위_데이터->>'우선순위레벨')::integer NOT BETWEEN 1 AND 5 THEN
    RETURN FALSE;
  END IF;
  
  -- 긴급도 값 확인
  IF 우선순위_데이터->>'긴급도' NOT IN ('즉시', '당일', '이번주', '이번달', '언젠가') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 감정 차원 데이터 유효성 검사 함수
CREATE OR REPLACE FUNCTION 감정차원유효성검사(감정_데이터 JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- 필수 필드 확인
  IF 감정_데이터 IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 주감정 값 확인
  IF 감정_데이터->'기분상태'->>'주감정' NOT IN ('기쁨', '슬픔', '분노', '두려움', '놀람', '혐오') THEN
    RETURN FALSE;
  END IF;
  
  -- 감정강도 범위 확인 (1-10)
  IF (감정_데이터->'기분상태'->>'전체강도')::integer NOT BETWEEN 1 AND 10 THEN
    RETURN FALSE;
  END IF;
  
  -- 에너지레벨 범위 확인 (1-5)
  IF (감정_데이터->'기분상태'->>'에너지레벨')::integer NOT BETWEEN 1 AND 5 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 맥락 차원 데이터 유효성 검사 함수
CREATE OR REPLACE FUNCTION 맥락차원유효성검사(맥락_데이터 JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- 필수 필드 확인
  IF 맥락_데이터 IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 상황유형 값 확인
  IF 맥락_데이터->>'상황유형' NOT IN ('업무', '학습', '개인', '가족', '친구', '취미', '회의', '브레인스토밍', '검토', '계획', '실행', '회고') THEN
    RETURN FALSE;
  END IF;
  
  -- 작성목적 값 확인
  IF 맥락_데이터->>'작성목적' NOT IN ('기록', '정리', '계획', '아이디어', '문제해결', '학습', '공유', '보고', '검토', '임시메모') THEN
    RETURN FALSE;
  END IF;
  
  -- 집중도 범위 확인 (1-5)
  IF (맥락_데이터->'환경정보'->>'집중도')::integer NOT BETWEEN 1 AND 5 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. 테이블 변경 확인
-- ==============================================

-- 채팅메시지목록 테이블 구조 확인
SELECT '=== 채팅메시지목록 테이블 구조 ===' as 확인_제목;
SELECT 
  column_name as 컬럼명,
  data_type as 데이터타입,
  is_nullable as 널허용,
  column_default as 기본값
FROM information_schema.columns 
WHERE table_name = '채팅메시지목록' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 노트목록 테이블 구조 확인  
SELECT '=== 노트목록 테이블 구조 ===' as 확인_제목;
SELECT 
  column_name as 컬럼명,
  data_type as 데이터타입,
  is_nullable as 널허용,
  column_default as 기본값
FROM information_schema.columns 
WHERE table_name = '노트목록' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 생성된 뷰 목록 확인
SELECT '=== 생성된 분석 뷰 목록 ===' as 확인_제목;
SELECT 
  viewname as 뷰명,
  viewowner as 소유자
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE '%분석뷰%';

-- 생성된 인덱스 확인
SELECT '=== 7차원 관련 인덱스 ===' as 확인_제목;
SELECT 
  indexname as 인덱스명,
  tablename as 테이블명,
  indexdef as 인덱스정의
FROM pg_indexes 
WHERE schemaname = 'public' 
AND (indexname LIKE 'idx_%priority%' 
     OR indexname LIKE 'idx_%emotion%' 
     OR indexname LIKE 'idx_%context%' 
     OR indexname LIKE 'idx_%relations%');

-- ==============================================
-- 7. 샘플 데이터 삽입 (테스트용)
-- ==============================================

-- 주의: 실제 노트 ID가 존재할 때만 실행하세요
/*
-- 샘플 우선순위 차원 데이터
UPDATE 노트목록 SET 우선순위차원 = '{
  "우선순위레벨": 2,
  "긴급도": "당일",
  "중요도매트릭스": {
    "긴급하고중요함": true,
    "중요하지만긴급하지않음": false,
    "긴급하지만중요하지않음": false,
    "긴급하지도중요하지도않음": false
  },
  "예상소요시간": 120
}'::jsonb 
WHERE 제목 LIKE '%회의%' LIMIT 1;

-- 샘플 감정 차원 데이터
UPDATE 채팅메시지목록 SET 감정차원 = '{
  "기분상태": {
    "주감정": "기쁨",
    "전체강도": 7,
    "에너지레벨": 4
  },
  "텍스트톤": "긍정적",
  "감정노트": "좋은 아이디어가 떠올랐음"
}'::jsonb 
WHERE 텍스트 LIKE '%좋%' LIMIT 3;

-- 샘플 맥락 차원 데이터
UPDATE 채팅메시지목록 SET 맥락차원 = '{
  "상황유형": "업무",
  "환경정보": {
    "디바이스": "PC",
    "집중도": 4,
    "주변소음레벨": 2
  },
  "작성목적": "계획",
  "위치정보": {
    "장소유형": "사무실"
  }
}'::jsonb 
WHERE 메시지유형 = '일반' LIMIT 5;
*/

-- 마이그레이션 완료 확인
SELECT '🎉 7차원 노트 시스템 Phase 1 마이그레이션 완료!' as 상태;

-- 추가된 컬럼 개수 확인
SELECT 
  '총 추가된 7차원 컬럼 개수: ' || COUNT(*) as 마이그레이션_결과
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('채팅메시지목록', '노트목록')
AND column_name IN ('우선순위차원', '감정차원', '맥락차원', '관련메시지목록', '관련노트목록', '메시지유형', '노트유형', '참조출처');