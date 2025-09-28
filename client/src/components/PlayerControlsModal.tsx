import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, SkipForward } from 'lucide-react';
import TimeSkipControls from './TimeSkipControls';

interface PlayerControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any | null;
  isPlayerReady: boolean;
  volume: number;
  currentRate: number;
  onVolumeChange: (volume: number) => void;
  onRateChange: (rate: number) => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

const PlayerControlsModal: React.FC<PlayerControlsModalProps> = ({
  isOpen,
  onClose,
  player,
  isPlayerReady,
  volume,
  currentRate,
  onVolumeChange,
  onRateChange,
  showNotification,
}) => {
  const [controlMode, setControlMode] = useState<'normal' | 'timeSkip'>('normal');
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startRate, setStartRate] = useState(1);
  const controlRef = useRef<HTMLDivElement>(null);

  // 드래그 제한값
  const minRate = 0.25;
  const maxRate = 2.0;

  // 모달이 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen && player && isPlayerReady) {
      const currentVolume = player.getVolume ? player.getVolume() : 100;
      const currentSpeed = player.getPlaybackRate ? player.getPlaybackRate() : 1;
      onVolumeChange(currentVolume);
      onRateChange(currentSpeed);
    }
  }, [isOpen, player, isPlayerReady]);

  // 드래그 핸들러
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlayerReady || !player) return;

    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartRate(currentRate);

    if (controlRef.current) {
      controlRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isPlayerReady || !player) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = startPos.y - e.clientY; // Y축은 반대로 (위가 +)

    // 속도 조절 (좌우 드래그)
    const rateChange = deltaX / 100;
    const newRate = Math.max(minRate, Math.min(maxRate, startRate + rateChange));
    if (player.setPlaybackRate) {
      player.setPlaybackRate(newRate);
    }
    onRateChange(newRate);

    // 볼륨 조절 (상하 드래그)
    const volumeChange = deltaY / 2;
    const newVolume = Math.max(0, Math.min(100, volume + volumeChange));
    if (player.setVolume) {
      player.setVolume(newVolume);
    }
    onVolumeChange(newVolume);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging && isPlayerReady && player) {
      // 클릭으로 재생/일시정지
      const deltaX = Math.abs(e.clientX - startPos.x);
      const deltaY = Math.abs(e.clientY - startPos.y);

      if (deltaX < 5 && deltaY < 5) {
        const playerState = player.getPlayerState();
        if (playerState === 1) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }
    }
    setIsDragging(false);

    if (controlRef.current) {
      controlRef.current.releasePointerCapture(e.pointerId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative z-10 bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setControlMode(controlMode === 'normal' ? 'timeSkip' : 'normal')}
            className="text-lg font-medium text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
          >
            {controlMode === 'normal' ? '재생 컨트롤' : '영상 건너뛰기'}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 font-mono mb-4">
          <span>{Math.round(volume)}%</span>
          <span>•</span>
          <span>{currentRate.toFixed(2)}x</span>
        </div>

        {/* 컨트롤 영역 */}
        {controlMode === 'normal' ? (
          <div
            ref={controlRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`
              relative w-full h-32 bg-gradient-to-r from-blue-50 to-red-50
              border-2 border-gray-200 rounded-lg cursor-pointer
              ${isDragging ? 'border-blue-400 bg-blue-100' : 'hover:border-gray-300'}
              ${!isPlayerReady ? 'opacity-50 cursor-not-allowed' : ''}
              select-none touch-none
            `}
            style={{
              background: isDragging
                ? 'linear-gradient(to right, #dbeafe 0%, #fef3c7 50%, #fecaca 100%)'
                : 'linear-gradient(to right, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)'
            }}
          >
            {/* 시각적 피드백 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">
                  {isDragging ? '조절 중...' : '드래그하여 조절 • 클릭하여 재생/일시정지'}
                </div>
                <div className="flex items-center justify-center space-x-8 text-xs text-gray-600">
                  <span>← 느리게</span>
                  <span>빠르게 →</span>
                </div>
                <div className="flex items-center justify-center space-x-8 text-xs text-gray-600 mt-2">
                  <span>↑ 볼륨 크게</span>
                  <span>볼륨 작게 ↓</span>
                </div>
              </div>
            </div>

            {/* 현재 값 표시 바 */}
            <div
              className="absolute top-0 left-0 h-full bg-blue-200 opacity-30 transition-all duration-150"
              style={{ width: `${(currentRate - minRate) / (maxRate - minRate) * 100}%` }}
            />
            <div
              className="absolute bottom-0 left-0 w-full bg-green-200 opacity-30 transition-all duration-150"
              style={{ height: `${volume}%` }}
            />
          </div>
        ) : (
          <TimeSkipControls
            player={player}
            isPlayerReady={isPlayerReady}
            showNotification={showNotification}
          />
        )}
      </div>
    </div>
  );
};

export default PlayerControlsModal;