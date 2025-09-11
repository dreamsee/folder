import { useState, useEffect } from 'react';

export type 시간대테마 = 'morning' | 'afternoon' | 'evening' | 'night';

interface 시간대정보 {
  테마: 시간대테마;
  인사말: string;
  아이콘: string;
}

export const useTimeTheme = () => {
  const [현재시간대, 현재시간대설정] = useState<시간대정보>(시간대확인());

  function 시간대확인(): 시간대정보 {
    const 현재시간 = new Date().getHours();

    if (현재시간 >= 6 && 현재시간 < 12) {
      return {
        테마: 'morning',
        인사말: '좋은 아침! 오늘은 어떤 생각을 담아볼까요? ☀️',
        아이콘: '🌅'
      };
    } else if (현재시간 >= 12 && 현재시간 < 18) {
      return {
        테마: 'afternoon',
        인사말: '오후의 영감을 담아보세요 🌤️',
        아이콘: '☀️'
      };
    } else if (현재시간 >= 18 && 현재시간 < 22) {
      return {
        테마: 'evening',
        인사말: '하루를 정리하는 시간이네요 🌆',
        아이콘: '🌅'
      };
    } else {
      return {
        테마: 'night',
        인사말: '고요한 밤, 깊은 생각을 담아보세요 🌙',
        아이콘: '🌙'
      };
    }
  }

  // CSS 변수 업데이트
  function 테마적용(테마: 시간대테마) {
    const root = document.documentElement;
    
    // CSS 변수 매핑
    const 테마변수맵 = {
      morning: {
        '--current-gradient': 'var(--morning-gradient)',
        '--current-bg': 'var(--morning-bg)',
        '--current-accent': 'var(--morning-accent)',
        '--current-bubble-bg': 'var(--morning-bubble-bg)',
        '--current-text': 'var(--morning-text)',
        '--current-shadow': 'var(--morning-shadow)',
        '--ai-hue': '270deg'
      },
      afternoon: {
        '--current-gradient': 'var(--afternoon-gradient)',
        '--current-bg': 'var(--afternoon-bg)',
        '--current-accent': 'var(--afternoon-accent)',
        '--current-bubble-bg': 'var(--afternoon-bubble-bg)',
        '--current-text': 'var(--afternoon-text)',
        '--current-shadow': 'var(--afternoon-shadow)',
        '--ai-hue': '30deg'
      },
      evening: {
        '--current-gradient': 'var(--evening-gradient)',
        '--current-bg': 'var(--evening-bg)',
        '--current-accent': 'var(--evening-accent)',
        '--current-bubble-bg': 'var(--evening-bubble-bg)',
        '--current-text': 'var(--evening-text)',
        '--current-shadow': 'var(--evening-shadow)',
        '--ai-hue': '330deg'
      },
      night: {
        '--current-gradient': 'var(--night-gradient)',
        '--current-bg': 'var(--night-bg)',
        '--current-accent': 'var(--night-accent)',
        '--current-bubble-bg': 'var(--night-bubble-bg)',
        '--current-text': 'var(--night-text)',
        '--current-shadow': 'var(--night-shadow)',
        '--ai-hue': '200deg'
      }
    };

    const 변수들 = 테마변수맵[테마];
    Object.entries(변수들).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // body에 테마 클래스 추가
    document.body.className = `theme-${테마}`;
  }

  useEffect(() => {
    // 초기 테마 적용
    테마적용(현재시간대.테마);

    // 1분마다 시간대 체크
    const 인터벌 = setInterval(() => {
      const 새시간대 = 시간대확인();
      if (새시간대.테마 !== 현재시간대.테마) {
        현재시간대설정(새시간대);
        테마적용(새시간대.테마);
      }
    }, 60000); // 1분

    return () => clearInterval(인터벌);
  }, [현재시간대.테마]);

  return 현재시간대;
};