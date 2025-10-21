import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface ButtonPositionSettingsProps {
  settings: any;
  settingsUpdate: any;
}

const ButtonPositionSettings: React.FC<ButtonPositionSettingsProps> = ({
  settings,
  settingsUpdate,
}) => {
  return (
    <div className="space-y-3">
      {/* 전체화면 버튼 */}
      <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">전체화면 버튼</span>
          <Switch
            checked={settings.재생기본값?.fullscreenButtonVisible ?? true}
            onCheckedChange={(값) =>
              settingsUpdate.handleSettingChange('재생기본값', {
                ...settings.재생기본값,
                fullscreenButtonVisible: 값
              })
            }
          />
        </div>
        {settings.재생기본값?.fullscreenButtonVisible && (
          <div className="ml-4 space-y-3">
            <div>
              <span className="text-xs text-gray-600">일반 화면 버튼 위치 (px):</span>
              <div className="flex gap-2 mt-1 items-center">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={settings.재생기본값?.fullscreenButtonPosition?.right ?? 17}
                    onChange={(e) =>
                      settingsUpdate.handleSettingChange('재생기본값', {
                        ...settings.재생기본값,
                        fullscreenButtonPosition: {
                          ...settings.재생기본값?.fullscreenButtonPosition,
                          right: parseInt(e.target.value) || 17
                        }
                      })
                    }
                    className="h-8 text-xs text-center"
                    min="0"
                    placeholder="right"
                  />
                </div>
                <span className="text-xs text-gray-500">x</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={settings.재생기본값?.fullscreenButtonPosition?.bottom ?? 3}
                    onChange={(e) =>
                      settingsUpdate.handleSettingChange('재생기본값', {
                        ...settings.재생기본값,
                        fullscreenButtonPosition: {
                          ...settings.재생기본값?.fullscreenButtonPosition,
                          bottom: parseInt(e.target.value) || 3
                        }
                      })
                    }
                    className="h-8 text-xs text-center"
                    min="0"
                    placeholder="bottom"
                  />
                </div>
                <span className="text-xs text-gray-500">y</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-600">전체 화면 버튼 위치 (px):</span>
              <div className="flex gap-2 mt-1 items-center">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={settings.재생기본값?.fullscreenButtonPositionFullscreen?.right ?? 35}
                    onChange={(e) =>
                      settingsUpdate.handleSettingChange('재생기본값', {
                        ...settings.재생기본값,
                        fullscreenButtonPositionFullscreen: {
                          ...settings.재생기본값?.fullscreenButtonPositionFullscreen,
                          right: parseInt(e.target.value) || 35
                        }
                      })
                    }
                    className="h-8 text-xs text-center"
                    min="0"
                    placeholder="right"
                  />
                </div>
                <span className="text-xs text-gray-500">x</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    value={settings.재생기본값?.fullscreenButtonPositionFullscreen?.bottom ?? 8}
                    onChange={(e) =>
                      settingsUpdate.handleSettingChange('재생기본값', {
                        ...settings.재생기본값,
                        fullscreenButtonPositionFullscreen: {
                          ...settings.재생기본값?.fullscreenButtonPositionFullscreen,
                          bottom: parseInt(e.target.value) || 8
                        }
                      })
                    }
                    className="h-8 text-xs text-center"
                    min="0"
                    placeholder="bottom"
                  />
                </div>
                <span className="text-xs text-gray-500">y</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 댓글 버튼 */}
      <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">댓글 버튼</span>
          <Switch
            checked={settings.재생기본값?.commentButtonVisible ?? true}
            onCheckedChange={(값) =>
              settingsUpdate.handleSettingChange('재생기본값', {
                ...settings.재생기본값,
                commentButtonVisible: 값
              })
            }
          />
        </div>
        {settings.재생기본값?.commentButtonVisible && (
          <div className="ml-4">
            <span className="text-xs text-gray-600">버튼 위치 (px):</span>
            <div className="flex gap-2 mt-1 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  value={settings.재생기본값?.commentButtonPosition?.right ?? 80}
                  onChange={(e) =>
                    settingsUpdate.handleSettingChange('재생기본값', {
                      ...settings.재생기본값,
                      commentButtonPosition: {
                        ...settings.재생기본값?.commentButtonPosition,
                        right: parseInt(e.target.value) || 80
                      }
                    })
                  }
                  className="h-8 text-xs text-center"
                  min="0"
                  placeholder="right"
                />
              </div>
              <span className="text-xs text-gray-500">x</span>
              <div className="flex-1">
                <Input
                  type="number"
                  value={settings.재생기본값?.commentButtonPosition?.bottom ?? 8}
                  onChange={(e) =>
                    settingsUpdate.handleSettingChange('재생기본값', {
                      ...settings.재생기본값,
                      commentButtonPosition: {
                        ...settings.재생기본값?.commentButtonPosition,
                        bottom: parseInt(e.target.value) || 8
                      }
                    })
                  }
                  className="h-8 text-xs text-center"
                  min="0"
                  placeholder="bottom"
                />
              </div>
              <span className="text-xs text-gray-500">y</span>
            </div>
          </div>
        )}
      </div>

      {/* 플레이어 내장 버튼 */}
      <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">플레이어 내장 버튼</span>
            <Switch
              checked={settings.재생기본값?.playerControlButtonVisible ?? true}
              onCheckedChange={(값) =>
                settingsUpdate.handleSettingChange('재생기본값', {
                  ...settings.재생기본값,
                  playerControlButtonVisible: 값
                })
              }
            />
          </div>
          {settings.재생기본값?.playerControlButtonVisible && (
            <div className="ml-4 space-y-3">
              <div>
                <span className="text-xs text-gray-600">일반 화면 버튼 위치 (px):</span>
                <div className="flex gap-2 mt-1 items-center">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={settings.재생기본값?.playerControlButtonPosition?.left ?? 18}
                      onChange={(e) =>
                        settingsUpdate.handleSettingChange('재생기본값', {
                          ...settings.재생기본값,
                          playerControlButtonPosition: {
                            ...settings.재생기본값?.playerControlButtonPosition,
                            left: parseInt(e.target.value) || 18
                          }
                        })
                      }
                      className="h-8 text-xs text-center"
                      min="0"
                      placeholder="left"
                    />
                  </div>
                  <span className="text-xs text-gray-500">x</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={settings.재생기본값?.playerControlButtonPosition?.bottom ?? 3}
                      onChange={(e) =>
                        settingsUpdate.handleSettingChange('재생기본값', {
                          ...settings.재생기본값,
                          playerControlButtonPosition: {
                            ...settings.재생기본값?.playerControlButtonPosition,
                            bottom: parseInt(e.target.value) || 3
                          }
                        })
                      }
                      className="h-8 text-xs text-center"
                      min="0"
                      placeholder="bottom"
                    />
                  </div>
                  <span className="text-xs text-gray-500">y</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-600">전체 화면 버튼 위치 (px):</span>
                <div className="flex gap-2 mt-1 items-center">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={settings.재생기본값?.playerControlButtonPositionFullscreen?.left ?? 41}
                      onChange={(e) =>
                        settingsUpdate.handleSettingChange('재생기본값', {
                          ...settings.재생기본값,
                          playerControlButtonPositionFullscreen: {
                            ...settings.재생기본값?.playerControlButtonPositionFullscreen,
                            left: parseInt(e.target.value) || 41
                          }
                        })
                      }
                      className="h-8 text-xs text-center"
                      min="0"
                      placeholder="left"
                    />
                  </div>
                  <span className="text-xs text-gray-500">x</span>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={settings.재생기본값?.playerControlButtonPositionFullscreen?.bottom ?? 8}
                      onChange={(e) =>
                        settingsUpdate.handleSettingChange('재생기본값', {
                          ...settings.재생기본값,
                          playerControlButtonPositionFullscreen: {
                            ...settings.재생기본값?.playerControlButtonPositionFullscreen,
                            bottom: parseInt(e.target.value) || 8
                          }
                        })
                      }
                      className="h-8 text-xs text-center"
                      min="0"
                      placeholder="bottom"
                    />
                  </div>
                  <span className="text-xs text-gray-500">y</span>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ButtonPositionSettings;
