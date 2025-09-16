// 원본 문서 타입
export interface OriginalDocument {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

// 수정된 문서 타입
export interface ModifiedDocument {
  id: number;
  title: string;
  content: string;
  originalId: number;
  regionData?: any; // 줄 그룹화 및 영역 데이터
  createdAt: string;
}

// 수정된 문서 생성시 사용할 타입
export interface CreateModifiedDocument {
  title: string;
  content: string;
  originalId: number;
  regionData?: any; // 줄 그룹화 및 영역 데이터
}

// 비교 모드 타입
export type ComparisonMode = "side-by-side" | "top-bottom" | "edit-only" | "diff";

// 덮어쓰기 모드 타입
export type SaveMode = "create" | "overwrite";

// 비교 결과 타입
export interface DiffResult {
  html: string;
  stats: {
    additions: number;
    deletions: number;
  };
}
