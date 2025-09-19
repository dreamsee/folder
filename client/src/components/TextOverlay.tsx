import React, { useEffect, useState } from "react";

// 오버레이 위치 타입
export type OverlayPosition = 
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

// 위치 모드 타입
export type PositionMode = "preset" | "coordinate";

// 좌표 타입
export interface Coordinates {
  x: number; // 픽셀 또는 퍼센트
  y: number; // 픽셀 또는 퍼센트
  unit: "px" | "%"; // 단위
}

// 오버레이 데이터 타입
export interface OverlayData {
  id: string;
  text: string;
  positionMode: PositionMode;
  position?: OverlayPosition; // preset 모드일 때
  coordinates?: Coordinates; // coordinate 모드일 때
  startTime: number; // 초 단위
  duration: number; // 초 단위
  rotation?: number; // 회전 각도 (기본값 0, -180~180도)
  style: {
    fontSize: number; // px
    color: string;
    backgroundColor: string;
    padding: number; // px
    textAlign?: 'left' | 'center' | 'right'; // 텍스트 정렬
  };
}

interface TextOverlayProps {
  overlays: OverlayData[];
  currentTime: number;
  isPlaying: boolean;
  onOverlayPositionChange?: (id: string, coordinates: Coordinates) => void;
  editingId?: string; // 편집 중인 오버레이 ID
}

const TextOverlay: React.FC<TextOverlayProps> = ({
  overlays,
  currentTime,
  isPlaying,
  onOverlayPositionChange,
  editingId
}) => {
  const [activeOverlays, setActiveOverlays] = useState<OverlayData[]>([]);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; initialCoords: Coordinates } | null>(null);

  // 현재 시간에 활성화되어야 할 오버레이 찾기
  useEffect(() => {
    const active = overlays.filter(overlay => {
      const endTime = overlay.startTime + overlay.duration;
      return currentTime >= overlay.startTime && currentTime <= endTime;
    });

    setActiveOverlays(active);
  }, [currentTime, overlays]);

  // 드래그 시작 (정지 상태에서만 가능, 미리보기는 드래그 불가)
  const handleMouseDown = (e: React.MouseEvent, overlay: OverlayData) => {
    if (!onOverlayPositionChange || !overlay.coordinates || overlay.id === "preview-overlay" || isPlaying) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setDragging({
      id: overlay.id,
      startX: e.clientX,
      startY: e.clientY,
      initialCoords: { ...overlay.coordinates }
    });
  };

  // 드래그 중
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragging.startX;
      const deltaY = e.clientY - dragging.startY;
      
      // 비디오 컨테이너 크기를 기준으로 퍼센트 계산
      const videoContainer = document.querySelector('.youtube-player-container') as HTMLElement;
      if (!videoContainer) return;
      
      const containerRect = videoContainer.getBoundingClientRect();
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;
      
      const newCoords: Coordinates = {
        x: Math.max(0, Math.min(100, dragging.initialCoords.x + deltaXPercent)),
        y: Math.max(0, Math.min(100, dragging.initialCoords.y + deltaYPercent)),
        unit: "%"
      };
      
      onOverlayPositionChange?.(dragging.id, newCoords);
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onOverlayPositionChange]);

  // 위치에 따른 CSS 스타일 반환 (회전 기능 포함)
  const getPositionStyle = (overlay: OverlayData, isDragging: boolean = false): React.CSSProperties => {
    // 회전 각도 처리
    const rotation = overlay.rotation || 0;
    const rotationTransform = rotation !== 0 ? `rotate(${rotation}deg)` : '';
    const scaleTransform = isDragging ? 'scale(1.05)' : '';


    if (overlay.positionMode === "coordinate" && overlay.coordinates) {
      const { x, y, unit } = overlay.coordinates;
      const textAlign = overlay.style.textAlign || 'left';

      // 텍스트 정렬에 따른 transform 설정
      let alignTransform = '';
      if (textAlign === 'center') {
        alignTransform = 'translateX(-50%)';
      } else if (textAlign === 'right') {
        alignTransform = 'translateX(-100%)';
      }

      // 정렬 transform과 회전 transform, 스케일 transform 결합
      const combinedTransform = [alignTransform, rotationTransform, scaleTransform].filter(Boolean).join(' ');

      return {
        position: "absolute",
        left: `${x}${unit}`,
        top: `${y}${unit}`,
        transform: combinedTransform,
        textAlign,
      };
    } else if (overlay.positionMode === "preset" && overlay.position) {
      // 기존 preset 위치 로직 (회전 및 스케일 포함)
      const positions: Record<OverlayPosition, React.CSSProperties> = {
        "top-left": { position: "absolute", top: "16px", left: "16px", transform: [rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "top-center": { position: "absolute", top: "16px", left: "50%", transform: [`translateX(-50%)`, rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "top-right": { position: "absolute", top: "16px", right: "16px", transform: [rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "middle-left": { position: "absolute", top: "50%", left: "16px", transform: [`translateY(-50%)`, rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "middle-center": { position: "absolute", top: "50%", left: "50%", transform: [`translate(-50%, -50%)`, rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "middle-right": { position: "absolute", top: "50%", right: "16px", transform: [`translateY(-50%)`, rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "bottom-left": { position: "absolute", bottom: "16px", left: "16px", transform: [rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "bottom-center": { position: "absolute", bottom: "16px", left: "50%", transform: [`translateX(-50%)`, rotationTransform, scaleTransform].filter(Boolean).join(' ') },
        "bottom-right": { position: "absolute", bottom: "16px", right: "16px", transform: [rotationTransform, scaleTransform].filter(Boolean).join(' ') },
      };
      return positions[overlay.position] || positions["bottom-center"];
    }

    // 기본값 (회전 및 스케일 포함)
    return {
      position: "absolute",
      bottom: "16px",
      left: "50%",
      transform: [`translateX(-50%)`, rotationTransform, scaleTransform].filter(Boolean).join(' '),
    };
  };

  // 오버레이가 없을 때는 렌더링하지 않음
  if (activeOverlays.length === 0) {
    return null;
  }

  return (
    <>
      {activeOverlays.map((overlay) => {
        const isDraggingThis = dragging?.id === overlay.id;
        const isPreview = overlay.id === "preview-overlay"; // 미리보기 오버레이 확인
        const canDrag = onOverlayPositionChange && overlay.coordinates && !isPreview && !isPlaying;

        return (
          <div
            key={overlay.id}
            className="z-50 transition-opacity duration-300"
            style={{
              ...getPositionStyle(overlay, isDraggingThis),
              fontSize: `${overlay.style.fontSize}px`,
              color: overlay.style.color,
              backgroundColor: overlay.style.backgroundColor,
              padding: `${overlay.style.padding}px`,
              opacity: isPreview ? 0.9 : (isPlaying ? (isDraggingThis ? 0.8 : 1) : 0.7),
              cursor: canDrag ? 'move' : 'default',
              pointerEvents: canDrag ? "auto" : "none",
              textAlign: overlay.style.textAlign as any || 'left',
              transition: isDraggingThis ? 'none' : 'all 0.3s ease',
              border: isPreview
                ? '2px dashed #10d876' // 미리보기: 초록색 점선 테두리
                : isDraggingThis
                  ? '2px solid #3b82f6' // 드래그 중: 파란색 실선 테두리
                  : 'none',
              boxShadow: isPreview ? '0 0 8px rgba(16, 216, 118, 0.3)' : 'none', // 미리보기에 초록색 그림자
              borderRadius: isPreview || isDraggingThis ? '4px' : '0px',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay)}
          >
            <div className="whitespace-pre-wrap">
              {overlay.text}
            </div>
            {/* 미리보기 라벨 */}
            {isPreview && (
              <div
                className="absolute -top-6 left-0 text-xs text-green-500 font-bold bg-white px-1 rounded"
                style={{ fontSize: '10px' }}
              >
                미리보기
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default TextOverlay;