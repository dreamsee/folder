import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresets } from "@/hooks/usePresets";
import { useCustomSpeeds } from "@/hooks/useCustomSpeeds";
import { useSettingsUpdate } from "@/hooks/useSettingsUpdate";
import PlaybackDefaults from "@/components/settings/PlaybackDefaults";
import PresetManager from "@/components/settings/PresetManager";

export interface UISettings {
  상단부: {
    제목표시: boolean;
    제목내용: string;
    부제목내용: string;
  };
  검색창: {
    유지: boolean;
    목록유지?: boolean;
  };
  바설정: {
    커스텀바: boolean;
    챕터바: boolean;
    챕터바개수?: number;
  };
  재생컨트롤: {
    전체표시: boolean;
    플레이어내장: boolean;
    볼륨: boolean;
    속도: boolean;
    도장: boolean;
    편집: boolean;
  };
  왼쪽탭레이아웃: {
    사용: boolean;
  };
  노트영역: {
    표시: boolean;
  };
  화면텍스트: {
    패널표시: boolean;
    좌표설정: boolean;
    스타일설정: boolean;
    빠른설정: boolean;
    빠른설정위치: string;
    지속시간: boolean;
    글자크기여백: boolean;
    색상설정: boolean;
    배경투명도: boolean;
    정지시YouTube숨김?: boolean;
  };
  프리셋: {
    최소모드명: string;
    노트모드명: string;
  };
  재생기본값?: {
    defaultPlaybackRate: number;
    defaultVolume: number;
    fullscreenButtonVisible?: boolean;
    fullscreenButtonPosition?: {
      bottom: number;
      right: number;
    };
    fullscreenButtonPositionFullscreen?: {
      bottom: number;
      right: number;
    };
    commentButtonVisible?: boolean;
    commentButtonPosition?: {
      bottom: number;
      right: number;
    };
    playerControlButtonVisible?: boolean;
    playerControlButtonPosition?: {
      bottom: number;
      left: number;
    };
    playerControlButtonPositionFullscreen?: {
      bottom: number;
      left: number;
    };
  };
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UISettings;
  onSettingsChange: (settings: UISettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  // 프리셋 관리 훅
  const presets = usePresets({
    settings,
    onSettingsChange,
  });

  // 커스텀 속도 관리 훅
  const speeds = useCustomSpeeds();

  // 설정 업데이트 훅
  const settingsUpdate = useSettingsUpdate({
    settings,
    onSettingsChange,
    getActivePreset: presets.getActivePreset,
    savePresetSettings: presets.savePresetSettings,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30" 
        onClick={onClose}
      />
      
      {/* 설정 패널 */}
      <div className="relative w-80 h-full bg-white border-l shadow-lg flex flex-col">
        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto">
          <CardContent className="space-y-6 pt-6">
          {/* 탭 메뉴 */}
          <Tabs defaultValue="quick-settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick-settings">빠른 설정</TabsTrigger>
              <TabsTrigger value="playback-defaults">재생 기본값</TabsTrigger>
            </TabsList>
            
            {/* 빠른 설정 탭 */}
            <TabsContent value="quick-settings" className="space-y-2 mt-4">
              <PresetManager
                settings={settings}
                presets={presets}
                settingsUpdate={settingsUpdate}
              />

              {/* 상단부 설정 */}
              <div className="space-y-3 mt-4">
                <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">제목 표시</span>
                    <Switch
                      checked={settings.상단부.제목표시}
                      onCheckedChange={(값) => settingsUpdate.설정업데이트("상단부", "제목표시", 값)}
                    />
                  </div>
                  {settings.상단부.제목표시 && (
                    <div className="ml-4 space-y-2">
                      <div>
                        <span className="text-xs text-gray-600">제목 내용:</span>
                        <Input
                          value={settings.상단부.제목내용 || "유튜브 노트"}
                          onChange={(e) => settingsUpdate.설정업데이트("상단부", "제목내용", e.target.value)}
                          className="mt-1 text-xs"
                          placeholder="제목을 입력하세요"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">부제목 내용:</span>
                        <Input
                          value={settings.상단부.부제목내용 || "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요"}
                          onChange={(e) => settingsUpdate.설정업데이트("상단부", "부제목내용", e.target.value)}
                          className="mt-1 text-xs"
                          placeholder="부제목을 입력하세요"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm">{settings.검색창?.유지 ? "검색창 유지" : "팝업창 모드"}</span>
                      <span className="text-xs text-gray-500">
                        {settings.검색창?.유지 ? "" : "상단에 검색 아이콘"}
                      </span>
                    </div>
                    <Switch
                      checked={settings.검색창?.유지 ?? true}
                      onCheckedChange={(값) => settingsUpdate.설정업데이트("검색창", "유지", 값)}
                    />
                  </div>
                  {settings.검색창?.유지 && (
                    <div className="ml-6 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">검색_목록 유지</span>
                      </div>
                      <Switch
                        checked={settings.검색창?.목록유지 ?? false}
                        onCheckedChange={(값) => settingsUpdate.설정업데이트("검색창", "목록유지", 값)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 바 설정 */}
              <div className="space-y-3">
                <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm">커스텀 바</span>
                      <span className="text-xs text-gray-500">타임스탬프 하이라이트 표시</span>
                    </div>
                    <Switch
                      checked={settings.바설정?.커스텀바 ?? true}
                      onCheckedChange={(값) => settingsUpdate.handleSettingChange("바설정", {
                        ...settings.바설정,
                        커스텀바: 값
                      })}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-sm">챕터 바</span>
                      <span className="text-xs text-gray-500">챕터구간 표시</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={settings.바설정?.챕터바개수 ?? ''}
                        onChange={(e) => {
                          const 입력값 = e.target.value;
                          if (입력값 === '') {
                            settingsUpdate.handleSettingChange("바설정", {
                              ...settings.바설정,
                              챕터바개수: ''
                            });
                          } else {
                            const 값 = parseInt(입력값);
                            if (!isNaN(값)) {
                              settingsUpdate.handleSettingChange("바설정", {
                                ...settings.바설정,
                                챕터바개수: 값
                              });
                            }
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            settingsUpdate.handleSettingChange("바설정", {
                              ...settings.바설정,
                              챕터바개수: 1
                            });
                          }
                        }}
                        className="w-16 h-8 text-sm text-center"
                        min={1}
                        max={9999999999}
                      />
                      <Switch
                        checked={settings.바설정?.챕터바 ?? true}
                        onCheckedChange={(값) => settingsUpdate.handleSettingChange("바설정", {
                          ...settings.바설정,
                          챕터바: 값
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 재생 컨트롤 설정 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium">
                      {settings.재생컨트롤.전체표시 ? "재생 컨트롤" : "플레이어 내장"}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {settings.재생컨트롤.전체표시 ? "(영상 건너뛰기)" : "버튼 클릭으로 컨트롤 표시"}
                    </span>
                  </div>
                  <Switch
                    checked={settings.재생컨트롤.전체표시}
                    onCheckedChange={(값) => settingsUpdate.설정업데이트("재생컨트롤", "전체표시", 값)}
                  />
                </div>

                {settings.재생컨트롤.전체표시 && (
                  <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-around items-start">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-sm font-medium" style={{ color: '#3B82F6' }}>볼륨</span>
                        <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                          <Switch
                            checked={settings.재생컨트롤.볼륨}
                            onCheckedChange={(값) => settingsUpdate.설정업데이트("재생컨트롤", "볼륨", 값)}
                            style={{
                              backgroundColor: settings.재생컨트롤.볼륨 ? '#3B82F6' : '#E5E7EB'
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-sm font-medium" style={{ color: '#10B981' }}>속도</span>
                        <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                          <Switch
                            checked={settings.재생컨트롤.속도}
                            onCheckedChange={(값) => settingsUpdate.설정업데이트("재생컨트롤", "속도", 값)}
                            style={{
                              backgroundColor: settings.재생컨트롤.속도 ? '#10B981' : '#E5E7EB'
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-sm font-medium" style={{ color: '#8B5CF6' }}>도장</span>
                        <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                          <Switch
                            checked={settings.재생컨트롤.도장}
                            onCheckedChange={(값) => settingsUpdate.설정업데이트("재생컨트롤", "도장", 값)}
                            style={{
                              backgroundColor: settings.재생컨트롤.도장 ? '#8B5CF6' : '#E5E7EB'
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-sm font-medium" style={{ color: '#F59E0B' }}>편집</span>
                        <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                          <Switch
                            checked={settings.재생컨트롤.편집}
                            onCheckedChange={(값) => settingsUpdate.설정업데이트("재생컨트롤", "편집", 값)}
                            style={{
                              backgroundColor: settings.재생컨트롤.편집 ? '#F59E0B' : '#E5E7EB'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 왼쪽 탭 레이아웃 설정 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm">왼쪽 탭</span>
                    <span className="text-xs text-gray-500">노트/화면글자/돋보기</span>
                  </div>
                  <Switch
                    checked={settings.왼쪽탭레이아웃?.사용 ?? false}
                    onCheckedChange={(값) => settingsUpdate.handleSettingChange("왼쪽탭레이아웃", {
                      ...settings.왼쪽탭레이아웃,
                      사용: 값
                    })}
                  />
                </div>

                {/* 노트/화면글자/돋보기 탭 그룹 */}
                <div className="space-y-3" id="content-tabs-section">
                  <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-1">
                    <Tabs defaultValue="노트" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 h-8">
                        <TabsTrigger
                          value="노트"
                          className="text-xs py-1 px-2"
                          onClick={() => {
                            setTimeout(() => {
                              const element = document.getElementById('content-tabs-section');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                        >
                          노트
                        </TabsTrigger>
                        <TabsTrigger
                          value="화면글자"
                          className="text-xs py-1 px-2"
                          onClick={() => {
                            setTimeout(() => {
                              const element = document.getElementById('content-tabs-section');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                        >
                          화면글자
                        </TabsTrigger>
                        <TabsTrigger
                          value="돋보기"
                          className="text-xs py-1 px-2"
                          onClick={() => {
                            setTimeout(() => {
                              const element = document.getElementById('content-tabs-section');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                        >
                          돋보기
                        </TabsTrigger>
                      </TabsList>

                    {/* 노트 탭 */}
                    <TabsContent value="노트" className="mt-3">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">노트 표시</h3>
                          <Switch
                            checked={settings.노트영역.표시}
                            onCheckedChange={(값) => settingsUpdate.설정업데이트("노트영역", "표시", 값)}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* 화면글자 탭 */}
                    <TabsContent value="화면글자" className="mt-3">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2">
                          <h3 className="text-sm font-medium">화면 글자 패널</h3>
                          <Switch
                            checked={settings.화면텍스트.패널표시}
                            onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "패널표시", 값)}
                          />
                        </div>
                        {settings.화면텍스트.패널표시 && (
                          <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">좌표 설정</span>
                              <Switch
                                checked={settings.화면텍스트.좌표설정}
                                onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "좌표설정", 값)}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">빠른 설정</span>
                              <Switch
                                checked={settings.화면텍스트.빠른설정}
                                onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "빠른설정", 값)}
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">스타일 설정</span>
                              <Switch
                                checked={settings.화면텍스트.스타일설정}
                                onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "스타일설정", 값)}
                              />
                            </div>
                            {settings.화면텍스트.스타일설정 && (
                              <div className="ml-4 space-y-2 border-l-2 border-gray-300 pl-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">글자크기, 여백</span>
                                  <Switch
                                    checked={settings.화면텍스트.글자크기여백 !== false}
                                    onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "글자크기여백", 값)}
                                    className="scale-90"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">글자 색상, 배경 색상</span>
                                  <Switch
                                    checked={settings.화면텍스트.색상설정 !== false}
                                    onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "색상설정", 값)}
                                    className="scale-90"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">배경 투명도</span>
                                  <Switch
                                    checked={settings.화면텍스트.배경투명도 !== false}
                                    onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "배경투명도", 값)}
                                    className="scale-90"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">지속시간</span>
                                  <Switch
                                    checked={settings.화면텍스트.지속시간 !== false}
                                    onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "지속시간", 값)}
                                    className="scale-90"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-3">
                              <div className="flex flex-col">
                                <span className="text-sm">정지 시 YouTube UI 숨김</span>
                                <span className="text-xs text-gray-500">일시정지 시 YouTube 오버레이 숨김</span>
                              </div>
                              <Switch
                                checked={settings.화면텍스트.정지시YouTube숨김 ?? false}
                                onCheckedChange={(값) => settingsUpdate.설정업데이트("화면텍스트", "정지시YouTube숨김", 값)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* 돋보기 탭 */}
                    <TabsContent value="돋보기" className="mt-3">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2">
                          <h3 className="text-sm font-medium">화면 확대 기능</h3>
                          <Switch
                            checked={false}
                            onCheckedChange={(값) => {
                              console.log("돋보기 기능:", 값);
                            }}
                          />
                        </div>
                        <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4">
                          <p className="text-xs text-gray-500 text-center">
                            화면 확대 기능이 준비 중입니다
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </div>
          </TabsContent>

            {/* 재생 기본값 탭 */}
            <TabsContent value="playback-defaults" className="space-y-4 mt-4">
              <PlaybackDefaults
                settings={settings}
                settingsUpdate={settingsUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        </div>
        
        {/* 하단 헤더 (제목 + 닫기 버튼) */}
        <div className="border-t bg-white">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">화면 설정</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;