import React, { useRef, useEffect } from 'react';

interface 동적카테고리입력속성 {
  카테고리줄목록: string[];
  카테고리줄목록설정: (줄목록: string[]) => void;
  선택됨: boolean;
  온클릭: () => void;
}

// 동적 카테고리 입력 필드 컴포넌트
const 동적카테고리입력: React.FC<동적카테고리입력속성> = ({
  카테고리줄목록,
  카테고리줄목록설정,
  선택됨,
  온클릭
}) => {
  const 입력필드참조목록 = useRef<(HTMLInputElement | null)[]>([]);

  // 입력 필드 참조 배열 크기 조정
  useEffect(() => {
    입력필드참조목록.current = 입력필드참조목록.current.slice(0, 카테고리줄목록.length);
  }, [카테고리줄목록.length]);

  const 줄입력처리 = (인덱스: number, 값: string) => {
    const 새줄목록 = [...카테고리줄목록];
    새줄목록[인덱스] = 값;
    
    // 마지막 필드에 입력 시작하면 새 필드 추가
    if (인덱스 === 카테고리줄목록.length - 1 && 값.length > 0) {
      새줄목록.push('');
    }
    
    카테고리줄목록설정(새줄목록);
  };

  const 키입력처리 = (인덱스: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const 타겟 = e.target as HTMLInputElement;
    
    // 3글자 채우면 자동으로 다음 필드로 이동
    if (타겟.value.length >= 3 && 인덱스 < 카테고리줄목록.length - 1) {
      setTimeout(() => {
        입력필드참조목록.current[인덱스 + 1]?.focus();
      }, 0);
    }
    
    // 빈 필드에서 백스페이스시 필드 삭제
    if (e.key === 'Backspace' && 타겟.value === '' && 카테고리줄목록.length > 1) {
      e.preventDefault();
      const 새줄목록 = 카테고리줄목록.filter((_, i) => i !== 인덱스);
      카테고리줄목록설정(새줄목록);
      
      // 이전 필드로 포커스 이동
      if (인덱스 > 0) {
        setTimeout(() => {
          입력필드참조목록.current[인덱스 - 1]?.focus();
        }, 0);
      }
    }
  };

  const 카테고리클릭 = () => {
    // 빈 줄 제거하고 유효한 카테고리만 전달
    const 유효한줄목록 = 카테고리줄목록.filter(줄 => 줄.length > 0);
    if (유효한줄목록.length > 0) {
      온클릭();
    }
  };

  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        border: `2px solid ${선택됨 ? '#007bff' : '#ddd'}`,
        borderRadius: '8px',
        backgroundColor: 선택됨 ? '#e7f3ff' : 'white',
        minWidth: '60px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onClick={카테고리클릭}
    >
      {/* 동적 입력 필드들 */}
      {카테고리줄목록.map((줄, 인덱스) => (
        <input
          key={인덱스}
          ref={el => { 입력필드참조목록.current[인덱스] = el; }}
          value={줄}
          maxLength={3}
          onChange={(e) => 줄입력처리(인덱스, e.target.value)}
          onKeyDown={(e) => 키입력처리(인덱스, e)}
          onClick={(e) => e.stopPropagation()} // 클릭 시 버블링 방지
          placeholder="___"
          style={{
            width: '40px',
            height: '24px',
            textAlign: 'center',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '2px',
            fontSize: '12px',
            outline: 'none'
          }}
        />
      ))}
      
      {/* 완성된 카테고리 미리보기 */}
      {카테고리줄목록.some(줄 => 줄.length > 0) && (
        <div style={{ 
          fontSize: '10px', 
          color: '#666', 
          marginTop: '4px',
          textAlign: 'center'
        }}>
          {카테고리줄목록.filter(줄 => 줄.length > 0).join('')}
        </div>
      )}
    </div>
  );
};

export default 동적카테고리입력;