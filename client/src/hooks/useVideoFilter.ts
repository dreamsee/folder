import { useState, useCallback } from 'react';
import type { YoutubeVideo } from '@shared/schema';

// 필터 모드 타입 정의
export type FilterMode = 'watched' | 'blacklisted' | 'unwatched';
export type SortOrder = 'desc' | 'asc' | 'none';

// useVideoFilter 훅의 반환 타입
interface UseVideoFilterReturn {
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  filteredResults: YoutubeVideo[];
  watchedSortOrder: SortOrder;
  setWatchedSortOrder: (order: 'desc' | 'asc') => void;
  unwatchedSortOrder: SortOrder;
  setUnwatchedSortOrder: (order: SortOrder) => void;
  applyFilter: (videos: YoutubeVideo[], mode: FilterMode) => Promise<void>;
  clearFilteredResults: () => void;
}

/**
 * 비디오 필터링 커스텀 훅
 *
 * 기능:
 * - 시청 기록 기반 필터링 (본 영상 / 안 본 영상 / 안 볼 영상)
 * - 시청 횟수 기반 정렬 (본 영상)
 * - 날짜 기반 정렬 (안 본 영상)
 */
export const useVideoFilter = (): UseVideoFilterReturn => {
  const [filterMode, setFilterMode] = useState<FilterMode>('unwatched');
  const [filteredResults, setFilteredResults] = useState<YoutubeVideo[]>([]);
  const [watchedSortOrder, setWatchedSortOrder] = useState<'desc' | 'asc'>('desc');
  const [unwatchedSortOrder, setUnwatchedSortOrder] = useState<SortOrder>('none');

  /**
   * 필터링 함수
   *
   * 필터 모드:
   * - watched: 시청 기록이 있는 영상만 표시 (시청 횟수순 정렬)
   * - blacklisted: 블랙리스트에 있는 영상만 표시
   * - unwatched: 시청 기록도 없고 블랙리스트도 아닌 영상 표시
   *
   * 정렬:
   * - watched: 시청 횟수 기준 (desc/asc)
   * - unwatched: 날짜 기준 (none/desc/asc, none은 YouTube API 기본 순서 유지)
   */
  const applyFilter = useCallback(async (videos: YoutubeVideo[], mode: FilterMode) => {
    console.log("applyFilter 호출 - 모드:", mode, "정렬:", unwatchedSortOrder, "영상 개수:", videos.length);

    // localStorage에서 시청 기록과 블랙리스트 가져오기
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');

    let filtered = videos;

    if (mode === 'watched') {
      // 본 영상: 시청 기록이 있는 영상
      filtered = videos.filter(video => watchHistory[video.videoId]);

      // 시청 횟수로 정렬
      filtered.sort((a, b) => {
        const aCount = watchHistory[a.videoId]?.watchCount || 0;
        const bCount = watchHistory[b.videoId]?.watchCount || 0;
        return watchedSortOrder === 'desc' ? bCount - aCount : aCount - bCount;
      });
    } else if (mode === 'blacklisted') {
      // 안 볼 영상: 블랙리스트에 있는 영상
      filtered = videos.filter(video => blacklist[video.videoId]);
    } else if (mode === 'unwatched') {
      // 안 본 영상: 시청 기록도 없고 블랙리스트도 아닌 영상
      filtered = videos.filter(video => !watchHistory[video.videoId] && !blacklist[video.videoId]);

      // 안 본 영상 날짜순 정렬 (none이 아닐 때만)
      if (unwatchedSortOrder !== 'none') {
        filtered.sort((a, b) => {
          const aDate = new Date(a.publishedAt || 0).getTime();
          const bDate = new Date(b.publishedAt || 0).getTime();
          return unwatchedSortOrder === 'desc' ? bDate - aDate : aDate - bDate;
        });
      }
      // unwatchedSortOrder가 'none'이면 YouTube API 기본 순서(관련성순) 유지
    }

    setFilteredResults(filtered);
  }, [watchedSortOrder, unwatchedSortOrder]);

  const clearFilteredResults = useCallback(() => {
    setFilteredResults([]);
  }, []);

  return {
    filterMode,
    setFilterMode,
    filteredResults,
    watchedSortOrder,
    setWatchedSortOrder,
    unwatchedSortOrder,
    setUnwatchedSortOrder,
    applyFilter,
    clearFilteredResults,
  };
};
