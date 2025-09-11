import React, { useState } from 'react';
import { Supabase상태사용하기 } from '../상태관리/supabase상태';

// 설정 패널 컴포넌트
const 설정패널: React.FC = () => {
  const { 
    localStorage마이그레이션하기, 
    로딩중, 
    폴더목록,
    오프라인모드
  } = Supabase상태사용하기();
  const [패널열림, 패널열림설정] = useState(false);
  const [마이그레이션완료됨, 마이그레이션완료됨설정] = useState(() => {
    // localStorage 백업이 있으면 마이그레이션이 완료된 것으로 간주
    return localStorage.getItem('smart-note-폴더목록-backup') !== null;
  });

  const 데이터다운로드하기 = () => {
    try {
      const 데이터 = JSON.stringify(폴더목록, null, 2);
      const 현재시간 = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const 파일명 = `스마트노트_백업_${현재시간}.json`;

      const 블롭 = new Blob([데이터], { type: 'application/json' });
      const URL주소 = window.URL.createObjectURL(블롭);
      
      const 링크 = document.createElement('a');
      링크.href = URL주소;
      링크.download = 파일명;
      document.body.appendChild(링크);
      링크.click();
      document.body.removeChild(링크);
      window.URL.revokeObjectURL(URL주소);

      alert('데이터가 다운로드되었습니다.');
    } catch (오류) {
      console.error('다운로드 실패:', 오류);
      alert('다운로드에 실패했습니다.');
    }
  };

  const 파일업로드처리 = async (이벤트: React.ChangeEvent<HTMLInputElement>) => {
    const 파일 = 이벤트.target.files?.[0];
    if (파일) {
      const 리더 = new FileReader();
      리더.onload = async (읽기이벤트) => {
        try {
          const 내용 = 읽기이벤트.target?.result as string;
          const 파싱된데이터 = JSON.parse(내용);
          
          // 데이터 형식 검증
          if (Array.isArray(파싱된데이터) && 파싱된데이터.length > 0) {
            // 업로드된 파일을 localStorage에 임시 저장 후 마이그레이션
            const 기존백업 = localStorage.getItem('smart-note-폴더목록');
            localStorage.setItem('smart-note-폴더목록', 내용);
            
            try {
              await localStorage마이그레이션하기();
              alert('데이터를 성공적으로 가져왔습니다.');
              패널열림설정(false);
            } catch (마이그레이션오류) {
              // 실패 시 기존 데이터 복원
              if (기존백업) {
                localStorage.setItem('smart-note-폴더목록', 기존백업);
              }
              throw 마이그레이션오류;
            }
          } else {
            alert('올바른 데이터 형식이 아닙니다.');
          }
        } catch (오류) {
          console.error('데이터 가져오기 실패:', 오류);
          alert('데이터 가져오기에 실패했습니다.');
        }
      };
      리더.readAsText(파일);
    }
    // 파일 선택 초기화
    이벤트.target.value = '';
  };

  if (!패널열림) {
    return (
      <button 
        className="기본-버튼"
        onClick={() => 패널열림설정(true)}
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          left: '20px', 
          zIndex: 1000,
          fontSize: '12px',
          padding: '6px 12px'
        }}
      >
        ⚙️ 설정
      </button>
    );
  }

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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
        onClick={() => 패널열림설정(false)}
      />
      
      {/* 설정 패널 */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1001,
        minWidth: '300px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>⚙️ 설정</h3>
          <button 
            onClick={() => 패널열림설정(false)}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '20px', 
              cursor: 'pointer' 
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Supabase 마이그레이션 */}
          <button 
            className="주요-버튼"
            onClick={async () => {
              await localStorage마이그레이션하기();
              마이그레이션완료됨설정(true);
            }}
            disabled={로딩중 || 마이그레이션완료됨}
            style={{ 
              padding: '12px', 
              fontSize: '14px', 
              fontWeight: 'bold',
              backgroundColor: 마이그레이션완료됨 ? '#28a745' : undefined,
              borderColor: 마이그레이션완료됨 ? '#28a745' : undefined
            }}
          >
            {로딩중 ? '⏳ 마이그레이션 중...' : 
             마이그레이션완료됨 ? '✅ 마이그레이션 완료됨' : 
             '🔄 localStorage → Supabase 마이그레이션'}
          </button>

          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            padding: '8px', 
            backgroundColor: 오프라인모드 ? '#fff3cd' : 마이그레이션완료됨 ? '#d4edda' : '#e7f3ff',
            borderRadius: '4px',
            borderLeft: `3px solid ${오프라인모드 ? '#ffc107' : 마이그레이션완료됨 ? '#28a745' : '#007bff'}`
          }}>
            {오프라인모드 ? (
              <>
                📱 오프라인 모드<br/>
                로컬 캐시 데이터를 사용 중입니다. 온라인 복귀 시 자동 동기화됩니다.
              </>
            ) : 마이그레이션완료됨 ? (
              <>
                ✅ Supabase 클라우드와 연동됨<br/>
                🔄 모든 기기에서 실시간 동기화 중
              </>
            ) : (
              <>
                💡 기존 브라우저 데이터를 Supabase 클라우드로 이전합니다.<br/>
                이후 모든 기기에서 동기화됩니다.
              </>
            )}
          </div>

          <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />

          {/* 데이터 내보내기 */}
          <button 
            className="기본-버튼"
            onClick={데이터다운로드하기}
            style={{ padding: '10px', fontSize: '14px' }}
          >
            📁 데이터 내보내기 (JSON 다운로드)
          </button>

          {/* 데이터 가져오기 */}
          <label style={{ 
            display: 'block', 
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            transition: 'background-color 0.2s'
          }}>
            📂 데이터 가져오기 (JSON 파일 선택)
            <input
              type="file"
              accept=".json"
              onChange={파일업로드처리}
              style={{ display: 'none' }}
            />
          </label>

          <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />

          {/* 데이터 초기화 */}
          <button 
            className="기본-버튼"
            onClick={() => {
              if (window.confirm('정말로 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            style={{ 
              padding: '10px', 
              fontSize: '14px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderColor: '#dc3545'
            }}
          >
            🗑️ 로컬 데이터 초기화
          </button>
        </div>

        <div style={{ 
          marginTop: '16px', 
          fontSize: '12px', 
          color: '#666',
          textAlign: 'center'
        }}>
          🔒 Supabase 연동 시 모든 기기에서 안전하게 동기화됩니다
        </div>
      </div>
    </>
  );
};

export default 설정패널;