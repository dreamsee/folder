import React from "react";
import { Button } from "@/components/ui/button";
import { OverlayPosition } from "./TextOverlay";

interface PositionGridProps {
  selectedPosition: OverlayPosition;
  onPositionChange: (position: OverlayPosition) => void;
}

const PositionGrid: React.FC<PositionGridProps> = ({ selectedPosition, onPositionChange }) => {
  // 3x3 그리드 위치 매핑 (키패드 스타일)
  const gridPositions: { position: OverlayPosition; label: string; row: number; col: number }[] = [
    // 7, 8, 9 (상단)
    { position: "top-left", label: "7", row: 0, col: 0 },
    { position: "top-center", label: "8", row: 0, col: 1 },
    { position: "top-right", label: "9", row: 0, col: 2 },
    // 4, 5, 6 (중단)
    { position: "middle-left", label: "4", row: 1, col: 0 },
    { position: "middle-center", label: "5", row: 1, col: 1 },
    { position: "middle-right", label: "6", row: 1, col: 2 },
    // 1, 2, 3 (하단)
    { position: "bottom-left", label: "1", row: 2, col: 0 },
    { position: "bottom-center", label: "2", row: 2, col: 1 },
    { position: "bottom-right", label: "3", row: 2, col: 2 },
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600 text-center">
        위치 선택 (키패드 방식)
      </div>
      <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
        {gridPositions.map(({ position, label }) => (
          <Button
            key={position}
            size="sm"
            variant={selectedPosition === position ? "default" : "outline"}
            onClick={() => onPositionChange(position)}
            className="w-7 h-7 p-0 text-xs font-mono"
            title={getPositionDescription(position)}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className="text-xs text-gray-500 text-center">
        {getPositionDescription(selectedPosition)}
      </div>
    </div>
  );
};

// 위치 설명 반환
const getPositionDescription = (position: OverlayPosition): string => {
  const descriptions: Record<OverlayPosition, string> = {
    "top-left": "좌상단",
    "top-center": "상단중앙",
    "top-right": "우상단",
    "middle-left": "좌측",
    "middle-center": "중앙",
    "middle-right": "우측",
    "bottom-left": "좌하단",
    "bottom-center": "하단중앙",
    "bottom-right": "우하단",
  };
  return descriptions[position] || "하단중앙";
};

export default PositionGrid;