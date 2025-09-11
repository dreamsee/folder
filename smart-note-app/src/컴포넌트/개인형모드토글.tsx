import React, { useState, useEffect } from 'react';
import './개인형모드토글.css';

interface 개인형모드토글Props {
  활성화됨: boolean;
  온변경: (활성화: boolean) => void;
}

const 개인형모드토글: React.FC<개인형모드토글Props> = ({ 활성화됨, 온변경 }) => {
  const [애니메이션중, 애니메이션중설정] = useState(false);

  const 모드변경처리 = () => {
    애니메이션중설정(true);
    
    // 부드러운 전환을 위한 지연
    setTimeout(() => {
      온변경(!활성화됨);
      
      // 성취감 알림 표시
      성취감알림표시(활성화됨 ? '공유모드로 전환' : '개인모드로 전환');
      
      setTimeout(() => {
        애니메이션중설정(false);
      }, 300);
    }, 200);
  };

  const 성취감알림표시 = (메시지: string) => {
    const 알림 = document.createElement('div');
    알림.className = 'achievement-notification';
    알림.innerHTML = `
      <div style="font-size: 24px;">${활성화됨 ? '🌐' : '🏠'}</div>
      <div>
        <div style="font-weight: 600;">${메시지}</div>
        <div style="font-size: 12px; opacity: 0.7;">
          ${활성화됨 ? '개인 서재에서 편안하게' : '모두와 함께 성장하세요'}
        </div>
      </div>
    `;
    document.body.appendChild(알림);

    // 3초 후 자동 제거
    setTimeout(() => {
      if (알림.parentNode) {
        알림.parentNode.removeChild(알림);
      }
    }, 3000);
  };

  return (
    <div className="mode-toggle-container">
      <button
        className={`mode-toggle ${활성화됨 ? 'personal' : 'shared'} ${애니메이션중 ? 'animating' : ''}`}
        onClick={모드변경처리}
        disabled={애니메이션중}
        title={활성화됨 ? '개인모드 (나만의 서재)' : '공유모드 (지식 광장)'}
      >
        <div className="toggle-track">
          <div className="toggle-thumb">
            <div className="toggle-icon">
              {활성화됨 ? '🏠' : '🌐'}
            </div>
          </div>
        </div>
        
        <div className="toggle-labels">
          <span className={`label ${활성화됨 ? 'active' : ''}`}>
            개인형
          </span>
          <span className={`label ${!활성화됨 ? 'active' : ''}`}>
            공유형
          </span>
        </div>
      </button>

      {/* 모드 설명 툴팁 */}
      <div className="mode-description">
        {활성화됨 ? (
          <div className="description-content">
            <div className="description-title">🏠 개인모드</div>
            <div className="description-text">
              나만의 똑똑한 비서가 함께하는 아늑한 공간
            </div>
            <div className="description-features">
              • 채팅→노트 자동 변환<br/>
              • 패턴 학습으로 개인화<br/>
              • 완벽한 프라이버시 보장
            </div>
          </div>
        ) : (
          <div className="description-content">
            <div className="description-title">🌐 공유모드</div>
            <div className="description-text">
              집단 지성으로 함께 성장하는 지식 광장
            </div>
            <div className="description-features">
              • 다중 검증으로 품질 향상<br/>
              • 경험 공유로 문제 해결<br/>
              • 지식의 지속적 진화
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default 개인형모드토글;