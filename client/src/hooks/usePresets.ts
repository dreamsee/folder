import { useState, useEffect, useCallback } from "react";
import { UISettings } from "@/components/SettingsPanel";

interface UsePresetsProps {
  settings: UISettings;
  onSettingsChange: (settings: UISettings) => void;
}

export const usePresets = ({
  settings,
  onSettingsChange,
}: UsePresetsProps) => {
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

  // 컴포넌트 마운트시 localStorage에서 프리셋 데이터 로드
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
  }, []);

  // 프리셋 상태 변경시 로컬스토리지에 저장
  const updatePresetStates = useCallback((newStates: { 최소: boolean; 노트: boolean }) => {
    setPresetStates(newStates);
    localStorage.setItem('presetToggleStates', JSON.stringify(newStates));
  }, []);

  // 각 모드별 설정값 저장
  const savePresetSettings = useCallback((preset: "최소" | "노트", settings: UISettings) => {
    setPresetSettings(prev => {
      const newPresetSettings = { ...prev };
      newPresetSettings[preset] = settings;
      localStorage.setItem('presetSettings', JSON.stringify(newPresetSettings));
      return newPresetSettings;
    });
  }, []);

  // 각 모드별 설정값 로드
  const loadPresetSettings = useCallback((preset: "최소" | "노트"): UISettings | null => {
    return presetSettings[preset];
  }, [presetSettings]);

  // 프리셋 적용
  const 프리셋적용 = useCallback((프리셋: "최소" | "노트" | "전체" | "기본") => {
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
          상단부: { 제목표시: true, 제목내용: settings.상단부?.제목내용 || "유튜브 노트", 부제목내용: settings.상단부?.부제목내용 || "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
          검색창: { 유지: true, 목록유지: settings.검색창?.목록유지 ?? false },
          바설정: { 커스텀바: true, 챕터바: true, 챕터바개수: 3 },
          재생컨트롤: { 전체표시: true, 플레이어내장: false, 볼륨: true, 속도: true, 도장: true, 편집: true },
          왼쪽탭레이아웃: settings.왼쪽탭레이아웃 || { 사용: false },
          노트영역: { 표시: true },
          화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙", 지속시간: true, 글자크기여백: true, 색상설정: true, 배경투명도: true },
          프리셋: settings.프리셋 || { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
          재생기본값: settings.재생기본값 || { defaultPlaybackRate: 1, defaultVolume: 100 },
        };
        break;
      case "기본":
        새설정 = {
          상단부: { 제목표시: true, 제목내용: "유튜브 노트", 부제목내용: "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
          검색창: { 유지: true, 목록유지: false },
          바설정: { 커스텀바: true, 챕터바: true, 챕터바개수: 3 },
          재생컨트롤: { 전체표시: true, 플레이어내장: false, 볼륨: true, 속도: true, 도장: true, 편집: true },
          왼쪽탭레이아웃: { 사용: false },
          노트영역: { 표시: true },
          화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙", 지속시간: true, 글자크기여백: true, 색상설정: true, 배경투명도: true },
          프리셋: { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
          재생기본값: { defaultPlaybackRate: 1, defaultVolume: 100 },
        };
        break;
      default:
        return;
    }

    onSettingsChange(새설정);
    localStorage.setItem('uiSettings', JSON.stringify(새설정));
  }, [settings, onSettingsChange, loadPresetSettings, savePresetSettings]);

  // 프리셋 선택
  const 프리셋선택 = useCallback((프리셋: "최소" | "노트") => {
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
  }, [presetStates, settings, updatePresetStates, savePresetSettings, 프리셋적용]);

  // 현재 활성화된 프리셋 가져오기
  const getActivePreset = useCallback((): "최소" | "노트" | null => {
    return presetStates.최소 ? "최소" : presetStates.노트 ? "노트" : null;
  }, [presetStates]);

  return {
    selectedPreset,
    setSelectedPreset,
    presetStates,
    tempPresetName,
    setTempPresetName,
    프리셋선택,
    프리셋적용,
    savePresetSettings,
    getActivePreset,
  };
};
