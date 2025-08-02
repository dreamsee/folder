import React, { useState, useCallback, useEffect, useRef } from 'react';

interface 노트분할선속성 {
  방향: '가로' | '세로';  // 가로: 상하 분할, 세로: 좌우 분할  
  초기비율?: number;  // 0.0 ~ 1.0 사이 값 (기본값: 0.6)
  최소비율?: number;  // 최소 크기 비율 (기본값: 0.2)
  최대비율?: number;  // 최대 크기 비율 (기본값: 0.8)
  저장키?: string;    // localStorage 저장용 키
  비율변경시?: (비율: number) => void;
  상단컨텐츠: React.ReactNode;
  하단컨텐츠: React.ReactNode;
}

const 노트분할선: React.FC<노트분할선속성> = ({
  방향,
  초기비율 = 0.6,
  최소비율 = 0.2,
  최대비율 = 0.8,
  저장키 = '게임밸런스-노트분할비율',
  비율변경시,
  상단컨텐츠,
  하단컨텐츠
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
    
    const 마우스이동처리 = (moveEvent: MouseEvent) => {
      if (!컨테이너참조.current) return;

      const 컨테이너영역 = 컨테이너참조.current.getBoundingClientRect();
      let 새비율: number;

      if (방향 === '가로') {
        const 상대위치 = moveEvent.clientY - 컨테이너영역.top;
        새비율 = 상대위치 / 컨테이너영역.height;
      } else {
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

  // 초기 렌더링 시 부모에게 현재 비율 전달
  useEffect(() => {
    비율변경시?.(분할비율);
  }, []);

  return (
    <div ref={컨테이너참조} className="relative w-full h-full">
      {/* 첫 번째 패널 (상단 또는 좌측) */}
      <div 
        className="absolute overflow-hidden"
        style={{
          top: 0,
          left: 0,
          right: 방향 === '세로' ? `${(1 - 분할비율) * 100}%` : 0,
          bottom: 방향 === '가로' ? `${(1 - 분할비율) * 100}%` : 0,
        }}
      >
        {상단컨텐츠}
      </div>

      {/* 두 번째 패널 (하단 또는 우측) */}
      <div 
        className="absolute overflow-hidden"
        style={{
          top: 방향 === '가로' ? `${분할비율 * 100}%` : 0,
          left: 방향 === '세로' ? `${분할비율 * 100}%` : 0,
          right: 0,
          bottom: 0,
        }}
      >
        {하단컨텐츠}
      </div>

      {/* 분할선 호버 영역 */}
      <div
        className={`
          absolute z-10 
          ${방향 === '가로' ? 'cursor-row-resize' : 'cursor-col-resize'}
          ${방향 === '가로' 
            ? 'left-0 right-0 h-3 -translate-y-1.5' 
            : 'top-0 bottom-0 w-3 -translate-x-1.5'
          }
          hover:bg-blue-500 hover:bg-opacity-20 transition-colors
        `}
        style={{
          [방향 === '가로' ? 'top' : 'left']: `${분할비율 * 100}%`,
        }}
        onMouseDown={마우스다운처리}
        title="드래그하여 크기 조절"
      />

      {/* 실제 분할선 */}
      <div
        className={`
          absolute z-10 bg-gray-300 transition-colors
          ${드래그중 ? 'bg-blue-500' : 'hover:bg-gray-400'}
          ${방향 === '가로' 
            ? 'left-0 right-0 h-0.5 -translate-y-px' 
            : 'top-0 bottom-0 w-0.5 -translate-x-px'
          }
        `}
        style={{
          [방향 === '가로' ? 'top' : 'left']: `${분할비율 * 100}%`,
        }}
      />
    </div>
  );
};

export default 노트분할선;