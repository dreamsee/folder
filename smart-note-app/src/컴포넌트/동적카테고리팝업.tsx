import React, { useState, useRef, useEffect } from 'react';

interface 동적카테고리팝업속성 {
  팝업열림: boolean;
  선택된카테고리목록: string[];
  기존조합이름?: string; // 이전에 저장된 조합 이름이 있다면
  팝업닫기: () => void;
  조합이름확정: (조합이름: string) => void;
}

// 동적 카테고리 조합 이름 입력 팝업 컴포넌트
const 동적카테고리팝업: React.FC<동적카테고리팝업속성> = ({
  팝업열림,
  선택된카테고리목록,
  기존조합이름,
  팝업닫기,
  조합이름확정
}) => {
  const [카테고리줄목록, 카테고리줄목록설정] = useState<string[]>(['']);
  const 입력필드참조목록 = useRef<(HTMLInputElement | null)[]>([]);
  const 첫번째필드참조 = useRef<HTMLInputElement>(null);

  // 팝업이 열릴 때 기존 조합 이름이 있으면 로드
  useEffect(() => {
    if (팝업열림) {
      if (기존조합이름) {
        // 기존 조합 이름을 3글자씩 나누어 배열로 변환
        const 줄목록 = 기존조합이름.match(/.{1,3}/g) || [''];
        if (줄목록[줄목록.length - 1].length === 3) {
          줄목록.push(''); // 마지막에 빈 필드 추가
        }
        카테고리줄목록설정(줄목록);
      } else {
        카테고리줄목록설정(['']);
      }
      
      // 첫 번째 필드에 포커스
      setTimeout(() => {
        첫번째필드참조.current?.focus();
      }, 100);
    }
  }, [팝업열림, 기존조합이름]);

  // 팝업이 열리지 않았으면 렌더링하지 않음
  if (!팝업열림) return null;

  // 언어 타입 감지 함수
  const 언어타입감지 = (텍스트: string): '한글' | '영어' | '숫자' | '혼합' => {
    if (텍스트.length === 0) return '한글';
    
    let 한글수 = 0;
    let 영어수 = 0;
    let 숫자수 = 0;
    
    for (let i = 0; i < 텍스트.length; i++) {
      const 코드 = 텍스트.charCodeAt(i);
      
      // 한글 (완성형 + 조합형)
      if ((코드 >= 0xAC00 && 코드 <= 0xD7AF) || 
          (코드 >= 0x1100 && 코드 <= 0x11FF) || 
          (코드 >= 0x3130 && 코드 <= 0x318F)) {
        한글수++;
      }
      // 영어
      else if ((코드 >= 65 && 코드 <= 90) || (코드 >= 97 && 코드 <= 122)) {
        영어수++;
      }
      // 숫자
      else if (코드 >= 48 && 코드 <= 57) {
        숫자수++;
      }
    }
    
    const 전체수 = 한글수 + 영어수 + 숫자수;
    if (전체수 === 0) return '한글';
    
    if (한글수 / 전체수 > 0.5) return '한글';
    if (영어수 / 전체수 > 0.5) return '영어';
    if (숫자수 / 전체수 > 0.5) return '숫자';
    return '혼합';
  };

  // 언어별 최대 글자 수 계산
  const 최대글자수계산 = (현재텍스트: string): number => {
    const 언어타입 = 언어타입감지(현재텍스트);
    switch(언어타입) {
      case '한글': return 3;
      case '영어': return 7;
      case '숫자': return 6;
      case '혼합': return 5;
      default: return 3;
    }
  };

  // 한글 조합 중인지 확인하는 함수
  const 한글조합중인가 = (값: string): boolean => {
    if (값.length === 0) return false;
    const 마지막글자 = 값[값.length - 1];
    const 코드 = 마지막글자.charCodeAt(0);
    
    // 한글 조합 중인 글자 범위 (0x1100-0x11FF: 초성, 0x3130-0x318F: 호환 자모)
    return (코드 >= 0x1100 && 코드 <= 0x11FF) || (코드 >= 0x3130 && 코드 <= 0x318F);
  };

  // 다국어 지원 완성된 글자 수 계산 함수
  const 완성된글자수계산 = (값: string): number => {
    const 언어타입 = 언어타입감지(값);
    
    if (언어타입 === '한글') {
      // 한글: 완성형 글자만 카운트 (조합 중인 글자 제외)
      let 완성된글자수 = 0;
      for (let i = 0; i < 값.length; i++) {
        const 코드 = 값.charCodeAt(i);
        // 완성된 한글 (가-힣: 0xAC00-0xD7AF) 또는 기타 문자
        if ((코드 >= 0xAC00 && 코드 <= 0xD7AF) || 
            (코드 < 0x1100 || 코드 > 0x318F)) {
          완성된글자수++;
        }
      }
      return 완성된글자수;
    } else {
      // 영어, 숫자, 혼합: 모든 문자 카운트
      return 값.length;
    }
  };

  const 줄입력처리 = (인덱스: number, 값: string) => {
    const 새줄목록 = [...카테고리줄목록];
    새줄목록[인덱스] = 값;

    // 마지막 필드에 입력 시작하면 새 필드 추가
    if (인덱스 === 카테고리줄목록.length - 1 && 값.length > 0) {
      새줄목록.push('');
    }

    카테고리줄목록설정(새줄목록);

    // 언어별 최대 글자수에 도달하고 조합 중이 아닐 때만 다음 필드로 이동
    const 완성된글자수 = 완성된글자수계산(값);
    const 최대글자수 = 최대글자수계산(값);
    const 조합중 = 한글조합중인가(값);
    
    if (완성된글자수 >= 최대글자수 && !조합중) {
      setTimeout(() => {
        const 다음인덱스 = 인덱스 + 1;
        if (다음인덱스 < 입력필드참조목록.current.length || 인덱스 === 카테고리줄목록.length - 1) {
          입력필드참조목록.current[다음인덱스]?.focus();
        }
      }, 10);
    }
  };

  const 키입력처리 = (인덱스: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      확인하기();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      팝업닫기();
    } else if (e.key === 'Backspace' && (e.currentTarget as HTMLInputElement).value === '' && 카테고리줄목록.length > 1) {
      // 빈 필드에서 백스페이스 누르면 해당 필드 삭제
      const 새줄목록 = 카테고리줄목록.filter((_, i) => i !== 인덱스);
      카테고리줄목록설정(새줄목록);
      
      // 이전 필드로 포커스 이동
      const 이전인덱스 = Math.max(0, 인덱스 - 1);
      setTimeout(() => {
        입력필드참조목록.current[이전인덱스]?.focus();
      }, 0);
    }
  };

  const 확인하기 = () => {
    const 조합이름 = 카테고리줄목록.filter(줄 => 줄.trim().length > 0).join('');
    if (조합이름.trim().length > 0) {
      조합이름확정(조합이름.trim());
    } else {
      // 빈 이름이면 기본 조합 이름 사용
      조합이름확정(선택된카테고리목록.join(','));
    }
  };

  const 취소하기 = () => {
    카테고리줄목록설정(['']);
    팝업닫기();
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={팝업닫기}
      />
      
      {/* 팝업 내용 */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 2001,
        minWidth: '320px',
        maxWidth: '400px'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* 팝업 헤더 */}
        <div style={{ 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '18px',
            color: '#333'
          }}>
            🏷️ 카테고리 조합 이름 입력
          </h3>
          <div style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px'
          }}>
            선택된 카테고리: {선택된카테고리목록.join(', ')}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#999'
          }}>
            한글 3글자, 영어 7글자, 숫자 6글자까지 입력 가능
          </div>
        </div>

        {/* 동적 입력 필드들 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          {카테고리줄목록.map((줄, 인덱스) => {
            const 현재최대글자수 = 최대글자수계산(줄);
            return (
              <input
                key={인덱스}
                ref={인덱스 === 0 ? 첫번째필드참조 : (el) => { 입력필드참조목록.current[인덱스] = el; }}
                value={줄}
                maxLength={현재최대글자수}
                onChange={(e) => 줄입력처리(인덱스, e.target.value)}
              onKeyDown={(e) => 키입력처리(인덱스, e)}
              placeholder="___"
              style={{
                width: '60px',
                height: '40px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '2px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: 줄.length > 0 ? '#f8f9fa' : 'white'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#007bff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd';
              }}
            />
          );
          })}
        </div>

        {/* 미리보기 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            미리보기:
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: '#333',
            minHeight: '20px',
            whiteSpace: 'pre-line',
            lineHeight: '1.4'
          }}>
            {카테고리줄목록.filter(줄 => 줄.trim().length > 0).join('\n') || '(입력하세요)'}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button 
            onClick={취소하기}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            취소
          </button>
          <button 
            onClick={확인하기}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              border: '1px solid #007bff',
              borderRadius: '6px',
              backgroundColor: '#007bff',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff';
            }}
          >
            확인
          </button>
        </div>

        {/* 도움말 */}
        <div style={{
          marginTop: '16px',
          fontSize: '11px',
          color: '#999',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          💡 팁: Enter로 확인, Esc로 취소, 백스페이스로 필드 삭제<br/>
          언어별 자동 감지로 최적 글자 수 적용
        </div>
      </div>
    </>
  );
};

export default 동적카테고리팝업;