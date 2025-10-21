import { useEffect, useRef, useState } from 'react';

interface UseMobileZoomProps {
  isLocked: boolean;
  playerContainerRef: React.RefObject<HTMLDivElement>;
}

interface ZoomState {
  isMobile: boolean;
  isTouchHolding: boolean;
  touchPosition: { x: number; y: number };
  overlayPosition: { x: number; y: number };
}

export const useMobileZoom = ({ isLocked, playerContainerRef }: UseMobileZoomProps): ZoomState => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchHolding, setIsTouchHolding] = useState(false);
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 터치 홀드 이벤트 처리
  useEffect(() => {
    if (!isMobile || !isLocked || !playerContainerRef.current) return;

    const container = playerContainerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const target = e.target as HTMLElement;
      const isControlElement = target.closest('[data-control-panel="true"]') ||
                               target.closest('button') ||
                               target.closest('input');

      if (isControlElement) return;

      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();

      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {

        const relativeX = touch.clientX - rect.left;
        const relativeY = touch.clientY - rect.top;
        setTouchPosition({ x: relativeX, y: relativeY });
        setOverlayPosition({ x: touch.clientX, y: touch.clientY });

        touchTimerRef.current = setTimeout(() => {
          setIsTouchHolding(true);
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }, 50);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }

      if (isTouchHolding && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const relativeX = touch.clientX - rect.left;
        const relativeY = touch.clientY - rect.top;
        setTouchPosition({ x: relativeX, y: relativeY });
        setOverlayPosition({ x: touch.clientX, y: touch.clientY });
      }
    };

    const handleTouchEnd = () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
      setIsTouchHolding(false);
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isMobile, isLocked, isTouchHolding, playerContainerRef]);

  return {
    isMobile,
    isTouchHolding,
    touchPosition,
    overlayPosition,
  };
};
