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

// 페이지 색상 프리셋
export const PAGE_COLORS = [
  '#fef3c7', // 노란색
  '#fecaca', // 빨간색
  '#c7d2fe', // 파란색
  '#bbf7d0', // 초록색
  '#fed7e2', // 분홍색
  '#e5e7eb', // 회색
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