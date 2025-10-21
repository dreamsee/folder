import { useCallback } from "react";
import { UISettings } from "@/components/SettingsPanel";

interface UseSettingsUpdateProps {
  settings: UISettings;
  onSettingsChange: (settings: UISettings) => void;
  getActivePreset: () => "최소" | "노트" | null;
  savePresetSettings: (preset: "최소" | "노트", settings: UISettings) => void;
}

export const useSettingsUpdate = ({
  settings,
  onSettingsChange,
  getActivePreset,
  savePresetSettings,
}: UseSettingsUpdateProps) => {

  // 설정 업데이트 (개별 키-값 업데이트)
  const 설정업데이트 = useCallback((
    카테고리: keyof UISettings,
    키: string,
    값: boolean | string | number,
    저장여부: boolean = false
  ) => {
    const 새설정 = { ...settings };
    (새설정[카테고리] as any)[키] = 값;
    onSettingsChange(새설정);

    // 저장여부가 true일 때만 localStorage에 저장
    if (저장여부) {
      localStorage.setItem('uiSettings', JSON.stringify(새설정));
    }

    // 현재 활성화된 프리셋이 있으면 해당 프리셋에도 저장
    const activePreset = getActivePreset();
    if (activePreset) {
      savePresetSettings(activePreset, 새설정);
    }
  }, [settings, onSettingsChange, getActivePreset, savePresetSettings]);

  // 설정 변경 (전체 카테고리 업데이트)
  const handleSettingChange = useCallback((카테고리: keyof UISettings, 값: any) => {
    const 새설정 = { ...settings };
    새설정[카테고리] = 값;
    onSettingsChange(새설정);
    localStorage.setItem('uiSettings', JSON.stringify(새설정));

    // 현재 활성화된 프리셋이 있으면 해당 프리셋에도 저장
    const activePreset = getActivePreset();
    if (activePreset) {
      savePresetSettings(activePreset, 새설정);
    }
  }, [settings, onSettingsChange, getActivePreset, savePresetSettings]);

  return {
    설정업데이트,
    handleSettingChange,
  };
};
