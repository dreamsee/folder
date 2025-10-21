import { useEffect, useState } from 'react';

// 플레이어 초기화 및 설정 관리 커스텀 훅
interface UsePlayerInitProps {
  currentVideoId: string;
  player: any | null;
  setPlayer: React.Dispatch<React.SetStateAction<any | null>>;
  setIsPlayerReady: React.Dispatch<React.SetStateAction<boolean>>;
  setPlayerState: React.Dispatch<React.SetStateAction<number>>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

interface UsePlayerInitReturn {
  availableRates: number[];
  setAvailableRates: React.Dispatch<React.SetStateAction<number[]>>;
  currentRate: number;
  setCurrentRate: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isPaused: boolean;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  togglePlayPause: () => void;
  applyDefaultSettings: (player: any) => void;
  onPlayerReady: (event: any) => void;
  onPlayerStateChange: (event: any) => void;
  onPlayerError: (event: any) => void;
}

export const usePlayerInit = ({
  currentVideoId,
  player,
  setPlayer,
  setIsPlayerReady,
  setPlayerState,
  showNotification,
}: UsePlayerInitProps): UsePlayerInitReturn => {
  const [availableRates, setAvailableRates] = useState<number[]>([]);
  const [currentRate, setCurrentRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // 저장된 기본값 적용 함수
  const applyDefaultSettings = (player: any) => {
    try {
      const uiSettings = localStorage.getItem('uiSettings');
      if (uiSettings) {
        const settings = JSON.parse(uiSettings);
        const 재생기본값 = settings.재생기본값;

        if (재생기본값) {
          // 기본 재생 속도 적용
          if (재생기본값.defaultPlaybackRate) {
            const availableRates = player.getAvailablePlaybackRates();
            if (availableRates.includes(재생기본값.defaultPlaybackRate)) {
              player.setPlaybackRate(재생기본값.defaultPlaybackRate);
              setCurrentRate(재생기본값.defaultPlaybackRate);
            }
          }

          // 기본 볼륨 적용
          if (재생기본값.defaultVolume !== undefined) {
            player.setVolume(재생기본값.defaultVolume);
          }
        }
      }
    } catch (error) {
      console.warn('기본 설정 적용 중 오류:', error);
    }
  };

  // 플레이어 준비 이벤트 핸들러
  const onPlayerReady = (event: any) => {
    console.log('플레이어 준비 완료');
    setIsPlayerReady(true);
    setAvailableRates(event.target.getAvailablePlaybackRates());
    applyDefaultSettings(event.target);
  };

  // 플레이어 상태 변경 이벤트 핸들러
  const onPlayerStateChange = (event: any) => {
    setPlayerState(event.data);
    setIsPlaying(event.data === 1); // YT.PlayerState.PLAYING = 1
    setIsPaused(event.data === 2); // YT.PlayerState.PAUSED = 2

    // 영상 재생 시작 시 기본값 재적용 (YouTube가 가끔 초기화하는 경우 대비)
    if (event.data === 1 && currentVideoId) {
      setTimeout(() => {
        if (player && event.target) {
          applyDefaultSettings(event.target);
        }
      }, 1000);
    }
  };

  // 플레이어 오류 이벤트 핸들러
  const onPlayerError = (event: any) => {
    let errorMessage = "동영상 재생 중 오류가 발생했습니다.";

    switch (event.data) {
      case 2:
        errorMessage = "잘못된 동영상 ID입니다.";
        break;
      case 5:
        errorMessage = "HTML5 플레이어 관련 오류가 발생했습니다.";
        break;
      case 100:
        errorMessage = "요청한 동영상을 찾을 수 없습니다.";
        break;
      case 101:
      case 150:
        errorMessage = "이 동영상의 소유자가 내장 재생을 허용하지 않습니다.";
        break;
    }

    showNotification(errorMessage, "error");
  };

  // 재생/일시정지 토글 함수
  const togglePlayPause = () => {
    if (!player) return;

    try {
      const playerState = player.getPlayerState();
      if (playerState === 1) { // 재생 중
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (error) {
      console.error('재생/일시정지 오류:', error);
    }
  };

  // 플레이어 초기화 - 강화된 안정성
  useEffect(() => {
    if (!player && typeof window.YT !== "undefined" && window.YT.Player && currentVideoId) {
      // 이전 플레이어 정리
      const existingPlayer = document.getElementById("player");
      if (existingPlayer && existingPlayer.innerHTML) {
        existingPlayer.innerHTML = '';
      }

      // 약간의 지연 후 플레이어 생성
      const timer = setTimeout(() => {
        const playerElement = document.getElementById("player");
        if (!playerElement) {
          console.warn('플레이어 DOM 요소가 없습니다.');
          return;
        }

        try {
          const newPlayer = new window.YT.Player("player", {
            height: "100%",
            width: "100%",
            videoId: currentVideoId,
            playerVars: {
              playsinline: 1,
              enablejsapi: 1,
              controls: 1,
              fs: 1,
              disablekb: 0,
            },
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange,
              onError: onPlayerError,
            },
          });
          setPlayer(newPlayer);
        } catch (error) {
          console.error('플레이어 생성 오류:', error);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentVideoId, player]);

  // 영상 변경 시 세션 초기화 및 자동 로드/재생
  useEffect(() => {
    setCurrentSessionId(null);

    if (player && currentVideoId) {
      try {
        const playerElement = document.getElementById('player');
        if (playerElement && player.loadVideoById) {
          player.loadVideoById(currentVideoId);
          // 로드 후 자동 재생
          setTimeout(() => {
            if (player && player.playVideo) {
              player.playVideo();
            }
          }, 500);
        }
      } catch (error) {
        console.error('[usePlayerInit] 영상 로드 오류:', error);
      }
    }
  }, [currentVideoId, player]);

  // 컴포넌트 언마운트 시 플레이어 정리
  useEffect(() => {
    return () => {
      if (player) {
        try {
          player.destroy();
          setPlayer(null);
          setIsPlayerReady(false);
        } catch (error) {
          console.warn('플레이어 정리 중 오류:', error);
        }
      }
    };
  }, [player]);

  return {
    availableRates,
    setAvailableRates,
    currentRate,
    setCurrentRate,
    isPlaying,
    setIsPlaying,
    isPaused,
    setIsPaused,
    currentSessionId,
    setCurrentSessionId,
    togglePlayPause,
    applyDefaultSettings,
    onPlayerReady,
    onPlayerStateChange,
    onPlayerError,
  };
};
