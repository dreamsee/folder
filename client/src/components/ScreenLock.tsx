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
    mode: 'hold' | 'toggle';
  };
  onMagnifierSettingsChange: (settings: any) => void;
  onFavoritesOpen?: () => void;
  onSearchOpen?: () => void;
  showSearchIcon?: boolean;
  isControlsModalOpen?: boolean;
}

const ScreenLock: React.FC<ScreenLockProps> = ({
  isLocked,
  onLockToggle,
  magnifierSettings,
  onMagnifierSettingsChange,
  onFavoritesOpen,
  onSearchOpen,
  showSearchIcon = false,
  isControlsModalOpen = false,
}) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const magnifierRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [lastReleasePosition, setLastReleasePosition] = useState({ x: 50, y: 50 }); // 마우스를 뗀 마지막 위치
  const [isClicked, setIsClicked] = useState(false); // 홀드 모드: 마우스 다운 상태
  const [isToggled, setIsToggled] = useState(false); // 토글 모드: 확대 고정 상태
  const [mouseDownPosition, setMouseDownPosition] = useState({ x: 0, y: 0 }); // 마우스 다운 위치 (드래그 감지용)
  const [toggleStartPosition, setToggleStartPosition] = useState({ x: 50, y: 50 }); // 토글 모드: 확대 시작 위치 (축소 시 사용)

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
    if (!isLocked || isControlsModalOpen) {
      setShowMagnifier(false);
      setIsClicked(false);
      return;
    }

    // 마우스 다운: 확대 시작
    const handleMouseDown = (e: MouseEvent) => {
      // 플레이어 버튼 클릭인지 확인
      const target = e.target as HTMLElement;
      if (target.closest('[data-player-button]')) {
        return; // 버튼 클릭이면 확대 로직 실행 안 함
      }

      const playerElement = document.querySelector('.youtube-player-container');
      if (playerElement && playerElement.contains(e.target as Node)) {
        if (isLocked) {
          const rect = playerElement.getBoundingClientRect();
          const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
          const relativeY = ((e.clientY - rect.top) / rect.height) * 100;

          // 마우스 다운 위치 저장 (드래그 감지용)
          setMouseDownPosition({ x: relativeX, y: relativeY });

          // 홀드 모드에서만 클릭 위치 업데이트 (토글 모드는 마우스 업에서 처리)
          if (magnifierSettings.mode === 'hold') {
            setClickPosition({ x: relativeX, y: relativeY });
            // 홀드 모드: 마우스 다운 시 확대
            setIsClicked(true);
          }
        }
      }
    };

    // 마우스 무브: 드래그 중 확대 위치 이동 (홀드 모드만)
    const handleMouseMove = (e: MouseEvent) => {
      if (magnifierSettings.mode === 'hold' && isClicked && isLocked) {
        const playerElement = document.querySelector('.youtube-player-container');
        if (playerElement) {
          const rect = playerElement.getBoundingClientRect();
          const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
          const relativeY = ((e.clientY - rect.top) / rect.height) * 100;

          setClickPosition({ x: relativeX, y: relativeY });
        }
      }
    };

    // 마우스 업: 확대 해제 또는 토글
    const handleMouseUp = (e: MouseEvent) => {
      // 플레이어 버튼 클릭인지 확인
      const target = e.target as HTMLElement;
      if (target.closest('[data-player-button]')) {
        return; // 버튼 클릭이면 확대 로직 실행 안 함
      }

      const playerElement = document.querySelector('.youtube-player-container');
      if (playerElement && playerElement.contains(e.target as Node)) {
        const rect = playerElement.getBoundingClientRect();
        const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
        const relativeY = ((e.clientY - rect.top) / rect.height) * 100;
        setLastReleasePosition({ x: relativeX, y: relativeY });

        if (magnifierSettings.mode === 'toggle') {
          // 토글 모드: 드래그가 아닌 클릭일 때만 토글
          const distanceX = Math.abs(relativeX - mouseDownPosition.x);
          const distanceY = Math.abs(relativeY - mouseDownPosition.y);
          const isDrag = distanceX > 2 || distanceY > 2; // 2% 이상 이동하면 드래그로 간주

          if (!isDrag) {
            // 클릭: 토글
            setIsToggled(!isToggled);
            // 토글 시 클릭 위치를 새로 설정 (축소→확대 시)
            if (!isToggled) {
              setClickPosition({ x: relativeX, y: relativeY });
              setToggleStartPosition({ x: relativeX, y: relativeY }); // 확대 시작 위치 저장
            }
          }
        }
      }

      if (magnifierSettings.mode === 'hold') {
        // 홀드 모드: 마우스 업 시 확대 해제
        setIsClicked(false);
      }
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
  }, [isLocked, isControlsModalOpen, magnifierSettings.enabled, magnifierSettings.mode, isClicked, isToggled, mouseDownPosition]);

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

            {/* 확대 안내 메시지 (모바일에서는 홀드 메시지만 표시) */}
            {isLocked && (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isMobile
                    ? `누르고 있으면 ${magnifierSettings.zoom.toFixed(1)}x 확대`
                    : magnifierSettings.mode === 'toggle'
                    ? `클릭시 ${magnifierSettings.zoom.toFixed(1)}x 확대/축소`
                    : `누르고 있으면 ${magnifierSettings.zoom.toFixed(1)}x 확대`}
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

                    {/* 확대 모드 선택 (모바일에서는 홀드시 확대만 사용) */}
                    {!isMobile && (
                      <div className="flex items-center justify-between">
                        <label className="text-sm">확대 모드</label>
                        <div className="flex gap-2">
                          <Button
                            variant={magnifierSettings.mode === 'toggle' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                              onMagnifierSettingsChange({
                                ...magnifierSettings,
                                mode: 'toggle',
                              })
                            }
                          >
                            클릭시 확대/축소
                          </Button>
                          <Button
                            variant={magnifierSettings.mode === 'hold' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() =>
                              onMagnifierSettingsChange({
                                ...magnifierSettings,
                                mode: 'hold',
                              })
                            }
                          >
                            홀드시 확대
                          </Button>
                        </div>
                      </div>
                    )}

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

      {/* 홀드 모드: 확대 효과 (플레이어 안에서만 보임) */}
      {isLocked && magnifierSettings.mode === 'hold' && isClicked && (
        <style>
          {`
            .youtube-player-container {
              overflow: hidden !important;
              position: relative;
              z-index: 100;
            }
            .youtube-player-container iframe {
              transform: scale(${magnifierSettings.zoom});
              transform-origin: ${clickPosition.x}% ${clickPosition.y}%;
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}
        </style>
      )}

      {/* 토글 모드: 확대 효과 (화면 전체로 넘어감) */}
      {isLocked && magnifierSettings.mode === 'toggle' && isToggled && (
        <style>
          {`
            .youtube-player-container {
              position: relative;
              z-index: 100;
            }
            .youtube-player-container iframe {
              transform: scale(${magnifierSettings.zoom});
              transform-origin: ${clickPosition.x}% ${clickPosition.y}%;
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}
        </style>
      )}

      {/* 홀드 모드: 줌아웃 스타일 (플레이어 안에서만) */}
      {isLocked && magnifierSettings.mode === 'hold' && !isClicked && (
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

      {/* 토글 모드: 줌아웃 스타일 (화면 전체) */}
      {isLocked && magnifierSettings.mode === 'toggle' && !isToggled && (
        <style>
          {`
            body {
              overflow-y: scroll;
              height: calc(100vh + 1px);
            }
            body::-webkit-scrollbar {
              display: none;
            }
            body {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .youtube-player-container {
              position: relative;
              z-index: 100;
            }
            .youtube-player-container iframe {
              transform: scale(1);
              transform-origin: ${toggleStartPosition.x}% ${toggleStartPosition.y}%;
              transition: transform 0.9s cubic-bezier(0.5, 0.3, 0, 0.99);
            }
          `}
        </style>
      )}
      
      {/* 모바일 터치 홀드 확대 효과는 YouTubePlayer에서 처리됨 */}
      
      {/* 클릭/터치 위치 표시 (확대 중심점 시각화) */}
      {((magnifierSettings.mode === 'hold' && isClicked) || (magnifierSettings.mode === 'toggle' && isToggled)) && (
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