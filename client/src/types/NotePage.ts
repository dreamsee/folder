// 멀티페이지 노트 시스템 타입 정의

export interface NotePage {
  id: string;
  name: string;
  emoji: string;
  content: string;
  color: string;
  isSpecial?: boolean; // 전체 타임스탬프 페이지 등 특수 페이지 표시
  createdAt: number;
  updatedAt: number;
}

export interface NotePageState {
  pages: NotePage[];
  activePageIndex: number;
}

// 페이지 색상 프리셋 (구분 잘되는 파스텔 톤)
export const PAGE_COLORS = [
  '#fef3c7', // 노란색 (버터)
  '#fecaca', // 빨간색 (코랄)
  '#bfdbfe', // 하늘색 (스카이)
  '#bbf7d0', // 초록색 (민트)
  '#e9d5ff', // 라벤더 (보라)
  '#fed7d7', // 복숭아색 (피치)
] as const;

// 기본 이모지 프리셋
export const DEFAULT_EMOJIS = [
  '📝', '📖', '✨', '💬', '🎯', '📋',
  '🔍', '💡', '⭐', '📌', '🎨', '🚀'
] as const;

// 특수 페이지 설정
export const SPECIAL_PAGES = {
  UNIFIED_TIMESTAMPS: {
    id: 'unified-timestamps',
    name: '전체',
    emoji: '📋',
    color: '#e5e7eb',
    isSpecial: true,
  }
} as const;