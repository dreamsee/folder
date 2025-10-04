import React, { useState, useEffect, useRef } from "react";
import { Chapter } from "@/utils/chapterParser";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ChapterBarProps {
  chapters: Chapter[];
  currentTime: number;
  onChapterClick: (seconds: number) => void;
  className?: string;
}

const ChapterBar: React.FC<ChapterBarProps> = ({
  chapters,
  currentTime,
  onChapterClick,
  className = ""
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [chaptersPerPage, setChaptersPerPage] = useState(3); // 기본값: 3개씩 표시
  const [inputValue, setInputValue] = useState('3'); // 입력 필드용 별도 상태
  const [pageWindowStart, setPageWindowStart] = useState(0); // 표시할 페이지 그룹의 시작 인덱스
  const [maxVisiblePages, setMaxVisiblePages] = useState(7); // 보일 수 있는 최대 페이지 수
  const containerRef = useRef<HTMLDivElement>(null);

  // 챕터가 없으면 렌더링하지 않음
  if (!chapters || chapters.length === 0) {
    return null;
  }

  // 챕터 수가 변경되면 기본값 3으로 리셋
  useEffect(() => {
    setChaptersPerPage(3);
    setInputValue('3');
    setCurrentPage(0);
  }, [chapters.length]);

  // 컨테이너 너비에 따라 보일 수 있는 최대 페이지 수 계산
  useEffect(() => {
    const calculateMaxVisiblePages = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // 화살표 버튼(각 30px) + 입력란 영역(약 150px) + 여백(20px) = 230px
        const availableWidth = containerWidth - 230;
        // 각 페이지 버튼 너비 약 40px (패딩 포함)
        const pageButtonWidth = 40;
        const maxPages = Math.floor(availableWidth / pageButtonWidth);
        setMaxVisiblePages(Math.max(3, maxPages)); // 최소 3개는 보이도록
      }
    };

    calculateMaxVisiblePages();
    window.addEventListener('resize', calculateMaxVisiblePages);
    return () => window.removeEventListener('resize', calculateMaxVisiblePages);
  }, []);

  // 현재 재생 중인 챕터 인덱스 찾기
  const getCurrentChapterIndex = () => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTime >= chapters[i].seconds) {
        return i;
      }
    }
    return -1;
  };

  const currentChapterIndex = getCurrentChapterIndex();
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil(chapters.length / chaptersPerPage);
  
  // 현재 재생 중인 챕터가 포함된 페이지로 자동 이동
  useEffect(() => {
    if (currentChapterIndex >= 0) {
      const targetPage = Math.floor(currentChapterIndex / chaptersPerPage);
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
    }
  }, [currentChapterIndex, chaptersPerPage]);

  // 텍스트 너비 측정 함수 (실제 DOM 사용)
  const textWidthCache = useRef<Map<string, number>>(new Map());

  const measureTextWidth = (text: string): number => {
    // 캐시 확인
    if (textWidthCache.current.has(text)) {
      return textWidthCache.current.get(text)!;
    }

    // 임시 span 요소 생성하여 실제 너비 측정
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'nowrap';
    span.style.fontSize = '12px'; // text-xs
    span.style.fontFamily = 'sans-serif';
    span.style.padding = '0 4px'; // px-1
    span.textContent = text;

    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);

    // 캐시에 저장
    textWidthCache.current.set(text, width);
    return width;
  };

  // 현재 페이지의 챕터들 가져오기
  const startIndex = currentPage * chaptersPerPage;
  const endIndex = Math.min(startIndex + chaptersPerPage, chapters.length);
  const currentPageChapters = chapters.slice(startIndex, endIndex);

  // 현재 페이지 챕터들의 총 시간 계산
  const pageStartTime = currentPageChapters[0]?.seconds || 0;
  const pageEndTime = currentPageChapters[currentPageChapters.length - 1]?.seconds + (currentPageChapters[currentPageChapters.length - 1]?.duration || 0) || 0;
  const pageTotalDuration = pageEndTime - pageStartTime;

  // 각 챕터의 페이지 내 상대적 너비 계산
  const chaptersWithRelativeWidth = (() => {
    // 전체 챕터 표시 모드: 시간 비율 사용
    if (chaptersPerPage >= chapters.length) {
      return currentPageChapters.map(chapter => ({
        ...chapter,
        relativeWidth: pageTotalDuration > 0 ? ((chapter.duration || 0) / pageTotalDuration) * 100 : 100 / currentPageChapters.length
      }));
    }

    // 페이지 모드: 텍스트 길이에 따라 동적 조정
    const withTextWidth = currentPageChapters.map(chapter => ({
      ...chapter,
      textWidth: measureTextWidth(chapter.title)
    }));

    // 최소 너비: 텍스트가 들어갈 공간
    // 최대 너비: 균등 분배의 1.5배
    const evenWidth = 100 / currentPageChapters.length;
    const totalTextWidth = withTextWidth.reduce((sum, ch) => sum + ch.textWidth, 0);

    // 각 챕터의 목표 너비 계산
    let widths = withTextWidth.map(ch => {
      // 텍스트 비율로 계산
      const textRatio = ch.textWidth / totalTextWidth;
      const targetWidth = textRatio * 100;
      // 최소 10%, 최대 균등분배의 2배
      return Math.max(10, Math.min(targetWidth, evenWidth * 2));
    });

    // 총합이 100%가 되도록 정규화
    const totalWidth = widths.reduce((sum, w) => sum + w, 0);
    widths = widths.map(w => (w / totalWidth) * 100);

    return currentPageChapters.map((chapter, index) => ({
      ...chapter,
      relativeWidth: widths[index]
    }));
  })();

  // 각 챕터의 누적 위치와 너비 계산
  const getChapterPositions = () => {
    let accumulatedWidth = 0;
    return chaptersWithRelativeWidth.map((chapter, index) => {
      const startPos = accumulatedWidth;
      const width = chapter.relativeWidth;
      accumulatedWidth += width;
      return {
        index,
        startPos, // 시작 위치 (%)
        endPos: accumulatedWidth, // 끝 위치 (%)
        width, // 막대 너비 (%)
        textWidth: measureTextWidth(chapter.title), // 텍스트 실제 너비 (px)
        title: chapter.title
      };
    });
  };

  // 스마트하게 텍스트 자르기 (단어 단위)
  const smartTruncate = (text: string, maxWidth: number): string => {
    const ellipsis = '...';
    const ellipsisWidth = measureTextWidth(ellipsis);
    const fullWidth = measureTextWidth(text);

    if (fullWidth <= maxWidth) return text;

    // '...' 공간 확보
    const availableWidth = maxWidth - ellipsisWidth - 5; // 여유 5px

    if (availableWidth <= 0) return ellipsis;

    // 이진 탐색으로 최대 길이 찾기
    let left = 0;
    let right = text.length;
    let bestLength = 0;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const testText = text.substring(0, mid);
      const testWidth = measureTextWidth(testText);

      if (testWidth <= availableWidth) {
        bestLength = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (bestLength === 0) return ellipsis;

    // 단어 경계에서 자르기 (띄어쓰기, 괄호 등)
    let truncated = text.substring(0, bestLength);
    const breakChars = [' ', '(', ')', '-', '/', ',', '&'];

    // 마지막 10자 내에서 단어 경계 찾기
    for (let i = truncated.length - 1; i >= Math.max(0, truncated.length - 10); i--) {
      if (breakChars.includes(truncated[i])) {
        truncated = truncated.substring(0, i);
        break;
      }
    }

    return truncated.trim() + ellipsis;
  };

  // 충돌 검사 및 최대 너비 계산
  const getMaxWidth = (index: number, containerWidth: number): number | null => {
    if (!containerRef.current) return null;

    const positions = getChapterPositions();
    const current = positions[index];
    if (!current) return null;

    const currentStartPx = (current.startPos / 100) * containerWidth;

    // 같은 줄의 다음 챕터 찾기
    const nextSameRow = positions.find(p =>
      p.index > index &&
      p.index % 2 === index % 2
    );

    const limitPx = nextSameRow
      ? (nextSameRow.startPos / 100) * containerWidth
      : containerWidth;

    const maxWidth = limitPx - currentStartPx;

    // 텍스트가 제한을 초과하는 경우에만 maxWidth 반환
    if (current.textWidth > maxWidth) {
      return maxWidth;
    }

    return null;
  };

  // 페이지 이동 (왼쪽 화살표 - 1칸씩)
  const handlePrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      
      // 새 페이지가 현재 윈도우 밖에 있으면 윈도우 이동
      if (newPage < pageWindowStart) {
        setPageWindowStart(Math.max(0, pageWindowStart - 1));
      }
    }
  };

  // 페이지 이동 (오른쪽 화살표 - 1칸씩)
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      
      // 새 페이지가 현재 윈도우 밖에 있으면 윈도우 이동
      if (newPage >= pageWindowStart + maxVisiblePages) {
        setPageWindowStart(pageWindowStart + 1);
      }
    }
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 현재 페이지가 보이는 범위를 벗어나면 pageWindowStart 조정
  useEffect(() => {
    if (currentPage < pageWindowStart) {
      setPageWindowStart(currentPage);
    } else if (currentPage >= pageWindowStart + maxVisiblePages) {
      setPageWindowStart(Math.max(0, currentPage - maxVisiblePages + 1));
    }
  }, [currentPage, pageWindowStart, maxVisiblePages]);

  return (
    <div className={`w-full ${className}`}>

      {/* 위쪽 챕터 제목들 (짝수 인덱스: 0, 2, 4...) */}
      <div className="flex w-full mb-1 h-4">
        {chaptersWithRelativeWidth.map((chapter, index) => {
          const containerWidth = containerRef.current?.offsetWidth || 1000;
          const maxWidth = index % 2 === 0 ? getMaxWidth(index, containerWidth) : null;
          const displayText = maxWidth !== null
            ? smartTruncate(chapter.title, maxWidth)
            : chapter.title;

          return (
            <div
              key={`top-${index}`}
              className={`text-xs px-1 ${
                index % 2 === 0 ? 'text-gray-600' : 'text-transparent'
              }`}
              style={{ width: `${chapter.relativeWidth}%` }}
              title={index % 2 === 0 ? chapter.title : ''}
            >
              <div className="whitespace-nowrap overflow-visible">
                {index % 2 === 0 ? displayText : ''}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 챕터 바들 */}
      <div className="flex w-full h-2">
        {chaptersWithRelativeWidth.map((chapter, originalIndex) => {
          const globalIndex = startIndex + originalIndex;
          return (
            <button
              key={globalIndex}
              className={`h-full border-r border-white transition-colors duration-200 hover:opacity-80 ${
                globalIndex === currentChapterIndex
                  ? 'bg-blue-500'  // 현재 챕터: 파란색
                  : 'bg-gray-300'  // 기본: 회색
              }`}
              style={{ width: `${chapter.relativeWidth}%` }}
              onClick={() => onChapterClick(chapter.seconds)}
              title={`${chapter.time} - ${chapter.title}`}
            />
          );
        })}
      </div>
      
      {/* 아래쪽 챕터 제목들 (홀수 인덱스: 1, 3, 5...) */}
      <div className="flex w-full mt-1 h-4">
        {chaptersWithRelativeWidth.map((chapter, index) => {
          const containerWidth = containerRef.current?.offsetWidth || 1000;
          const maxWidth = index % 2 === 1 ? getMaxWidth(index, containerWidth) : null;
          const displayText = maxWidth !== null
            ? smartTruncate(chapter.title, maxWidth)
            : chapter.title;

          return (
            <div
              key={`bottom-${index}`}
              className={`text-xs px-1 ${
                index % 2 === 1 ? 'text-gray-600' : 'text-transparent'
              }`}
              style={{ width: `${chapter.relativeWidth}%` }}
              title={index % 2 === 1 ? chapter.title : ''}
            >
              <div className="whitespace-nowrap overflow-visible">
                {index % 2 === 1 ? displayText : ''}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 챕터 시간 표시 */}
      <div className="flex w-full mt-1">
        {chaptersWithRelativeWidth.map((chapter, index) => (
          <div
            key={`time-${index}`}
            className="text-xs text-gray-500 text-center"
            style={{ width: `${chapter.relativeWidth}%` }}
          >
            {chapter.time}
          </div>
        ))}
      </div>

      {/* 페이지 네비게이션 및 챕터 표시 개수 설정 */}
      <div className="flex items-center mt-2 gap-2" ref={containerRef}>
        <div className="flex-1 flex justify-center items-center">
          {totalPages > 1 && (
            <div className="flex items-center">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded"
              >
                &lt;
              </button>

              {/* 페이지 번호 컨테이너 - 동적 너비 */}
              <div className="flex gap-1 overflow-hidden mx-1" style={{ maxWidth: `${maxVisiblePages * 40}px` }}>
                <div
                  className="flex gap-1 transition-transform duration-300"
                  style={{ transform: `translateX(-${pageWindowStart * 40}px)` }}
                >
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageClick(index)}
                      className={`px-3 py-1 text-sm rounded flex-shrink-0 ${
                        index === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      style={{ minWidth: '36px' }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
        
        {/* 챕터 표시 개수 입력란 - 우측 정렬 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => {
              // 전체 챕터 보기
              setChaptersPerPage(chapters.length);
              setInputValue(chapters.length.toString());
              setCurrentPage(0);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            [{chapters.length}]챕터
          </button>
          <span className="text-sm text-gray-600">표시</span>
          <input
            type="number"
            min="1"
            max={chapters.length}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value); // 입력값 그대로 저장
            }}
            onBlur={(e) => {
              const 값 = parseInt(e.target.value) || 1; // 빈 값이면 1로 처리
              const 제한값 = Math.min(Math.max(값, 1), chapters.length);
              setChaptersPerPage(제한값);
              setInputValue(제한값.toString()); // 검증된 값으로 입력 필드 업데이트
              setCurrentPage(0); // 페이지 변경 시 첫 페이지로 이동
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur(); // Enter 키 시 blur 이벤트 발생
              }
            }}
            className="w-10 px-1 py-0.5 text-sm text-center border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
};

export default ChapterBar;