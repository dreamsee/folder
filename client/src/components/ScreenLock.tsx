import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Search, Settings2, Star } from 'lucide-react';
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
  onFavoritesOpen?: () => void;
  onSearchOpen?: () => void;
  showSearchIcon?: boolean;
}

const ScreenLock: React.FC<ScreenLockProps> = ({
  isLocked,
  onLockToggle,
  magnifierSettings,
  onMagnifierSettingsChange,
  onFavoritesOpen,
  onSearchOpen,
  showSearchIcon = false,
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const magnifierRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [lastReleasePosition, setLastReleasePosition] = useState({ x: 50, y: 50 }); // 마우스를 뗀 마지막 위치
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

    // 마우스 다운: 확대 시작
    const handleMouseDown = (e: MouseEvent) => {
      const playerElement = document.querySelector('.youtube-player-container');
      if (playerElement && playerElement.contains(e.target as Node)) {
        if (magnifierSettings.enabled && isLocked) {
          const rect = playerElement.getBoundingClientRect();
          const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
          const relativeY = ((e.clientY - rect.top) / rect.height) * 100;

          setClickPosition({ x: relativeX, y: relativeY });
          setIsClicked(true);
        }
      }
    };

    // 마우스 무브: 드래그 중 확대 위치 이동
    const handleMouseMove = (e: MouseEvent) => {
      if (isClicked && magnifierSettings.enabled && isLocked) {
        const playerElement = document.querySelector('.youtube-player-container');
        if (playerElement) {
          const rect = playerElement.getBoundingClientRect();
          const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
          const relativeY = ((e.clientY - rect.top) / rect.height) * 100;

          setClickPosition({ x: relativeX, y: relativeY });
        }
      }
    };

    // 마우스 업: 확대 해제 (마지막 위치 저장)
    const handleMouseUp = () => {
      // 마우스를 뗀 위치를 저장하여 줌아웃 시 해당 위치 기준으로 복귀
      setLastReleasePosition({ x: clickPosition.x, y: clickPosition.y });
      setIsClicked(false);
    };

    if (magnifierSettings.enabled) {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isLocked, magnifierSettings.enabled, isClicked]);

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

            {/* 확대 안내 메시지 */}
            {isLocked && (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isMobile ? '영상을 길게 눌러서' : '클릭하여'} {magnifierSettings.zoom.toFixed(1)}x 확대
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 검색 버튼 (검색창 유지 OFF일 때만 표시) */}
            {showSearchIcon && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSearchOpen}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">검색</span>
              </Button>
            )}
            
            {/* 즐겨찾기 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onFavoritesOpen}
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">즐겨찾기</span>
            </Button>

            {/* 설정 버튼 (화면 잠금 활성화 시에만 표시) */}
            {isLocked && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">확대 설정</h3>

                    {/* 확대 활성화 토글 */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm">{isMobile ? '터치' : '클릭'} 확대 사용</label>
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
                        min={1.1}
                        max={5}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      {/* 클릭 확대 효과 - 영상 영역 내부에서만 확대 (컨테이너 overflow hidden) */}
      {isLocked && magnifierSettings.enabled && isClicked && (
        <style>
          {`
            .youtube-player-container {
              overflow: hidden !important;
              position: relative;
            }
            .youtube-player-container iframe {
              transform: scale(${magnifierSettings.zoom});
              transform-origin: ${clickPosition.x}% ${clickPosition.y}%;
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}
        </style>
      )}

      {/* 확대되지 않은 상태의 기본 스타일 */}
      {isLocked && magnifierSettings.enabled && !isClicked && (
        <style>
          {`
            .youtube-player-container {
              overflow: hidden !important;
            }
            .youtube-player-container iframe {
              transform: scale(1);
              transform-origin: ${lastReleasePosition.x}% ${lastReleasePosition.y}%;
              transition: transform 0.9s cubic-bezier(0.5, 0.3, 0, 0.99);
            }
          `}
        </style>
      )}
      
      {/* 모바일 터치 홀드 확대 효과는 YouTubePlayer에서 처리됨 */}
      
      {/* 클릭/터치 위치 표시 (확대 중심점 시각화) */}
      {isClicked && magnifierSettings.enabled && (
        <div className="fixed pointer-events-none z-[60]">
          <div
            className="absolute animate-ping"
            style={{
              left: `${clickPosition.x}%`,
              top: `${clickPosition.y}%`,
              width: 40,
              height: 40,
              marginLeft: -20,
              marginTop: -20,
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-blue-500 opacity-50" />
          </div>
        </div>
      )}
    </>
  );
};

export default ScreenLock;