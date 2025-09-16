// 댓글 상세보기 모달 컴포넌트
// 평가 버튼 클릭시 중앙에 표시되는 팝업

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Star, ArrowUpDown, X, Plus } from 'lucide-react';
import CommentInputModal from './CommentInputModal';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: Date;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  channelName: string;
  averageRating: number;
  totalComments: number;
  comments: Comment[];
  isOwner: boolean; // 주인/사용자 구분
  currentUserId?: string; // 현재 사용자 ID (사용자용)
  onCommentSubmit?: (comment: Omit<Comment, 'id' | 'timestamp'>) => void; // 댓글 제출 콜백
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
  channelName,
  averageRating,
  totalComments,
  comments,
  isOwner,
  currentUserId,
  onCommentSubmit
}) => {
  // 댓글 필터 상태
  const [commentFilter, setCommentFilter] = useState<number | null>(null);

  // 댓글 정렬 상태
  const [commentSortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 댓글 입력 모달 상태
  const [showCommentInput, setShowCommentInput] = useState(false);

  // 기존 댓글 찾기 및 버전 관리
  const existingComment = currentUserId ? comments.find(c => c.userId === currentUserId) : null;
  const commentVersion = existingComment ? 1 : 0; // 첫 작성은 버전 없음, 재편집부터 v1

  // 감정 치유 색상 시스템 - 그라데이션 스펙트럼 순서
  const getHealingColor = (rating: number, isSelected: boolean) => {
    if (!isSelected) return {};

    const colorMap = {
      5: { backgroundColor: 'rgba(16, 216, 118, 0.9)', color: 'white' }, // 투명한 에메랄드 그린 (최고 안정감)
      4: { backgroundColor: 'rgba(6, 182, 212, 0.9)', color: 'white' }, // 투명한 스카이 블루 (편안함)
      3: { backgroundColor: 'rgba(168, 85, 247, 0.9)', color: 'white' }, // 투명한 퍼플 (중성적 신비감)
      2: { backgroundColor: 'rgba(249, 115, 22, 0.9)', color: 'white' }, // 투명한 오렌지 (따뜻한 위로감)
      1: { backgroundColor: 'rgba(236, 72, 153, 0.9)', color: 'white' }  // 투명한 핑크 (포용감)
    };

    return colorMap[rating as keyof typeof colorMap] || {};
  };

  // 별점 렌더링 함수 (0.5 단위)
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // 채워진 별
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    // 반 별
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-300" />
          <div className="absolute overflow-hidden w-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }

    // 빈 별
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  // 댓글 필터링 함수
  const getFilteredComments = () => {
    let filtered = [...comments];

    // 별점 필터링
    if (commentFilter !== null) {
      const minRating = commentFilter;
      const maxRating = commentFilter === 5 ? 5 : commentFilter + 0.9;
      filtered = filtered.filter(c => c.rating >= minRating && c.rating <= maxRating);
    }

    // 정렬
    filtered.sort((a, b) => {
      if (commentSortOrder === 'desc') {
        return b.rating - a.rating;
      } else {
        return a.rating - b.rating;
      }
    });

    return filtered;
  };

  // 특정 별점대의 댓글 개수를 계산하는 함수
  const getCommentCountByRating = (rating: number) => {
    const minRating = rating;
    const maxRating = rating === 5 ? 5 : rating + 0.9;
    return comments.filter(c => c.rating >= minRating && c.rating <= maxRating).length;
  };

  // 특정 별점대의 평균 점수를 계산하는 함수
  const getAverageRatingByRange = (rating: number) => {
    const minRating = rating;
    const maxRating = rating === 5 ? 5 : rating + 0.9;
    const rangeComments = comments.filter(c => c.rating >= minRating && c.rating <= maxRating);

    if (rangeComments.length === 0) return rating; // 댓글이 없으면 기본값

    const sum = rangeComments.reduce((acc, c) => acc + c.rating, 0);
    return (sum / rangeComments.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <DialogHeader className="pb-4 border-b">
          <div className="flex-1">
            <DialogTitle className="text-lg font-semibold mb-1">
              {videoTitle}
            </DialogTitle>
            <p className="text-sm text-gray-600">{channelName}</p>

            {/* 평균 평점 표시 */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">{renderStars(averageRating)}</div>
              <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({totalComments}개 평가)</span>
            </div>
          </div>
        </DialogHeader>

        {/* 필터 및 정렬 컨트롤 */}
        <div className="py-3 border-b space-y-3">
          {/* 필터 버튼들 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={commentFilter === null ? "default" : "outline"}
              onClick={() => setCommentFilter(null)}
              className="flex flex-col items-center py-2 px-3 h-auto"
            >
              <span className="text-sm font-medium">전체</span>
              <span className="text-xs text-gray-500">({comments.length}개)</span>
            </Button>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = getCommentCountByRating(rating);
              const averageRating = getAverageRatingByRange(rating);
              const isSelected = commentFilter === rating;
              const healingStyle = getHealingColor(rating, isSelected);

              return (
                <Button
                  key={rating}
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setCommentFilter(rating)}
                  className="flex flex-col items-center py-2 px-3 h-auto gap-1 transition-all duration-200"
                  style={healingStyle}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{rating}</span>
                    <Star className={`w-3 h-3 ${isSelected ? 'fill-current text-current' : 'fill-yellow-400 text-yellow-400'}`} />
                    {count > 0 && <span className="text-sm">{averageRating.toFixed(1)}점</span>}
                  </div>
                  <span className={`text-xs ${isSelected ? 'text-current opacity-80' : 'text-gray-500'}`}>({count}개)</span>
                </Button>
              );
            })}
          </div>

          {/* 정렬 버튼 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {getFilteredComments().length}개의 댓글
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1"
            >
              <ArrowUpDown className="w-3 h-3" />
              {commentSortOrder === 'desc' ? '높은 평점순' : '낮은 평점순'}
            </Button>
          </div>

          {/* 사용자용 댓글 입력 버튼 */}
          {!isOwner && (
            <div className="flex justify-center py-2">
              <Button
                onClick={() => setShowCommentInput(true)}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
                댓글 입력
              </Button>
            </div>
          )}
        </div>

        {/* 댓글 리스트 */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-3">
            {getFilteredComments().map(comment => {
              // 주인 댓글 확인
              const isOwnerComment = comment.userName === channelName || comment.userId === 'owner';

              return (
                <div
                  key={comment.id}
                  className={`p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                    isOwnerComment ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* 주인장 도장 */}
                      {isOwnerComment && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                          <span className="text-xs">❤️</span>
                          <span className="text-xs font-medium text-orange-700">주인장</span>
                        </div>
                      )}
                      <span className={`font-medium text-sm ${isOwnerComment ? 'text-orange-700' : ''}`}>
                        {comment.userName}
                      </span>
                      <div className="flex">{renderStars(comment.rating)}</div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm ${isOwnerComment ? 'text-orange-800' : 'text-gray-700'}`}>
                    {comment.comment}
                  </p>
                </div>
              );
            })}

            {getFilteredComments().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">해당 평점의 댓글이 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 댓글 입력 모달 */}
        <CommentInputModal
          isOpen={showCommentInput}
          onClose={() => setShowCommentInput(false)}
          videoTitle={videoTitle}
          channelName={channelName}
          existingComment={existingComment}
          commentVersion={commentVersion}
          onSubmit={onCommentSubmit || (() => {})}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;