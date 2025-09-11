import React, { useState, useMemo } from 'react';
import { 폴더타입 } from '../타입';
import { 태그색상가져오기, 태그빈도계산, 인기태그추출 } from '../유틸/태그관리';

interface 태그클라우드속성 {
  폴더목록: 폴더타입[];
  활성폴더: 폴더타입 | null;
  선택된태그목록: string[];
  태그선택변경: (태그목록: string[]) => void;
  최대태그수?: number;
}

const 태그클라우드: React.FC<태그클라우드속성> = ({
  폴더목록,
  활성폴더,
  선택된태그목록,
  태그선택변경,
  최대태그수 = 15
}) => {
  const [표시모드, 표시모드설정] = useState<'전체' | '폴더'>('폴더');

  // 활성 폴더의 태그 빈도 계산
  const 폴더태그빈도 = useMemo(() => {
    if (!활성폴더 || 표시모드 === '전체') return new Map<string, number>();
    
    const 모든태그목록 = 활성폴더.노트목록
      .map(노트 => 노트.태그목록 || [])
      .filter(태그목록 => 태그목록.length > 0);
    
    return 태그빈도계산(모든태그목록);
  }, [활성폴더, 표시모드]);

  // 전체 폴더의 태그 빈도 계산
  const 전체태그빈도 = useMemo(() => {
    if (표시모드 === '폴더') return new Map<string, number>();
    
    const 모든태그목록 = 폴더목록
      .flatMap(폴더 => 폴더.노트목록)
      .map(노트 => 노트.태그목록 || [])
      .filter(태그목록 => 태그목록.length > 0);
    
    return 태그빈도계산(모든태그목록);
  }, [폴더목록, 표시모드]);

  // 현재 모드에 따른 태그 목록
  const 현재태그빈도 = 표시모드 === '폴더' ? 폴더태그빈도 : 전체태그빈도;
  const 인기태그목록 = useMemo(() => {
    return 인기태그추출(현재태그빈도, 최대태그수);
  }, [현재태그빈도, 최대태그수]);

  const 태그클릭 = (태그: string) => {
    const 새선택목록 = 선택된태그목록.includes(태그)
      ? 선택된태그목록.filter(t => t !== 태그)
      : [...선택된태그목록, 태그];
    
    태그선택변경(새선택목록);
  };

  const 모든태그해제 = () => {
    태그선택변경([]);
  };

  // 태그 크기 계산 (빈도에 따라)
  const 태그크기계산 = (빈도: number, 최대빈도: number): number => {
    const 최소크기 = 11;
    const 최대크기 = 16;
    const 비율 = 빈도 / 최대빈도;
    return 최소크기 + (최대크기 - 최소크기) * 비율;
  };

  const 최대빈도 = Math.max(...인기태그목록.map(t => t.빈도), 1);

  if (인기태그목록.length === 0) {
    return (
      <div style={{
        padding: '16px',
        textAlign: 'center',
        color: '#999',
        fontSize: '12px'
      }}>
        아직 태그가 없습니다.<br />
        노트에 태그를 추가해보세요!
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e0e0e0'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>
          🏷️ 태그
        </div>
        
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* 모드 전환 버튼 */}
          <button
            onClick={() => 표시모드설정(표시모드 === '폴더' ? '전체' : '폴더')}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              border: '1px solid #ddd',
              borderRadius: '12px',
              backgroundColor: 'white',
              cursor: 'pointer',
              color: '#666'
            }}
            title={표시모드 === '폴더' ? '전체 폴더 태그 보기' : '현재 폴더 태그만 보기'}
          >
            {표시모드 === '폴더' ? '폴더' : '전체'}
          </button>
          
          {/* 선택 해제 버튼 */}
          {선택된태그목록.length > 0 && (
            <button
              onClick={모든태그해제}
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                border: '1px solid #ff6b6b',
                borderRadius: '12px',
                backgroundColor: 'white',
                cursor: 'pointer',
                color: '#ff6b6b'
              }}
              title="모든 태그 선택 해제"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 태그 클라우드 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        lineHeight: '1.4'
      }}>
        {인기태그목록.map(({ 태그, 빈도 }) => {
          const 선택됨 = 선택된태그목록.includes(태그);
          const 태그크기 = 태그크기계산(빈도, 최대빈도);
          
          return (
            <button
              key={태그}
              onClick={() => 태그클릭(태그)}
              style={{
                padding: '4px 8px',
                fontSize: `${태그크기}px`,
                fontWeight: 선택됨 ? '600' : '400',
                border: 선택됨 ? `2px solid ${태그색상가져오기(태그)}` : '1px solid #ddd',
                borderRadius: '12px',
                backgroundColor: 선택됨 ? 태그색상가져오기(태그) : 'white',
                color: 선택됨 ? 'white' : '#555',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: 선택됨 ? 1 : 0.8
              }}
              onMouseEnter={(e) => {
                if (!선택됨) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!선택됨) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
              title={`${태그} (${빈도}개 노트)`}
            >
              {태그}
              <span style={{ 
                marginLeft: '4px', 
                fontSize: `${Math.max(태그크기 - 2, 9)}px`,
                opacity: 0.8 
              }}>
                {빈도}
              </span>
            </button>
          );
        })}
      </div>

      {/* 선택된 태그 정보 */}
      {선택된태그목록.length > 0 && (
        <div style={{
          marginTop: '8px',
          fontSize: '10px',
          color: '#666',
          textAlign: 'center'
        }}>
          {선택된태그목록.length}개 태그로 필터링 중
        </div>
      )}
    </div>
  );
};

export default 태그클라우드;