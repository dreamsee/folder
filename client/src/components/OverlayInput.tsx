import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Plus, X, Edit2, Save, Type, Clock } from "lucide-react";
import { formatTime } from "@/lib/youtubeUtils";
import { OverlayData, OverlayPosition, PositionMode, Coordinates } from "./TextOverlay";
import CoordinateInput from "./CoordinateInput";
import { UISettings } from "./SettingsPanel";

interface OverlayInputProps {
  player: any | null;
  isPlayerReady: boolean;
  overlays: OverlayData[];
  setOverlays: React.Dispatch<React.SetStateAction<OverlayData[]>>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  uiSettings?: UISettings;
  onSettingsChange?: (settings: UISettings) => void;
  noteText?: string;  // 노트 텍스트 추가
  currentVideoId?: string; // 현재 영상 ID 추가
}

const OverlayInput: React.FC<OverlayInputProps> = ({
  player,
  isPlayerReady,
  overlays,
  setOverlays,
  showNotification,
  uiSettings,
  onSettingsChange,
  noteText = "",
  currentVideoId = "",
}) => {
  const [overlayText, setOverlayText] = useState("");
  const [positionMode] = useState<PositionMode>("coordinate"); // 항상 좌표 모드로 고정
  const [coordinates, setCoordinates] = useState<Coordinates>({ x: 50, y: 90, unit: "%" });
  const [position] = useState<OverlayPosition>("bottom-center"); // 기본 위치
  const [duration, setDuration] = useState(5);
  const [actualDuration, setActualDuration] = useState<number | null>(null); // 타임스탬프에서 가져온 실제 지속시간 (소수점 포함)
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("#000000");
  const [bgOpacity, setBgOpacity] = useState(0); // 0-100 퍼센트 (기본값 0 = 투명)
  const [padding, setPadding] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [showTimestampPicker, setShowTimestampPicker] = useState(false);
  const [availableTimestamps, setAvailableTimestamps] = useState<Array<{text: string, start: number, end: number, description: string}>>([]);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

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

  // 노트에서 타임스탬프 파싱 (설명 텍스트 포함)
  const parseTimestamps = () => {
    const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
    const timestamps = [];
    let match;

    while ((match = timestampRegex.exec(noteText)) !== null) {
      const startHours = parseInt(match[1]);
      const startMinutes = parseInt(match[2]);
      const startSeconds = parseFloat(match[3]);
      const endHours = parseInt(match[4]);
      const endMinutes = parseInt(match[5]);
      const endSeconds = parseFloat(match[6]);

      const start = startHours * 3600 + startMinutes * 60 + startSeconds;
      const end = endHours * 3600 + endMinutes * 60 + endSeconds;

      // 타임스탬프 뒤 설명 텍스트 추출
      const timestampEnd = match.index! + match[0].length;
      const remainingText = noteText.substring(timestampEnd);

      // 다음 줄바꿈 또는 다음 타임스탬프까지의 텍스트 추출
      const nextLineBreak = remainingText.indexOf('\n');
      const nextTimestampMatch = remainingText.match(/\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/);
      const nextTimestampPos = nextTimestampMatch ? nextTimestampMatch.index! : -1;

      let endPos = remainingText.length;
      if (nextLineBreak !== -1 && (nextTimestampPos === -1 || nextLineBreak < nextTimestampPos)) {
        endPos = nextLineBreak;
      } else if (nextTimestampPos !== -1) {
        endPos = nextTimestampPos;
      }

      let description = remainingText.substring(0, endPos).trim();
      // 앞쪽 공백이나 특수문자 제거
      description = description.replace(/^[\s\-\*\•\>\→\|\:\,\.\!]*/, '').trim();

      timestamps.push({
        text: match[0],
        start,
        end,
        description: description || '' // 설명 텍스트가 없으면 빈 문자열
      });
    }

    return timestamps;
  };

  // 타임스탬프에서 시간 가져오기
  const loadTimestampTimes = () => {
    const timestamps = parseTimestamps();
    if (timestamps.length === 0) {
      showNotification("노트에 타임스탬프가 없습니다.", "warning");
      return;
    }
    setAvailableTimestamps(timestamps);
    setShowTimestampPicker(true);
  };

  // 타임스탬프 선택 처리 (설명 텍스트 포함)
  const selectTimestamp = (timestamp: {text: string, start: number, end: number, description: string}) => {
    setStartTime(timestamp.start);
    setEndTime(timestamp.end);

    // 실제 지속시간 계산 (소수점 포함)
    const realDuration = timestamp.end - timestamp.start;
    setActualDuration(realDuration);
    setDuration(Math.round(realDuration)); // 슬라이더용 정수값

    // 설명 텍스트가 있으면 오버레이 텍스트로 자동 설정
    if (timestamp.description && timestamp.description.trim()) {
      setOverlayText(timestamp.description.trim());
      showNotification(`타임스탬프+텍스트를 가져왔습니다: ${formatTime(timestamp.start)} - ${formatTime(timestamp.end)}`, "success");
    } else {
      showNotification(`타임스탬프 시간을 가져왔습니다: ${formatTime(timestamp.start)} - ${formatTime(timestamp.end)}`, "success");
    }

    setShowTimestampPicker(false);
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
      // 타임스탬프에서 가져온 시간이 있으면 사용, 없으면 현재 시간 사용
      const overlayStartTime = startTime !== null ? startTime : player.getCurrentTime();
      const overlayDuration = startTime !== null && endTime !== null ? endTime - startTime : duration;
      
      const newOverlay: OverlayData = {
        id: editingId || Date.now().toString(),
        text: overlayText,
        positionMode,
        position: positionMode === "preset" ? position : undefined,
        coordinates: positionMode === "coordinate" ? coordinates : undefined,
        startTime: overlayStartTime,
        duration: overlayDuration,
        style: {
          fontSize,
          color: textColor,
          backgroundColor: getFinalBgColor(),
          padding,
          textAlign,
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
      setStartTime(null);
      setEndTime(null);
      setTextAlign('left');
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
    setTextAlign(overlay.style.textAlign || 'left');
    
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
    setStartTime(null);
    setEndTime(null);
    setTextAlign('left');
  };


  // 오버레이 위치 설명 반환
  const getOverlayPositionDescription = (overlay: OverlayData): string => {
    if (overlay.coordinates) {
      const { x, y, unit } = overlay.coordinates;
      const textAlign = overlay.style.textAlign || 'left';
      const alignText = textAlign === 'left' ? '좌측' : textAlign === 'center' ? '중앙' : '우측';
      return `좌표 (${x}${unit}, ${y}${unit}) • ${alignText}_정렬`;
    }
    return "좌표 (50%, 90%) • 좌측_정렬";
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 md:hidden">
        <h3 className="text-lg font-semibold flex items-center">
          <Type className="w-5 h-5 mr-2" />
          화면 텍스트 오버레이
        </h3>
        {!editingId ? (
          <Button
            size="sm"
            variant="outline"
            onClick={loadTimestampTimes}
            disabled={!isPlayerReady}
            className="text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            타임스탬프+텍스트
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="w-4 h-4 mr-1" />
            취소
          </Button>
        )}
      </div>
      
      {/* PC용 버튼 (우상단) */}
      <div className="hidden md:flex justify-end mb-2">
        {!editingId ? (
          <Button
            size="sm"
            variant="outline"
            onClick={loadTimestampTimes}
            disabled={!isPlayerReady}
            className="text-xs"
          >
            <Clock className="w-3 h-3 mr-1" />
            타임스탬프+텍스트 가져오기
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="w-4 h-4 mr-1" />
            취소
          </Button>
        )}
      </div>

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
      {(uiSettings?.화면텍스트?.좌표설정 !== false || uiSettings?.화면텍스트?.빠른설정 !== false) && (
        <div className="space-y-4">
          
          {/* 좌표설정이 켜져있으면 상세한 좌표 입력 표시 */}
          {uiSettings?.화면텍스트?.좌표설정 !== false && (
            <CoordinateInput
              coordinates={coordinates}
              onCoordinatesChange={setCoordinates}
            />
          )}
          
          {/* 빠른 설정이 켜져있으면 9개 그리드 표시 */}
          {uiSettings?.화면텍스트?.빠른설정 !== false && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 text-center">
                빠른 설정:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "좌상단", x: 10, y: 10, align: 'left' as const },
                  { name: "상단중앙", x: 50, y: 10, align: 'center' as const },
                  { name: "우상단", x: 90, y: 10, align: 'right' as const },
                  { name: "좌측중앙", x: 10, y: 50, align: 'left' as const },
                  { name: "정중앙", x: 50, y: 50, align: 'center' as const },
                  { name: "우측중앙", x: 90, y: 50, align: 'right' as const },
                  { name: "좌하단", x: 10, y: 90, align: 'left' as const },
                  { name: "하단중앙", x: 50, y: 90, align: 'center' as const },
                  { name: "우하단", x: 90, y: 90, align: 'right' as const },
                ].map((position, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCoordinates({ x: position.x, y: position.y, unit: "%" });
                      setTextAlign(position.align);
                    }}
                    className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    {position.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {/* 글자크기, 여백 설정 */}
      {uiSettings?.화면텍스트?.스타일설정 !== false && uiSettings?.화면텍스트?.글자크기여백 !== false && (
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
      )}

      {/* 색상 설정 */}
      {uiSettings?.화면텍스트?.스타일설정 !== false && (
        <div className="space-y-4">
        {/* 글자 색상과 배경 색상을 좌우로 배치 */}
        {uiSettings?.화면텍스트?.색상설정 !== false && (
        <div className="grid grid-cols-2 gap-3">
          {/* 글자 색상 */}
          <div>
            <Label htmlFor="text-color" className="text-sm">글자 색상</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                id="text-color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-7 p-0.5"
              />
              <Input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 h-7 text-xs"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
          
          {/* 배경 색상 */}
          <div>
            <Label htmlFor="bg-color" className="text-sm">배경 색상</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                id="bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-12 h-7 p-0.5"
              />
              <Input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 h-7 text-xs"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
        )}

        {/* 배경 투명도 */}
        {uiSettings?.화면텍스트?.배경투명도 !== false && (
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
        )}
        </div>
      )}

      {/* 지속 시간 설정 (버튼 바로 위) */}
      {uiSettings?.화면텍스트?.스타일설정 !== false && uiSettings?.화면텍스트?.지속시간 !== false && (
        <div>
          <Label htmlFor="duration">
            지속 시간: {duration}초
            {actualDuration !== null && actualDuration !== duration && (
              <span className="text-gray-500 text-sm ml-1">
                ({actualDuration.toFixed(2)}초)
              </span>
            )}
          </Label>
          <Slider
            id="duration"
            value={[duration]}
            onValueChange={([value]) => {
              setDuration(value);
              setActualDuration(null); // 수동 조정 시 실제 지속시간 초기화
            }}
            min={1}
            max={30}
            step={1}
            className="mt-1"
          />
        </div>
      )}

      {/* 추가/수정 버튼 */}
      <div className="space-y-2">
        {/* 타임스탬프에서 시간 가져오기 버튼 */}
        {!editingId && (
          <Button
            onClick={loadTimestampTimes}
            disabled={!isPlayerReady}
            className="w-full"
            variant="outline"
          >
            <Clock className="w-4 h-4 mr-2" />
            타임스탬프+텍스트 가져오기
            {startTime !== null && endTime !== null && (
              <span className="ml-2 text-xs">
                ({formatTime(startTime)} - {formatTime(endTime)})
              </span>
            )}
          </Button>
        )}
        
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
      </div>

      {/* 타임스탬프 선택 모달 */}
      {showTimestampPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-3">타임스탬프 선택</h3>
            <div className="space-y-2">
              {availableTimestamps.map((ts, index) => (
                <button
                  key={index}
                  onClick={() => selectTimestamp(ts)}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded border border-gray-200"
                >
                  <div className="font-mono text-sm">{ts.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(ts.start)} - {formatTime(ts.end)} ({Math.round(ts.end - ts.start)}초)
                  </div>
                  {ts.description && ts.description.trim() && (
                    <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                      <span className="font-medium text-blue-600">텍스트:</span> {ts.description.trim()}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setShowTimestampPicker(false)}
              className="w-full mt-3"
              variant="outline"
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 오버레이 목록 */}
      {overlays.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            등록된 오버레이 {currentVideoId && (
              <span className="text-xs text-gray-500 font-normal">({currentVideoId})</span>
            )}
          </h4>
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