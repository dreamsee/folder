import { useState, useEffect } from 'react';

export const useVirtualKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    // 초기 뷰포트 높이 저장
    let initialViewportHeight = window.innerHeight;
    
    // 모바일 환경이 아니면 키보드 감지하지 않음
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      return;
    }

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      // 키보드가 올라온 것으로 판단하는 임계값 (150px로 증가)
      if (heightDifference > 150) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(heightDifference);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    // Visual Viewport API가 지원되는 경우 사용
    if ('visualViewport' in window && window.visualViewport) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport!;
        const heightDifference = window.screen.height - viewport.height;
        
        if (heightDifference > 150) {
          setIsKeyboardVisible(true);
          setKeyboardHeight(heightDifference);
        } else {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        }
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // 폴백: window resize 이벤트 사용
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight
  };
};