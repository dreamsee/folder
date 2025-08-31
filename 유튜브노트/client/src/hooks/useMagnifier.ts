import { useEffect, useRef, useState } from 'react';

export const useMagnifier = (
  enabled: boolean,
  zoom: number,
  size: number
) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const magnifierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      
      // 마우스 위치에 따라 페이지 확대
      if (magnifierRef.current) {
        const rect = magnifierRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 돋보기 내부의 콘텐츠를 확대
        const content = document.querySelector('.magnifiable-content');
        if (content) {
          (content as HTMLElement).style.transform = `scale(${zoom})`;
          (content as HTMLElement).style.transformOrigin = `${e.clientX}px ${e.clientY}px`;
        }
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      const content = document.querySelector('.magnifiable-content');
      if (content) {
        (content as HTMLElement).style.transform = 'scale(1)';
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Ctrl + 휠로 배율 조절 (부모 컴포넌트에서 처리)
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, zoom]);

  return {
    magnifierRef,
    position,
    isVisible,
  };
};