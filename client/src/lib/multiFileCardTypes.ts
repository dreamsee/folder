// 3개 파일 매칭 시스템 타입 정의

// 카드의 각 파일 매칭 정보
export interface CardMatch {
  fileIndex: 0 | 1 | 2;  // 파일1, 파일2, 파일3
  lineNumber: number;  // 사용자가 입력한 줄 번호 (1-based)
  originalContent: string;  // 원본 내용 (매칭 검색용)
  modifiedContent: string;  // 수정된 내용
  startLine: number;  // 0-based 시작 줄
  startChar: number;
  endLine: number;  // 0-based 끝 줄
  endChar: number;
}

// 매칭 카드
export interface MatchCard {
  id: string;
  name: string;  // 카드 이름 (예: "검", "창")
  categoryId: string;
  matches: CardMatch[];  // 3개 파일의 매칭 정보
  memo?: string;  // 카드 메모
  order?: number;  // 카테고리 내 순서
  createdAt: number;
  updatedAt: number;
}

// 로드된 파일 정보
export interface LoadedFile {
  index: 0 | 1 | 2;
  name: string;
  content: string;
  lines: string[];  // 줄 단위로 분리된 내용
  rawData?: ArrayBuffer;  // 원본 바이너리 데이터 (인코딩 보존용)
  encoding?: string;  // 감지된 인코딩 정보
  lineEnding?: '\r\n' | '\n';  // 줄바꿈 문자 (Windows CRLF vs Unix LF)
  originalContent?: string;  // 업로드 시점의 원본 텍스트 (수정 여부 판단용)
}

// 카드 카테고리
export interface CardCategory {
  id: string;
  name: string;
  color: string;
  order: number;
}

// 변경 감지 결과
export interface ChangeDetection {
  cardId: string;
  cardName: string;
  changes: {
    fileIndex: 0 | 1 | 2;
    oldLine: number;
    newLine: number | null;  // null이면 삭제됨
    oldContent: string;
    newContent: string | null;
    isModified: boolean;  // 내용 변경 여부
  }[];
}
