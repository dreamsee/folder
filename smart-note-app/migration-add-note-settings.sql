-- 노트별 설정 필드 추가 마이그레이션
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- 노트목록 테이블에 노트설정 JSON 컬럼 추가
ALTER TABLE 노트목록 
ADD COLUMN IF NOT EXISTS 노트설정 JSONB DEFAULT NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_note_settings ON 노트목록 USING GIN (노트설정);

-- 테이블 변경 확인
\d 노트목록;

-- 예시 데이터 삽입 (테스트용)
/*
UPDATE 노트목록 SET 노트설정 = '{
  "시간표시여부": true,
  "입력방식": "카테고리형",
  "하위입력활성화": false,
  "카테고리목록": ["아침", "점심", "저녁"]
}'::jsonb 
WHERE 아이디 = 'your-note-id-here';
*/