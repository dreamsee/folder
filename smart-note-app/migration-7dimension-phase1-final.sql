-- 7차원 노트 시스템 Phase 1 마이그레이션 (완전 수정됨)
-- 기존 뷰 삭제 후 재생성
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

BEGIN;

-- ===== 기존 뷰 삭제 =====
DROP VIEW IF EXISTS 우선순위분석뷰 CASCADE;
DROP VIEW IF EXISTS 감정추이분석뷰 CASCADE;
DROP VIEW IF EXISTS 맥락별활동분석뷰 CASCADE;
DROP VIEW IF EXISTS 칠차원종합분석뷰 CASCADE;

-- ===== 채팅메시지목록 테이블 확장 =====

-- 5차원: 우선순위 차원 추가
ALTER TABLE 채팅메시지목록 
ADD COLUMN IF NOT EXISTS 우선순위차원 JSONB;

-- 6차원: 감정 차원 추가
ALTER TABLE 채팅메시지목록 
ADD COLUMN IF NOT EXISTS 감정차원 JSONB;

-- 7차원: 맥락 차원 추가
ALTER TABLE 채팅메시지목록 
ADD COLUMN IF NOT EXISTS 맥락차원 JSONB;

-- 4차원 확장: 관계 강화
ALTER TABLE 채팅메시지목록 
ADD COLUMN IF NOT EXISTS 관련메시지목록 TEXT[],
ADD COLUMN IF NOT EXISTS 메시지유형 TEXT DEFAULT '일반';

-- 메시지 유형 제약 조건 추가 (기존에 있으면 무시)
DO $$
BEGIN
  ALTER TABLE 채팅메시지목록
  ADD CONSTRAINT chk_message_type CHECK (
    메시지유형 IN ('일반', '질문', '답변', '아이디어', '결론', '액션아이템')
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===== 노트목록 테이블 확장 =====

-- 5차원: 우선순위 차원 추가
ALTER TABLE 노트목록
ADD COLUMN IF NOT EXISTS 우선순위차원 JSONB;

-- 6차원: 감정 차원 추가
ALTER TABLE 노트목록
ADD COLUMN IF NOT EXISTS 감정차원 JSONB;

-- 7차원: 맥락 차원 추가
ALTER TABLE 노트목록
ADD COLUMN IF NOT EXISTS 맥락차원 JSONB;

-- 4차원 확장: 관계 강화
ALTER TABLE 노트목록
ADD COLUMN IF NOT EXISTS 관련노트목록 TEXT[],
ADD COLUMN IF NOT EXISTS 노트유형 TEXT DEFAULT '일반',
ADD COLUMN IF NOT EXISTS 참조출처 TEXT[];

-- 노트 유형 제약 조건 추가 (기존에 있으면 무시)
DO $$
BEGIN
  ALTER TABLE 노트목록
  ADD CONSTRAINT chk_note_type CHECK (
    노트유형 IN ('일반', '회의록', '아이디어', '계획', '학습', '일기', '프로젝트')
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===== 인덱스 생성 (성능 최적화) =====

-- 채팅메시지 인덱스
CREATE INDEX IF NOT EXISTS idx_msg_priority ON 채팅메시지목록 USING GIN (우선순위차원);
CREATE INDEX IF NOT EXISTS idx_msg_emotion ON 채팅메시지목록 USING GIN (감정차원);
CREATE INDEX IF NOT EXISTS idx_msg_context ON 채팅메시지목록 USING GIN (맥락차원);
CREATE INDEX IF NOT EXISTS idx_msg_type ON 채팅메시지목록 (메시지유형);
CREATE INDEX IF NOT EXISTS idx_msg_relations ON 채팅메시지목록 USING GIN (관련메시지목록);

-- 노트 인덱스
CREATE INDEX IF NOT EXISTS idx_note_priority ON 노트목록 USING GIN (우선순위차원);
CREATE INDEX IF NOT EXISTS idx_note_emotion ON 노트목록 USING GIN (감정차원);
CREATE INDEX IF NOT EXISTS idx_note_context ON 노트목록 USING GIN (맥락차원);
CREATE INDEX IF NOT EXISTS idx_note_type ON 노트목록 (노트유형);
CREATE INDEX IF NOT EXISTS idx_note_relations ON 노트목록 USING GIN (관련노트목록);

-- ===== 분석용 뷰 생성 =====

-- 우선순위 분석 뷰
CREATE VIEW 우선순위분석뷰 AS
SELECT 
  n.폴더아이디,
  n.아이디 as 노트아이디,
  n.제목,
  n.우선순위차원->>'우선순위레벨' as 우선순위레벨,
  n.우선순위차원->>'긴급도' as 긴급도,
  (n.우선순위차원->>'마감일')::timestamp as 마감일,
  (n.우선순위차원->>'예상소요시간')::integer as 예상소요시간_분,
  n.생성시간 as 노트생성시간,
  n.수정시간 as 노트수정시간
FROM 노트목록 n 
WHERE n.우선순위차원 IS NOT NULL;

-- 감정 추이 분석 뷰
CREATE VIEW 감정추이분석뷰 AS
SELECT 
  m.노트아이디,
  m.아이디 as 메시지아이디,
  m.감정차원->'기분상태'->>'주감정' as 주감정,
  (m.감정차원->'기분상태'->>'전체강도')::integer as 감정강도,
  (m.감정차원->'기분상태'->>'에너지레벨')::integer as 에너지레벨,
  m.감정차원->>'텍스트톤' as 텍스트톤,
  m.타임스탬프 as 메시지생성시간,
  LEFT(m.텍스트, 100) as 텍스트미리보기
FROM 채팅메시지목록 m 
WHERE m.감정차원 IS NOT NULL
ORDER BY m.타임스탬프;

-- 맥락별 활동 분석 뷰
CREATE VIEW 맥락별활동분석뷰 AS
SELECT 
  m.맥락차원->>'상황유형' as 상황유형,
  m.맥락차원->>'작성목적' as 작성목적,
  m.맥락차원->'위치정보'->>'장소유형' as 장소유형,
  (m.맥락차원->'환경정보'->>'집중도')::integer as 집중도,
  COUNT(*) as 메시지수,
  DATE(m.타임스탬프) as 활동날짜
FROM 채팅메시지목록 m 
WHERE m.맥락차원 IS NOT NULL
GROUP BY 
  m.맥락차원->>'상황유형',
  m.맥락차원->>'작성목적',
  m.맥락차원->'위치정보'->>'장소유형',
  m.맥락차원->'환경정보'->>'집중도',
  DATE(m.타임스탬프)
ORDER BY 활동날짜 DESC;

-- 7차원 종합 분석 뷰
CREATE VIEW 칠차원종합분석뷰 AS
SELECT 
  m.노트아이디,
  n.제목 as 노트제목,
  COUNT(m.아이디) as 총메시지수,
  COUNT(m.우선순위차원) as 우선순위설정수,
  COUNT(m.감정차원) as 감정기록수,
  COUNT(m.맥락차원) as 맥락기록수,
  ROUND(
    (COUNT(m.우선순위차원)::numeric / NULLIF(COUNT(m.아이디), 0) * 100), 
    2
  ) as 우선순위활용률,
  ROUND(
    (COUNT(m.감정차원)::numeric / NULLIF(COUNT(m.아이디), 0) * 100), 
    2
  ) as 감정기록률,
  ROUND(
    (COUNT(m.맥락차원)::numeric / NULLIF(COUNT(m.아이디), 0) * 100), 
    2
  ) as 맥락완성률
FROM 채팅메시지목록 m
LEFT JOIN 노트목록 n ON m.노트아이디 = n.아이디
GROUP BY m.노트아이디, n.제목;

-- ===== 헬퍼 함수 생성 =====

-- 중요도 매트릭스 사분면 계산 함수
CREATE OR REPLACE FUNCTION 중요도사분면(매트릭스 JSONB)
RETURNS INTEGER AS $$
BEGIN
  IF (매트릭스->>'긴급하고중요함')::boolean THEN
    RETURN 1;
  ELSIF (매트릭스->>'중요하지만긴급하지않음')::boolean THEN
    RETURN 2;
  ELSIF (매트릭스->>'긴급하지만중요하지않음')::boolean THEN
    RETURN 3;
  ELSE
    RETURN 4;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7차원 점수 계산 함수
CREATE OR REPLACE FUNCTION 칠차원점수계산(
  우선순위 JSONB,
  감정 JSONB,
  맥락 JSONB
)
RETURNS INTEGER AS $$
DECLARE
  점수 INTEGER := 0;
BEGIN
  -- 우선순위 점수 (최대 30점)
  IF 우선순위 IS NOT NULL THEN
    점수 := 점수 + 20;
    IF 우선순위->>'마감일' IS NOT NULL THEN
      점수 := 점수 + 5;
    END IF;
    IF 우선순위->>'예상소요시간' IS NOT NULL THEN
      점수 := 점수 + 5;
    END IF;
  END IF;
  
  -- 감정 점수 (최대 35점)
  IF 감정 IS NOT NULL THEN
    점수 := 점수 + 25;
    IF 감정->>'감정노트' IS NOT NULL THEN
      점수 := 점수 + 5;
    END IF;
    IF 감정->>'감정변화추적' IS NOT NULL THEN
      점수 := 점수 + 5;
    END IF;
  END IF;
  
  -- 맥락 점수 (최대 35점)
  IF 맥락 IS NOT NULL THEN
    점수 := 점수 + 20;
    IF 맥락->>'위치정보' IS NOT NULL THEN
      점수 := 점수 + 5;
    END IF;
    IF 맥락->>'참여자' IS NOT NULL THEN
      점수 := 점수 + 5;
    END IF;
    IF 맥락->>'컨텍스트노트' IS NOT NULL THEN
      점수 := 점수 + 5;
    END IF;
  END IF;
  
  RETURN 점수;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- 마이그레이션 완료 확인
SELECT 
  'migration-7d-phase1 completed successfully' as status,
  NOW() as completed_at;