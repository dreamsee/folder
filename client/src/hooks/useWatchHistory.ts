import type { YoutubeVideo } from '@shared/schema';

// 시청 기록 데이터 구조
export interface WatchHistoryData {
  videoId: string;
  firstWatchedAt: string;
  lastWatchedAt: string;
  watchCount: number;
  totalWatchTime: number;
  lastPosition: number;
  duration: number;
  progress?: number;
}

// useWatchHistory 훅의 반환 타입
interface UseWatchHistoryReturn {
  getWatchInfo: (videoId: string) => WatchHistoryData | null;
  incrementWatchCount: (video: YoutubeVideo) => void;
  formatWatchDate: (dateString: string) => string;
}

/**
 * 시청 기록 관리 커스텀 훅
 *
 * 기능:
 * - 시청 기록 조회 (localStorage에서 가져오기)
 * - 시청 횟수 증가 (영상 선택 시)
 * - 날짜 포맷팅 (상대 시간 표시)
 */
export const useWatchHistory = (): UseWatchHistoryReturn => {
  /**
   * 시청 기록 가져오기
   *
   * @param videoId - 조회할 영상 ID
   * @returns 시청 기록 데이터 또는 null
   */
  const getWatchInfo = (videoId: string): WatchHistoryData | null => {
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
    return watchHistory[videoId] || null;
  };

  /**
   * 시청 횟수 증가 및 기록 업데이트
   *
   * 동작:
   * 1. 새 영상인 경우: 첫 시청 기록 생성 (watchCount = 1)
   * 2. 기존 영상인 경우: watchCount 증가 및 lastWatchedAt 업데이트
   *
   * @param video - 선택한 영상 정보
   */
  const incrementWatchCount = (video: YoutubeVideo): void => {
    // 시청 기록 가져오기
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');

    if (!watchHistory[video.videoId]) {
      // 새 영상 - 첫 시청 기록 생성
      watchHistory[video.videoId] = {
        videoId: video.videoId,
        firstWatchedAt: new Date().toISOString(),
        lastWatchedAt: new Date().toISOString(),
        watchCount: 1,
        totalWatchTime: 0,
        lastPosition: 0,
        duration: 0,
      };
    } else {
      // 기존 영상 - 시청 횟수 증가
      watchHistory[video.videoId].watchCount = (watchHistory[video.videoId].watchCount || 0) + 1;
      watchHistory[video.videoId].lastWatchedAt = new Date().toISOString();
    }

    // 시청 기록 저장
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
  };

  /**
   * 날짜 포맷팅 (상대 시간)
   *
   * 표시 형식:
   * - 1시간 이내: "방금 전"
   * - 24시간 이내: "N시간 전"
   * - 48시간 이내: "어제"
   * - 1주일 이내: "N일 전"
   * - 그 이상: "YYYY. M. D." 형식
   *
   * @param dateString - ISO 날짜 문자열
   * @returns 포맷된 날짜 문자열
   */
  const formatWatchDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffHours < 48) return '어제';
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return {
    getWatchInfo,
    incrementWatchCount,
    formatWatchDate,
  };
};
