import React, { useState, useRef, useEffect } from 'react';
import { 태그색상가져오기, 태그유효성검사, 태그중복제거, 태그검색 } from '../유틸/태그관리';

interface 태그입력속성 {
  태그목록: string[];
  태그목록변경: (새태그목록: string[]) => void;
  전체태그목록?: string[]; // 자동완성용
  플레이스홀더?: string;
}

const 태그입력: React.FC<태그입력속성> = ({
  태그목록,
  태그목록변경,
  전체태그목록 = [],
  플레이스홀더 = "태그 입력 후 Enter"
}) => {
  const [입력값, 입력값설정] = useState('');
  const [자동완성표시, 자동완성표시설정] = useState(false);
  const [자동완성목록, 자동완성목록설정] = useState<string[]>([]);
  const [선택인덱스, 선택인덱스설정] = useState(-1);
  const 입력참조 = useRef<HTMLInputElement>(null);

  // 자동완성 목록 업데이트
  useEffect(() => {
    if (입력값) {
      const 검색결과 = 태그검색(전체태그목록, 입력값, 5);
      자동완성목록설정(검색결과);
      자동완성표시설정(검색결과.length > 0);
    } else {
      자동완성표시설정(false);
      자동완성목록설정([]);
    }
    선택인덱스설정(-1);
  }, [입력값, 전체태그목록]);

  const 태그추가 = (태그: string) => {
    const 정리된태그 = 태그.trim();
    
    if (태그유효성검사(정리된태그) && !태그목록.includes(정리된태그)) {
      const 새태그목록 = 태그중복제거([...태그목록, 정리된태그]);
      태그목록변경(새태그목록);
    }
    
    입력값설정('');
    자동완성표시설정(false);
  };

  const 태그제거 = (제거할태그: string) => {
    태그목록변경(태그목록.filter(태그 => 태그 !== 제거할태그));
  };

  const 키입력처리 = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (자동완성표시 && 자동완성목록.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        선택인덱스설정(prev => 
          prev < 자동완성목록.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        선택인덱스설정(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.key === 'Enter' && 선택인덱스 >= 0) {
        e.preventDefault();
        태그추가(자동완성목록[선택인덱스]);
      } else if (e.key === 'Escape') {
        자동완성표시설정(false);
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey && 선택인덱스 === -1) {
      e.preventDefault();
      if (입력값) {
        태그추가(입력값);
      }
    } else if (e.key === 'Backspace' && !입력값 && 태그목록.length > 0) {
      // 입력값이 없을 때 백스페이스로 마지막 태그 제거
      태그목록변경(태그목록.slice(0, -1));
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 태그 입력 영역 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '8px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#f8f9fa',
        minHeight: '40px',
        alignItems: 'center',
        cursor: 'text'
      }}
      onClick={() => 입력참조.current?.focus()}>
        {/* 기존 태그들 */}
        {태그목록.map((태그) => (
          <span
            key={태그}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 태그색상가져오기(태그),
              color: 'white',
              borderRadius: '12px',
              fontWeight: '500'
            }}
          >
            {태그}
            <button
              onClick={(e) => {
                e.stopPropagation();
                태그제거(태그);
              }}
              style={{
                marginLeft: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: '1',
                padding: '0 2px'
              }}
            >
              ×
            </button>
          </span>
        ))}
        
        {/* 입력 필드 */}
        <input
          ref={입력참조}
          type="text"
          value={입력값}
          onChange={(e) => 입력값설정(e.target.value)}
          onKeyDown={키입력처리}
          placeholder={태그목록.length === 0 ? 플레이스홀더 : ''}
          style={{
            flex: '1',
            minWidth: '100px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: '13px',
            padding: '4px'
          }}
        />
      </div>

      {/* 자동완성 드롭다운 */}
      {자동완성표시 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxHeight: '150px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {자동완성목록.map((추천태그, 인덱스) => (
            <div
              key={추천태그}
              onClick={() => 태그추가(추천태그)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: 선택인덱스 === 인덱스 ? '#f0f0f0' : 'white',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={() => 선택인덱스설정(인덱스)}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 태그색상가져오기(추천태그)
                }}
              />
              {추천태그}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default 태그입력;