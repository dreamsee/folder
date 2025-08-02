import React, { useState } from 'react';
import './App.css';
import 채팅패널 from './컴포넌트/채팅패널';
import 노트패널 from './컴포넌트/노트패널';
import 폴더목록컴포넌트 from './컴포넌트/폴더목록';
import 설정패널 from './컴포넌트/설정패널';
import { Supabase상태제공자, Supabase상태사용하기 } from './상태관리/supabase상태';
import { 앱상태제공자 } from './상태관리/앱상태';
import { 태그필터상태제공자 } from './상태관리/태그필터상태';

// 로딩 상태를 보여주는 컴포넌트
const 로딩화면: React.FC = () => {
  const { 로딩중, 에러 } = Supabase상태사용하기();

  if (에러) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ 
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#856404', margin: '0 0 16px 0' }}>⚠️ 연결 오류</h3>
          <p style={{ color: '#856404', margin: '0' }}>{에러}</p>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            Supabase 설정을 확인해주세요.
          </div>
        </div>
      </div>
    );
  }

  if (로딩중) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ 
          fontSize: '48px',
          marginBottom: '16px',
          animation: 'spin 2s linear infinite'
        }}>
          ⏳
        </div>
        <div style={{ fontSize: '18px', color: '#666' }}>
          Supabase 데이터 로딩 중...
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
};

// 메인 앱 컴포넌트
const 메인앱: React.FC = () => {
  const { 로딩중, 폴더목록, 활성폴더 } = Supabase상태사용하기();
  
  // 저장된 분할 비율 불러오기 또는 기본값 사용
  const 초기분할비율 = () => {
    const 저장된값 = localStorage.getItem('왼쪽패널분할비율');
    if (저장된값) {
      const 비율 = parseFloat(저장된값);
      if (비율 >= 0.1 && 비율 <= 0.9) {
        return 비율;
      }
    }
    return 0.3; // 기본값
  };

  const [왼쪽분할비율, 왼쪽분할비율설정] = useState<number>(초기분할비율);

  return (
    <>
      <로딩화면 />
      {!로딩중 && (
        <태그필터상태제공자 폴더목록={폴더목록} 활성폴더={활성폴더}>
          <div className="앱-컨테이너">
            {/* 전체 레이아웃: 좌우 패널 분할 */}
            <div className="메인-레이아웃">
            {/* 왼쪽 영역: 폴더 목록 + 채팅 패널 (크기조절 가능) */}
            <div className="왼쪽-패널" style={{ position: 'relative' }}>
              {/* 폴더 목록 영역 */}
              <div 
                className="폴더목록-영역"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${왼쪽분할비율 * 100}%`,
                  overflow: 'hidden'
                }}
              >
                <폴더목록컴포넌트 />
              </div>

              {/* 크기조절 분할선 */}
              <div 
                className="분할선-컨테이너"
                style={{
                  position: 'absolute',
                  top: `${왼쪽분할비율 * 100}%`,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: '#e0e0e0',
                  cursor: 'row-resize',
                  zIndex: 10,
                  transform: 'translateY(-2px)',
                  transition: 'background-color 0.2s'
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const 시작Y = e.clientY;
                  const 시작비율 = 왼쪽분할비율;
                  const 패널높이 = e.currentTarget.parentElement?.clientHeight || 1;

                  const 마우스이동처리 = (moveEvent: MouseEvent) => {
                    const Y차이 = moveEvent.clientY - 시작Y;
                    const 비율변화 = Y차이 / 패널높이;
                    const 새비율 = Math.max(0.1, Math.min(0.9, 시작비율 + 비율변화));
                    왼쪽분할비율설정(새비율);
                    
                    // localStorage에 저장
                    localStorage.setItem('왼쪽패널분할비율', 새비율.toString());
                  };

                  const 마우스업처리 = () => {
                    document.removeEventListener('mousemove', 마우스이동처리);
                    document.removeEventListener('mouseup', 마우스업처리);
                  };

                  document.addEventListener('mousemove', 마우스이동처리);
                  document.addEventListener('mouseup', 마우스업처리);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#007bff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e0e0';
                }}
              />

              {/* 채팅 패널 영역 */}
              <div 
                className="채팅패널-영역"
                style={{
                  position: 'absolute',
                  top: `${왼쪽분할비율 * 100}%`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: 'hidden'
                }}
              >
                <채팅패널 />
              </div>
            </div>
            
            {/* 오른쪽 영역: 노트 패널 */}
            <div className="오른쪽-패널">
              <노트패널 />
            </div>
          </div>
          
          {/* 설정 패널 */}
          <설정패널 />
          </div>
        </태그필터상태제공자>
      )}
    </>
  );
};

function App() {
  return (
    <Supabase상태제공자>
      <앱상태제공자>
        <메인앱 />
      </앱상태제공자>
    </Supabase상태제공자>
  );
}

export default App;