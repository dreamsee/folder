import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Settings2, Play, Pause, Volume2, RotateCw, Mic, MessageCircle } from "lucide-react";
import TextOverlay, { OverlayData, Coordinates } from "./TextOverlay";
import ChapterBar from "./ChapterBar";
import CommentSidePanel from "./CommentSidePanel";
import { parseChapters, parseDuration, Chapter } from "@/utils/chapterParser";

interface YouTubePlayerProps {
  player: any | null; // YT.Player 대신 any 사용
  setPlayer: React.Dispatch<React.SetStateAction<any | null>>;
  isPlayerReady: boolean;
  setIsPlayerReady: React.Dispatch<React.SetStateAction<boolean>>;
  currentVideoId: string;
  setPlayerState: React.Dispatch<React.SetStateAction<number>>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  onAddTimestamp?: () => void;
  timestamps?: any[]; // 타임스탬프 구간 하이라이트용
  overlays?: OverlayData[]; // 텍스트 오버레이 데이터
  onOverlayPositionChange?: (id: string, coordinates: Coordinates) => void;
  isLocked?: boolean; // 화면 잠금 상태
  magnifierSettings?: {
    enabled: boolean;
    zoom: number;
    size: number;
  };
  바설정?: {
    커스텀바: boolean;
    챕터바: boolean;
  };
  currentTime?: number; // 현재 재생 시간 (HomePage에서 전달)
  uiSettings?: {
    재생컨트롤: {
      전체표시: boolean;
      플레이어내장: boolean;
    };
  };
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  player,
  setPlayer,
  isPlayerReady,
  setIsPlayerReady,
  currentVideoId,
  setPlayerState,
  showNotification,
  timestamps = [],
  overlays = [],
  onOverlayPositionChange,
  isLocked = false,
  magnifierSettings = { enabled: true, zoom: 2.0, size: 2 },
  바설정 = { 커스텀바: true, 챕터바: true },
  currentTime: propCurrentTime = 0, // 외부에서 전달된 현재 시간
  uiSettings
}) => {
  const [availableRates, setAvailableRates] = useState<number[]>([]);
  const [currentRate, setCurrentRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null); // 현재 시청 세션 ID
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 재생 컨트롤 모달 상태
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false);

  // 컨트롤 패널의 볼륨과 속도 상태
  const [currentVolume, setCurrentVolume] = useState(100);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);

  // 터치 홀드 확대 상태
  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 }); // 컨테이너 기준 상대 좌표 (iframe용)
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 }); // 화면 기준 절대 좌표 (오버레이용)
  const [isMobile, setIsMobile] = useState(false);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

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

  // 재생/일시정지 토글 함수
  const togglePlayPause = () => {
    if (!player || !isPlayerReady) return;

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
  }, [currentVideoId, player, setPlayer]);

  // 영상 변경 시 세션 초기화 및 자동 로드/재생
  useEffect(() => {
    setCurrentSessionId(null);

    // 플레이어가 준비되고 비디오 ID가 있으면 로드 및 재생
    if (player && isPlayerReady && currentVideoId) {
      try {
        // 플레이어 DOM 요소 존재 여부 확인
        const playerElement = document.getElementById('player');
        if (playerElement && player.loadVideoById) {
          player.loadVideoById(currentVideoId);
          // 로드 후 자동 재생 (시청 기록 업데이트를 위해)
          setTimeout(() => {
            if (player && player.playVideo) {
              player.playVideo();
            }
          }, 500);
        }
      } catch (error) {
        console.error('[YouTubePlayer] 영상 로드 오류:', error);
      }
    }
  }, [currentVideoId, player, isPlayerReady]);

  // 저장된 기본값 적용 함수
  const applyDefaultSettings = (player: any) => {
    try {
      // 설정에서 기본값 가져오기
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

    // 저장된 기본값 적용
    applyDefaultSettings(event.target);

    // 초기 로드는 useEffect에서 처리하므로 여기서는 하지 않음
  };

  // 플레이어 상태 변경 이벤트 핸들러
  const onPlayerStateChange = (event: any) => {
    setPlayerState(event.data);
    // 재생 상태 업데이트 (YT.PlayerState.PLAYING = 1, PAUSED = 2)
    setIsPlaying(event.data === 1);
    setIsPaused(event.data === 2);

    
    // 영상 재생 시작 시 시청 기록 관리 (단일 책임: 모든 시청 기록은 여기서만 관리)
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1 && currentVideoId) {
      // 새 영상이면 기본값 다시 적용 (YouTube가 가끔 초기화하는 경우 대비)
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


  // 챕터 클릭 핸들러
  const handleChapterClick = (seconds: number) => {
    if (player && isPlayerReady) {
      player.seekTo(seconds, true);
      player.playVideo();
    }
  };

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 터치 홀드 이벤트 처리 (영상 영역에서만)
  useEffect(() => {
    if (!isMobile || !isLocked || !playerContainerRef.current) return;

    const container = playerContainerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      // 단일 터치만 처리
      if (e.touches.length !== 1) return;

      // 터치 타겟이 컨트롤 패널이나 버튼 요소인지 확인
      const target = e.target as HTMLElement;
      const isControlElement = target.closest('[data-control-panel="true"]') || // 컨트롤 패널
                               target.closest('button') || // 버튼들
                               target.closest('input'); // 슬라이더

      // 컨트롤 요소면 터치홀드 스킵
      if (isControlElement) return;

      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();

      // 터치가 영상 영역 안에서만 발생했는지 확인
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {

        // 컨테이너 기준 상대 좌표로 변환 (iframe transform-origin용)
        const relativeX = touch.clientX - rect.left;
        const relativeY = touch.clientY - rect.top;
        setTouchPosition({ x: relativeX, y: relativeY });
        setOverlayPosition({ x: touch.clientX, y: touch.clientY });

        // 300ms 후 확대 시작
        touchTimerRef.current = setTimeout(() => {
          setIsTouchHolding(true);
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, 300);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // 터치 이동 시 타이머 취소 (스크롤과 구분)
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }

      // 이미 확대 중이면 터치 위치 업데이트
      if (isTouchHolding && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        // 컨테이너 기준 상대 좌표로 변환
        const relativeX = touch.clientX - rect.left;
        const relativeY = touch.clientY - rect.top;
        setTouchPosition({ x: relativeX, y: relativeY });
        setOverlayPosition({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleTouchEnd = () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
      setIsTouchHolding(false);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isMobile, isLocked, isTouchHolding, isControlsModalOpen]);


  // 현재 시간과 영상 길이 업데이트 및 시청 진행률 저장
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    const interval = setInterval(() => {
      try {
        // 플레이어가 여전히 유효한지 확인
        if (player && typeof player.getCurrentTime === 'function') {
          const current = player.getCurrentTime();
          const total = player.getDuration();
          
          setCurrentTime(current);
          setDuration(total);
          
          // 시청 진행률 업데이트 (5초마다)
          if (currentVideoId && current > 0 && total > 0 && Math.floor(current) % 5 === 0) {
            const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
            if (watchHistory[currentVideoId]) {
              watchHistory[currentVideoId].lastPosition = current;
              watchHistory[currentVideoId].totalWatchTime = (watchHistory[currentVideoId].totalWatchTime || 0) + 5;
              watchHistory[currentVideoId].progress = Math.round((current / total) * 100);
              localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
            }
          }
        }
      } catch (error) {
        // 플레이어가 준비되지 않았을 때 무시
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlayerReady, currentVideoId]);

  // 진행바 클릭 핸들러
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !isPlayerReady || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = duration * percentage;

    player.seekTo(targetTime);
  };

  return (
    <>
      {/* 전체 화면 확대 효과 - 플레이어 컨테이너 iframe 타겟 */}
      {isMobile && isLocked && (
        <style>
          {`
            .youtube-player-container {
              overflow: hidden;
              position: relative;
            }

            .youtube-player-container iframe {
              transform: scale(${isTouchHolding ? magnifierSettings.zoom : 1});
              transform-origin: ${touchPosition.x}px ${touchPosition.y}px;
              transition: transform ${isTouchHolding ? '0.3s' : '0.2s'} ease-out;
            }
          `}
        </style>
      )}


      <div>
        <div
          ref={playerContainerRef}
          className="relative w-full aspect-video bg-black youtube-player-container"
        >
          {/* 재생 컨트롤 버튼 (좌측 하단) - 재생컨트롤.전체표시가 false이고 패널이 닫혀있을 때만 표시 */}
          {uiSettings && !uiSettings.재생컨트롤?.전체표시 && !isControlsModalOpen && (
            <Button
              onClick={() => {
                // 패널 열 때 현재 플레이어 볼륨/속도 가져오기
                if (player && isPlayerReady) {
                  setCurrentVolume(player.getVolume());
                  setCurrentSpeed(player.getPlaybackRate());
                }
                setIsControlsModalOpen(true);
              }}
              className="absolute bottom-4 left-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all z-40"
              size="sm"
              variant="ghost"
              title="재생 컨트롤"
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          )}

          {/* 전체화면 버튼 */}
          <Button
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all z-40"
            size="sm"
            variant="ghost"
            title={isFullscreen ? "전체화면 종료" : "전체화면"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>

          {/* 댓글창 열기 버튼 (전체화면일 때만 표시) */}
          <Button
            onClick={() => {
              // CommentSidePanel의 setIsOpen을 직접 호출할 수 없으므로
              // 임시로 이벤트 발생시켜 열기
              const event = new CustomEvent('openCommentPanel');
              window.dispatchEvent(event);
            }}
            className={`absolute bottom-4 right-20 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all z-40 ${
              isFullscreen ? 'block' : 'hidden'
            }`}
            size="sm"
            variant="ghost"
            title="댓글 열기"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>

          <div id="player" className="w-full h-full">
            <div className="flex items-center justify-center h-full bg-gray-800 text-white rounded">
              <p>동영상을 검색해 주세요</p>
            </div>
          </div>
          {/* 텍스트 오버레이 (미리보기 포함) */}
          <TextOverlay
            overlays={overlays}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onOverlayPositionChange={onOverlayPositionChange}
          />
          {/* 영상 잠금 오버레이 */}
          {isLocked && (
            <div
              className="absolute inset-0 z-30 cursor-default"
              style={{
                pointerEvents: 'auto',
                touchAction: 'none'
              }}
              title="화면이 잠금되었습니다"
            />
          )}

          {/* 컴팩트 재생 컨트롤 - 플레이어 내부에서 버튼 기준 위치 */}
          {isControlsModalOpen && (
            <div className="absolute bottom-2 left-2 z-50" data-control-panel="true">
              <div className="bg-black bg-opacity-80 text-white rounded-lg p-3 w-48 shadow-lg backdrop-blur-sm">

                {/* 볼륨 조절 */}
                <div className="flex items-center mb-2">
                  <Volume2 className="w-4 h-4 mr-2" />
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentVolume}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      onChange={(e) => {
                        const newVolume = parseInt(e.target.value);
                        setCurrentVolume(newVolume);
                        if (player && isPlayerReady) {
                          player.setVolume(newVolume);
                        }
                      }}
                      disabled={!player || !isPlayerReady}
                    />
                  </div>
                  <span className="text-xs ml-2 w-10 text-right">{currentVolume}%</span>
                </div>

                {/* 속도 조절 */}
                <div className="flex items-center mb-2">
                  <RotateCw className="w-4 h-4 mr-2" />
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0.25"
                      max="2.0"
                      step="0.05"
                      value={currentSpeed}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      onChange={(e) => {
                        const newSpeed = parseFloat(e.target.value);
                        setCurrentSpeed(newSpeed);
                        if (player && isPlayerReady) {
                          player.setPlaybackRate(newSpeed);
                          setCurrentRate(newSpeed);
                        }
                      }}
                      disabled={!player || !isPlayerReady}
                    />
                  </div>
                  <span className="text-xs ml-2 w-12 text-right">{currentSpeed.toFixed(2)}x</span>
                </div>

                {/* 재생/일시정지 */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={togglePlayPause}
                    disabled={!player || !isPlayerReady}
                    className="flex items-center space-x-2 bg-white text-black px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {isPlaying ? '일시정지' : '재생'}
                    </span>
                  </button>

                  {/* 닫기 버튼 */}
                  <button
                    onClick={() => setIsControlsModalOpen(false)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 댓글 사이드 패널 - 전체화면 컨테이너 내부 */}
          {currentVideoId && (
            <CommentSidePanel
              videoId={currentVideoId}
              player={player}
              isPlayerReady={isPlayerReady}
              showNotification={showNotification}
              isFullscreen={isFullscreen}
            />
          )}
        </div>

      {/* 커스텀 진행바 (타임스탬프 하이라이트 포함) */}
      {isPlayerReady && duration > 0 && 바설정?.커스텀바 && (
        <div className="mt-2 space-y-1">
          <div 
            className="relative w-full h-3 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            {/* 재생 진행도 */}
            <div 
              className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            
            {/* 타임스탬프 구간 하이라이트 */}
            {timestamps.map((timestamp, index) => {
              const startPercent = (timestamp.timeInSeconds / duration) * 100;
              const durationPercent = ((timestamp.duration || 5) / duration) * 100;
              
              // 구간 색상 결정
              let bgColor = 'bg-blue-400';
              if (timestamp.volume !== 100 && timestamp.playbackRate !== 1.0) {
                bgColor = 'bg-purple-400'; // 볼륨 + 속도 변경
              } else if (timestamp.volume !== 100) {
                bgColor = 'bg-green-400'; // 볼륨만 변경
              } else if (timestamp.playbackRate !== 1.0) {
                bgColor = 'bg-orange-400'; // 속도만 변경
              }
              
              return (
                <div
                  key={index}
                  className={`absolute top-0 h-full ${bgColor} opacity-60 rounded-full`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${durationPercent}%`,
                  }}
                  title={`${timestamp.timeFormatted} - 볼륨: ${timestamp.volume}%, 속도: ${timestamp.playbackRate}x`}
                />
              );
            })}
          </div>
          
          {/* 진행 시간 표시 */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* 하이라이트 범례 */}
          {timestamps.length > 0 && (
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-2 bg-green-400 rounded"></div>
                <span>볼륨 변경</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-2 bg-orange-400 rounded"></div>
                <span>속도 변경</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-2 bg-purple-400 rounded"></div>
                <span>둘 다 변경</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 챕터 바 */}
      {isPlayerReady && duration > 0 && 바설정?.챕터바 && chapters.length > 0 && (
        <div className="mt-2">
          <ChapterBar
            chapters={chapters}
            currentTime={currentTime}
            onChapterClick={handleChapterClick}
          />
        </div>
      )}

      </div>
    </>
  );

  // 시간 포맷팅 함수
  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
};

export default YouTubePlayer;
