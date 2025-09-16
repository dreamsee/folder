import React, { useState, useEffect } from 'react';
import './컴팩트모드토글.css';

interface 컴팩트모드토글Props {
  활성화됨: boolean;
  온변경: (활성화: boolean) => void;
}

const 컴팩트모드토글: React.FC<컴팩트모드토글Props> = ({ 활성화됨, 온변경 }) => {
  const [설명표시중, 설명표시중설정] = useState(false);
  const [애니메이션중, 애니메이션중설정] = useState(false);

  const 모드변경처리 = () => {
    애니메이션중설정(true);
    
    setTimeout(() => {
      온변경(!활성화됨);
      
      // 설명창 잠깐 표시
      설명표시중설정(true);
      
      // 3초 후 자동 사라짐
      setTimeout(() => {
        설명표시중설정(false);
      }, 3000);
      
      setTimeout(() => {
        애니메이션중설정(false);
      }, 300);
    }, 150);
  };

  return (
    <div className="compact-toggle-container">
      {/* 컴팩트 토글 버튼 */}
      <button
        className={`compact-toggle ${활성화됨 ? 'personal' : 'shared'} ${애니메이션중 ? 'animating' : ''}`}
        onClick={모드변경처리}
        disabled={애니메이션중}
        title={활성화됨 ? '개인모드 활성화 중' : '공유모드 활성화 중'}
      >
        <div className="toggle-slider">
          <div className="toggle-handle">
            <div className="toggle-icon">
              {활성화됨 ? '🏠' : '🌐'}
            </div>
          </div>
        </div>
      </button>

      {/* 전환 시에만 나타나는 설명창 */}
      {설명표시중 && (
        <div className="mode-explanation-popup">
          <div className="explanation-content">
            <div className="explanation-title">
              {활성화됨 ? '🏠 개인모드' : '🌐 공유모드'} 활성화
            </div>
            <div className="explanation-text">
              {활성화됨 ? '나만의 똑똑한 비서와 함께하는 공간' : '함께 성장하는 지식 공유 공간'}
            </div>
          </div>
          <div className="explanation-arrow"></div>
        </div>
      )}
    </div>
  );
};

export default 컴팩트모드토글;