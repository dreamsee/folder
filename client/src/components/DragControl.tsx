import React, { useState, useRef } from "react";

interface DragControlProps {
  player: any;
  isPlayerReady: boolean;
  currentRate: number;
  volume: number;
  setCurrentRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
}

const DragControl: React.FC<DragControlProps> = ({
  player,
  isPlayerReady,
  currentRate,
  volume,
  setCurrentRate,
  setVolume,
  setPlaybackRate,
}) => {
  // 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startRate, setStartRate] = useState(1);
  const [startVolume, setStartVolume] = useState(100);

  // 재생 속도 범위
  const minRate = 0.25;
  const maxRate = 2.0;

  const controlRef = useRef<HTMLDivElement>(null);

  // 포인터 다운 핸들러
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlayerReady || !player) return;

    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartRate(currentRate);
    setStartVolume(volume);

    if (controlRef.current) {
      controlRef.current.setPointerCapture(e.pointerId);
    }
  };

  // 포인터 이동 핸들러
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isPlayerReady || !player) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // 좌우 드래그로 재생 속도 조절
    const sensitivity = 0.005;
    const newRate = Math.max(minRate, Math.min(maxRate, startRate + deltaX * sensitivity));

    if (Math.abs(newRate - currentRate) > 0.01) {
      player.setPlaybackRate(newRate);
      setCurrentRate(newRate);
      setPlaybackRate(newRate);
    }

    // 상하 드래그로 볼륨 조절
    const volumeSensitivity = 0.5;
    const newVolume = Math.max(0, Math.min(100, startVolume - deltaY * volumeSensitivity));

    if (Math.abs(newVolume - volume) > 1) {
      player.setVolume(newVolume);
      setVolume(newVolume);
    }
  };

  // 포인터 업 핸들러
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPlayerReady || !player) return;

    const deltaX = Math.abs(e.clientX - startPos.x);
    const deltaY = Math.abs(e.clientY - startPos.y);

    // 움직임이 거의 없었다면 재생/일시정지 토글
    if (deltaX < 5 && deltaY < 5) {
      const playerState = player.getPlayerState();
      if (playerState === 1) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
    setIsDragging(false);

    if (controlRef.current) {
      controlRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={controlRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`
        relative w-full h-16 bg-gradient-to-r from-blue-50 to-red-50
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
          <div className="text-xs text-gray-500 mb-1">
            {isDragging ? '조절 중...' : '드래그하여 조절 • 클릭하여 재생/일시정지'}
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
            <span>← 느리게</span>
            <span>빠르게 →</span>
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 mt-1">
            <span>↑ 볼륨 크게</span>
            <span>볼륨 작게 ↓</span>
          </div>
        </div>
      </div>

      {/* 현재 값 표시 바 */}
      <div
        className="absolute top-0 left-0 h-full bg-blue-200 opacity-30 transition-all duration-150"
        style={{ width: `${((currentRate || 1.0) - minRate) / (maxRate - minRate) * 100}%` }}
      />
      <div
        className="absolute bottom-0 left-0 w-full bg-green-200 opacity-30 transition-all duration-150"
        style={{ height: `${volume || 100}%` }}
      />
    </div>
  );
};

export default DragControl;
