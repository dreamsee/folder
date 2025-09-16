// 테스트용 카카오톡 스타일 공유창 컴포넌트
// 이 파일은 테스트 및 백업 목적으로 보관됩니다
// 유튜브노트의 공유 기능 프로토타입이며, 추후 메인 컴포넌트에 통합될 예정입니다

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Edit2, Save, ArrowUpDown, MessageCircle } from 'lucide-react';
import CommentModal from './CommentModal';

interface VideoShareData {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  editorComment: string;
  timestamp: Date;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1~5 점수
  comment: string;
  timestamp: Date;
}

interface VideoWithRating extends VideoShareData {
  averageRating: number;
  totalComments: number;
  comments: Comment[];
}

interface SimpleShareAreaProps {
  videoData?: VideoShareData;
  onCommentChange?: (comment: string) => void;
}

const SimpleShareArea: React.FC<SimpleShareAreaProps> = ({
  videoData,
  onCommentChange
}) => {
  // 비디오 리스트와 평가 데이터
  const [videoList, setVideoList] = useState<VideoWithRating[]>([]);

  // 편집 모드 상태
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState('');

  // 모달 상태
  const [modalVideo, setModalVideo] = useState<VideoWithRating | null>(null);

  // 정렬 상태
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc: 높은 평점순

  // 테스트용 더미 데이터 생성
  useEffect(() => {
    const dummyVideos: VideoWithRating[] = [
      {
        id: '1',
        videoId: 'abc123',
        title: 'React 기초 강좌 #1',
        channelName: '코딩 채널',
        thumbnail: 'https://via.placeholder.com/320x180?text=React+Tutorial',
        editorComment: '컴포넌트와 Props에 대한 기초 설명입니다.',
        timestamp: new Date('2025-01-16T10:00:00'),
        averageRating: 4.3,
        totalComments: 15,
        comments: [
          { id: 'c1', userId: 'u1', userName: '사용자1', rating: 5, comment: '매우 유익한 강의입니다!', timestamp: new Date() },
          { id: 'c2', userId: 'u2', userName: '사용자2', rating: 4, comment: '설명이 명확해요', timestamp: new Date() },
          { id: 'c3', userId: 'u3', userName: '사용자3', rating: 3, comment: '보통입니다', timestamp: new Date() },
          { id: 'c4', userId: 'u4', userName: '사용자4', rating: 5, comment: '완벽한 설명!', timestamp: new Date() },
          { id: 'c5', userId: 'u5', userName: '사용자5', rating: 4, comment: '도움이 되었어요', timestamp: new Date() },
        ]
      },
      {
        id: '2',
        videoId: 'def456',
        title: 'JavaScript 비동기 처리',
        channelName: 'JS 마스터',
        thumbnail: 'https://via.placeholder.com/320x180?text=Async+JS',
        editorComment: 'Promise와 async/await 설명',
        timestamp: new Date('2025-01-16T11:00:00'),
        averageRating: 3.5,
        totalComments: 8,
        comments: [
          { id: 'c6', userId: 'u6', userName: '학습자A', rating: 4, comment: '이해하기 쉬웠어요', timestamp: new Date() },
          { id: 'c7', userId: 'u7', userName: '학습자B', rating: 3, comment: '조금 어려웠습니다', timestamp: new Date() },
          { id: 'c8', userId: 'u8', userName: '학습자C', rating: 3, comment: '예제가 더 필요해요', timestamp: new Date() },
          { id: 'c9', userId: 'u9', userName: '학습자D', rating: 4, comment: '좋은 설명이에요', timestamp: new Date() },
        ]
      },
      {
        id: '3',
        videoId: 'ghi789',
        title: 'CSS Grid 완벽 가이드',
        channelName: 'Web Design Pro',
        thumbnail: 'https://via.placeholder.com/320x180?text=CSS+Grid',
        editorComment: '레이아웃 구성의 핵심',
        timestamp: new Date('2025-01-16T12:00:00'),
        averageRating: 1.8,
        totalComments: 5,
        comments: [
          { id: 'c10', userId: 'u10', userName: '디자이너1', rating: 2, comment: '설명이 부족해요', timestamp: new Date() },
          { id: 'c11', userId: 'u11', userName: '디자이너2', rating: 1, comment: '이해하기 어렵습니다', timestamp: new Date() },
          { id: 'c12', userId: 'u12', userName: '디자이너3', rating: 2, comment: '예제가 별로예요', timestamp: new Date() },
          { id: 'c13', userId: 'u13', userName: '디자이너4', rating: 2, comment: '개선이 필요합니다', timestamp: new Date() },
          { id: 'c14', userId: 'u14', userName: '디자이너5', rating: 2, comment: '다른 강의를 추천합니다', timestamp: new Date() },
        ]
      }
    ];

    setVideoList(dummyVideos);
  }, []);

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


  // 정렬된 비디오 리스트
  const sortedVideoList = [...videoList].sort((a, b) => {
    if (sortOrder === 'desc') {
      return b.averageRating - a.averageRating;
    } else {
      return a.averageRating - b.averageRating;
    }
  });

  // 편집 모드 시작
  const startEdit = (video: VideoWithRating) => {
    setEditingVideoId(video.id);
    setEditingComment(video.editorComment);
  };

  // 편집 저장
  const saveEdit = (videoId: string) => {
    setVideoList(prev => prev.map(v =>
      v.id === videoId ? { ...v, editorComment: editingComment } : v
    ));
    setEditingVideoId(null);
    setEditingComment('');
    if (onCommentChange) {
      onCommentChange(editingComment);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 - 정렬 컨트롤 */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">공유 노트</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortOrder === 'desc' ? '높은 평점순' : '낮은 평점순'}
          </Button>
        </div>
      </div>

      {/* 대화형 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {sortedVideoList.map((video) => (
            <div key={video.id} className="space-y-2">
              {/* 메시지 행 */}
              <div className="flex items-start gap-4">
                {/* 왼쪽: 영상 정보 */}
                <div className="flex-1">
                  <div
                    className="inline-block max-w-md rounded-2xl p-3 shadow-sm"
                    style={{ backgroundColor: '#FEE500' }} // 카카오톡 노란색
                  >
                    {/* 섬네일 */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full rounded-lg mb-2 object-cover"
                      style={{ maxHeight: '120px' }}
                    />

                    {/* 영상 정보 */}
                    <div className="text-sm font-medium text-gray-800 mb-2">
                      {video.title} - {video.channelName}
                    </div>

                    {/* 구분선 */}
                    <div className="border-t border-yellow-600/20 my-2"></div>

                    {/* 편집자 코멘트 */}
                    {editingVideoId === video.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingComment}
                          onChange={(e) => setEditingComment(e.target.value)}
                          className="w-full min-h-[60px] bg-white/70 border-yellow-600/30"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(video.id)}
                            className="flex-1"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingVideoId(null)}
                            className="flex-1"
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">{video.editorComment}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(video)}
                          className="w-full"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          편집
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 오른쪽: 평가 요약 */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setModalVideo(video)}
                    className="inline-block rounded-2xl p-3 shadow-sm hover:shadow-md transition-all hover:scale-105"
                    style={{ backgroundColor: '#E8E8E8' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(video.averageRating)}</div>
                      <span className="text-sm font-medium">{video.averageRating.toFixed(1)}</span>
                      <MessageCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {video.totalComments}개 평가
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 댓글 모달 */}
      {modalVideo && (
        <CommentModal
          isOpen={!!modalVideo}
          onClose={() => setModalVideo(null)}
          videoTitle={modalVideo.title}
          channelName={modalVideo.channelName}
          averageRating={modalVideo.averageRating}
          totalComments={modalVideo.totalComments}
          comments={modalVideo.comments}
        />
      )}
    </div>
  );
};

export default SimpleShareArea;