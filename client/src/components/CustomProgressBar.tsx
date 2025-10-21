import React from "react";

interface CustomProgressBarProps {
  isPlayerReady: boolean;
  duration: number;
  currentTime: number;
  timestamps: any[];
  바설정?: {
    커스텀바?: boolean;
  };
  player: any;
  formatTime: (seconds: number) => string;
}

const CustomProgressBar: React.FC<CustomProgressBarProps> = ({
  isPlayerReady,
  duration,
  currentTime,
  timestamps,
  바설정,
  player,
  formatTime,
}) => {
  // 진행바 클릭 핸들러
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !isPlayerReady || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = duration * percentage;

    player.seekTo(targetTime);
  };

  if (!isPlayerReady || duration <= 0 || !바설정?.커스텀바) {
    return null;
  }

  return (
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
            bgColor = 'bg-purple-400';
          } else if (timestamp.volume !== 100) {
            bgColor = 'bg-green-400';
          } else if (timestamp.playbackRate !== 1.0) {
            bgColor = 'bg-orange-400';
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
  );
};

export default CustomProgressBar;
