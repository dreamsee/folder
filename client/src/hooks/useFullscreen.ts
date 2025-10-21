import { useEffect, useState, RefObject } from 'react';

// 전체화면 관리 커스텀 훅
interface UseFullscreenProps {
  playerContainerRef: RefObject<HTMLDivElement>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

interface UseFullscreenReturn {
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleFullscreen: () => Promise<void>;
}

export const useFullscreen = ({
  playerContainerRef,
  showNotification,
}: UseFullscreenProps): UseFullscreenReturn => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 전체화면 토글 함수
  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!isFullscreen) {
        // 전체화면 진입
        if (playerContainerRef.current.requestFullscreen) {
          await playerContainerRef.current.requestFullscreen();
        } else if ((playerContainerRef.current as any).webkitRequestFullscreen) {
          await (playerContainerRef.current as any).webkitRequestFullscreen();
        } else if ((playerContainerRef.current as any).mozRequestFullScreen) {
          await (playerContainerRef.current as any).mozRequestFullScreen();
        } else if ((playerContainerRef.current as any).msRequestFullscreen) {
          await (playerContainerRef.current as any).msRequestFullscreen();
        }
      } else {
        // 전체화면 종료
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('전체화면 토글 실패:', error);
      showNotification('전체화면 전환에 실패했습니다.', 'error');
    }
  };

  // 전체화면 상태 변화 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    // 전체화면 변화 이벤트 리스너 등록
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      // 정리
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen,
    setIsFullscreen,
    toggleFullscreen,
  };
};
