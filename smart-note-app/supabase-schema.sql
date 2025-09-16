-- 채팅형 스마트 노트 시스템 데이터베이스 스키마

-- 1. 폴더 테이블
CREATE TABLE IF NOT EXISTS 폴더목록 (
    아이디 VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    이름 VARCHAR(100) NOT NULL,
    폴더설정 JSONB NOT NULL DEFAULT '{}',
    생성시간 TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    수정시간 TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    사용자아이디 VARCHAR(50) -- 추후 인증 기능 추가 시 사용
);

-- 2. 노트 테이블
CREATE TABLE IF NOT EXISTS 노트목록 (
    아이디 VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    폴더아이디 VARCHAR(50) NOT NULL REFERENCES 폴더목록(아이디) ON DELETE CASCADE,
    제목 VARCHAR(200) NOT NULL,
    내용 TEXT DEFAULT '',
    요약 TEXT,
    태그목록 TEXT[], -- PostgreSQL 배열 타입
    생성시간 TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    수정시간 TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS 채팅메시지목록 (
    아이디 VARCHAR(50) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    노트아이디 VARCHAR(50) NOT NULL REFERENCES 노트목록(아이디) ON DELETE CASCADE,
    부모메시지아이디 VARCHAR(50) REFERENCES 채팅메시지목록(아이디) ON DELETE CASCADE, -- 하위 메시지용
    텍스트 TEXT NOT NULL,
    작성자 VARCHAR(100), -- 대화형 입력용
    카테고리 VARCHAR(100), -- 카테고리형 입력용
    말풍선위치 VARCHAR(10), -- 대화형 입력에서 개별 메시지 위치 ('왼쪽' 또는 '오른쪽')
    타임스탬프 TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_노트목록_폴더아이디 ON 노트목록(폴더아이디);
CREATE INDEX IF NOT EXISTS idx_채팅메시지목록_노트아이디 ON 채팅메시지목록(노트아이디);
CREATE INDEX IF NOT EXISTS idx_채팅메시지목록_부모메시지아이디 ON 채팅메시지목록(부모메시지아이디);
CREATE INDEX IF NOT EXISTS idx_폴더목록_사용자아이디 ON 폴더목록(사용자아이디);

-- 수정시간 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_수정시간()
RETURNS TRIGGER AS $$
BEGIN
    NEW.수정시간 = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 수정시간 자동 업데이트 트리거
CREATE TRIGGER trigger_폴더목록_수정시간
    BEFORE UPDATE ON 폴더목록
    FOR EACH ROW
    EXECUTE FUNCTION update_수정시간();

CREATE TRIGGER trigger_노트목록_수정시간
    BEFORE UPDATE ON 노트목록
    FOR EACH ROW
    EXECUTE FUNCTION update_수정시간();

-- Row Level Security (RLS) 설정 (추후 인증 추가 시)
-- ALTER TABLE 폴더목록 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE 노트목록 ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE 채팅메시지목록 ENABLE ROW LEVEL SECURITY;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO 폴더목록 (아이디, 이름, 폴더설정) VALUES 
('folder-1', '음식일지', '{
    "시간표시여부": true,
    "입력방식": "카테고리형",
    "카테고리목록": ["아침", "점심", "저녁", "간식", "음료"],
    "하위입력활성화": false
}'),
('folder-2', '소설 대화', '{
    "시간표시여부": false,
    "입력방식": "대화형", 
    "캐릭터목록": [
        {"아이디": "char-1", "이름": "주인공", "기본위치": "왼쪽"},
        {"아이디": "char-2", "이름": "조연", "기본위치": "오른쪽"}
    ],
    "하위입력활성화": true
}'),
('folder-3', '일반 노트', '{
    "시간표시여부": true,
    "입력방식": "단순채팅",
    "하위입력활성화": false
}');