import React, { useState, useEffect } from 'react';
import { 노트타입, 노트설정타입, 폴더설정타입 } from '../타입';

interface 노트설정모달속성 {
  노트: 노트타입;
  폴더설정: 폴더설정타입;
  열림: boolean;
  닫기: () => void;
  저장하기: (새설정: 노트설정타입) => Promise<void>;
}

const 노트설정모달: React.FC<노트설정모달속성> = ({ 노트, 폴더설정, 열림, 닫기, 저장하기 }) => {
  const [설정, 설정변경] = useState<노트설정타입>({});
  const [저장중, 저장중설정] = useState(false);

  // 모달이 열릴 때 현재 노트 설정으로 초기화
  useEffect(() => {
    if (열림) {
      설정변경(노트.노트설정 || {});
    }
  }, [열림, 노트.노트설정]);

  if (!열림) return null;

  const 저장처리 = async () => {
    try {
      저장중설정(true);
      await 저장하기(설정);
      닫기();
    } catch (오류) {
      console.error('노트 설정 저장 실패:', 오류);
      alert('설정 저장에 실패했습니다.');
    } finally {
      저장중설정(false);
    }
  };

  const 설정값가져오기 = (키: keyof 노트설정타입): any => {
    return 설정[키] !== undefined ? 설정[키] : 폴더설정[키 as keyof 폴더설정타입];
  };

  const 설정업데이트 = (키: keyof 노트설정타입, 값: any) => {
    설정변경(이전설정 => ({
      ...이전설정,
      [키]: 값
    }));
  };

  const 기본값으로복원 = (키: keyof 노트설정타입) => {
    설정변경(이전설정 => {
      const 새설정 = { ...이전설정 };
      delete 새설정[키];
      return 새설정;
    });
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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
        onClick={닫기}
      />
      
      {/* 설정 모달 */}
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
        minWidth: '400px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>⚙️ 노트별 설정</h3>
          <button 
            onClick={닫기}
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

        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
          노트: <strong>{노트.제목}</strong>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 시간 표시 여부 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{ fontWeight: 'bold' }}>시간 자동 표시</label>
              {설정.시간표시여부 === undefined && (
                <span style={{ fontSize: '12px', color: '#007bff' }}>(폴더 기본값 사용 중)</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="radio" 
                  name="시간표시여부"
                  checked={설정값가져오기('시간표시여부') === true}
                  onChange={() => 설정업데이트('시간표시여부', true)}
                />
                표시
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="radio" 
                  name="시간표시여부"
                  checked={설정값가져오기('시간표시여부') === false}
                  onChange={() => 설정업데이트('시간표시여부', false)}
                />
                숨김
              </label>
              <button 
                onClick={() => 기본값으로복원('시간표시여부')}
                style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                폴더 기본값
              </button>
            </div>
          </div>

          {/* 입력 방식 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{ fontWeight: 'bold' }}>입력 방식</label>
              {설정.입력방식 === undefined && (
                <span style={{ fontSize: '12px', color: '#007bff' }}>(폴더 기본값 사용 중)</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['단순채팅', '카테고리형', '대화형'].map(방식 => (
                <label key={방식} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input 
                    type="radio" 
                    name="입력방식"
                    checked={설정값가져오기('입력방식') === 방식}
                    onChange={() => 설정업데이트('입력방식', 방식 as any)}
                  />
                  {방식}
                </label>
              ))}
              <button 
                onClick={() => 기본값으로복원('입력방식')}
                style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  alignSelf: 'flex-start'
                }}
              >
                폴더 기본값
              </button>
            </div>
          </div>

          {/* 하위 입력 활성화 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{ fontWeight: 'bold' }}>하위 입력 활성화</label>
              {설정.하위입력활성화 === undefined && (
                <span style={{ fontSize: '12px', color: '#007bff' }}>(폴더 기본값 사용 중)</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="radio" 
                  name="하위입력활성화"
                  checked={설정값가져오기('하위입력활성화') === true}
                  onChange={() => 설정업데이트('하위입력활성화', true)}
                />
                활성화
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="radio" 
                  name="하위입력활성화"
                  checked={설정값가져오기('하위입력활성화') === false}
                  onChange={() => 설정업데이트('하위입력활성화', false)}
                />
                비활성화
              </label>
              <button 
                onClick={() => 기본값으로복원('하위입력활성화')}
                style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                폴더 기본값
              </button>
            </div>
          </div>

          {/* 현재 사용 중인 설정 요약 */}
          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            borderLeft: '3px solid #007bff'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>현재 적용될 설정:</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 시간 표시: {설정값가져오기('시간표시여부') ? '표시' : '숨김'}
              {설정.시간표시여부 === undefined && ' (폴더 기본값)'}<br/>
              • 입력 방식: {설정값가져오기('입력방식')}
              {설정.입력방식 === undefined && ' (폴더 기본값)'}<br/>
              • 하위 입력: {설정값가져오기('하위입력활성화') ? '활성화' : '비활성화'}
              {설정.하위입력활성화 === undefined && ' (폴더 기본값)'}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '8px',
          marginTop: '24px'
        }}>
          <button 
            onClick={닫기}
            style={{
              padding: '10px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button 
            onClick={저장처리}
            disabled={저장중}
            style={{
              padding: '10px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 저장중 ? 'not-allowed' : 'pointer',
              opacity: 저장중 ? 0.6 : 1
            }}
          >
            {저장중 ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </>
  );
};

export default 노트설정모달;