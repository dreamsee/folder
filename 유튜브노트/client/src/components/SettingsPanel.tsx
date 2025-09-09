import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, RotateCcw, Edit3 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface UISettings {
  상단부: {
    제목표시: boolean;
    부제목표시: boolean;
    부제목내용: string;
  };
  검색창: {
    유지: boolean;
  };
  바설정: {
    커스텀바: boolean;
    챕터바: boolean;
  };
  재생컨트롤: {
    전체표시: boolean;
    볼륨: boolean;
    속도: boolean;
    녹화: boolean;
    도장: boolean;
    편집: boolean;
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
  };
  프리셋: {
    최소모드명: string;
    노트모드명: string;
  };
  재생기본값?: {
    defaultPlaybackRate: number;
    defaultVolume: number;
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
  const [presetStates, setPresetStates] = useState<{ 최소: boolean; 노트: boolean }>({
    최소: false,
    노트: false
  });

  // 각 모드별 저장된 설정값
  const [presetSettings, setPresetSettings] = useState<{
    최소: UISettings | null;
    노트: UISettings | null;
  }>({
    최소: null,
    노트: null
  });
  
  // 임시 편집 상태
  const [tempPresetName, setTempPresetName] = useState<string>("");
  
  // 커스텀 속도값 관리
  const [customSpeeds, setCustomSpeeds] = useState<number[]>([0.5, 0.75, 1.25, 1.5, 1.75]);
  const [isEditingSpeeds, setIsEditingSpeeds] = useState<boolean>(false);
  const [tempSpeedValues, setTempSpeedValues] = useState<string[]>(["0.5", "0.75", "1.25", "1.5", "1.75"]);
  // 컴포넌트 마운트시 localStorage에서 모든 프리셋 데이터 로드
  useEffect(() => {
    // 프리셋 토글 상태 로드
    const savedPresetStates = localStorage.getItem('presetToggleStates');
    if (savedPresetStates) {
      try {
        const states = JSON.parse(savedPresetStates);
        setPresetStates(states);
      } catch (error) {
        console.error('프리셋 상태 로드 실패:', error);
      }
    }

    // 각 모드별 설정값 로드
    const savedPresetSettings = localStorage.getItem('presetSettings');
    if (savedPresetSettings) {
      try {
        const settings = JSON.parse(savedPresetSettings);
        setPresetSettings(settings);
      } catch (error) {
        console.error('프리셋 설정 로드 실패:', error);
      }
    }

    // 커스텀 속도값 로드
    const savedCustomSpeeds = localStorage.getItem('customPlaybackSpeeds');
    if (savedCustomSpeeds) {
      try {
        const speeds = JSON.parse(savedCustomSpeeds);
        setCustomSpeeds(speeds);
        setTempSpeedValues(speeds.map(s => s.toString()));
      } catch (error) {
        console.error('커스텀 속도값 로드 실패:', error);
      }
    }
  }, []); // 마운트시 한 번만 실행

  // 프리셋 상태 변경시 로컬스토리지에 저장
  const updatePresetStates = (newStates: { 최소: boolean; 노트: boolean }) => {
    setPresetStates(newStates);
    localStorage.setItem('presetToggleStates', JSON.stringify(newStates));
  };

  // 각 모드별 설정값 저장
  const savePresetSettings = (preset: "최소" | "노트", settings: UISettings) => {
    const newPresetSettings = { ...presetSettings };
    newPresetSettings[preset] = settings;
    setPresetSettings(newPresetSettings);
    localStorage.setItem('presetSettings', JSON.stringify(newPresetSettings));
  };

  // 각 모드별 설정값 로드
  const loadPresetSettings = (preset: "최소" | "노트"): UISettings | null => {
    return presetSettings[preset];
  };

  // 커스텀 속도값 저장
  const saveCustomSpeeds = (speeds: number[]) => {
    setCustomSpeeds(speeds);
    localStorage.setItem('customPlaybackSpeeds', JSON.stringify(speeds));
  };

  // 속도 편집 시작
  const startEditingSpeeds = () => {
    setIsEditingSpeeds(true);
    setTempSpeedValues(customSpeeds.map(s => s.toString()));
  };

  // 속도 편집 완료
  const finishEditingSpeeds = () => {
    const newSpeeds = tempSpeedValues.map(value => {
      const speed = parseFloat(value);
      if (!isNaN(speed) && speed > 0 && speed <= 5) {
        return Math.round(speed * 20) / 20; // 0.05 단위로 반올림
      }
      return 1; // 기본값
    }).sort((a, b) => a - b); // 오름차순 정렬 (낮은 숫자 → 높은 숫자)
    
    saveCustomSpeeds(newSpeeds);
    setIsEditingSpeeds(false);
  };

  // 속도 편집 취소
  const cancelEditingSpeeds = () => {
    setIsEditingSpeeds(false);
    setTempSpeedValues(customSpeeds.map(s => s.toString()));
  };

  // 임시 속도값 업데이트
  const updateTempSpeedValue = (index: number, value: string) => {
    const newValues = [...tempSpeedValues];
    newValues[index] = value;
    setTempSpeedValues(newValues);
  };

  // 마우스 휠로 속도값 조정
  const handleSpeedWheel = (index: number, event: React.WheelEvent) => {
    event.preventDefault();
    const currentValue = parseFloat(tempSpeedValues[index]) || 0;
    const delta = event.deltaY > 0 ? -0.05 : 0.05; // 휠 아래: 감소, 휠 위: 증가
    const newValue = Math.max(0.05, Math.min(5, currentValue + delta));
    const roundedValue = Math.round(newValue * 20) / 20; // 0.05 단위로 반올림
    updateTempSpeedValue(index, roundedValue.toString());
  };

  const 기본설정: UISettings = {
    상단부: { 제목표시: true, 부제목표시: true, 부제목내용: "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
    검색창: { 유지: true },
    바설정: { 커스텀바: true, 챕터바: true },
    재생컨트롤: { 전체표시: true, 볼륨: true, 속도: true, 녹화: true, 도장: true, 편집: true },
    노트영역: { 표시: true },
    화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙", 지속시간: true, 글자크기여백: true, 색상설정: true, 배경투명도: true },
    프리셋: { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
    재생기본값: { defaultPlaybackRate: 1, defaultVolume: 100 },
  };

  const 설정업데이트 = (카테고리: keyof UISettings, 키: string, 값: boolean | string, 저장여부: boolean = false) => {
    const 새설정 = { ...settings };
    (새설정[카테고리] as any)[키] = 값;
    onSettingsChange(새설정);
    // 저장여부가 true일 때만 localStorage에 저장
    if (저장여부) {
      localStorage.setItem('uiSettings', JSON.stringify(새설정));
    }
  };

  const handleSettingChange = (카테고리: keyof UISettings, 값: any) => {
    const 새설정 = { ...settings };
    새설정[카테고리] = 값;
    onSettingsChange(새설정);
    localStorage.setItem('uiSettings', JSON.stringify(새설정));
  };

  const 프리셋선택 = (프리셋: "최소" | "노트") => {
    // 토글 상태 변경
    const isCurrentlyActive = presetStates[프리셋];
    const newStates = {
      최소: 프리셋 === "최소" ? !isCurrentlyActive : false,
      노트: 프리셋 === "노트" ? !isCurrentlyActive : false
    };
    
    updatePresetStates(newStates);
    
    // 편집 패널 토글 - 토글 상태와 연동
    if (newStates[프리셋]) {
      // 모드 켜기: 편집 패널 열고 현재 이름을 임시 상태에 저장
      setSelectedPreset(프리셋);
      const currentName = 프리셋 === "최소" 
        ? (settings.프리셋?.최소모드명 || "최소 모드")
        : (settings.프리셋?.노트모드명 || "노트 모드");
      setTempPresetName(currentName);
      // 프리셋적용 함수 사용
      프리셋적용(프리셋);
    } else {
      // 토글 off시: 편집 패널 닫고 현재 설정을 해당 모드에 저장하고 전체 모드로 전환
      setSelectedPreset(null);
      setTempPresetName("");
      savePresetSettings(프리셋, settings);
      프리셋적용("전체");
    }
  };

  const 프리셋적용 = (프리셋: "최소" | "노트" | "전체" | "기본") => {
    let 새설정: UISettings;
    
    switch (프리셋) {
      case "최소":
      case "노트":
        // 프리셋 모드: 저장된 설정이 있으면 로드, 없으면 현재 설정 유지
        const savedSettings = loadPresetSettings(프리셋);
        if (savedSettings) {
          새설정 = savedSettings;
        } else {
          // 첫 사용시 현재 설정을 해당 모드 설정으로 저장하고 사용
          새설정 = { ...settings };
          savePresetSettings(프리셋, 새설정);
        }
        break;
      case "전체":
        새설정 = {
          상단부: { 제목표시: true, 부제목표시: true, 부제목내용: settings.상단부?.부제목내용 || "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
          검색창: { 유지: true },
          바설정: { 커스텀바: true, 챕터바: true },
          재생컨트롤: { 전체표시: true, 볼륨: true, 속도: true, 녹화: true, 도장: true, 편집: true },
          노트영역: { 표시: true },
          화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙", 지속시간: true, 글자크기여백: true, 색상설정: true, 배경투명도: true },
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
              <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={presetStates.최소 ? "default" : "outline"} 
                size="sm" 
                onClick={() => 프리셋선택("최소")}
                className={presetStates.최소 ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {presetStates.최소 ? "✓ " : ""}{settings.프리셋?.최소모드명 || "최소 모드"}
              </Button>
              <Button 
                variant={presetStates.노트 ? "default" : "outline"} 
                size="sm" 
                onClick={() => 프리셋선택("노트")}
                className={presetStates.노트 ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {presetStates.노트 ? "✓ " : ""}{settings.프리셋?.노트모드명 || "노트 모드"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                updatePresetStates({ 최소: false, 노트: false });
                setSelectedPreset(null);
                setTempPresetName("");
                프리셋적용("전체");
              }}>
                전체 모드
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                updatePresetStates({ 최소: false, 노트: false });
                setSelectedPreset(null);
                setTempPresetName("");
                프리셋적용("기본");
              }}>
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
                      value={tempPresetName}
                      onChange={(e) => setTempPresetName(e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                  
                  
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      // 임시 이름을 실제 설정에 저장하고 localStorage에도 저장
                      if (selectedPreset) {
                        설정업데이트("프리셋",
                          selectedPreset === "최소" ? "최소모드명" : "노트모드명",
                          tempPresetName,
                          true  // localStorage에 저장
                        );
                        // 현재 토글 상태도 localStorage에 저장
                        localStorage.setItem('presetToggleStates', JSON.stringify(presetStates));
                        // 프리셋 재적용 제거 - 현재 설정 유지 (이름과 토글 상태 저장)
                        setSelectedPreset(null);
                      }
                    }} className="flex-1 bg-emerald-200 hover:bg-emerald-300 text-emerald-800">
                      이름 적용
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
            
            {/* 재생 기본값 탭 */}
            <TabsContent value="playback-defaults" className="space-y-4 mt-4">
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
                        onClick={() => handleSettingChange('재생기본값', {
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
                        onClick={() => handleSettingChange('재생기본값', {
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
                        onClick={() => handleSettingChange('재생기본값', {
                          ...settings.재생기본값,
                          defaultPlaybackRate: 2
                        })}
                      >
                        2x
                      </Button>
                    </div>
                    
                    {/* 편집 가능한 속도 옵션 */}
                    {!isEditingSpeeds ? (
                      <div className="flex gap-1">
                        {/* 5개 속도 버튼 */}
                        {customSpeeds.map((speed, index) => (
                          <Button
                            key={index}
                            variant={settings.재생기본값?.defaultPlaybackRate === speed ? "default" : "outline"}
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleSettingChange('재생기본값', {
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
                          onClick={startEditingSpeeds}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* 편집 모드 - 5개 입력창 */}
                        <div className="flex gap-1">
                          {tempSpeedValues.map((value, index) => (
                            <Input
                              key={index}
                              value={value}
                              onChange={(e) => updateTempSpeedValue(index, e.target.value)}
                              onWheel={(e) => handleSpeedWheel(index, e)}
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
                            onClick={finishEditingSpeeds}
                          >
                            적용
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={cancelEditingSpeeds}
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
                      handleSettingChange('재생기본값', {
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

                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  💡 이 설정은 새로 재생하는 모든 영상에 자동으로 적용됩니다.
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
                  <span className="text-sm">{settings.검색창?.유지 ? "검색창 유지" : "팝업창 모드"}</span>
                  <span className="text-xs text-gray-500">
                    {settings.검색창?.유지 ? "" : "상단에 검색 아이콘"}
                  </span>
                </div>
                <Switch
                  checked={settings.검색창?.유지 ?? true}
                  onCheckedChange={(값) => 설정업데이트("검색창", "유지", 값)}
                />
              </div>
            </div>
          </div>

          {/* 바 설정 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium pb-2">바 설정</h3>
            <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm">커스텀 바</span>
                  <span className="text-xs text-gray-500">타임스탬프 하이라이트가 포함된 진행바</span>
                </div>
                <Switch
                  checked={settings.바설정?.커스텀바 ?? true}
                  onCheckedChange={(값) => handleSettingChange("바설정", {
                    ...settings.바설정,
                    커스텀바: 값
                  })}
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm">챕터 바</span>
                  <span className="text-xs text-gray-500">영상의 챕터별 구간을 표시하는 바</span>
                </div>
                <Switch
                  checked={settings.바설정?.챕터바 ?? true}
                  onCheckedChange={(값) => handleSettingChange("바설정", {
                    ...settings.바설정,
                    챕터바: 값
                  })}
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
              <div className="bg-gray-50/30 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-around items-start">
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium" style={{ color: '#3B82F6' }}>볼륨</span>
                    <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                      <Switch
                        checked={settings.재생컨트롤.볼륨}
                        onCheckedChange={(값) => 설정업데이트("재생컨트롤", "볼륨", 값)}
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
                        onCheckedChange={(값) => 설정업데이트("재생컨트롤", "속도", 값)}
                        style={{ 
                          backgroundColor: settings.재생컨트롤.속도 ? '#10B981' : '#E5E7EB'
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium" style={{ color: '#EF4444' }}>녹화</span>
                    <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                      <Switch
                        checked={settings.재생컨트롤.녹화}
                        onCheckedChange={(값) => 설정업데이트("재생컨트롤", "녹화", 값)}
                        style={{ 
                          backgroundColor: settings.재생컨트롤.녹화 ? '#EF4444' : '#E5E7EB'
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-sm font-medium" style={{ color: '#8B5CF6' }}>도장</span>
                    <div style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}>
                      <Switch
                        checked={settings.재생컨트롤.도장}
                        onCheckedChange={(값) => 설정업데이트("재생컨트롤", "도장", 값)}
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
                        onCheckedChange={(값) => 설정업데이트("재생컨트롤", "편집", 값)}
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
                {settings.화면텍스트.스타일설정 && (
                  <div className="ml-4 space-y-2 border-l-2 border-gray-300 pl-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">지속시간</span>
                      <Switch
                        checked={settings.화면텍스트.지속시간 !== false}
                        onCheckedChange={(값) => 설정업데이트("화면텍스트", "지속시간", 값)}
                        className="scale-90"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">글자크기, 여백</span>
                      <Switch
                        checked={settings.화면텍스트.글자크기여백 !== false}
                        onCheckedChange={(값) => 설정업데이트("화면텍스트", "글자크기여백", 값)}
                        className="scale-90"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">글자 색상, 배경 색상</span>
                      <Switch
                        checked={settings.화면텍스트.색상설정 !== false}
                        onCheckedChange={(값) => 설정업데이트("화면텍스트", "색상설정", 값)}
                        className="scale-90"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">배경 투명도</span>
                      <Switch
                        checked={settings.화면텍스트.배경투명도 !== false}
                        onCheckedChange={(값) => 설정업데이트("화면텍스트", "배경투명도", 값)}
                        className="scale-90"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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