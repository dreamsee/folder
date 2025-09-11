import { useState, useCallback } from 'react';

export interface 드래그이벤트 {
  메시지아이디: string;
  텍스트: string;
  드래그패턴: '짧게' | '길게' | '원형' | '위로' | '옆으로';
  시작위치: { x: number; y: number };
  끝위치: { x: number; y: number };
}

interface 드래그상태 {
  드래그중: boolean;
  드래그아이템: string | null;
  드롭존활성: boolean;
}

export const useDragAndDrop = (
  온드래그완료?: (이벤트: 드래그이벤트) => void
) => {
  const [드래그상태, 드래그상태설정] = useState<드래그상태>({
    드래그중: false,
    드래그아이템: null,
    드롭존활성: false
  });

  // 드래그 패턴 분석
  const 드래그패턴분석 = useCallback((
    시작위치: { x: number; y: number },
    끝위치: { x: number; y: number }
  ): 드래그이벤트['드래그패턴'] => {
    const X차이 = 끝위치.x - 시작위치.x;
    const Y차이 = 끝위치.y - 시작위치.y;
    const 거리 = Math.sqrt(X차이 * X차이 + Y차이 * Y차이);
    const 각도 = Math.atan2(Y차이, X차이) * 180 / Math.PI;

    // 원형 패턴 감지
    if (거리 > 100) {
      const 절대각도 = Math.abs(각도);
      if (절대각도 > 135 && 절대각도 < 225) {
        return '원형';
      }
    }

    // 거리 기반 패턴
    if (거리 < 50) return '짧게';
    if (거리 > 200) return '길게';

    // 방향 기반 패턴
    if (Y차이 < -50) return '위로';
    if (Math.abs(X차이) > Math.abs(Y차이)) return '옆으로';

    return '길게'; // 기본값
  }, []);

  // 물결 효과 생성
  const 물결효과생성 = useCallback((
    요소: HTMLElement,
    이벤트: React.MouseEvent
  ) => {
    const 물결 = document.createElement('span');
    const 크기 = Math.max(요소.offsetWidth,요소.offsetHeight);
    const 반지름 = 크기 / 2;

    물결.style.width = `${크기}px`;
    물결.style.height = `${크기}px`;
    물결.classList.add('ripple');

    const 영역 = 요소.getBoundingClientRect();
    물결.style.left = `${이벤트.clientX - 영역.left - 반지름}px`;
    물결.style.top = `${이벤트.clientY - 영역.top - 반지름}px`;

    요소.appendChild(물결);

    // 애니메이션 후 제거
    setTimeout(() => {
      물결.remove();
    }, 600);
  }, []);

  // 드래그 시작
  const 드래그시작 = useCallback((
    메시지아이디: string,
    시작위치: { x: number; y: number }
  ) => {
    드래그상태설정(이전상태 => ({
      ...이전상태,
      드래그중: true,
      드래그아이템: 메시지아이디
    }));

    // 햅틱 피드백 (지원하는 경우)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  // 드래그 중
  const 드래그중 = useCallback((위치: { x: number; y: number }) => {
    // 드롭존 감지 및 하이라이트
    const 드롭존요소 = document.elementsFromPoint(위치.x, 위치.y)
      .find(el => el.classList.contains('drop-zone'));

    드래그상태설정(이전상태 => ({
      ...이전상태,
      드롭존활성: !!드롭존요소
    }));
  }, []);

  // 드래그 완료
  const 드래그완료 = useCallback((
    메시지아이디: string,
    텍스트: string,
    시작위치: { x: number; y: number },
    끝위치: { x: number; y: number }
  ) => {
    const 패턴 = 드래그패턴분석(시작위치, 끝위치);

    드래그상태설정({
      드래그중: false,
      드래그아이템: null,
      드롭존활성: false
    });

    // 드래그 완료 이벤트 호출
    if (온드래그완료) {
      온드래그완료({
        메시지아이디,
        텍스트,
        드래그패턴: 패턴,
        시작위치,
        끝위치
      });
    }

    // 성취감 햅틱
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [드래그패턴분석, 온드래그완료]);

  return {
    드래그상태,
    드래그시작,
    드래그중,
    드래그완료,
    물결효과생성
  };
};