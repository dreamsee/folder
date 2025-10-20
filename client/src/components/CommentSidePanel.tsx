// 댓글 사이드 패널 컴포넌트
// 스와이프/호버로 왼쪽에서 슬라이드인되는 댓글 패널
// 타임스탬프 클릭으로 영상 시간 이동 기능 포함

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Clock, Heart, MessageCircle, Filter } from 'lucide-react';
import { formatTime } from '@/lib/youtubeUtils';

// 댓글 타입 정의
interface Comment {
  id: string;
  author: string;
  authorProfileImageUrl: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  timestamps?: Array<{
    time: number;
    text: string;
  }>;
}

// 정렬 옵션
type SortOption = 'newest' | 'popular' | 'timestamp' | 'relevance';

interface CommentSidePanelProps {
  videoId: string;
  player: any;
  isPlayerReady: boolean;
  showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  isFullscreen?: boolean; // 전체화면 상태
}

export const CommentSidePanel: React.FC<CommentSidePanelProps> = ({
  videoId,
  player,
  isPlayerReady,
  showNotification,
  isFullscreen = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 전체화면 버튼으로 패널 열기 이벤트 리스너
  useEffect(() => {
    const handleOpenPanel = () => {
      setIsOpen(true);
    };

    window.addEventListener('openCommentPanel', handleOpenPanel);
    return () => {
      window.removeEventListener('openCommentPanel', handleOpenPanel);
    };
  }, []);

  // 타임스탬프 추출 정규식 (다양한 형식 지원)
  const extractTimestamps = (text: string): Array<{time: number, text: string}> => {
    const timestamps: Array<{time: number, text: string}> = [];
    // 패턴: 00:00, 0:00, 00:00:00, 0:00:00 등
    const patterns = [
      /(\d{1,2}:\d{2}:\d{2})/g,  // HH:MM:SS or H:MM:SS
      /(\d{1,2}:\d{2})/g,         // MM:SS or M:SS
    ];

    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const timeStr = match[1];
        const parts = timeStr.split(':').reverse();
        let seconds = 0;

        // 초
        if (parts[0]) seconds += parseInt(parts[0]);
        // 분
        if (parts[1]) seconds += parseInt(parts[1]) * 60;
        // 시간
        if (parts[2]) seconds += parseInt(parts[2]) * 3600;

        if (!isNaN(seconds) && seconds > 0) {
          timestamps.push({
            time: seconds,
            text: timeStr
          });
        }
      }
    });

    // 중복 제거
    const uniqueTimestamps = timestamps.filter((item, index, self) =>
      index === self.findIndex((t) => t.time === item.time)
    );

    return uniqueTimestamps.sort((a, b) => a.time - b.time);
  };

  // 댓글 로드 (YouTube API 사용)
  const loadComments = async () => {
    if (!videoId) return;

    setIsLoading(true);
    try {
      // YouTube 댓글 API 호출
      const response = await fetch(`/api/youtube/comments/${videoId}?order=${sortBy}`);

      if (!response.ok) {
        throw new Error('댓글을 가져올 수 없습니다');
      }

      const data = await response.json();

      // API 응답을 Comment 형식으로 변환
      const apiComments: Comment[] = data.items?.map((item: any) => ({
        id: item.id,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
        text: item.snippet.topLevelComment.snippet.textOriginal || item.snippet.topLevelComment.snippet.textDisplay,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt
      })) || [];

      // 타임스탬프 추출
      const commentsWithTimestamps = apiComments.map(comment => ({
        ...comment,
        timestamps: extractTimestamps(comment.text)
      }));

      setComments(commentsWithTimestamps);
    } catch (error) {
      console.error('댓글 로드 실패:', error);

      // 에러 알림 활성화 (디버깅용)
      showNotification('댓글을 불러올 수 없습니다', 'error');

      // API 실패시 빈 배열 설정
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 정렬 (클라이언트 사이드)
  const sortComments = (comments: Comment[]): Comment[] => {
    const sorted = [...comments];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      case 'popular':
        return sorted.sort((a, b) => b.likeCount - a.likeCount);
      case 'timestamp':
        // 타임스탬프가 있는 댓글을 먼저, 그 다음 좋아요순
        return sorted.sort((a, b) => {
          const aHasTimestamp = a.timestamps && a.timestamps.length > 0;
          const bHasTimestamp = b.timestamps && b.timestamps.length > 0;

          if (aHasTimestamp && !bHasTimestamp) return -1;
          if (!aHasTimestamp && bHasTimestamp) return 1;

          return b.likeCount - a.likeCount;
        });
      case 'relevance':
        // YouTube API의 relevance 정렬 유지
        return sorted;
      default:
        return sorted;
    }
  };

  // 타임스탬프 클릭 처리
  const handleTimestampClick = (time: number) => {
    if (isPlayerReady && player) {
      player.seekTo(time, true);
      showNotification(`${formatTime(time)}로 이동`, 'success');
    }
  };

  // 터치 이벤트 처리 (모바일 스와이프)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;

    // 오른쪽으로 스와이프 (열기)
    if (swipeDistance > 50 && !isOpen) {
      setIsOpen(true);
    }
    // 왼쪽으로 스와이프 (닫기)
    if (swipeDistance < -50 && isOpen) {
      setIsOpen(false);
    }
  };

  // 마우스 호버 처리 (데스크톱) - 더 신중하게
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (!isOpen) {
      setTimeout(() => {
        if (isHovering && !isOpen) {
          setIsOpen(true);
        }
      }, 800); // 800ms로 지연 시간 증가
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // 패널 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // videoId 또는 정렬 변경시 댓글 재로드
  useEffect(() => {
    if (videoId) {
      loadComments();
    }
  }, [videoId, sortBy]);

  // 정렬된 댓글
  const sortedComments = sortComments(comments);
  const timestampComments = sortedComments.filter(c => c.timestamps && c.timestamps.length > 0);
  const regularComments = sortedComments.filter(c => !c.timestamps || c.timestamps.length === 0);

  return (
    <>
      {/* 트리거 영역 - 일반 모드일 때만 표시 (전체화면은 버튼 사용) */}
      {!isFullscreen && (
        <div
          className="fixed left-0 top-0 h-full z-40"
          style={{
            width: '50px',
            background: isOpen ? 'transparent' : 'linear-gradient(to right, rgba(0,0,0,0.05), transparent)',
            pointerEvents: isOpen ? 'none' : 'auto'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}


      {/* 배경 오버레이 */}
      {isOpen && (
        <div
          className={`${isFullscreen ? 'absolute' : 'fixed'} inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300`}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 댓글 패널 */}
      <div
        ref={panelRef}
        className={`${isFullscreen ? 'absolute' : 'fixed'} left-0 top-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '320px' }}
        onMouseLeave={handleMouseLeave}
      >
        {/* 패널 헤더 */}
        <div className="sticky top-0 bg-white border-b p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              댓글 {comments.length}개
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* 정렬 선택 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="relevance">관련성순</option>
            <option value="newest">최신순</option>
            <option value="popular">인기순</option>
            <option value="timestamp">타임스탬프 우선</option>
          </select>
        </div>

        {/* 댓글 목록 */}
        <div className="overflow-y-auto h-full pb-20">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              댓글을 불러오는 중...
            </div>
          ) : comments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              댓글이 없습니다
            </div>
          ) : (
            <>
              {/* 타임스탬프 우선 정렬일 때만 별도 섹션으로 표시 */}
              {sortBy === 'timestamp' && timestampComments.length > 0 && (
                <div className="p-4 bg-blue-50 border-b">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    타임스탬프 댓글
                  </h4>
                  {timestampComments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onTimestampClick={handleTimestampClick}
                      highlight={true}
                    />
                  ))}
                </div>
              )}

              {/* 일반 댓글 섹션 */}
              <div className="p-4">
                {(sortBy === 'timestamp' ? regularComments : sortedComments).map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onTimestampClick={handleTimestampClick}
                    highlight={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// 개별 댓글 컴포넌트
const CommentItem: React.FC<{
  comment: Comment;
  onTimestampClick: (time: number) => void;
  highlight?: boolean;
}> = ({ comment, onTimestampClick, highlight = false }) => {
  // 텍스트에서 타임스탬프를 링크로 변환
  const renderTextWithTimestamps = (text: string) => {
    if (!comment.timestamps || comment.timestamps.length === 0) {
      return text;
    }

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    comment.timestamps.forEach((timestamp, index) => {
      const timestampIndex = text.indexOf(timestamp.text, lastIndex);

      if (timestampIndex !== -1) {
        // 타임스탬프 이전 텍스트
        if (timestampIndex > lastIndex) {
          elements.push(text.substring(lastIndex, timestampIndex));
        }

        // 타임스탬프 링크
        elements.push(
          <button
            key={index}
            onClick={() => onTimestampClick(timestamp.time)}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            {timestamp.text}
          </button>
        );

        lastIndex = timestampIndex + timestamp.text.length;
      }
    });

    // 남은 텍스트
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements;
  };

  return (
    <div className={`mb-4 pb-4 border-b last:border-b-0 ${highlight ? 'bg-blue-50 p-3 rounded-lg' : ''}`}>
      <div className="flex-1">
        {/* 작성자 정보 */}
        <div className="mb-1">
          <div className="font-semibold text-sm">{comment.author}</div>
          <div className="text-xs text-gray-500">
            {new Date(comment.publishedAt).toLocaleDateString()}
          </div>
        </div>

        {/* 댓글 내용 */}
        <div className="text-sm text-gray-800 whitespace-pre-wrap">
          {renderTextWithTimestamps(comment.text)}
        </div>

        {/* 좋아요 */}
        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
            <Heart className="h-3 w-3" />
            {comment.likeCount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSidePanel;