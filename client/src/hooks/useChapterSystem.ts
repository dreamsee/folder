import { useEffect, useState } from 'react';
import { parseChapters, Chapter } from "@/utils/chapterParser";

// 챕터 시스템 관리 커스텀 훅
interface UseChapterSystemProps {
  currentVideoId: string;
  isPlayerReady: boolean;
  duration: number;
  바설정?: {
    커스텀바: boolean;
    챕터바: boolean;
    챕터바개수?: number;
  };
}

interface UseChapterSystemReturn {
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  isLoadingChapters: boolean;
}

export const useChapterSystem = ({
  currentVideoId,
  isPlayerReady,
  duration,
  바설정,
}: UseChapterSystemProps): UseChapterSystemReturn => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  // 영상 변경 시 챕터 로드
  // 챕터바 설정이 활성화되어 있을 때만 챕터 로드
  useEffect(() => {
    const loadChapters = async () => {
      // 챕터바 비활성화 시 로드하지 않음
      if (!바설정?.챕터바) {
        setChapters([]);
        return;
      }

      // 영상 길이가 확정될 때까지 대기
      if (!currentVideoId || !isPlayerReady || duration <= 0) {
        setChapters([]);
        return;
      }

      try {
        setIsLoadingChapters(true);
        // YouTube Data API로 영상 정보 가져오기
        const response = await fetch(`/api/youtube/video-info?videoId=${currentVideoId}`);

        if (!response.ok) {
          console.error(`챕터 로드 실패: ${response.status}`);
          setChapters([]);
          return;
        }

        const data = await response.json();
        const description = data.description || '';

        // 챕터 파싱 (duration 상태값 사용)
        const parsedChapters = parseChapters(description, duration);
        setChapters(parsedChapters);

        if (parsedChapters.length > 0) {
          console.log(`${parsedChapters.length}개의 챕터를 찾았습니다.`);
        }
      } catch (error) {
        console.error('챕터 로드 에러:', error);
        setChapters([]);
      } finally {
        setIsLoadingChapters(false);
      }
    };

    loadChapters();
  }, [currentVideoId, isPlayerReady, duration, 바설정]);

  return {
    chapters,
    setChapters,
    isLoadingChapters,
  };
};
