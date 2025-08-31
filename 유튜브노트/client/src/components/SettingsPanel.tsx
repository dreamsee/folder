import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, RotateCcw } from "lucide-react";

export interface UISettings {
  상단부: {
    제목표시: boolean;
    부제목표시: boolean;
    부제목내용: string;
  };
  검색창: {
    유지: boolean;
  };
  재생컨트롤: {
    전체표시: boolean;
    볼륨: boolean;
    속도: boolean;
    도장: boolean;
    녹화: boolean;
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
  };
  프리셋: {
    최소모드명: string;
    노트모드명: string;
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
  const [selectedPreset, setSelectedPreset] = useState<"최소" | "노트" | null>(null);
  const 기본설정: UISettings = {
    상단부: { 제목표시: true, 부제목표시: true, 부제목내용: "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
    검색창: { 유지: true },
    재생컨트롤: { 전체표시: true, 볼륨: true, 속도: true, 도장: true, 녹화: true },
    노트영역: { 표시: true },
    화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙" },
    프리셋: { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
  };

  const 설정업데이트 = (카테고리: keyof UISettings, 키: string, 값: boolean | string) => {
    const 새설정 = { ...settings };
    (새설정[카테고리] as any)[키] = 값;
    onSettingsChange(새설정);
    // localStorage에 즉시 저장
    localStorage.setItem('uiSettings', JSON.stringify(새설정));
  };

  const 프리셋선택 = (프리셋: "최소" | "노트") => {
    setSelectedPreset(selectedPreset === 프리셋 ? null : 프리셋);
  };

  const 프리셋적용 = (프리셋: "최소" | "노트" | "전체" | "기본") => {
    let 새설정: UISettings;
    setSelectedPreset(null); // 적용 후 선택 해제
    
    switch (프리셋) {
      case "최소":
        새설정 = {
          상단부: { 제목표시: false, 부제목표시: false, 부제목내용: settings.상단부?.부제목내용 || "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
          검색창: { 유지: false },
          재생컨트롤: { 전체표시: false, 볼륨: false, 속도: false, 도장: false, 녹화: false },
          노트영역: { 표시: false },
          화면텍스트: { 패널표시: true, 좌표설정: false, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙" },
          프리셋: settings.프리셋 || { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
        };
        break;
      case "노트":
        새설정 = {
          상단부: { 제목표시: false, 부제목표시: false, 부제목내용: settings.상단부?.부제목내용 || "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
          검색창: { 유지: false },
          재생컨트롤: { 전체표시: true, 볼륨: true, 속도: true, 도장: false, 녹화: false },
          노트영역: { 표시: true },
          화면텍스트: { 패널표시: false, 좌표설정: false, 스타일설정: false, 빠른설정: false, 빠른설정위치: "정중앙" },
          프리셋: settings.프리셋 || { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
        };
        break;
      case "전체":
        새설정 = {
          상단부: { 제목표시: true, 부제목표시: true, 부제목내용: settings.상단부?.부제목내용 || "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
          검색창: { 유지: true },
          재생컨트롤: { 전체표시: true, 볼륨: true, 속도: true, 도장: true, 녹화: true },
          노트영역: { 표시: true },
          화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙" },
          프리셋: settings.프리셋 || { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
        };
        break;
      default:
        새설정 = 기본설정;
    }
    
    onSettingsChange(새설정);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-30" 
        onClick={onClose}
      />
      
      {/* 설정 패널 */}
      <div className="relative w-80 h-full bg-white border-l shadow-lg overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">화면 설정</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 프리셋 버튼들 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium pb-2 border-b border-gray-200">빠른 설정</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={selectedPreset === "최소" ? "default" : "outline"} 
                size="sm" 
                onClick={() => 프리셋선택("최소")}
              >
                {settings.프리셋?.최소모드명 || "최소 모드"}
              </Button>
              <Button 
                variant={selectedPreset === "노트" ? "default" : "outline"} 
                size="sm" 
                onClick={() => 프리셋선택("노트")}
              >
                {settings.프리셋?.노트모드명 || "노트 모드"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => 프리셋적용("전체")}>
                전체 모드
              </Button>
              <Button variant="outline" size="sm" onClick={() => 프리셋적용("기본")}>
                <RotateCcw className="h-3 w-3 mr-1" />
                초기화
              </Button>
            </div>

            {/* 선택된 프리셋 편집 */}
            {selectedPreset && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-blue-800">모드 이름:</span>
                    <Input
                      value={selectedPreset === "최소" 
                        ? (settings.프리셋?.최소모드명 || "최소 모드")
                        : (settings.프리셋?.노트모드명 || "노트 모드")
                      }
                      onChange={(e) => 설정업데이트("프리셋", 
                        selectedPreset === "최소" ? "최소모드명" : "노트모드명", 
                        e.target.value
                      )}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-blue-800">이 모드의 설정값:</span>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {selectedPreset === "최소" ? (
                        <>
                          <div className="flex justify-between"><span>상단부:</span><span className="text-red-600">숨김</span></div>
                          <div className="flex justify-between"><span>검색창:</span><span className="text-red-600">검색 후 숨김</span></div>
                          <div className="flex justify-between"><span>재생컨트롤:</span><span className="text-red-600">숨김</span></div>
                          <div className="flex justify-between"><span>노트영역:</span><span className="text-red-600">숨김</span></div>
                          <div className="flex justify-between"><span>화면텍스트:</span><span className="text-green-600">표시 (스타일설정만)</span></div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between"><span>상단부:</span><span className="text-red-600">숨김</span></div>
                          <div className="flex justify-between"><span>검색창:</span><span className="text-red-600">검색 후 숨김</span></div>
                          <div className="flex justify-between"><span>재생컨트롤:</span><span className="text-green-600">표시 (볼륨/속도만)</span></div>
                          <div className="flex justify-between"><span>노트영역:</span><span className="text-green-600">표시</span></div>
                          <div className="flex justify-between"><span>화면텍스트:</span><span className="text-red-600">숨김</span></div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => 프리셋적용(selectedPreset)} className="flex-1">
                      이 설정 적용
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedPreset(null)}>
                      취소
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 상단부 설정 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium pb-2">상단부</h3>
            <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">제목 표시</span>
                <Switch
                  checked={settings.상단부.제목표시}
                  onCheckedChange={(값) => 설정업데이트("상단부", "제목표시", 값)}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">부제목 표시</span>
                <Switch
                  checked={settings.상단부.부제목표시}
                  onCheckedChange={(값) => 설정업데이트("상단부", "부제목표시", 값)}
                />
              </div>
              {settings.상단부.부제목표시 && (
                <div className="ml-4">
                  <span className="text-xs text-gray-600">부제목 내용:</span>
                  <Input
                    value={settings.상단부.부제목내용 || "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요"}
                    onChange={(e) => 설정업데이트("상단부", "부제목내용", e.target.value)}
                    className="mt-1 text-xs"
                    placeholder="부제목을 입력하세요"
                  />
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm">검색창 유지</span>
                  <span className="text-xs text-gray-500">
                    {settings.검색창?.유지 ? "검색 후에도 계속 표시" : "검색 후 1초 뒤 자동 숨김"}
                  </span>
                </div>
                <Switch
                  checked={settings.검색창?.유지 ?? true}
                  onCheckedChange={(값) => 설정업데이트("검색창", "유지", 값)}
                />
              </div>
            </div>
          </div>

          {/* 재생 컨트롤 설정 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-sm font-medium">재생 컨트롤</h3>
              <Switch
                checked={settings.재생컨트롤.전체표시}
                onCheckedChange={(값) => 설정업데이트("재생컨트롤", "전체표시", 값)}
              />
            </div>
            {settings.재생컨트롤.전체표시 && (
              <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">볼륨</span>
                  <Switch
                    checked={settings.재생컨트롤.볼륨}
                    onCheckedChange={(값) => 설정업데이트("재생컨트롤", "볼륨", 값)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">속도</span>
                  <Switch
                    checked={settings.재생컨트롤.속도}
                    onCheckedChange={(값) => 설정업데이트("재생컨트롤", "속도", 값)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">도장</span>
                  <Switch
                    checked={settings.재생컨트롤.도장}
                    onCheckedChange={(값) => 설정업데이트("재생컨트롤", "도장", 값)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">녹화</span>
                  <Switch
                    checked={settings.재생컨트롤.녹화}
                    onCheckedChange={(값) => 설정업데이트("재생컨트롤", "녹화", 값)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 노트 영역 설정 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-sm font-medium">노트 영역</h3>
              <div 
                className="touch-manipulation" 
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Switch
                  checked={settings.노트영역.표시}
                  onCheckedChange={(값) => 설정업데이트("노트영역", "표시", 값)}
                />
              </div>
            </div>
          </div>

          {/* 화면 텍스트 설정 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-sm font-medium">화면 텍스트</h3>
              <div 
                className="touch-manipulation" 
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Switch
                  checked={settings.화면텍스트.패널표시}
                  onCheckedChange={(값) => 설정업데이트("화면텍스트", "패널표시", 값)}
                />
              </div>
            </div>
            {settings.화면텍스트.패널표시 && (
              <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">좌표 설정</span>
                  <Switch
                    checked={settings.화면텍스트.좌표설정}
                    onCheckedChange={(값) => 설정업데이트("화면텍스트", "좌표설정", 값)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">빠른 설정</span>
                  <Switch
                    checked={settings.화면텍스트.빠른설정}
                    onCheckedChange={(값) => 설정업데이트("화면텍스트", "빠른설정", 값)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">스타일 설정</span>
                  <Switch
                    checked={settings.화면텍스트.스타일설정}
                    onCheckedChange={(값) => 설정업데이트("화면텍스트", "스타일설정", 값)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </div>
  );
};

export default SettingsPanel;