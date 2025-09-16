import React, { useState, useEffect } from 'react';
import { Supabase상태사용하기 } from '../상태관리/supabase상태';
import { 폴더타입, 폴더설정타입, 캐릭터타입 } from '../타입';

interface 폴더설정모달속성 {
  폴더: 폴더타입 | null;
  모달열림: boolean;
  모달닫기: () => void;
}

// 폴더 설정 모달 컴포넌트
const 폴더설정모달: React.FC<폴더설정모달속성> = ({ 폴더, 모달열림, 모달닫기 }) => {
  const { 폴더이름변경하기, 폴더삭제하기, 폴더설정업데이트하기 } = Supabase상태사용하기();
  
  // 로컬 상태
  const [폴더이름, 폴더이름설정] = useState('');
  const [시간표시여부, 시간표시여부설정] = useState(true);
  const [입력방식, 입력방식설정] = useState<'단순채팅' | '카테고리형' | '대화형'>('단순채팅');
  const [카테고리목록, 카테고리목록설정] = useState<string[]>(['아침', '점심', '저녁', '간식']);
  const [캐릭터목록, 캐릭터목록설정] = useState<캐릭터타입[]>([
    { 아이디: 'char-1', 이름: '주인공', 기본위치: '왼쪽' },
    { 아이디: 'char-2', 이름: '악역', 기본위치: '오른쪽' },
    { 아이디: 'char-3', 이름: '조연', 기본위치: '왼쪽' }
  ]);
  const [하위입력활성화, 하위입력활성화설정] = useState(false);
  const [동적카테고리사용, 동적카테고리사용설정] = useState(false);

  // 폴더가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    if (폴더) {
      폴더이름설정(폴더.이름);
      시간표시여부설정(폴더.폴더설정.시간표시여부);
      입력방식설정(폴더.폴더설정.입력방식);
      하위입력활성화설정(폴더.폴더설정.하위입력활성화);
      동적카테고리사용설정(폴더.폴더설정.동적카테고리사용 ?? false);
      
      if (폴더.폴더설정.카테고리목록) {
        카테고리목록설정(폴더.폴더설정.카테고리목록);
      }
      
      if (폴더.폴더설정.캐릭터목록) {
        캐릭터목록설정(폴더.폴더설정.캐릭터목록);
      }
    }
  }, [폴더]);

  // 모달이 열리지 않았거나 폴더가 없으면 렌더링하지 않음
  if (!모달열림 || !폴더) return null;

  const 저장하기 = () => {
    if (!폴더) return;

    // 폴더 이름 변경
    if (폴더이름.trim() !== 폴더.이름) {
      폴더이름변경하기(폴더.아이디, 폴더이름.trim());
    }

    // 캐릭터 목록은 이미 올바른 형태로 관리됨

    // 폴더 설정 업데이트
    const 새설정: Partial<폴더설정타입> = {
      시간표시여부,
      입력방식,
      하위입력활성화,
      동적카테고리사용,
      ...(입력방식 === '카테고리형' && { 카테고리목록 }),
      ...(입력방식 === '대화형' && { 캐릭터목록 })
    };

    폴더설정업데이트하기(폴더.아이디, 새설정);

    alert('설정이 저장되었습니다!');
    모달닫기();
  };

  const 폴더삭제하기핸들러 = () => {
    const 노트개수 = 폴더.노트목록.length;
    
    if (노트개수 === 0) {
      // 빈 폴더는 바로 삭제
      폴더삭제하기(폴더.아이디);
      모달닫기();
    } else {
      // 노트가 있는 폴더는 확인 창 표시
      const 확인 = window.confirm(`'${폴더.이름}' 폴더와 ${노트개수}개의 노트가 삭제됩니다. 정말 삭제하시겠습니까?`);
      if (확인) {
        폴더삭제하기(폴더.아이디);
        모달닫기();
      }
    }
  };

  const 카테고리추가하기 = () => {
    const 새카테고리 = prompt('새 카테고리 이름을 입력하세요:');
    if (새카테고리 && 새카테고리.trim()) {
      카테고리목록설정(이전목록 => [...이전목록, 새카테고리.trim()]);
    }
  };

  const 카테고리삭제하기 = (인덱스: number) => {
    카테고리목록설정(이전목록 => 이전목록.filter((_, i) => i !== 인덱스));
  };

  const 캐릭터추가하기 = () => {
    const 새캐릭터이름 = prompt('새 캐릭터 이름을 입력하세요:');
    if (새캐릭터이름 && 새캐릭터이름.trim()) {
      const 새캐릭터: 캐릭터타입 = {
        아이디: `char-${Date.now()}`,
        이름: 새캐릭터이름.trim(),
        기본위치: '왼쪽'
      };
      캐릭터목록설정(이전목록 => [...이전목록, 새캐릭터]);
    }
  };

  const 캐릭터삭제하기 = (아이디: string) => {
    캐릭터목록설정(이전목록 => 이전목록.filter(캐릭터 => 캐릭터.아이디 !== 아이디));
  };

  const 캐릭터이름변경하기 = (아이디: string, 새이름: string) => {
    캐릭터목록설정(이전목록 => 
      이전목록.map(캐릭터 => 
        캐릭터.아이디 === 아이디 ? { ...캐릭터, 이름: 새이름 } : 캐릭터
      )
    );
  };

  const 캐릭터위치변경하기 = (아이디: string, 새위치: '왼쪽' | '오른쪽') => {
    캐릭터목록설정(이전목록 => 
      이전목록.map(캐릭터 => 
        캐릭터.아이디 === 아이디 ? { ...캐릭터, 기본위치: 새위치 } : 캐릭터
      )
    );
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
        onClick={모달닫기}
      />
      
      {/* 모달 내용 */}
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
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        {/* 모달 헤더 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>📁 폴더 설정</h3>
          <button 
            onClick={모달닫기}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* 폴더 이름 */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              폴더 이름
            </label>
            <input
              type="text"
              value={폴더이름}
              onChange={(e) => 폴더이름설정(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* 입력 방식 */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              입력 방식
            </label>
            <select
              value={입력방식}
              onChange={(e) => 입력방식설정(e.target.value as '단순채팅' | '카테고리형' | '대화형')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="단순채팅">단순 채팅 - 일반적인 텍스트 입력</option>
              <option value="카테고리형">카테고리형 - 미리 정의된 카테고리 선택</option>
              <option value="대화형">대화형 - 캐릭터 이름과 대화 내용</option>
            </select>
          </div>

          {/* 카테고리형 설정 */}
          {입력방식 === '카테고리형' && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              {/* 동적 카테고리 사용 옵션 */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={동적카테고리사용}
                    onChange={(e) => 동적카테고리사용설정(e.target.checked)}
                  />
                  <span>동적 카테고리 입력 사용 (3글자 제한 자동 줄바꿈)</span>
                </label>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginTop: '4px',
                  marginLeft: '24px'
                }}>
                  {동적카테고리사용 
                    ? '다중 선택 시 팝업창에서 입력, 조합 이름 저장 가능' 
                    : '다중 선택 시 쉼표로 구분하여 줄바꿈 표시'
                  }
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: 'bold' }}>카테고리 목록</span>
                <button 
                  className="기본-버튼"
                  onClick={카테고리추가하기}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  + 추가
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {카테고리목록.map((카테고리, 인덱스) => (
                  <div 
                    key={인덱스}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      backgroundColor: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '14px'
                    }}
                  >
                    <span>{카테고리}</span>
                    <button 
                      onClick={() => 카테고리삭제하기(인덱스)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        marginLeft: '4px',
                        cursor: 'pointer',
                        color: '#dc3545'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 대화형 설정 */}
          {입력방식 === '대화형' && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: 'bold' }}>캐릭터 목록</span>
                <button 
                  className="기본-버튼"
                  onClick={캐릭터추가하기}
                  style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    borderColor: '#007bff'
                  }}
                >
                  + 추가
                </button>
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: '4px',
                border: '1px solid #ddd',
                overflow: 'hidden'
              }}>
                {캐릭터목록.map((캐릭터, 인덱스) => (
                  <div 
                    key={캐릭터.아이디}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'white',
                      padding: '8px',
                      borderTop: 인덱스 > 0 ? '1px solid #ddd' : 'none'
                    }}
                  >
                    {/* 캐릭터 이름 입력 */}
                    <input
                      type="text"
                      value={캐릭터.이름}
                      onChange={(e) => 캐릭터이름변경하기(캐릭터.아이디, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'transparent',
                        outline: 'none'
                      }}
                      placeholder="캐릭터 이름"
                    />
                    
                    {/* 위치 선택 드롭박스 */}
                    <select
                      value={캐릭터.기본위치}
                      onChange={(e) => 캐릭터위치변경하기(캐릭터.아이디, e.target.value as '왼쪽' | '오른쪽')}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="왼쪽">왼쪽</option>
                      <option value="오른쪽">오른쪽</option>
                    </select>
                    
                    {/* 삭제 버튼 */}
                    <button 
                      onClick={() => 캐릭터삭제하기(캐릭터.아이디)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#dc3545',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                      title="캐릭터 삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 하위 입력 활성화 */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={하위입력활성화}
                onChange={(e) => 하위입력활성화설정(e.target.checked)}
              />
              <span>하위 입력 활성화 (속마음, 메모 등)</span>
            </label>
          </div>

          {/* 시간 표시 여부 */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={시간표시여부}
                onChange={(e) => 시간표시여부설정(e.target.checked)}
              />
              <span>채팅에 시간 자동 표시</span>
            </label>
          </div>

          {/* 버튼 영역 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #eee'
          }}>
            <button 
              className="기본-버튼"
              onClick={폴더삭제하기핸들러}
              style={{ 
                backgroundColor: '#dc3545',
                color: 'white',
                borderColor: '#dc3545'
              }}
            >
              🗑️ 폴더 삭제
            </button>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="기본-버튼"
                onClick={모달닫기}
              >
                취소
              </button>
              <button 
                className="주요-버튼"
                onClick={저장하기}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default 폴더설정모달;