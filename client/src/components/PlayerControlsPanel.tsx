import React from "react";
import { Volume2, RotateCw, Play, Pause } from "lucide-react";

interface PlayerControlsPanelProps {
  isOpen: boolean;
  currentVolume: number;
  currentSpeed: number;
  isPlaying: boolean;
  isPlayerReady: boolean;
  player: any;

  setCurrentVolume: (volume: number) => void;
  setCurrentSpeed: (speed: number) => void;
  setCurrentRate: (rate: number) => void;
  togglePlayPause: () => void;
  onClose: () => void;
  buttonPosition?: { bottom: number; left: number };
}

const PlayerControlsPanel: React.FC<PlayerControlsPanelProps> = ({
  isOpen,
  currentVolume,
  currentSpeed,
  isPlaying,
  isPlayerReady,
  player,
  setCurrentVolume,
  setCurrentSpeed,
  setCurrentRate,
  togglePlayPause,
  onClose,
  buttonPosition,
}) => {
  if (!isOpen) return null;

  // 버튼 위치를 기준으로 패널 위치 계산 (버튼 위 + 약간 왼쪽)
  const panelBottom = buttonPosition?.bottom ? buttonPosition.bottom : 0;
  const panelLeft = buttonPosition?.left ?? 0;

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      data-control-panel="true"
      style={{
        bottom: `${panelBottom}px`,
        left: `${panelLeft}px`
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
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
            onClick={onClose}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerControlsPanel;
