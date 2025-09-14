import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TextOverlay, { OverlayData, Coordinates } from "./TextOverlay";
import ChapterBar from "./ChapterBar";
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
  const [hideYouTubeOverlay, setHideYouTubeOverlay] = useState(false);
  
  // 터치 홀드 확대 상태
  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

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
              modestbranding: 1,
              rel: 0,
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
      console.log('[YouTubePlayer] currentVideoId 변경됨, 영상 로드 및 재생:', currentVideoId);
      player.loadVideoById(currentVideoId);
      // 로드 후 자동 재생 (시청 기록 업데이트를 위해)
      setTimeout(() => {
        player.playVideo();
      }, 500);
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
    console.log('[YouTubePlayer] onPlayerReady - 플레이어 준비 완료, currentVideoId:', currentVideoId);
  };

  // 플레이어 상태 변경 이벤트 핸들러
  const onPlayerStateChange = (event: any) => {
    console.log('[시청기록] 플레이어 상태 변경:', event.data, 'videoId:', currentVideoId);
    setPlayerState(event.data);
    // 재생 상태 업데이트 (YT.PlayerState.PLAYING = 1, PAUSED = 2)
    setIsPlaying(event.data === 1);
    setIsPaused(event.data === 2);

    // 정지 시 YouTube 오버레이 숨김 설정 확인
    if (event.data === 2) {
      const uiSettings = localStorage.getItem('uiSettings');
      if (uiSettings) {
        const settings = JSON.parse(uiSettings);
        if (settings.화면텍스트?.정지시YouTube숨김) {
          setHideYouTubeOverlay(true);
        }
      }
    } else {
      setHideYouTubeOverlay(false);
    }
    
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

  // 챕터 데이터 가져오기
  const fetchChapters = async (videoId: string) => {
    if (!videoId || !바설정?.챕터바) {
      setChapters([]);
      return;
    }

    setIsLoadingChapters(true);
    try {
      const response = await fetch(`/api/youtube/video-info/${videoId}`);
      if (response.ok) {
        const videoInfo = await response.json();
        const videoDuration = typeof videoInfo.duration === 'string' 
          ? parseDuration(videoInfo.duration) 
          : duration; // 현재 플레이어의 duration 사용

        const parsedChapters = parseChapters(videoInfo.description, videoDuration);
        setChapters(parsedChapters);
        
        if (parsedChapters.length > 0) {
          console.log(`${parsedChapters.length}개의 챕터를 찾았습니다.`);
        }
      } else {
        console.error('영상 정보를 가져올 수 없습니다.');
        setChapters([]);
      }
    } catch (error) {
      console.error('챕터 로딩 에러:', error);
      setChapters([]);
    } finally {
      setIsLoadingChapters(false);
    }
  };

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
      
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      
      // 터치가 영상 영역 안에서만 발생했는지 확인
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        
        setTouchPosition({ x: touch.clientX, y: touch.clientY });
        
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
        setTouchPosition({ x: touch.clientX, y: touch.clientY });
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
  }, [isMobile, isLocked, isTouchHolding]);

  // 영상 변경 시 챕터 정보 가져오기
  useEffect(() => {
    if (currentVideoId && duration > 0) {
      fetchChapters(currentVideoId);
    }
  }, [currentVideoId, duration, 바설정?.챕터바]);

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
      {/* 전체 화면 확대 효과 */}
      {isMobile && isLocked && (
        <style>
          {`
            body {
              transform: scale(${isTouchHolding ? magnifierSettings.zoom : 1});
              transform-origin: ${touchPosition.x}px ${touchPosition.y}px;
              transition: transform ${isTouchHolding ? '0.3s' : '0.2s'} ease-out;
            }
          `}
        </style>
      )}

      {/* 터치 홀드 오버레이 효과 */}
      {isMobile && isLocked && isTouchHolding && (
        <>
          <div 
            className="fixed inset-0 pointer-events-none z-[9998]"
            style={{
              background: `radial-gradient(circle at ${touchPosition.x}px ${touchPosition.y}px, transparent 100px, rgba(0, 0, 0, 0.3) 200px)`,
              transition: 'background 0.3s ease-out',
            }}
          />
        </>
      )}

      <div className="mb-4">
        <div 
          ref={playerContainerRef}
          className="relative w-full aspect-video bg-black rounded shadow-md youtube-player-container"
        >
          <div id="player" className="w-full h-full">
            <div className="flex items-center justify-center h-full bg-gray-800 text-white rounded">
              <p>동영상을 검색해 주세요</p>
            </div>
          </div>
          {/* 텍스트 오버레이 */}
          <TextOverlay
            overlays={overlays}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onOverlayPositionChange={onOverlayPositionChange}
          />
          {/* 정지 시 YouTube UI 숨김 오버레이 */}
          {hideYouTubeOverlay && isPaused && (
            <div
              className="absolute inset-0 z-25"
              style={{
                backgroundColor: 'transparent',
                pointerEvents: 'auto'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 클릭 시 재생/정지 토글
                togglePlayPause();
              }}
            />
          )}
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
