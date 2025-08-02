import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coordinates } from "./TextOverlay";

interface CoordinateInputProps {
  coordinates: Coordinates;
  onCoordinatesChange: (coordinates: Coordinates) => void;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({ coordinates, onCoordinatesChange }) => {
  const handleChange = (field: keyof Coordinates, value: string | number) => {
    onCoordinatesChange({
      ...coordinates,
      [field]: value,
    });
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 text-center">
        좌표 직접 지정
      </div>
      
      {/* 단위 선택 */}
      <div>
        <Label htmlFor="unit">단위</Label>
        <Select 
          value={coordinates.unit} 
          onValueChange={(value) => handleChange("unit", value as "px" | "%")}
        >
          <SelectTrigger id="unit" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="px">픽셀 (px)</SelectItem>
            <SelectItem value="%">퍼센트 (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* X, Y 좌표 입력 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="x-coord">
            X {coordinates.unit === "%" ? "(0-100)" : "(픽셀)"}
          </Label>
          <Input
            id="x-coord"
            type="number"
            value={coordinates.x}
            onChange={(e) => handleChange("x", Number(e.target.value))}
            min={0}
            max={coordinates.unit === "%" ? 100 : 9999}
            className="mt-1"
            placeholder={coordinates.unit === "%" ? "0-100" : "0"}
          />
        </div>
        <div>
          <Label htmlFor="y-coord">
            Y {coordinates.unit === "%" ? "(0-100)" : "(픽셀)"}
          </Label>
          <Input
            id="y-coord"
            type="number"
            value={coordinates.y}
            onChange={(e) => handleChange("y", Number(e.target.value))}
            min={0}
            max={coordinates.unit === "%" ? 100 : 9999}
            className="mt-1"
            placeholder={coordinates.unit === "%" ? "0-100" : "0"}
          />
        </div>
      </div>

      {/* 좌표 설명 */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• X: 0 = 왼쪽, {coordinates.unit === "%" ? "100" : "화면너비"} = 오른쪽</div>
        <div>• Y: 0 = 위쪽, {coordinates.unit === "%" ? "100" : "화면높이"} = 아래쪽</div>
        <div>• 현재 위치: ({coordinates.x}{coordinates.unit}, {coordinates.y}{coordinates.unit})</div>
      </div>

      {/* 빠른 좌표 버튼 */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600">빠른 설정:</div>
        <div className="grid grid-cols-3 gap-1 text-xs">
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 10, y: 10, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            좌상단
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 50, y: 10, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            상단중앙
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 90, y: 10, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            우상단
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 10, y: 50, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            좌측중앙
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 50, y: 50, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            정중앙
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 90, y: 50, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            우측중앙
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 10, y: 90, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            좌하단
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 50, y: 90, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            하단중앙
          </button>
          <button
            type="button"
            onClick={() => onCoordinatesChange({ x: 90, y: 90, unit: coordinates.unit })}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs"
          >
            우하단
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoordinateInput;