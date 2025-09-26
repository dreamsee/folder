// 화면 확대 테스트 페이지 - CSS transform 방식으로 특정 영역 확대
// ScreenLock 컴포넌트 방식 참조하여 단일 플레이어 확대 구현

import React, { useState, useRef, useEffect } from 'react';
import YouTubePlayer from '../components/YouTubePlayer';
import { formatTime } from '../lib/youtubeUtils';
import { Maximize2, X } from 'lucide-react';

interface TestZoomPageProps {}

// 시간 화살표 컨트롤 컴포넌트
interface TimeArrowControlProps {
  startTime: number;
  endTime: number;
  duration: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
}

const TimeArrowControl: React.FC<TimeArrowControlProps> = ({
  startTime,
  endTime,
  duration,
  onStartTimeChange,
  onEndTimeChange
}) => {
  // 시간을 분:초 형태로 변환
  const timeToMinSec = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return { min, sec };
  };

  const minSecToTime = (min: number, sec: number) => {
    return min * 60 + sec;
  };

  const TimeInput = ({
    label,
    time,
    onChange
  }: {
    label: string;
    time: number;
    onChange: (time: number) => void;
  }) => {
    const { min, sec } = timeToMinSec(time);

    const handleMinChange = (delta: number) => {
      const newMin = Math.max(0, Math.min(Math.floor(duration / 60), min + delta));
      onChange(minSecToTime(newMin, sec));
    };

    const handleSecChange = (delta: number) => {
      const newSec = Math.max(0, Math.min(59, sec + delta));
      onChange(minSecToTime(min, newSec));
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs w-8">{label}</span>
        {/* 분 */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => handleMinChange(1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ▲
          </button>
          <span className="w-6 text-center text-xs">{min}</span>
          <button
            onClick={() => handleMinChange(-1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ▼
          </button>
        </div>
        <span className="text-xs">:</span>
        {/* 초 */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => handleSecChange(1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ▲
          </button>
          <span className="w-6 text-center text-xs">{sec.toString().padStart(2, '0')}</span>
          <button
            onClick={() => handleSecChange(-1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ▼
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <TimeInput
        label="시작"
        time={startTime}
        onChange={onStartTimeChange}
      />
      <TimeInput
        label="종료"
        time={endTime}
        onChange={onEndTimeChange}
      />
    </div>
  );
};

// 좌표 화살표 컨트롤 컴포넌트
interface CoordinateArrowControlProps {
  x: number;
  y: number;
  onXChange: (x: number) => void;
  onYChange: (y: number) => void;
  maxX?: number;
  maxY?: number;
}

const CoordinateArrowControl: React.FC<CoordinateArrowControlProps> = ({
  x,
  y,
  onXChange,
  onYChange,
  maxX = 800,
  maxY = 450
}) => {
  // 숫자를 100자리, 10자리, 1자리로 분해
  const numberToDigits = (num: number) => {
    const hundreds = Math.floor(num / 100);
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    return { hundreds, tens, ones };
  };

  const digitsToNumber = (hundreds: number, tens: number, ones: number) => {
    return hundreds * 100 + tens * 10 + ones;
  };

  const CoordinateInput = ({
    label,
    value,
    onChange,
    max
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    max: number;
  }) => {
    const { hundreds, tens, ones } = numberToDigits(value);

    const handleDigitChange = (digit: 'hundreds' | 'tens' | 'ones', delta: number) => {
      const currentDigits = { hundreds, tens, ones };
      let newValue = currentDigits[digit] + delta;

      // 자릿수별 범위 제한
      if (digit === 'hundreds') {
        newValue = Math.max(0, Math.min(Math.floor(max / 100), newValue));
      } else {
        newValue = Math.max(0, Math.min(9, newValue));
      }

      const newDigits = { ...currentDigits, [digit]: newValue };
      const finalValue = Math.min(max, digitsToNumber(newDigits.hundreds, newDigits.tens, newDigits.ones));
      onChange(finalValue);
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs w-4">{label}</span>
        {/* 100자리 */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => handleDigitChange('hundreds', 1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ↑
          </button>
          <span className="w-6 text-center text-xs">{hundreds}</span>
          <button
            onClick={() => handleDigitChange('hundreds', -1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ↓
          </button>
        </div>
        {/* 10자리 */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => handleDigitChange('tens', 1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ↑
          </button>
          <span className="w-6 text-center text-xs">{tens}</span>
          <button
            onClick={() => handleDigitChange('tens', -1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ↓
          </button>
        </div>
        {/* 1자리 */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => handleDigitChange('ones', 1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ↑
          </button>
          <span className="w-6 text-center text-xs">{ones}</span>
          <button
            onClick={() => handleDigitChange('ones', -1)}
            className="w-6 h-4 text-xs bg-gray-200 hover:bg-gray-300 rounded"
          >
            ↓
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <CoordinateInput
        label="X"
        value={x}
        onChange={onXChange}
        max={maxX}
      />
      <CoordinateInput
        label="Y"
        value={y}
        onChange={onYChange}
        max={maxY}
      />
    </div>
  );
};

// 확대 설정 데이터 타입 - CSS transform 기반으로 단순화
interface ZoomConfig {
  id: string;
  // 확대 중심점 (transform-origin 좌표)
  centerPoint: {
    x: number;  // 픽셀 단위 (영상 내 절대 좌표)
    y: number;  // 픽셀 단위 (영상 내 절대 좌표)
  };
  // 확대 설정
  scale: number;  // 확대 배율 (1.5, 2, 3 등)
  // 시간 설정
  startTime: number;  // 초 단위
  endTime: number;    // 초 단위
  // 테두리 설정 (확대 시 표시할 테두리)
  border: {
    enabled: boolean;
    width: number;  // px
    color: string;  // hex color
  };
}

const TestZoomPage: React.FC<TestZoomPageProps> = () => {
  // 테스트용 비디오 ID
  const [testVideoId] = useState('8gDsaqNwUbo');

  // YouTube 플레이어 관련
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // CSS transform 기반 확대 상태
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomTransform, setZoomTransform] = useState({ scale: 1, originX: 0, originY: 0 });

  // 패널 상태
  const [showPanel, setShowPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState<'tl' | 'tr' | 'bl' | 'br'>('br'); // top-left, top-right, bottom-left, bottom-right

  // 확대 설정
  const [currentConfig, setCurrentConfig] = useState<ZoomConfig>({
    id: Date.now().toString(),
    centerPoint: { x: 100, y: 100 }, // 확대 영역의 좌상단 좌표
    scale: 2,
    startTime: 0,
    endTime: 10,
    border: { enabled: true, width: 2, color: '#FF0000' },
    isActive: true
  });

  // 저장된 확대 설정들
  const [savedConfigs, setSavedConfigs] = useState<ZoomConfig[]>([]);

  // 미리보기 활성화
  const [previewActive, setPreviewActive] = useState(false);

  // 플레이어 컨테이너 참조 (CSS transform 적용용)
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // 현재 활성 줌 설정 상태
  const [activeZoomConfig, setActiveZoomConfig] = useState<ZoomConfig | null>(null);

  // 시간 업데이트 및 자동 줌 활성화 시스템
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    const interval = setInterval(() => {
      const time = player.getCurrentTime();
      setCurrentTime(time);
      setDuration(player.getDuration() || 0);

      const state = player.getPlayerState();
      setIsPlaying(state === 1);

      // 저장된 설정 중 현재 시간에 해당하는 것이 있는지 확인 (패널이 닫혀있을 때만)
      if (!showPanel && savedConfigs.length > 0) {
        const activeConfig = savedConfigs.find(
          config => config.isActive && time >= config.startTime && time <= config.endTime
        );

        if (activeConfig) {
          // 줌 활성화 - 좌상단 좌표를 그대로 사용 (좌상단 기준 줌)
          const centerX = activeConfig.centerPoint.x;
          const centerY = activeConfig.centerPoint.y;

          setActiveZoomConfig(activeConfig);
          setZoomTransform({
            scale: activeConfig.scale,
            originX: centerX,
            originY: centerY
          });
          setIsZoomActive(true);
        } else {
          // 시간 범위를 벗어나면 줌 해제
          setActiveZoomConfig(null);
          setIsZoomActive(false);
        }
      } else if (showPanel) {
        // 패널이 열려있으면 자동 줌 비활성화
        setActiveZoomConfig(null);
        setIsZoomActive(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlayerReady, savedConfigs, showPanel]);

  // 패널 열기/닫기
  const togglePanel = () => {
    if (!showPanel) {
      // 패널 열 때 영상 일시정지
      if (player && isPlaying) {
        player.pauseVideo();
      }
      setPreviewActive(true);
    } else {
      setPreviewActive(false);
    }
    setShowPanel(!showPanel);
  };

  // 시간 변경 시 영상 이동
  const handleStartTimeChange = (time: number) => {
    setCurrentConfig(prev => ({ ...prev, startTime: time }));
    if (player && isPlayerReady) {
      player.seekTo(time, true);
    }
  };

  const handleEndTimeChange = (time: number) => {
    setCurrentConfig(prev => ({ ...prev, endTime: time }));
    if (player && isPlayerReady) {
      player.seekTo(time, true);
    }
  };


  // 패널 위치 변경
  const changePanelPosition = (position: 'tl' | 'tr' | 'bl' | 'br') => {
    setPanelPosition(position);
  };

  // 패널 위치에 따른 스타일
  const getPanelStyle = () => {
    const base = "absolute bg-white rounded-lg shadow-xl p-4 w-80 z-50";
    switch (panelPosition) {
      case 'tl': return `${base} top-4 left-4`;
      case 'tr': return `${base} top-4 right-4`;
      case 'bl': return `${base} bottom-4 left-4`;
      case 'br': return `${base} bottom-4 right-4`;
    }
  };

  // CSS transform 줌 스타일 생성 - iframe만 확대하고 컨테이너 내부에서만 보이게
  const generateZoomStyle = () => {
    if (!isZoomActive) return null;

    const { scale, originX, originY } = zoomTransform;
    const config = showPanel ? currentConfig : activeZoomConfig;

    return (
      <style>
        {`
          /* 플레이어 컨테이너는 원래 크기 유지하고 overflow hidden */
          .youtube-player-container {
            overflow: hidden;
            position: relative;
            ${config?.border.enabled ? `
              box-shadow: inset 0 0 0 ${config.border.width}px ${config.border.color};
            ` : ''}
          }

          /* YouTube iframe만 확대 (영상 부분만) */
          .youtube-player-container iframe {
            transform: scale(${scale});
            transform-origin: ${originX}px ${originY}px;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* 확대 시 줌 표시 오버레이 */
          .youtube-player-container::before {
            content: '🔍 ${scale}x';
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 100;
            pointer-events: none;
          }
        `}
      </style>
    );
  };

  // 줌 영역 표시 (편집 모드 시) - 네모 영역으로 표시
  const renderZoomArea = () => {
    if (!showPanel) return null;

    // 줌 배율에 반비례하는 영역 크기 계산
    // 플레이어 실제 크기를 동적으로 가져오거나 기본값 사용
    const containerRect = playerContainerRef.current?.getBoundingClientRect();
    const baseWidth = containerRect?.width || 800;
    const baseHeight = containerRect?.height || 450;
    const scale = currentConfig.scale;

    // 줌 배율에 반비례하는 크기 (2배 줌이면 절반 크기, 8배 줌이면 1/8 크기)
    const areaWidth = baseWidth / scale;
    const areaHeight = baseHeight / scale;

    return (
      <div
        style={{
          position: 'absolute',
          left: `${currentConfig.centerPoint.x}px`, // 좌상단 모서리가 좌표 위치
          top: `${currentConfig.centerPoint.y}px`,   // 좌상단 모서리가 좌표 위치
          width: `${areaWidth}px`,
          height: `${areaHeight}px`,
          border: '2px solid #FF0000',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">화면 확대 테스트</h1>
          <div className="text-sm text-gray-500">
            테스트 비디오: {testVideoId}
          </div>
        </div>
      </div>

      {/* YouTube 플레이어 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div
          ref={playerContainerRef}
          className="relative w-full max-w-4xl aspect-video bg-black rounded-lg youtube-player-container"
        >
          <YouTubePlayer
            player={player}
            setPlayer={setPlayer}
            isPlayerReady={isPlayerReady}
            setIsPlayerReady={setIsPlayerReady}
            currentVideoId={testVideoId}
            setPlayerState={(state: number) => setIsPlaying(state === 1)}
            showNotification={(msg) => console.log(msg)}
            overlays={[]}
            isLocked={false}
            바설정={{ 커스텀바: false, 챕터바: false }}
          />

          {/* 줌 영역 표시 (편집 모드) */}
          {renderZoomArea()}

          {/* 좌측 하단 컨트롤 버튼 */}
          <button
            onClick={togglePanel}
            className="absolute bottom-4 left-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all z-20"
            title="화면 확대 설정"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>

        {/* 저장된 확대 설정 목록 - 영상 플레이어 바로 아래 */}
        <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-lg p-3 mt-3">
          <h4 className="text-sm font-medium mb-2">저장된 확대 설정 ({savedConfigs.length}개)</h4>
          {savedConfigs.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">저장된 확대 설정이 없습니다. 설정을 추가해보세요.</div>
          ) : (
            <div className="space-y-2">
              {savedConfigs.map((config, index) => (
                <div
                  key={config.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded text-xs"
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.isActive || false}
                      onChange={(e) => {
                        setSavedConfigs(prev => prev.map(c =>
                          c.id === config.id ? { ...c, isActive: e.target.checked } : c
                        ));
                      }}
                      className="rounded"
                    />
                    <span>
                      {index + 1}. {formatTime(config.startTime)} ~ {formatTime(config.endTime)} ({config.scale}x)
                    </span>
                  </label>
                  <div className="flex gap-1 ml-auto">
                    <button
                      onClick={() => {
                        setCurrentConfig(config);
                        handleStartTimeChange(config.startTime);
                        setShowPanel(true);
                      }}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => {
                        setSavedConfigs(prev => prev.filter(c => c.id !== config.id));
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 설정 패널 (플로팅) */}
      {showPanel && (
        <div className={getPanelStyle()}>
          {/* 패널 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">화면 확대 설정</h2>

            {/* 2x2 위치 버튼 */}
            <div className="flex gap-1">
              <div className="grid grid-cols-2 gap-0.5">
                <button
                  onClick={() => changePanelPosition('tl')}
                  className={`w-4 h-4 border ${panelPosition === 'tl' ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-blue-400`}
                  title="좌상단"
                />
                <button
                  onClick={() => changePanelPosition('tr')}
                  className={`w-4 h-4 border ${panelPosition === 'tr' ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-blue-400`}
                  title="우상단"
                />
                <button
                  onClick={() => changePanelPosition('bl')}
                  className={`w-4 h-4 border ${panelPosition === 'bl' ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-blue-400`}
                  title="좌하단"
                />
                <button
                  onClick={() => changePanelPosition('br')}
                  className={`w-4 h-4 border ${panelPosition === 'br' ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-blue-400`}
                  title="우하단"
                />
              </div>

              <button
                onClick={togglePanel}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 설정 내용 */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <CoordinateArrowControl
              x={currentConfig.centerPoint.x}
              y={currentConfig.centerPoint.y}
              onXChange={(x) => setCurrentConfig(prev => ({
                ...prev,
                centerPoint: { ...prev.centerPoint, x }
              }))}
              onYChange={(y) => setCurrentConfig(prev => ({
                ...prev,
                centerPoint: { ...prev.centerPoint, y }
              }))}
              maxX={800}
              maxY={450}
            />

            <select
              value={currentConfig.scale}
              onChange={(e) => setCurrentConfig(prev => ({
                ...prev,
                scale: Number(e.target.value)
              }))}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
              <option value="4">4x</option>
            </select>

            <TimeArrowControl
              startTime={currentConfig.startTime}
              endTime={currentConfig.endTime}
              duration={duration}
              onStartTimeChange={handleStartTimeChange}
              onEndTimeChange={handleEndTimeChange}
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentConfig.border.enabled}
                onChange={(e) => setCurrentConfig(prev => ({
                  ...prev,
                  border: { ...prev.border, enabled: e.target.checked }
                }))}
                className="rounded"
              />
              테두리
            </label>
          </div>


          {/* 액션 버튼들 */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <button
              onClick={() => {
                // 중복 시간대 설정이 있으면 기존 것을 덮어쓰기
                const existingIndex = savedConfigs.findIndex(config =>
                  (currentConfig.startTime >= config.startTime && currentConfig.startTime <= config.endTime) ||
                  (currentConfig.endTime >= config.startTime && currentConfig.endTime <= config.endTime) ||
                  (config.startTime >= currentConfig.startTime && config.startTime <= currentConfig.endTime)
                );

                if (existingIndex !== -1) {
                  // 기존 설정 덮어쓰기
                  setSavedConfigs(prev => prev.map((config, index) =>
                    index === existingIndex ? { ...currentConfig, id: config.id } : config
                  ));
                } else {
                  // 새 설정 추가
                  setSavedConfigs(prev => [...prev, { ...currentConfig, id: Date.now().toString(), isActive: true }]);
                }

                togglePanel();
              }}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              저장
            </button>
            <button
              onClick={() => {
                togglePanel();
              }}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}


      {/* CSS Transform 줌 스타일 */}
      {generateZoomStyle()}
    </div>
  );
};

export default TestZoomPage;