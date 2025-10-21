import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw } from "lucide-react";

interface PresetManagerProps {
  settings: any;
  presets: any;
  settingsUpdate: any;
}

const PresetManager: React.FC<PresetManagerProps> = ({
  settings,
  presets,
  settingsUpdate,
}) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={presets.presetStates.최소 ? "default" : "outline"}
          size="sm"
          onClick={() => presets.프리셋선택("최소")}
          className={presets.presetStates.최소 ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          {presets.presetStates.최소 ? "✓ " : ""}{settings.프리셋?.최소모드명 || "최소 모드"}
        </Button>
        <Button
          variant={presets.presetStates.노트 ? "default" : "outline"}
          size="sm"
          onClick={() => presets.프리셋선택("노트")}
          className={presets.presetStates.노트 ? "bg-green-500 hover:bg-green-600" : ""}
        >
          {presets.presetStates.노트 ? "✓ " : ""}{settings.프리셋?.노트모드명 || "노트 모드"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          presets.setSelectedPreset(null);
          presets.setTempPresetName("");
          presets.프리셋적용("전체");
        }}>
          전체 모드
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          presets.setSelectedPreset(null);
          presets.setTempPresetName("");
          presets.프리셋적용("기본");
        }}>
          <RotateCcw className="h-3 w-3 mr-1" />
          초기화
        </Button>
      </div>

      {/* 선택된 프리셋 편집 */}
      {presets.selectedPreset && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-800">모드 이름:</span>
              <Input
                value={presets.tempPresetName}
                onChange={(e) => presets.setTempPresetName(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                // 임시 이름을 실제 설정에 저장하고 localStorage에도 저장
                if (presets.selectedPreset) {
                  settingsUpdate.settingsUpdate.설정업데이트("프리셋",
                    presets.selectedPreset === "최소" ? "최소모드명" : "노트모드명",
                    presets.tempPresetName,
                    true  // localStorage에 저장
                  );
                  // 현재 토글 상태도 localStorage에 저장
                  localStorage.setItem('presetToggleStates', JSON.stringify(presets.presetStates));
                  // 프리셋 재적용 제거 - 현재 설정 유지 (이름과 토글 상태 저장)
                  presets.setSelectedPreset(null);
                }
              }} className="flex-1 bg-emerald-200 hover:bg-emerald-300 text-emerald-800">
                이름 적용
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PresetManager;
