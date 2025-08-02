import React, { useState, useCallback, useEffect, useRef } from 'react';

interface 크기조절분할선속성 {
  방향: '가로' | '세로';  // 가로: 상하 분할, 세로: 좌우 분할  
  초기비율?: number;  // 0.0 ~ 1.0 사이 값 (기본값: 0.3)
  최소비율?: number;  // 최소 크기 비율 (기본값: 0.1)
  최대비율?: number;  // 최대 크기 비율 (기본값: 0.9)
  저장키?: string;    // localStorage 저장용 키
  비율변경시?: (비율: number) => void;
}

const 크기조절분할선: React.FC<크기조절분할선속성> = ({
  방향,
  초기비율 = 0.3,
  최소비율 = 0.1,
  최대비율 = 0.9,
  저장키,
  비율변경시
}) => {
  // 저장된 비율 불러오기 또는 초기값 사용
  const 저장된비율불러오기 = useCallback(() => {
    if (저장키) {
      const 저장된값 = localStorage.getItem(저장키);
      if (저장된값) {
        const 비율 = parseFloat(저장된값);
        if (비율 >= 최소비율 && 비율 <= 최대비율) {
          return 비율;
        }
      }
    }
    return 초기비율;
  }, [저장키, 초기비율, 최소비율, 최대비율]);

  const [분할비율, 분할비율설정] = useState<number>(저장된비율불러오기);
  const [드래그중, 드래그중설정] = useState(false);
  const 컨테이너참조 = useRef<HTMLDivElement>(null);

  // 비율 저장하기
  const 비율저장하기 = useCallback((새비율: number) => {
    if (저장키) {
      localStorage.setItem(저장키, 새비율.toString());
    }
  }, [저장키]);

  // 비율 업데이트 함수
  const 비율업데이트 = useCallback((새비율: number) => {
    const 제한된비율 = Math.max(최소비율, Math.min(최대비율, 새비율));
    분할비율설정(제한된비율);
    비율저장하기(제한된비율);
    비율변경시?.(제한된비율);
  }, [최소비율, 최대비율, 비율저장하기, 비율변경시]);

  // 마우스 다운 이벤트 처리
  const 마우스다운처리 = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    드래그중설정(true);
    
    // 전역 이벤트 리스너 추가
    const 마우스이동처리 = (moveEvent: MouseEvent) => {
      if (!컨테이너참조.current) return;

      const 컨테이너영역 = 컨테이너참조.current.getBoundingClientRect();
      let 새비율: number;

      if (방향 === '가로') {
        // 상하 분할: Y 좌표 기준
        const 상대위치 = moveEvent.clientY - 컨테이너영역.top;
        새비율 = 상대위치 / 컨테이너영역.height;
      } else {
        // 좌우 분할: X 좌표 기준  
        const 상대위치 = moveEvent.clientX - 컨테이너영역.left;
        새비율 = 상대위치 / 컨테이너영역.width;
      }

      비율업데이트(새비율);
    };

    const 마우스업처리 = () => {
      드래그중설정(false);
      document.removeEventListener('mousemove', 마우스이동처리);
      document.removeEventListener('mouseup', 마우스업처리);
    };

    document.addEventListener('mousemove', 마우스이동처리);
    document.addEventListener('mouseup', 마우스업처리);
  }, [방향, 비율업데이트]);

  // 키보드 접근성
  const 키입력처리 = useCallback((e: React.KeyboardEvent) => {
    const 이동단위 = 0.05;  // 5% 단위로 이동
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      비율업데이트(분할비율 - 이동단위);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      비율업데이트(분할비율 + 이동단위);
    }
  }, [분할비율, 비율업데이트]);

  // 초기 렌더링 시 부모에게 현재 비율 전달
  useEffect(() => {
    비율변경시?.(분할비율);
  }, []);

  const 분할선스타일: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    cursor: 방향 === '가로' ? 'row-resize' : 'col-resize',
    backgroundColor: 드래그중 ? '#007bff' : '#e0e0e0',
    transition: 드래그중 ? 'none' : 'background-color 0.2s',
    userSelect: 'none',
  };

  if (방향 === '가로') {
    // 상하 분할선
    Object.assign(분할선스타일, {
      top: `${분할비율 * 100}%`,
      left: 0,
      right: 0,
      height: '4px',
      transform: 'translateY(-2px)',
    });
  } else {
    // 좌우 분할선
    Object.assign(분할선스타일, {
      left: `${분할비율 * 100}%`,
      top: 0,
      bottom: 0,
      width: '4px',
      transform: 'translateX(-2px)',
    });
  }

  // 호버 영역 확장 (클릭하기 쉽게)
  const 호버영역스타일: React.CSSProperties = {
    position: 'absolute',
    zIndex: 9,
    cursor: 방향 === '가로' ? 'row-resize' : 'col-resize',
  };

  if (방향 === '가로') {
    Object.assign(호버영역스타일, {
      top: `${분할비율 * 100}%`,
      left: 0,
      right: 0,
      height: '12px',
      transform: 'translateY(-6px)',
    });
  } else {
    Object.assign(호버영역스타일, {
      left: `${분할비율 * 100}%`,
      top: 0,
      bottom: 0,
      width: '12px',
      transform: 'translateX(-6px)',
    });
  }

  return (
    <div ref={컨테이너참조} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 첫 번째 패널 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 방향 === '세로' ? `${(1 - 분할비율) * 100}%` : 0,
        bottom: 방향 === '가로' ? `${(1 - 분할비율) * 100}%` : 0,
        overflow: 'hidden'
      }}>
        {/* 첫 번째 패널 내용은 부모에서 전달 */}
      </div>

      {/* 두 번째 패널 */}
      <div style={{
        position: 'absolute',
        top: 방향 === '가로' ? `${분할비율 * 100}%` : 0,
        left: 방향 === '세로' ? `${분할비율 * 100}%` : 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}>
        {/* 두 번째 패널 내용은 부모에서 전달 */}
      </div>

      {/* 호버 영역 (클릭하기 쉽게) */}
      <div
        style={호버영역스타일}
        onMouseDown={마우스다운처리}
        onKeyDown={키입력처리}
        tabIndex={0}
        role="separator"
        aria-label={`${방향} 분할선`}
        aria-valuenow={Math.round(분할비율 * 100)}
        aria-valuemin={Math.round(최소비율 * 100)}
        aria-valuemax={Math.round(최대비율 * 100)}
        title={`드래그하여 크기 조절 (현재: ${Math.round(분할비율 * 100)}%)`}
      />

      {/* 실제 분할선 */}
      <div style={분할선스타일} />
    </div>
  );
};

export default 크기조절분할선;