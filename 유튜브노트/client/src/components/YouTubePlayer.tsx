import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import TextOverlay, { OverlayData, Coordinates } from "./TextOverlay";

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
}) => {
  const [availableRates, setAvailableRates] = useState<number[]>([]);
  const [currentRate, setCurrentRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  // 플레이어 준비 이벤트 핸들러
  const onPlayerReady = (event: any) => {
    console.log('플레이어 준비 완료');
    setIsPlayerReady(true);
    setAvailableRates(event.target.getAvailablePlaybackRates());
    
    // 비디오 ID가 있으면 즉시 로드
    if (currentVideoId) {
      try {
        event.target.loadVideoById(currentVideoId);
        showNotification("영상이 로드되었습니다.", "success");
      } catch (error) {
        console.error('비디오 로드 오류:', error);
        showNotification("영상 로드 중 오류가 발생했습니다.", "error");
      }
    }
  };

  // 플레이어 상태 변경 이벤트 핸들러
  const onPlayerStateChange = (event: any) => {
    setPlayerState(event.data);
    // 재생 상태 업데이트
    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
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

  // 현재 시간과 영상 길이 업데이트
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    const interval = setInterval(() => {
      try {
        // 플레이어가 여전히 유효한지 확인
        if (player && typeof player.getCurrentTime === 'function') {
          setCurrentTime(player.getCurrentTime());
          setDuration(player.getDuration());
        }
      } catch (error) {
        // 플레이어가 준비되지 않았을 때 무시
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlayerReady]);

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
    <div className="mb-4">
      <div className="relative w-full aspect-video bg-black rounded shadow-md youtube-player-container">
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
      </div>
      
      {/* 커스텀 진행바 (타임스탬프 하이라이트 포함) */}
      {isPlayerReady && duration > 0 && (
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
    </div>
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
