// 북마크 스타일 탭 컴포넌트
// 다중 페이지 노트 시스템을 위한 탭 인터페이스
// 기능: 탭 전환, 인라인 편집, 이모지/색상 선택, 드래그앤드롭 정렬

import React, { useState, useRef, useEffect } from 'react';
import { NotePage, NotePageState, SPECIAL_PAGES } from '../types/NotePage';

interface NoteTabsProps {
  pageState: NotePageState;
  onPageChange: (index: number) => void;
  onPageUpdate: (pageId: string, updates: Partial<NotePage>) => void;
  onPageAdd: () => void;
  onPageDelete: (pageId: string) => void;
  onPageReorder: (fromIndex: number, toIndex: number) => void;
  onEmojiClick: (pageId: string) => void;
  onColorClick: (pageId: string) => void;
}

export const NoteTabs: React.FC<NoteTabsProps> = ({
  pageState,
  onPageChange,
  onPageUpdate,
  onPageAdd,
  onPageDelete,
  onPageReorder,
  onEmojiClick,
  onColorClick
}) => {
  // 편집 상태 관리
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // 드래그앤드롭 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 탭 포커스 상태 (포스트잇 vs 책갈피 효과)
  const [isTabsFocused, setIsTabsFocused] = useState(false);

  // 마지막 포커스 획득 시간 추적 (클릭으로 인한 포커스인지 구분)
  const [lastFocusTime, setLastFocusTime] = useState(0);

  const editInputRef = useRef<HTMLInputElement>(null);

  // 편집 모드 진입 시 입력 필드 포커스
  useEffect(() => {
    if (editingPageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingPageId]);

  // 탭 클릭 핸들러 - 최소화 상태에서는 포커스 우선, 확대 상태에서만 편집 모드
  const handleTabClick = (index: number, pageId: string) => {
    if (pageState.activePageIndex === index && !pageState.pages[index].isSpecial) {
      // 선택된 탭 재클릭 시
      const now = Date.now();
      const wasJustFocused = now - lastFocusTime < 100; // 100ms 이내에 포커스된 경우

      if (!isTabsFocused || wasJustFocused) {
        // 최소화 상태이거나 방금 포커스된 경우: 포커스만 (편집 모드 안됨)
        setIsTabsFocused(true);
        setLastFocusTime(now);
      } else {
        // 이미 확대된 상태에서 클릭: 편집 모드 진입
        setEditingPageId(pageId);
        setEditingName(pageState.pages[index].name);
      }
    } else {
      // 다른 탭 클릭 -> 페이지 전환
      onPageChange(index);
    }
  };

  // 편집 완료 핸들러
  const handleEditComplete = () => {
    if (editingPageId && editingName.trim()) {
      onPageUpdate(editingPageId, { name: editingName.trim() });
    }
    setEditingPageId(null);
    setEditingName('');
  };

  // 편집 취소 핸들러
  const handleEditCancel = () => {
    setEditingPageId(null);
    setEditingName('');
  };


  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    // 특수 페이지는 드래그 불가
    if (pageState.pages[index].isSpecial) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 드래그 오버 핸들러
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // 특수 페이지는 드롭 대상에서 제외
    if (!pageState.pages[index].isSpecial) {
      setDragOverIndex(index);
    }
  };

  // 드롭 핸들러
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex && !pageState.pages[dropIndex].isSpecial) {
      onPageReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 페이지 삭제 핸들러
  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (window.confirm('이 페이지를 삭제하시겠습니까?')) {
      onPageDelete(pageId);
    }
  };

  return (
    <div
      className={`note-tabs-container ${isTabsFocused ? 'focused' : 'minimized'}`}
      onFocus={() => {
        setIsTabsFocused(true);
        setLastFocusTime(Date.now());
      }}
      onBlur={() => setIsTabsFocused(false)}
      tabIndex={0}
    >
      {/* 탭 목록 */}
      <div className="note-tabs-wrapper">
        <div className="note-tabs">
          {pageState.pages.map((page, index) => (
            <div
              key={page.id}
              className={`note-tab ${
                pageState.activePageIndex === index ? 'active' : ''
              } ${page.isSpecial ? 'special' : ''} ${
                draggedIndex === index ? 'dragging' : ''
              } ${dragOverIndex === index ? 'drag-over' : ''}`}
              style={{
                backgroundColor: page.color,
                borderColor: pageState.activePageIndex === index ? '#007acc' : '#ddd'
              }}
              draggable={!page.isSpecial}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
              onClick={() => handleTabClick(index, page.id)}
            >
              {/* 이모지 영역 - 클릭시 이모지 선택기 */}
              <div
                className="tab-emoji"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!page.isSpecial) {
                    onEmojiClick(page.id);
                  }
                }}
              >
                {page.emoji}
              </div>

              {/* 탭 이름 영역 - 편집 모드 또는 일반 표시 */}
              <div className="tab-name">
                {editingPageId === page.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleEditComplete}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditComplete();
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                    className="tab-name-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span>{page.name}</span>
                )}
              </div>

              {/* 색상 선택 영역 */}
              <div
                className="tab-color-indicator"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!page.isSpecial) {
                    onColorClick(page.id);
                  }
                }}
                style={{ backgroundColor: page.color }}
              />

              {/* 삭제 버튼 - 특수 페이지와 유일한 페이지는 삭제 불가 */}
              {!page.isSpecial && pageState.pages.filter(p => !p.isSpecial).length > 1 && (
                <button
                  className="tab-delete-btn"
                  onClick={(e) => handleDeletePage(e, page.id)}
                  title="페이지 삭제"
                >
                  ×
                </button>
              )}

            </div>
          ))}

          {/* 새 페이지 추가 버튼 */}
          <button
            className="add-page-btn"
            onClick={onPageAdd}
            title="새 페이지 추가"
          >
            +
          </button>
        </div>
      </div>

      <style>{`
        .note-tabs-container {
          position: relative;
          margin-bottom: -1px;
        }

        .note-tabs-wrapper {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #ccc transparent;
        }

        /* 최소화 상태에서 스크롤바 숨기기 */
        .note-tabs-container.minimized .note-tabs-wrapper {
          overflow-x: hidden;
          scrollbar-width: none;
        }

        .note-tabs-container.minimized .note-tabs-wrapper::-webkit-scrollbar {
          display: none;
        }

        .note-tabs {
          display: flex;
          min-width: fit-content;
          padding: 0;
          gap: 1px;
          margin-bottom: 0;
        }

        .note-tab {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 120px;
          max-width: 200px;
          padding: 0 12px;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 8px 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: none;
          margin-top: 0;
          height: 32px;
          transform-origin: top;
        }

        /* 포커스 없을 때 - 책갈피 효과 (최소화) */
        .note-tabs-container.minimized .note-tab {
          height: 12px; /* 4px 늘려서 12px */
          padding: 0 8px;
          gap: 3px;
          box-shadow: none;
          opacity: 0.7;
          transform: translateY(0); /* translateY 제거 - 상단 고정 */
          font-size: 10px;
          align-items: flex-start;
        }

        /* 최소화 상태에서 탭 내용 숨기기 */
        .note-tabs-container.minimized .tab-name,
        .note-tabs-container.minimized .tab-emoji,
        .note-tabs-container.minimized .tab-delete-btn,
        .note-tabs-container.minimized .tab-color-indicator {
          display: none;
        }

        /* 포커스 있을 때 - 포스트잇 효과 (튀어나옴) */
        .note-tabs-container.focused .note-tab {
          height: 32px; /* 원래 크기 */
          padding: 0 12px;
          gap: 6px;
          box-shadow: none;
          opacity: 1;
          transform: translateY(0); /* 원래 위치 */
        }

        .note-tab:hover {
          background: #fff;
        }

        .note-tab.active {
          background: #fff;
          border-color: #007acc;
          border-width: 2px;
          border-top: 2px solid #007acc;
          z-index: 10;
          transform: translateY(0);
          box-shadow: none;
        }

        .note-tab.special {
          background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
          border-color: #bbb;
        }

        .note-tab.dragging {
          opacity: 0.5;
          transform: rotate(5deg);
        }

        .note-tab.drag-over {
          border-left: 3px solid #007acc;
        }

        .tab-emoji {
          font-size: 16px;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .tab-emoji:hover {
          background-color: rgba(0,0,0,0.1);
        }

        .tab-name {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 500;
        }

        .tab-name span {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tab-name-input {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          outline: 1px solid #007acc;
          border-radius: 2px;
          padding: 2px 4px;
        }

        .tab-color-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.2s;
        }

        .tab-color-indicator:hover {
          transform: scale(1.2);
        }

        .tab-delete-btn {
          width: 16px;
          height: 16px;
          border: none;
          background: #ff4757;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .tab-delete-btn:hover {
          opacity: 1;
        }


        .add-page-btn {
          min-width: 40px;
          height: 24px; /* 높이 24로 변경 */
          border: 1px dashed #ccc;
          background: transparent;
          color: #666;
          border-radius: 0 0 8px 8px;
          border-top: none;
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          transition: all 0.2s ease;
          margin-top: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .add-page-btn:hover {
          background: #f0f0f0;
          border-color: #007acc;
          color: #007acc;
          transform: translateY(1px);
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }

        /* 모바일 대응 */
        @media (max-width: 768px) {
          .note-tab {
            min-width: 100px;
            padding: 6px 10px;
          }

          .tab-name {
            font-size: 12px;
          }

          .tab-emoji {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};