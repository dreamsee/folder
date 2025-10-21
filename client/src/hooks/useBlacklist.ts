import type { YoutubeVideo } from '@shared/schema';

// 블랙리스트 데이터 구조
interface BlacklistData {
  title: string;
  channelTitle: string;
  addedAt: string;
}

// useBlacklist 훅의 반환 타입
interface UseBlacklistReturn {
  addToBlacklist: (video: YoutubeVideo, onSuccess?: (message: string) => void) => void;
  removeFromBlacklist: (videoId: string, onSuccess?: (message: string) => void) => void;
  isBlacklisted: (videoId: string) => boolean;
}

/**
 * 블랙리스트 관리 커스텀 훅
 *
 * 기능:
 * - 블랙리스트에 영상 추가
 * - 블랙리스트에서 영상 제거
 * - 블랙리스트 여부 확인
 */
export const useBlacklist = (): UseBlacklistReturn => {
  /**
   * 블랙리스트에 추가
   *
   * 동작:
   * 1. localStorage에서 블랙리스트 가져오기
   * 2. 영상 정보와 추가 시간 기록
   * 3. localStorage에 저장
   *
   * @param video - 블랙리스트에 추가할 영상
   * @param onSuccess - 성공 시 실행할 콜백 (알림 표시용)
   */
  const addToBlacklist = (video: YoutubeVideo, onSuccess?: (message: string) => void): void => {
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');

    // 블랙리스트에 추가
    blacklist[video.videoId] = {
      title: video.title,
      channelTitle: video.channelTitle,
      addedAt: new Date().toISOString(),
    };

    localStorage.setItem('videoBlacklist', JSON.stringify(blacklist));

    // 성공 콜백 실행
    if (onSuccess) {
      onSuccess(`"${video.title}"을(를) 안 볼 영상으로 이동했습니다.`);
    }
  };

  /**
   * 블랙리스트에서 제거
   *
   * 동작:
   * 1. localStorage에서 블랙리스트 가져오기
   * 2. 해당 영상 제거
   * 3. localStorage에 저장
   *
   * @param videoId - 제거할 영상 ID
   * @param onSuccess - 성공 시 실행할 콜백 (알림 표시용)
   */
  const removeFromBlacklist = (videoId: string, onSuccess?: (message: string) => void): void => {
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');

    // 블랙리스트에서 제거
    delete blacklist[videoId];

    localStorage.setItem('videoBlacklist', JSON.stringify(blacklist));

    // 성공 콜백 실행
    if (onSuccess) {
      onSuccess('블랙리스트에서 제거했습니다.');
    }
  };

  /**
   * 블랙리스트 여부 확인
   *
   * @param videoId - 확인할 영상 ID
   * @returns 블랙리스트에 있으면 true, 없으면 false
   */
  const isBlacklisted = (videoId: string): boolean => {
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
    return !!blacklist[videoId];
  };

  return {
    addToBlacklist,
    removeFromBlacklist,
    isBlacklisted,
  };
};
