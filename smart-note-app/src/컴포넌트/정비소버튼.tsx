import React, { useState } from 'react';

interface 정비소버튼Props {
  className?: string;
}

const 정비소버튼: React.FC<정비소버튼Props> = ({ className = '' }) => {
  const [정비소창열림, 정비소창열림설정] = useState(false);

  const 정비소열기 = () => {
    const 정비소URL = 'file:///C:/Users/ksj/OneDrive/바탕 화면/gemini/제작파일/note-garage/간단한_정비소.html'; // HTML 버전 정비소
    
    // 현재 노트 정보를 정비소로 전송 (미래 확장용)
    const 노트데이터 = {
      type: 'smart-note-editing',
      timestamp: new Date().toISOString(),
      source: 'smart-note-app'
    };
    
    const 정비소파라미터 = `?data=${encodeURIComponent(JSON.stringify(노트데이터))}`;
    const 최종URL = `${정비소URL}${정비소파라미터}`;
    
    // 새 창에서 정비소 열기
    const 정비소창 = window.open(
      최종URL, 
      '노트정비소', 
      'width=1400,height=900,scrollbars=yes,resizable=yes'
    );
    
    if (정비소창) {
      정비소창열림설정(true);
      
      // 정비소 창이 닫히면 상태 업데이트
      const 창상태체크 = setInterval(() => {
        if (정비소창.closed) {
          정비소창열림설정(false);
          clearInterval(창상태체크);
          
          // 정비소 작업 완료 후 새로고침 (옵션)
          console.log('정비소 작업이 완료되었습니다.');
        }
      }, 1000);
    } else {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
    }
  };

  return (
    <button
      className={`정비소-버튼 ${className}`}
      onClick={정비소열기}
      disabled={정비소창열림}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        backgroundColor: 정비소창열림 ? '#6c757d' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 정비소창열림 ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
        opacity: 정비소창열림 ? 0.7 : 1
      }}
      onMouseEnter={(e) => {
        if (!정비소창열림) {
          e.currentTarget.style.backgroundColor = '#0056b3';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!정비소창열림) {
          e.currentTarget.style.backgroundColor = '#007bff';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
        }
      }}
      title={정비소창열림 ? '정비소가 열려있습니다' : 'AI와 함께 노트를 꾸며보세요'}
    >
      <span style={{ fontSize: '16px' }}>🔧</span>
      <span>{정비소창열림 ? '정비소 열림' : '정비소 가기'}</span>
      {!정비소창열림 && <span style={{ fontSize: '14px' }}>↗</span>}
    </button>
  );
};

export default 정비소버튼;