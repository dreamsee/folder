# Supabase 데이터베이스 마이그레이션 가이드

## 개요
개별 노트 설정 기능을 지원하기 위해 데이터베이스 스키마를 업데이트합니다.

## 마이그레이션 파일 적용

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://app.supabase.com/)에 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭

### 2. 마이그레이션 SQL 실행
`migration-add-note-settings.sql` 파일의 내용을 SQL Editor에 복사하여 실행:

```sql
-- 노트별 설정 필드 추가 마이그레이션
-- 실행 방법: Supabase 대시보드의 SQL Editor에서 실행

-- 노트목록 테이블에 노트설정 JSON 컬럼 추가
ALTER TABLE 노트목록 
ADD COLUMN IF NOT EXISTS 노트설정 JSONB DEFAULT NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_note_settings ON 노트목록 USING GIN (노트설정);

-- 테이블 변경 확인
\d 노트목록;
```

### 3. 마이그레이션 확인
실행 후 다음 쿼리로 테이블 구조 확인:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = '노트목록' 
ORDER BY ordinal_position;
```

## 데이터 구조
새로 추가된 `노트설정` 컬럼은 JSONB 타입으로 다음 형태의 데이터를 저장합니다:

```json
{
  "시간표시여부": true,
  "입력방식": "카테고리형",
  "하위입력활성화": false,
  "카테고리목록": ["아침", "점심", "저녁"],
  "캐릭터목록": [
    {
      "이름": "주인공",
      "색상": "#007bff"
    }
  ]
}
```

## 기능 설명
- **폴더 기본 설정**: 각 폴더에는 기본 설정이 있음
- **노트별 설정 오버라이드**: 개별 노트에서 필요한 경우 폴더 설정을 재정의
- **설정 우선순위**: 노트 설정 > 폴더 설정
- **빈 설정**: 노트설정이 null이거나 해당 필드가 undefined면 폴더 설정 사용

## 테스트 데이터 예시
필요시 다음 쿼리로 테스트 데이터 삽입:

```sql
-- 예시: 특정 노트에 카테고리형 입력 방식 설정
UPDATE 노트목록 SET 노트설정 = '{
  "시간표시여부": true,
  "입력방식": "카테고리형",
  "하위입력활성화": false,
  "카테고리목록": ["아침", "점심", "저녁"]
}'::jsonb 
WHERE 아이디 = 'your-note-id-here';
```

## 주의사항
1. 마이그레이션 실행 전 데이터베이스 백업 권장
2. `IF NOT EXISTS` 키워드 사용으로 중복 실행 시에도 안전
3. GIN 인덱스로 JSON 필드 검색 성능 최적화
4. 기존 데이터에는 영향 없음 (DEFAULT NULL)

## 마이그레이션 완료 후 확인
1. React 앱에서 노트 설정 모달 테스트
2. 폴더 기본값 사용/노트별 설정 적용 확인
3. 실시간 동기화 동작 확인