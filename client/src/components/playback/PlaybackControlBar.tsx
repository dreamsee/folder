import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import TimeSkipControls from "../TimeSkipControls";
import DragControl from "../DragControl";
import { UISettings } from "../SettingsPanel";

interface PlaybackControlBarProps {
  player: any;
  isPlayerReady: boolean;
  currentRate: number;
  volume: number;
  playbackRate: number;
  setCurrentRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  handleVolumeChange: (volume: number) => void;
  handleSpeedChange: (speed: number) => void;
  timestampEditor: any;
  uiSettings: UISettings;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

const PlaybackControlBar: React.FC<PlaybackControlBarProps> = ({
  player,
  isPlayerReady,
  currentRate,
  volume,
  playbackRate,
  setCurrentRate,
  setVolume,
  setPlaybackRate,
  handleVolumeChange,
  handleSpeedChange,
  timestampEditor,
  uiSettings,
  showNotification,
}) => {
  const [controlMode, setControlMode] = useState<'normal' | 'timeSkip'>('normal');

  return (
    <>
      {uiSettings?.재생컨트롤?.전체표시 !== false && (
        <div className="mb-4 space-y-2">
          {/* 메인 드래그 컨트롤 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1"></div>
              <button
                onClick={() => setControlMode(controlMode === 'normal' ? 'timeSkip' : 'normal')}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
              >
                {controlMode === 'normal' ? '재생 컨트롤' : '영상 건너뛰기'}
              </button>
              <div className="flex-1 flex items-center justify-end space-x-1 text-sm text-gray-600 font-mono">
                <span>{Math.round(volume || 100)}%</span>
                <span>•</span>
                <span>{(currentRate || 1.0).toFixed(2)}x</span>
              </div>
            </div>

            {/* 일반 모드: 드래그 컨트롤 */}
            {controlMode === 'normal' && (
              <DragControl
                player={player}
                isPlayerReady={isPlayerReady}
                currentRate={currentRate}
                volume={volume}
                setCurrentRate={setCurrentRate}
                setVolume={setVolume}
                setPlaybackRate={setPlaybackRate}
              />
            )}

            {/* 시간 건너뛰기 모드 */}
            {controlMode === 'timeSkip' && (
              <TimeSkipControls
                player={player}
                isPlayerReady={isPlayerReady}
                showNotification={showNotification}
              />
            )}
          </div>

          {/* 세부 컨트롤 바 */}
          {(uiSettings?.재생컨트롤?.볼륨 !== false || uiSettings?.재생컨트롤?.속도 !== false || uiSettings?.재생컨트롤?.도장 !== false || uiSettings?.재생컨트롤?.편집 !== false) && (
            <div className="flex items-center gap-1 overflow-x-auto">
              {uiSettings?.재생컨트롤?.볼륨 !== false && (
                <>
                  {/* 볼륨 */}
                  <div className="flex flex-col items-center leading-none flex-shrink-0">
                    <span className="text-xs text-gray-500">볼</span>
                    <span className="text-xs text-gray-500">륨</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => {
                      const newVolume = Number(e.target.value);
                      handleVolumeChange(newVolume);
                    }}
                    className="flex-1 h-3 min-w-[20px] max-w-[100px]"
                  />
                  <span className="text-xs text-gray-600 w-7 flex-shrink-0 text-right">{Math.round(volume || 100)}%</span>
                </>
              )}

              {uiSettings?.재생컨트롤?.속도 !== false && (
                <>
                  {/* 속도 */}
                  <div className="flex flex-col items-center leading-none flex-shrink-0 ml-1">
                    <span className="text-xs text-gray-500">속</span>
                    <span className="text-xs text-gray-500">도</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.05"
                    value={playbackRate}
                    onChange={(e) => {
                      const newRate = Number(e.target.value);
                      handleSpeedChange(newRate);
                    }}
                    className="flex-1 h-2 min-w-[20px] max-w-[100px]"
                  />
                  <span className="text-xs text-gray-600 w-10 flex-shrink-0 text-right">{playbackRate.toFixed(2)}x</span>
                </>
              )}

              {/* 지속시간 입력 - 도장 설정과 연동 */}
              {uiSettings?.재생컨트롤?.도장 !== false && (
                <>
                  <div className="flex flex-col items-center leading-none flex-shrink-0 ml-2">
                    <span className="text-xs text-gray-500">지</span>
                    <span className="text-xs text-gray-500">속</span>
                  </div>
                  <input
                    type="number"
                    value={timestampEditor.duration}
                    onChange={(e) => {
                      const newDuration = Math.max(1, Math.min(60, Number(e.target.value) || 5));
                      timestampEditor.setDuration(newDuration);
                    }}
                    onWheel={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      const change = e.deltaY > 0 ? -1 : 1;
                      const newDuration = Math.max(1, Math.min(60, timestampEditor.duration + change));
                      timestampEditor.setDuration(newDuration);
                    }}
                    className="w-12 h-6 text-xs border rounded px-1 text-center flex-shrink-0"
                  />
                  <span className="text-xs text-gray-500 flex-shrink-0">초</span>
                </>
              )}

              {/* 컨트롤 버튼들 - 개별 설정에 따라 표시 */}
              {uiSettings?.재생컨트롤?.도장 !== false && (
                <Button
                  onClick={timestampEditor.addTimestamp}
                  disabled={!isPlayerReady}
                  size="sm"
                  variant="destructive"
                  className="flex-shrink-0 ml-1 text-xs px-2 py-1 h-7"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  도장
                </Button>
              )}

              {uiSettings?.재생컨트롤?.편집 !== false && (
                <Button
                  onClick={timestampEditor.openTimestampModal}
                  disabled={!isPlayerReady}
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 ml-1 text-xs px-2 py-1 h-7"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  편집
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PlaybackControlBar;
