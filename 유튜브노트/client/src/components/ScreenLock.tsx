import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Search, Settings2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ScreenLockProps {
  isLocked: boolean;
  onLockToggle: () => void;
  magnifierSettings: {
    enabled: boolean;
    zoom: number;
    size: number;
  };
  onMagnifierSettingsChange: (settings: any) => void;
}

const ScreenLock: React.FC<ScreenLockProps> = ({
  isLocked,
  onLockToggle,
  magnifierSettings,
  onMagnifierSettingsChange,
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const magnifierRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 모바일 감지
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isLocked || isMobile) {
      setShowMagnifier(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (magnifierSettings.enabled && isLocked && !isMobile) {
        setShowMagnifier(true);
        setMagnifierPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseLeave = () => {
      setShowMagnifier(false);
    };

    if (magnifierSettings.enabled) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isLocked, magnifierSettings.enabled, isMobile]);

  const magnifierSizes = {
    1: 100, // 소
    2: 150, // 중
    3: 200, // 대
  };

  return (
    <>
      {/* 상단 컨트롤 바 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b p-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2">
            {/* 잠금 토글 버튼 */}
            <Button
              onClick={onLockToggle}
              variant={isLocked ? 'destructive' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">화면 잠금</span>
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  <span className="hidden sm:inline">잠금 해제</span>
                </>
              )}
            </Button>

            {/* PC에서만 돋보기 설정 표시 */}
            {!isMobile && isLocked && (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {magnifierSettings.zoom.toFixed(1)}x
                </span>
              </div>
            )}

            {/* 모바일 안내 메시지 */}
            {isMobile && isLocked && (
              <span className="text-sm text-muted-foreground">
                영상을 길게 눌러서 확대
              </span>
            )}
          </div>

          {/* 설정 버튼 (PC만) */}
          {!isMobile && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">돋보기 설정</h3>
                  
                  {/* 돋보기 활성화 */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm">돋보기 사용</label>
                    <Button
                      variant={magnifierSettings.enabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        onMagnifierSettingsChange({
                          ...magnifierSettings,
                          enabled: !magnifierSettings.enabled,
                        })
                      }
                    >
                      {magnifierSettings.enabled ? '켜짐' : '꺼짐'}
                    </Button>
                  </div>

                  {/* 배율 조절 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">배율</label>
                      <span className="text-sm text-muted-foreground">
                        {magnifierSettings.zoom.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      value={[magnifierSettings.zoom]}
                      onValueChange={([value]) =>
                        onMagnifierSettingsChange({
                          ...magnifierSettings,
                          zoom: value,
                        })
                      }
                      min={1.5}
                      max={5}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  {/* 크기 조절 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">돋보기 크기</label>
                      <span className="text-sm text-muted-foreground">
                        {magnifierSettings.size === 1
                          ? '소'
                          : magnifierSettings.size === 2
                          ? '중'
                          : '대'}
                      </span>
                    </div>
                    <Slider
                      value={[magnifierSettings.size]}
                      onValueChange={([value]) =>
                        onMagnifierSettingsChange({
                          ...magnifierSettings,
                          size: value,
                        })
                      }
                      min={1}
                      max={3}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* PC 돋보기 효과 - CSS transform 사용 */}
      {!isMobile && isLocked && magnifierSettings.enabled && (
        <style>
          {`
            body {
              transform: scale(${showMagnifier ? magnifierSettings.zoom : 1});
              transform-origin: ${magnifierPosition.x}px ${magnifierPosition.y}px;
              transition: transform 0.1s ease-out;
            }
            
            /* 돋보기 표시기 */
            .magnifier-indicator::after {
              content: '';
              position: fixed;
              left: ${magnifierPosition.x - 50}px;
              top: ${magnifierPosition.y - 50}px;
              width: 100px;
              height: 100px;
              border: 2px solid #3b82f6;
              border-radius: 50%;
              pointer-events: none;
              z-index: 9999;
              opacity: ${showMagnifier ? 0.5 : 0};
              transition: opacity 0.2s;
            }
          `}
        </style>
      )}
      
      {/* 모바일 터치 홀드 확대 효과는 이제 YouTubePlayer에서 처리됨 */}
      
      {/* PC 돋보기 표시기 */}
      {!isMobile && showMagnifier && magnifierSettings.enabled && (
        <div className="magnifier-indicator" />
      )}
      
      {/* 모바일 터치 인디케이터는 이제 YouTubePlayer에서 처리됨 */}

      {/* 전체 화면 잠금 오버레이 제거됨 - 이제 YouTube 영역만 잠금 */}
    </>
  );
};

export default ScreenLock;