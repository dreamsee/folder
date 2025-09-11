import React, { useState, useEffect } from 'react';
import { 노트타입 } from '../타입';

interface 목차네비게이션속성 {
  노트목록: 노트타입[];
  활성노트아이디?: string;
}

// 목차 네비게이션 컴포넌트
const 목차네비게이션: React.FC<목차네비게이션속성> = ({ 노트목록, 활성노트아이디 }) => {
  const [현재활성노트, 현재활성노트설정] = useState<string>('');
  const [목차표시여부, 목차표시여부설정] = useState(false);


  // 스크롤 이벤트 리스너로 현재 보이는 노트 감지
  useEffect(() => {
    const 스크롤감지 = () => {
      const 노트요소들 = 노트목록.map(노트 => 
        document.getElementById(`노트-${노트.아이디}`)
      ).filter(Boolean);

      // 화면에 가장 많이 보이는 노트를 찾기
      let 최적노트아이디 = '';
      let 최대가시영역 = 0;

      for (const 노트요소 of 노트요소들) {
        if (노트요소) {
          const 위치정보 = 노트요소.getBoundingClientRect();
          const 스크롤컨테이너 = document.querySelector('.노트패널-컨테이너');
          
          if (스크롤컨테이너) {
            const 컨테이너위치 = 스크롤컨테이너.getBoundingClientRect();
            
            // 컨테이너 내에서의 가시 영역 계산
            const 상단경계 = Math.max(위치정보.top, 컨테이너위치.top);
            const 하단경계 = Math.min(위치정보.bottom, 컨테이너위치.bottom);
            const 가시영역 = Math.max(0, 하단경계 - 상단경계);
            
            if (가시영역 > 최대가시영역) {
              최대가시영역 = 가시영역;
              최적노트아이디 = 노트요소.id.replace('노트-', '');
            }
          }
        }
      }

      if (최적노트아이디) {
        현재활성노트설정(최적노트아이디);
      }
    };

    const 스크롤컨테이너 = document.querySelector('.노트패널-컨테이너');
    if (스크롤컨테이너) {
      스크롤감지(); // 초기 실행
      스크롤컨테이너.addEventListener('scroll', 스크롤감지);
      return () => 스크롤컨테이너.removeEventListener('scroll', 스크롤감지);
    }
  }, [노트목록]);

  const 노트로이동 = (노트아이디: string) => {
    const 타겟요소 = document.getElementById(`노트-${노트아이디}`);
    if (타겟요소) {
      // 즉시 활성 노트 업데이트
      현재활성노트설정(노트아이디);
      
      // 스크롤 이동
      타겟요소.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      
      // 약간의 지연 후 다시 활성 노트 설정 (스크롤 완료 후 확실히 하기 위해)
      setTimeout(() => {
        현재활성노트설정(노트아이디);
      }, 500);
    }
  };

  // 노트가 3개 이하면 목차를 표시하지 않음
  if (노트목록.length <= 3) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      right: '0px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 9999,
      maxHeight: '60vh',
      overflowY: 'auto'
    }}>
      {/* 목차 토글 버튼 - 모던하고 세련된 디자인 */}
      <button
        onClick={() => 목차표시여부설정(!목차표시여부)}
        style={{
          position: 'relative',
          right: 목차표시여부 ? '0px' : '-25px',
          top: '0',
          width: '55px',
          height: '55px',
          background: 목차표시여부 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '27px 0 0 27px',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 목차표시여부 
            ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(118, 75, 162, 0.3)'
            : '0 8px 32px rgba(79, 172, 254, 0.4), 0 4px 16px rgba(0, 242, 254, 0.3)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: 목차표시여부 ? 'scale(1.05)' : 'scale(1)',
          zIndex: 10000,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 목차표시여부 ? 'scale(1.1)' : 'scale(1.05)';
          e.currentTarget.style.boxShadow = 목차표시여부 
            ? '0 12px 48px rgba(102, 126, 234, 0.6), 0 6px 24px rgba(118, 75, 162, 0.4)'
            : '0 12px 48px rgba(79, 172, 254, 0.6), 0 6px 24px rgba(0, 242, 254, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 목차표시여부 ? 'scale(1.05)' : 'scale(1)';
          e.currentTarget.style.boxShadow = 목차표시여부 
            ? '0 8px 32px rgba(102, 126, 234, 0.4), 0 4px 16px rgba(118, 75, 162, 0.3)'
            : '0 8px 32px rgba(79, 172, 254, 0.4), 0 4px 16px rgba(0, 242, 254, 0.3)';
        }}
        title="목차 표시/숨기기"
      >
        <span style={{
          transform: 목차표시여부 ? 'rotate(0deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          {목차표시여부 ? '✕' : '📋'}
        </span>
      </button>

      {/* 목차 패널 */}
      {목차표시여부 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(79, 172, 254, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 8px 24px rgba(79, 172, 254, 0.15)',
          padding: '20px',
          minWidth: window.innerWidth < 768 ? '280px' : '320px',
          maxWidth: window.innerWidth < 768 ? '300px' : '350px',
          marginRight: '55px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#333',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            borderBottom: '2px solid rgba(79, 172, 254, 0.2)',
            paddingBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#4facfe' }}>📋</span>
            <span>목차 ({노트목록.length}개)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {노트목록.map((노트, 인덱스) => {
              const 활성상태 = 현재활성노트 === 노트.아이디;
              return (
                <button
                  key={노트.아이디}
                  onClick={() => 노트로이동(노트.아이디)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    border: 활성상태 ? '2px solid #4facfe' : '2px solid transparent',
                    borderRadius: '8px',
                    background: 활성상태 
                      ? 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)'
                      : 'transparent',
                    color: 활성상태 ? '#0066cc' : '#555',
                    cursor: 'pointer',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: 활성상태 ? 'translateX(4px)' : 'translateX(0)',
                    boxShadow: 활성상태 
                      ? '0 4px 12px rgba(79, 172, 254, 0.3)' 
                      : '0 2px 4px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!활성상태) {
                      e.currentTarget.style.backgroundColor = 'rgba(79, 172, 254, 0.05)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(79, 172, 254, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!활성상태) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }
                  }}
                  title={노트.제목}
                >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ 
                    color: '#999', 
                    fontSize: '11px',
                    minWidth: '20px'
                  }}>
                    {인덱스 + 1}.
                  </span>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {노트.제목 || '제목 없음'}
                  </span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#999',
                  marginTop: '2px',
                  marginLeft: '26px'
                }}>
                  {노트.채팅메시지목록.length}개 메시지
                </div>
              </button>
              );
            })}
          </div>

          {/* 하단 도움말 */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.5',
            border: '1px solid rgba(79, 172, 254, 0.1)'
          }}>
            <span style={{ color: '#4facfe', fontSize: '14px' }}>💡</span> 노트를 클릭하면 해당 위치로 스무스하게 이동합니다
          </div>
        </div>
      )}
    </div>
  );
};

export default 목차네비게이션;