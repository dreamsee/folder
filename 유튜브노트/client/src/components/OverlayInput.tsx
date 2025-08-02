import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plus, X, Edit2, Save, Type } from "lucide-react";
import { formatTime } from "@/lib/youtubeUtils";
import { OverlayData, OverlayPosition, PositionMode, Coordinates } from "./TextOverlay";
import CoordinateInput from "./CoordinateInput";

interface OverlayInputProps {
  player: any | null;
  isPlayerReady: boolean;
  overlays: OverlayData[];
  setOverlays: React.Dispatch<React.SetStateAction<OverlayData[]>>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

const OverlayInput: React.FC<OverlayInputProps> = ({
  player,
  isPlayerReady,
  overlays,
  setOverlays,
  showNotification,
}) => {
  const [overlayText, setOverlayText] = useState("");
  const [positionMode] = useState<PositionMode>("coordinate"); // 항상 좌표 모드로 고정
  const [coordinates, setCoordinates] = useState<Coordinates>({ x: 50, y: 90, unit: "%" });
  const [position] = useState<OverlayPosition>("bottom-center"); // 기본 위치
  const [duration, setDuration] = useState(5);
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("#000000");
  const [bgOpacity, setBgOpacity] = useState(80); // 0-100 퍼센트
  const [padding, setPadding] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 투명도를 16진수로 변환하는 함수
  const opacityToHex = (opacity: number): string => {
    const alpha = Math.round((opacity / 100) * 255);
    return alpha.toString(16).padStart(2, '0').toUpperCase();
  };

  // 16진수를 투명도로 변환하는 함수
  const hexToOpacity = (hex: string): number => {
    if (hex.length === 9) {
      const alpha = parseInt(hex.slice(7, 9), 16);
      return Math.round((alpha / 255) * 100);
    }
    return 80; // 기본값
  };

  // 배경 색상과 투명도를 합친 최종 색상 반환
  const getFinalBgColor = (): string => {
    return bgColor + opacityToHex(bgOpacity);
  };


  // 오버레이 추가
  const addOverlay = () => {
    if (!isPlayerReady || !player) {
      showNotification("플레이어가 준비되지 않았습니다.", "error");
      return;
    }

    if (!overlayText.trim()) {
      showNotification("텍스트를 입력해주세요.", "error");
      return;
    }

    try {
      const currentTime = player.getCurrentTime();
      const newOverlay: OverlayData = {
        id: editingId || Date.now().toString(),
        text: overlayText,
        positionMode,
        position: positionMode === "preset" ? position : undefined,
        coordinates: positionMode === "coordinate" ? coordinates : undefined,
        startTime: currentTime,
        duration,
        style: {
          fontSize,
          color: textColor,
          backgroundColor: getFinalBgColor(),
          padding,
        },
      };

      if (editingId) {
        // 편집 모드
        setOverlays(prev => prev.map(o => o.id === editingId ? newOverlay : o));
        showNotification("오버레이가 수정되었습니다.", "success");
        setEditingId(null);
      } else {
        // 추가 모드
        setOverlays(prev => [...prev, newOverlay]);
        showNotification("오버레이가 추가되었습니다.", "success");
      }

      // 입력 필드 초기화
      setOverlayText("");
    } catch (error) {
      console.error("오버레이 추가 중 오류:", error);
      showNotification("오버레이 추가 중 오류가 발생했습니다.", "error");
    }
  };

  // 오버레이 편집
  const editOverlay = (overlay: OverlayData) => {
    setOverlayText(overlay.text);
    if (overlay.coordinates) setCoordinates(overlay.coordinates);
    setDuration(overlay.duration);
    setFontSize(overlay.style.fontSize);
    setTextColor(overlay.style.color);
    
    // 배경 색상과 투명도 분리
    const bgColorValue = overlay.style.backgroundColor.length === 9 
      ? overlay.style.backgroundColor.slice(0, 7) 
      : overlay.style.backgroundColor;
    const opacity = overlay.style.backgroundColor.length === 9 
      ? hexToOpacity(overlay.style.backgroundColor)
      : 80;
    
    setBgColor(bgColorValue);
    setBgOpacity(opacity);
    setPadding(overlay.style.padding);
    setEditingId(overlay.id);
    
    // 해당 시간으로 이동
    if (player && isPlayerReady) {
      player.seekTo(overlay.startTime);
    }
  };

  // 오버레이 삭제
  const deleteOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
    showNotification("오버레이가 삭제되었습니다.", "info");
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setOverlayText("");
    setCoordinates({ x: 50, y: 90, unit: "%" });
    setBgColor("#000000");
    setBgOpacity(80);
  };


  // 오버레이 위치 설명 반환
  const getOverlayPositionDescription = (overlay: OverlayData): string => {
    if (overlay.coordinates) {
      const { x, y, unit } = overlay.coordinates;
      return `좌표 (${x}${unit}, ${y}${unit})`;
    }
    return "좌표 (50%, 90%)";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 md:hidden">
        <h3 className="text-lg font-semibold flex items-center">
          <Type className="w-5 h-5 mr-2" />
          화면 텍스트 오버레이
        </h3>
        {editingId && (
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="w-4 h-4 mr-1" />
            취소
          </Button>
        )}
      </div>
      
      {/* PC용 취소 버튼 (우상단) */}
      {editingId && (
        <div className="hidden md:flex justify-end mb-2">
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="w-4 h-4 mr-1" />
            취소
          </Button>
        </div>
      )}

      {/* 텍스트 입력 */}
      <div>
        <Label htmlFor="overlay-text">텍스트</Label>
        <Textarea
          id="overlay-text"
          value={overlayText}
          onChange={(e) => setOverlayText(e.target.value)}
          placeholder="화면에 표시할 텍스트를 입력하세요"
          className="mt-1"
          rows={2}
        />
      </div>

      {/* 위치 설정 */}
      <div>
        <CoordinateInput
          coordinates={coordinates}
          onCoordinatesChange={setCoordinates}
        />
      </div>

      {/* 지속 시간 */}
      <div>
        <Label htmlFor="duration">지속 시간: {duration}초</Label>
        <Slider
          id="duration"
          value={[duration]}
          onValueChange={([value]) => setDuration(value)}
          min={1}
          max={30}
          step={1}
          className="mt-1"
        />
      </div>

      {/* 스타일 설정 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="font-size">글자 크기: {fontSize}px</Label>
          <Slider
            id="font-size"
            value={[fontSize]}
            onValueChange={([value]) => setFontSize(value)}
            min={12}
            max={48}
            step={2}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="padding">여백: {padding}px</Label>
          <Slider
            id="padding"
            value={[padding]}
            onValueChange={([value]) => setPadding(value)}
            min={4}
            max={20}
            step={2}
            className="mt-1"
          />
        </div>
      </div>

      {/* 색상 설정 */}
      <div className="space-y-4">
        {/* 글자 색상 */}
        <div>
          <Label htmlFor="text-color">글자 색상</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id="text-color"
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-16 h-8 p-1"
            />
            <Input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex-1"
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        {/* 배경 색상 */}
        <div>
          <Label htmlFor="bg-color">배경 색상</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              id="bg-color"
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-16 h-8 p-1"
            />
            <Input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* 배경 투명도 */}
        <div>
          <Label htmlFor="bg-opacity">배경 투명도: {bgOpacity}%</Label>
          <Slider
            id="bg-opacity"
            value={[bgOpacity]}
            onValueChange={([value]) => setBgOpacity(value)}
            min={0}
            max={100}
            step={5}
            className="mt-1"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>투명</span>
            <span>불투명</span>
          </div>
        </div>
      </div>

      {/* 추가/수정 버튼 */}
      <Button
        onClick={addOverlay}
        disabled={!isPlayerReady || !overlayText.trim()}
        className="w-full"
        variant={editingId ? "default" : "secondary"}
      >
        {editingId ? (
          <>
            <Save className="w-4 h-4 mr-2" />
            수정 완료
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            오버레이 추가
          </>
        )}
      </Button>

      {/* 오버레이 목록 */}
      {overlays.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">등록된 오버레이</h4>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {overlays.map((overlay) => (
              <div
                key={overlay.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <div className="flex-1 mr-2">
                  <div className="font-medium truncate">{overlay.text}</div>
                  <div className="text-xs text-gray-500">
                    {formatTime(overlay.startTime)} • {overlay.duration}초 • {getOverlayPositionDescription(overlay)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editOverlay(overlay)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteOverlay(overlay.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverlayInput;