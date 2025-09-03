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
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [isClicked, setIsClicked] = useState(false);

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
    if (!isLocked) {
      setShowMagnifier(false);
      setIsClicked(false);
      return;
    }

    const handleClick = (e: MouseEvent) => {
      // 영상 영역 클릭인지 확인 (YouTube player 영역)
      const playerElement = document.querySelector('.youtube-player-container');
      if (playerElement && playerElement.contains(e.target as Node)) {
        if (magnifierSettings.enabled && isLocked && !isMobile) {
          setClickPosition({ x: e.clientX, y: e.clientY });
          setIsClicked(true);
          // 2초 후 자동으로 확대 해제
          setTimeout(() => {
            setIsClicked(false);
          }, 2000);
        }
      }
    };

    if (magnifierSettings.enabled && !isMobile) {
      document.addEventListener('click', handleClick);
    }

    return () => {
      document.removeEventListener('click', handleClick);
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

            {/* PC에서 확대 설정 표시 */}
            {!isMobile && isLocked && (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  클릭하여 {magnifierSettings.zoom.toFixed(1)}x 확대
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
                  <h3 className="font-medium text-sm">확대 설정</h3>
                  
                  {/* 확대 활성화 */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm">클릭 확대 사용</label>
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

                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* PC 클릭 확대 효과 - 영상 영역만 확대 */}
      {!isMobile && isLocked && magnifierSettings.enabled && isClicked && (
        <style>
          {`
            .youtube-player-container {
              transform: scale(${magnifierSettings.zoom});
              transform-origin: ${clickPosition.x}px ${clickPosition.y - 64}px;
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              z-index: 50;
              position: relative;
            }
            
            /* 확대 시 그림자 효과 */
            .youtube-player-container::after {
              content: '';
              position: absolute;
              inset: -10px;
              background: radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, transparent 70%);
              pointer-events: none;
            }
          `}
        </style>
      )}
      
      {/* 확대되지 않은 상태의 기본 스타일 */}
      {!isMobile && isLocked && magnifierSettings.enabled && !isClicked && (
        <style>
          {`
            .youtube-player-container {
              transform: scale(1);
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}
        </style>
      )}
      
      {/* 모바일 터치 홀드 확대 효과는 YouTubePlayer에서 처리됨 */}
      
      {/* PC 클릭 위치 표시 */}
      {!isMobile && isClicked && magnifierSettings.enabled && (
        <div 
          className="fixed pointer-events-none z-[60] animate-pulse"
          style={{
            left: clickPosition.x - 30,
            top: clickPosition.y - 30,
            width: 60,
            height: 60,
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-blue-500 opacity-50" />
        </div>
      )}
    </>
  );
};

export default ScreenLock;