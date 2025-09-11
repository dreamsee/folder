-- 말풍선위치 컬럼 추가 마이그레이션
-- 기존 채팅메시지목록 테이블에 말풍선위치 컬럼 추가

ALTER TABLE 채팅메시지목록 
ADD COLUMN IF NOT EXISTS 말풍선위치 VARCHAR(10);

-- 기존 대화형 메시지들의 기본 위치 설정 (왼쪽으로 설정)
UPDATE 채팅메시지목록 
SET 말풍선위치 = '왼쪽' 
WHERE 작성자 IS NOT NULL AND 말풍선위치 IS NULL;

-- 마이그레이션 완료 로그
INSERT INTO 마이그레이션로그 (버전, 설명, 실행시간) 
VALUES ('v1.1.0', '말풍선위치 컬럼 추가', NOW())
ON CONFLICT DO NOTHING;