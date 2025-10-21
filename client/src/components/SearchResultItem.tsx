import React from 'react';
import { Button } from '@/components/ui/button';
import type { YoutubeVideo } from '@shared/schema';
import type { FilterMode } from '@/hooks/useVideoFilter';
import type { WatchHistoryData } from '@/hooks/useWatchHistory';

interface SearchResultItemProps {
  video: YoutubeVideo;
  filterMode: FilterMode;
  watchInfo: WatchHistoryData | null;
  isFavorite: boolean;
  formatWatchDate: (dateString: string) => string;
  onVideoSelect: (video: YoutubeVideo) => void;
  onAddToFavorites: (video: YoutubeVideo) => void;
  onAddToBlacklist: (video: YoutubeVideo) => void;
  onRemoveFromBlacklist: (videoId: string) => void;
}

/**
 * 검색 결과 아이템 컴포넌트
 *
 * 기능:
 * - 영상 썸네일 및 정보 표시
 * - 시청 기록 표시 (✓ 아이콘, 날짜, 진행률)
 * - 시청 횟수 표시
 * - 필터 모드별 액션 버튼 표시
 *   - watched: 즐겨찾기 버튼
 *   - unwatched: 블랙리스트 추가 버튼
 *   - blacklisted: 블랙리스트 제거 버튼
 */
const SearchResultItem: React.FC<SearchResultItemProps> = ({
  video,
  filterMode,
  watchInfo,
  isFavorite,
  formatWatchDate,
  onVideoSelect,
  onAddToFavorites,
  onAddToBlacklist,
  onRemoveFromBlacklist,
}) => {
  return (
    <div
      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer relative"
      onClick={() => onVideoSelect(video)}
    >
      {/* 시청 표시 (시청 기록이 있을 때만) */}
      {watchInfo && (
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <span className="text-xs text-green-600 font-medium">✓</span>
          <span className="text-xs text-gray-500">{formatWatchDate(watchInfo.lastWatchedAt)}</span>
          {watchInfo.progress && watchInfo.progress > 0 && (
            <span className="text-xs text-blue-600">{watchInfo.progress}%</span>
          )}
        </div>
      )}

      {/* 영상 썸네일 */}
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-16 h-12 object-cover rounded flex-shrink-0"
      />

      {/* 영상 정보 */}
      <div className="flex-1 min-w-0">
        <h3
          className={`text-sm font-medium line-clamp-2 ${
            watchInfo ? 'text-gray-600' : 'text-gray-900'
          }`}
        >
          {video.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {video.channelTitle}
          {/* 시청 횟수 표시 - 1회부터 표시 */}
          {watchInfo && watchInfo.watchCount >= 1 && (
            <span className="ml-2 text-blue-500">{watchInfo.watchCount}회 시청</span>
          )}
        </p>
      </div>

      {/* 본 영상에서 즐겨찾기 버튼 표시 */}
      {filterMode === 'watched' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onAddToFavorites(video);
          }}
          className={`text-xs px-2 py-1 h-6 ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
          title={isFavorite ? '즐겨찾기에서 제거' : '즐겨찾기에 추가'}
        >
          ⭐
        </Button>
      )}

      {/* 안 본 영상에서만 블랙리스트 버튼 표시 */}
      {filterMode === 'unwatched' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onAddToBlacklist(video);
          }}
          className="text-xs px-2 py-1 h-6"
          title="안 볼 영상으로 이동"
        >
          ×
        </Button>
      )}

      {/* 블랙리스트에서 제거 버튼 */}
      {filterMode === 'blacklisted' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFromBlacklist(video.videoId);
          }}
          className="text-xs px-2 py-1 h-6"
          title="블랙리스트에서 제거"
        >
          ↻
        </Button>
      )}
    </div>
  );
};

export default SearchResultItem;
