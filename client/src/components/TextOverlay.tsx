import React, { useEffect, useState, useRef } from "react";

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
  screenScale?: number; // 화면 크기 비율 (기본값 100)
  isFullscreen?: boolean; // 전체화면 여부
}

const TextOverlay: React.FC<TextOverlayProps> = ({
  overlays,
  currentTime,
  isPlaying,
  onOverlayPositionChange,
  editingId,
  screenScale = 100,
  isFullscreen = false
}) => {
  const [activeOverlays, setActiveOverlays] = useState<OverlayData[]>([]);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; initialCoords: Coordinates } | null>(null);
  const [containerScale, setContainerScale] = useState(1); // 실제 컨테이너 크기 비율
  const [normalModeWidth, setNormalModeWidth] = useState(0); // 일반 모드에서의 영상 너비
  const containerRef = useRef<HTMLDivElement>(null);

  // 기준 영상 크기 (16:9 비율의 표준 크기)
  const BASE_VIDEO_WIDTH = 1280; // 720p 기준

  // ResizeObserver로 컨테이너 크기 변화 감지
  useEffect(() => {
    const observeContainer = () => {
      // 부모 컨테이너 찾기 (영상 플레이어 컨테이너)
      const parentContainer = containerRef.current?.parentElement;
      if (!parentContainer) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;

          if (isFullscreen) {
            // 전체화면일 때: screenScale 비율만 사용
            // 전체화면에서는 영상이 화면에 맞게 확대되지만,
            // 글자는 screenScale 비율만 적용
            const scale = screenScale / 100;
            setContainerScale(scale);
            console.log(`전체화면: 글자 비율 ${scale.toFixed(2)} (screenScale: ${screenScale}%)`);
          } else {
            // 일반 모드일 때: 실제 컨테이너 크기 대비 비율 계산
            const scale = width / BASE_VIDEO_WIDTH;
            setContainerScale(scale);
            setNormalModeWidth(width); // 일반 모드 너비 저장
            console.log(`일반화면: 컨테이너 ${width}px, 비율: ${scale.toFixed(2)}`);
          }
        }
      });

      resizeObserver.observe(parentContainer);
      return () => resizeObserver.disconnect();
    };

    const cleanup = observeContainer();
    return cleanup;
  }, [isFullscreen, screenScale]); // screenScale 의존성 추가

  // 화면 크기에 비례한 글자 크기 계산 함수
  const getScaledFontSize = (baseFontSize: number): number => {
    // containerScale이 이미 screenScale과 브라우저 크기를 모두 반영한 실제 비율
    // screenScale을 다시 곱하면 중복 적용되므로 containerScale만 사용
    const scaledSize = Math.round(baseFontSize * containerScale);

    if (isFullscreen) {
      console.log(`전체화면 글자 크기: ${baseFontSize}px → ${scaledSize}px (실제 비율: ${containerScale.toFixed(2)})`);
    } else {
      console.log(`일반화면 글자 크기: ${baseFontSize}px → ${scaledSize}px (컨테이너 비율: ${containerScale.toFixed(2)})`);
    }

    return scaledSize;
  };

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
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
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
              fontSize: `${getScaledFontSize(overlay.style.fontSize)}px`,
              color: overlay.style.color,
              backgroundColor: overlay.style.backgroundColor,
              padding: `${Math.round(overlay.style.padding * containerScale)}px`,
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
    </div>
  );
};

export default TextOverlay;