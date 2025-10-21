import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useCustomSpeeds } from "@/hooks/useCustomSpeeds";
import ButtonPositionSettings from "@/components/settings/ButtonPositionSettings";

interface PlaybackDefaultsProps {
  settings: any;
  settingsUpdate: any;
}

const PlaybackDefaults: React.FC<PlaybackDefaultsProps> = ({
  settings,
  settingsUpdate,
}) => {
  const speeds = useCustomSpeeds();

  return (
    <div className="space-y-4">
      {/* 기본 재생 속도 설정 */}
      <div>
        <Label htmlFor="default-playback-rate" className="text-sm font-medium">
          기본 재생 속도
        </Label>
        <div className="mt-1 space-y-2">
          {/* 고정 속도 옵션 */}
          <div className="flex gap-1">
            <Button
              variant={settings.재생기본값?.defaultPlaybackRate === 0.25 ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => settingsUpdate.handleSettingChange('재생기본값', {
                ...settings.재생기본값,
                defaultPlaybackRate: 0.25
              })}
            >
              0.25x
            </Button>
            <Button
              variant={settings.재생기본값?.defaultPlaybackRate === 1 ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => settingsUpdate.handleSettingChange('재생기본값', {
                ...settings.재생기본값,
                defaultPlaybackRate: 1
              })}
            >
              1x
            </Button>
            <Button
              variant={settings.재생기본값?.defaultPlaybackRate === 2 ? "default" : "outline"}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => settingsUpdate.handleSettingChange('재생기본값', {
                ...settings.재생기본값,
                defaultPlaybackRate: 2
              })}
            >
              2x
            </Button>
          </div>

          {/* 편집 가능한 속도 옵션 */}
          {!speeds.isEditingSpeeds ? (
            <div className="flex gap-1">
              {/* 5개 속도 버튼 */}
              {speeds.customSpeeds.map((speed, index) => (
                <Button
                  key={index}
                  variant={settings.재생기본값?.defaultPlaybackRate === speed ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => settingsUpdate.handleSettingChange('재생기본값', {
                    ...settings.재생기본값,
                    defaultPlaybackRate: speed
                  })}
                >
                  {speed}x
                </Button>
              ))}
              {/* 편집 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={speeds.startEditingSpeeds}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 편집 모드 - 5개 입력창 */}
              <div className="flex gap-1">
                {speeds.tempSpeedValues.map((value, index) => (
                  <Input
                    key={index}
                    value={value}
                    onChange={(e) => speeds.updateTempSpeedValue(index, e.target.value)}
                    onWheel={(e) => speeds.handleSpeedWheel(index, e)}
                    className="flex-1 h-8 text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.05-5.00"
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="5"
                  />
                ))}
              </div>
              {/* 편집 완료/취소 버튼 */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={speeds.finishEditingSpeeds}
                >
                  적용
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={speeds.cancelEditingSpeeds}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 기본 볼륨 설정 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="default-volume" className="text-sm font-medium">
            기본 볼륨
          </Label>
          <span className="text-sm text-gray-500">
            {settings.재생기본값?.defaultVolume || 100}%
          </span>
        </div>
        <Slider
          value={[settings.재생기본값?.defaultVolume || 100]}
          onValueChange={([value]) =>
            settingsUpdate.handleSettingChange('재생기본값', {
              ...settings.재생기본값,
              defaultVolume: value
            })
          }
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* 버튼 위치 설정 */}
      <ButtonPositionSettings
        settings={settings}
        settingsUpdate={settingsUpdate}
      />

      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        이 설정은 새로 재생하는 모든 영상에 자동으로 적용됩니다.
      </div>
    </div>
  );
};

export default PlaybackDefaults;
