import { useState, useRef } from "react";
import { NotePage, NotePageState, PAGE_COLORS, DEFAULT_EMOJIS } from "../types/NotePage";

interface UsePageManagementProps {
  pageState: NotePageState;
  onPageStateChange: (pageState: NotePageState) => void;
  noteText: string;
  setNoteText: (text: string) => void;
  parseTimestamps: (text: string) => any[];
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

export const usePageManagement = ({
  pageState,
  onPageStateChange,
  noteText,
  setNoteText,
  parseTimestamps,
  showNotification,
}: UsePageManagementProps) => {
  // 페이지 탭 선택기 상태
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // 타임스탬프 가져오기 UI 상태
  const [showTimestampImporter, setShowTimestampImporter] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  // 탭 컨테이너 위치 참조
  const noteTabsRef = useRef<HTMLDivElement>(null);

  // 페이지 변경 핸들러
  const handlePageChange = (index: number) => {
    const newPageState = { ...pageState, activePageIndex: index };
    onPageStateChange(newPageState);
  };

  // 페이지 업데이트 핸들러
  const handlePageUpdate = (pageId: string, updates: Partial<NotePage>) => {
    const updatedPages = pageState.pages.map(page =>
      page.id === pageId ? { ...page, ...updates, updatedAt: Date.now() } : page
    );
    onPageStateChange({ ...pageState, pages: updatedPages });
  };

  // 새 페이지 추가 핸들러
  const handlePageAdd = () => {
    const newPage: NotePage = {
      id: `page-${Date.now()}`,
      name: `페이지 ${pageState.pages.filter(p => !p.isSpecial).length + 1}`,
      emoji: DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)],
      content: '',
      color: PAGE_COLORS[Math.floor(Math.random() * PAGE_COLORS.length)],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const newPages = [...pageState.pages, newPage];
    const newActiveIndex = newPages.length - 1;

    onPageStateChange({
      pages: newPages,
      activePageIndex: newActiveIndex
    });
  };

  // 페이지 삭제 핸들러
  const handlePageDelete = (pageId: string) => {
    const pageIndex = pageState.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const filteredPages = pageState.pages.filter(p => p.id !== pageId);
    let newActiveIndex = pageState.activePageIndex;

    // 삭제된 페이지가 현재 활성 페이지인 경우
    if (pageIndex === pageState.activePageIndex) {
      // 마지막 페이지가 삭제된 경우 이전 페이지로
      if (pageIndex === pageState.pages.length - 1) {
        newActiveIndex = Math.max(0, pageIndex - 1);
      }
    } else if (pageIndex < pageState.activePageIndex) {
      // 활성 페이지보다 앞의 페이지가 삭제된 경우 인덱스 조정
      newActiveIndex = pageState.activePageIndex - 1;
    }

    onPageStateChange({
      pages: filteredPages,
      activePageIndex: newActiveIndex
    });
  };

  // 페이지 순서 변경 핸들러 (드래그앤드롭)
  const handlePageReorder = (fromIndex: number, toIndex: number) => {
    const newPages = [...pageState.pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);

    // 현재 활성 페이지의 새로운 인덱스 계산
    let newActiveIndex = pageState.activePageIndex;
    if (pageState.activePageIndex === fromIndex) {
      newActiveIndex = toIndex;
    } else if (fromIndex < pageState.activePageIndex && toIndex >= pageState.activePageIndex) {
      newActiveIndex = pageState.activePageIndex - 1;
    } else if (fromIndex > pageState.activePageIndex && toIndex <= pageState.activePageIndex) {
      newActiveIndex = pageState.activePageIndex + 1;
    }

    onPageStateChange({
      pages: newPages,
      activePageIndex: newActiveIndex
    });
  };

  // 현재 활성 페이지 가져오기
  const getCurrentPage = () => {
    return pageState.pages[pageState.activePageIndex] || null;
  };

  // 페이지 내용 자동 저장
  const handleContentChange = (content: string) => {
    const currentPage = getCurrentPage();
    if (currentPage && !currentPage.isSpecial) {
      handlePageUpdate(currentPage.id, { content });
    }
  };

  // 통합 타임스탬프 페이지에서 모든 페이지의 타임스탬프 수집
  const getAllTimestamps = () => {
    const allTimestamps: any[] = [];

    pageState.pages.forEach(page => {
      if (!page.isSpecial && page.content) {
        const pageTimestamps = parseTimestamps(page.content);
        pageTimestamps.forEach(timestamp => {
          allTimestamps.push({
            ...timestamp,
            pageId: page.id,
            pageName: page.name,
            pageEmoji: page.emoji
          });
        });
      }
    });

    // 시작시간 순으로 정렬
    return allTimestamps.sort((a, b) => a.startTime - b.startTime);
  };

  // 선택기 핸들러들
  const handleEmojiClick = (pageId: string) => {
    setShowEmojiPicker(showEmojiPicker === pageId ? null : pageId);
    setShowColorPicker(null);
  };

  const handleColorClick = (pageId: string) => {
    setShowColorPicker(showColorPicker === pageId ? null : pageId);
    setShowEmojiPicker(null);
  };

  const handleEmojiSelect = (pageId: string, emoji: string) => {
    handlePageUpdate(pageId, { emoji });
    setShowEmojiPicker(null);
  };

  const handleColorSelect = (pageId: string, color: string) => {
    handlePageUpdate(pageId, { color });
    setShowColorPicker(null);
  };

  // 선택기 외부 클릭시 닫기
  const handleOutsideClick = () => {
    setShowEmojiPicker(null);
    setShowColorPicker(null);
    setShowTimestampImporter(false);
  };

  // 타임스탬프 가져오기 기능
  const handleImportTimestamps = () => {
    if (selectedPages.length === 0) {
      showNotification('가져올 페이지를 선택해주세요', 'warning');
      return;
    }

    const importedTimestamps: any[] = [];

    selectedPages.forEach(pageId => {
      const page = pageState.pages.find(p => p.id === pageId);
      if (page && !page.isSpecial && page.content) {
        const pageTimestamps = parseTimestamps(page.content);
        pageTimestamps.forEach(timestamp => {
          importedTimestamps.push({
            ...timestamp,
            pageId: page.id,
            pageName: page.name,
            pageEmoji: page.emoji
          });
        });
      }
    });

    // 시간순으로 정렬
    importedTimestamps.sort((a, b) => a.startTime - b.startTime);

    // 형식화된 텍스트 생성 - 각 타임스탬프와 연관된 텍스트 찾기
    const formattedContent = importedTimestamps.map(ts => {
      const page = pageState.pages.find(p => p.id === ts.pageId);
      if (!page) return ts.raw;

      // 페이지 내용에서 해당 타임스탬프 다음에 오는 텍스트 찾기
      const content = page.content || '';
      const timestampIndex = content.indexOf(ts.raw);

      if (timestampIndex === -1) return ts.raw;

      // 타임스탬프 이후의 텍스트 추출 - 다음 엔터까지만
      const afterTimestamp = content.slice(timestampIndex + ts.raw.length);
      const nextLineBreakIndex = afterTimestamp.indexOf('\n');
      const endIndex = nextLineBreakIndex !== -1 ? nextLineBreakIndex : afterTimestamp.length;

      let associatedText = afterTimestamp.slice(0, endIndex).trim();

      // 불필요한 문자 제거 및 정리
      associatedText = associatedText
        .replace(/^\s+/, '')
        .replace(/\s+$/, '')
        .trim();

      return associatedText ? `${ts.raw}     ${associatedText}` : ts.raw;
    }).join('\n');

    // 현재 전체 페이지 내용에 추가
    const currentContent = noteText || '';
    const newContent = currentContent ? `${currentContent}\n\n${formattedContent}` : formattedContent;

    setNoteText(newContent);
    setShowTimestampImporter(false);
    setSelectedPages([]);

    showNotification(`${importedTimestamps.length}개의 타임스탬프를 가져왔습니다`, 'success');
  };

  // 페이지 선택 토글
  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  // 탭 위치에 따른 선택기 위치 계산
  const getSelectionUIPosition = (isColorPicker: boolean = false) => {
    if (!noteTabsRef.current) return { bottom: '100%', left: '0' };

    const tabsRect = noteTabsRef.current.getBoundingClientRect();
    const containerRect = noteTabsRef.current.offsetParent?.getBoundingClientRect();

    if (!containerRect) return { bottom: '100%', left: '0' };

    // 탭 상단에서 약간 위로 위치시키기
    const bottomOffset = containerRect.bottom - tabsRect.top + 8;

    return {
      bottom: `${bottomOffset}px`,
      left: isColorPicker ? '200px' : '0px',
      right: 'auto'
    };
  };

  return {
    // 상태
    showEmojiPicker,
    showColorPicker,
    showTimestampImporter,
    selectedPages,
    noteTabsRef,

    // 페이지 관리 함수
    handlePageChange,
    handlePageUpdate,
    handlePageAdd,
    handlePageDelete,
    handlePageReorder,
    getCurrentPage,
    handleContentChange,
    getAllTimestamps,

    // 선택기 함수
    handleEmojiClick,
    handleColorClick,
    handleEmojiSelect,
    handleColorSelect,
    handleOutsideClick,

    // 타임스탬프 가져오기 함수
    handleImportTimestamps,
    togglePageSelection,
    getSelectionUIPosition,
    setShowTimestampImporter,
  };
};
