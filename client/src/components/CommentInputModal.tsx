// 댓글 입력 모달 컴포넌트
// 사용자용 댓글 작성 및 평점 선택 모달

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, ArrowRight } from 'lucide-react';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: Date;
}

interface CommentInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  channelName: string;
  existingComment?: Comment | null;
  commentVersion: number;
  onSubmit: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
}

const CommentInputModal: React.FC<CommentInputModalProps> = ({
  isOpen,
  onClose,
  videoTitle,
  channelName,
  existingComment,
  commentVersion,
  onSubmit
}) => {
  // 입력 상태
  const [commentText, setCommentText] = useState<string>(existingComment?.comment || '');
  const [userName, setUserName] = useState<string>(existingComment?.userName || '');

  // 새로운 별점 선택 상태
  const [baseRating, setBaseRating] = useState<number>(existingComment ? Math.floor(existingComment.rating) : 0); // 기본 별점 (0: 미선택, 1-5: 선택됨)
  const [decimalRating, setDecimalRating] = useState<number>(existingComment ? Math.round((existingComment.rating % 1) * 10) : 0); // 소수점 (0-9)
  const [showDecimalDropdown, setShowDecimalDropdown] = useState<boolean>(false); // 소수점 드롭다운 표시 여부

  // 최종 선택된 평점 계산
  const finalRating = baseRating === 0 ? 0 : (baseRating === 5 ? 5.0 : baseRating + (decimalRating / 10));

  // 별점 렌더링 함수 (0.5 단위) - 모든 별 크기 통일 (w-6 h-6)
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // 채워진 별
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
      );
    }

    // 반 별
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <div key="half" className="relative w-6 h-6">
          <Star className="absolute w-6 h-6 text-gray-300" />
          <div className="absolute overflow-hidden w-3">
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }

    // 빈 별
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-6 h-6 text-gray-300" />
      );
    }

    return stars;
  };

  // 새로운 별점 선택 UI 시스템 (자동 열리는 소수점 드롭다운)
  const renderNewRatingSelector = () => {
    // 화살표 표시 조건: 최종 점수가 있고 소수점 드롭다운이 안 보일 때
    const showArrow = baseRating > 0 && !showDecimalDropdown;

    return (
      <div className="w-full">
        {/* 상단: 별 선택, 소수점 드롭다운, 최종 결과 (가로 배치 & 상단 정렬) */}
        <div className="flex items-start gap-4 w-full min-h-[60px]">
          {/* 왼쪽: 별 선택 영역 (재선택 가능 & 고정 위치) */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">별점 선택</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <Star
                  key={rating}
                  className={`w-6 h-6 cursor-pointer transition-colors ${
                    rating <= baseRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                  onClick={() => {
                    setBaseRating(rating);
                    if (rating === 5) {
                      setDecimalRating(0); // 5점은 소수점 0으로 고정
                      setShowDecimalDropdown(false); // 5점일때는 소수점 숨김
                    } else {
                      setShowDecimalDropdown(true); // 1-4점일때는 소수점 드롭다운 자동 열기
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* 중간: 소수점 드롭다운 (자동 열림 & 2열 그리드 & 별점 우측 같은 높이) */}
          {baseRating > 0 && baseRating < 5 && showDecimalDropdown && (
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">소수점</div>
              <div className="bg-white border rounded-md shadow-lg p-2 w-24">
                <div className="grid grid-cols-2 gap-1">
                  {/* 왼쪽: .0~.4 (빈 반쪽별) */}
                  <div className="flex flex-col gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <Button
                        key={i}
                        variant={decimalRating === i ? "default" : "ghost"}
                        size="sm"
                        className="w-8 h-6 text-xs p-0 hover:bg-gray-100"
                        onClick={() => {
                          setDecimalRating(i);
                          setShowDecimalDropdown(false);
                        }}
                      >
                        .{i}
                      </Button>
                    ))}
                  </div>
                  {/* 오른쪽: .5~.9 (빈 한개별) */}
                  <div className="flex flex-col gap-1">
                    {[5, 6, 7, 8, 9].map(i => (
                      <Button
                        key={i}
                        variant={decimalRating === i ? "default" : "ghost"}
                        size="sm"
                        className="w-8 h-6 text-xs p-0 hover:bg-gray-100"
                        onClick={() => {
                          setDecimalRating(i);
                          setShowDecimalDropdown(false);
                        }}
                      >
                        .{i}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 중간: 조건부 화살표 (소수점 드롭다운시 숨김 & 별점 높이 맞춤) */}
          {showArrow && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium invisible">화살표</div>
              <div className="flex items-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          )}

          {/* 오른쪽: 최종 결과 표시 (실시간 업데이트 & 별점 선택과 같은 구조) */}
          {baseRating > 0 && !showDecimalDropdown && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium">선택된 평점</div>
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">{renderStars(finalRating)}</div>
                <span className="font-semibold text-lg">{finalRating.toFixed(1)}점</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 제출 처리
  const handleSubmit = () => {
    if (!userName.trim() || !commentText.trim()) {
      alert('닉네임과 댓글을 모두 입력해주세요.');
      return;
    }

    if (baseRating === 0) {
      alert('별점을 선택해주세요.');
      return;
    }

    onSubmit({
      userId: existingComment?.userId || `user_${Date.now()}`,
      userName: userName.trim(),
      rating: finalRating,
      comment: commentText.trim()
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md fixed top-[10vh] translate-y-0">
        {/* 헤더 */}
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {commentVersion > 0 ? `댓글 수정 (v${commentVersion})` : '댓글 작성'}
          </DialogTitle>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{videoTitle}</p>
            <p>{channelName}</p>
          </div>
        </DialogHeader>

        {/* 입력 폼 */}
        <div className="space-y-4 py-4">
          {/* 닉네임 입력 */}
          <div>
            <label className="block text-sm font-medium mb-2">닉네임</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
          </div>

          {/* 평점 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">평점</label>
            {renderNewRatingSelector()}
          </div>

          {/* 댓글 입력 */}
          <div>
            <label className="block text-sm font-medium mb-2">댓글</label>
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px] resize-none"
              placeholder="댓글을 입력하세요..."
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {commentText.length}/500
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>
            {existingComment ? '수정' : '작성'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentInputModal;