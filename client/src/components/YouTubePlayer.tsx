import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TextOverlay, { OverlayData, Coordinates } from "./TextOverlay";
import ChapterBar from "./ChapterBar";
import CommentSidePanel from "./CommentSidePanel";
import { Chapter } from "@/utils/chapterParser";
import PlayerButtons from "./PlayerButtons";
import PlayerControlsPanel from "./PlayerControlsPanel";
import CustomProgressBar from "./CustomProgressBar";
import { useMobileZoom } from "@/hooks/useMobileZoom";
import { usePlayerInit } from "@/hooks/usePlayerInit";
import { useChapterSystem } from "@/hooks/useChapterSystem";
import { useFullscreen } from "@/hooks/useFullscreen";

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
    챕터바개수?: number;
  };
  currentTime?: number; // 현재 재생 시간 (HomePage에서 전달)
  uiSettings?: {
    재생컨트롤: {
      전체표시: boolean;
      플레이어내장: boolean;
    };
  };
  재생기본값?: {
    fullscreenButtonPosition?: { bottom: number; right: number };
    commentButtonPosition?: { bottom: number; right: number };
  };
  isControlsModalOpen?: boolean; // 플레이어 컨트롤 모달 열림 상태
  onControlsModalOpenChange?: (isOpen: boolean) => void; // 모달 열림 상태 변경 콜백
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
  uiSettings,
  재생기본값,
  isControlsModalOpen = false, // 외부에서 전달받은 모달 상태
  onControlsModalOpenChange // 모달 상태 변경 콜백
}) => {
  // 재생 시간 및 영상 길이 상태
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // 컨트롤 패널의 볼륨과 속도 상태
  const [currentVolume, setCurrentVolume] = useState(100);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);

  // 플레이어 컨테이너 ref
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // 플레이어 초기화 훅 (플레이어 생성, 이벤트 핸들러, 재생/일시정지 등)
  const {
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
  } = usePlayerInit({
    currentVideoId,
    player,
    setPlayer,
    setIsPlayerReady,
    setPlayerState,
    showNotification,
  });

  // 챕터 시스템 훅 (챕터 로드 및 관리)
  const { chapters, setChapters, isLoadingChapters } = useChapterSystem({
    currentVideoId,
    isPlayerReady,
    duration,
    바설정,
  });

  // 전체화면 훅 (전체화면 상태 및 토글)
  const { isFullscreen, setIsFullscreen, toggleFullscreen } = useFullscreen({
    playerContainerRef,
    showNotification,
  });

  // 모바일 확대 기능 (커스텀 훅)
  const { isMobile, isTouchHolding, touchPosition, overlayPosition } = useMobileZoom({
    isLocked,
    playerContainerRef,
  });

  // 모든 플레이어 초기화, 전체화면, 챕터 로직은 커스텀 훅으로 분리됨


  // 챕터 클릭 핸들러
  const handleChapterClick = (seconds: number) => {
    if (player && isPlayerReady) {
      player.seekTo(seconds, true);
      player.playVideo();
    }
  };

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
          {/* 영상 잠금 오버레이 (하단 100px 제외하여 유튜브 컨트롤과 커스텀 버튼 사용 가능) */}
          {isLocked && (
            <div
              className="absolute z-30 cursor-default"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: '55px',
                pointerEvents: 'auto',
                touchAction: 'none'
              }}
              title="화면이 잠금되었습니다"
            />
          )}

          {/* UI 컨트롤 래퍼 - 터치 이벤트 차단, 영상 클릭은 허용 */}
          <div
            className="absolute inset-0 pointer-events-none z-40"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* 플레이어 버튼 컴포넌트 */}
            <PlayerButtons
              uiSettings={uiSettings}
              재생기본값={재생기본값}
              isFullscreen={isFullscreen}
              isControlsModalOpen={isControlsModalOpen}
              isPlayerReady={isPlayerReady}
              player={player}
              toggleFullscreen={toggleFullscreen}
              onControlsModalOpen={() => {
                if (player && isPlayerReady) {
                  setCurrentVolume(player.getVolume());
                  setCurrentSpeed(player.getPlaybackRate());
                }
                onControlsModalOpenChange?.(true); // 상위 컴포넌트에 모달 열림 알림
              }}
              setCurrentVolume={setCurrentVolume}
              setCurrentSpeed={setCurrentSpeed}
            />

            {/* 플레이어 컨트롤 패널 컴포넌트 */}
            <PlayerControlsPanel
              isOpen={isControlsModalOpen}
              currentVolume={currentVolume}
              currentSpeed={currentSpeed}
              isPlaying={isPlaying}
              isPlayerReady={isPlayerReady}
              player={player}
              setCurrentVolume={setCurrentVolume}
              setCurrentSpeed={setCurrentSpeed}
              setCurrentRate={setCurrentRate}
              togglePlayPause={togglePlayPause}
              onClose={() => onControlsModalOpenChange?.(false)} // 상위 컴포넌트에 모달 닫힘 알림
              buttonPosition={재생기본값?.playerControlButtonPosition}
            />
          </div>

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

      {/* 커스텀 진행바 컴포넌트 */}
      <CustomProgressBar
        isPlayerReady={isPlayerReady}
        duration={duration}
        currentTime={currentTime}
        timestamps={timestamps}
        바설정={바설정}
        player={player}
        formatTime={formatTime}
      />

      {/* 챕터 바 */}
      {isPlayerReady && duration > 0 && 바설정?.챕터바 && chapters.length > 0 && (
        <div className="mt-2">
          <ChapterBar
            chapters={chapters}
            currentTime={currentTime}
            onChapterClick={handleChapterClick}
            chaptersPerPageSetting={바설정?.챕터바개수}
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
