import React, { useState } from 'react';
import { Supabase상태사용하기 } from '../상태관리/supabase상태';
import { 태그필터상태사용하기 } from '../상태관리/태그필터상태';
import 폴더설정모달 from './폴더설정모달';
import 태그클라우드 from './태그클라우드';

// 폴더 목록 컴포넌트 - Supabase 연동
const 폴더목록: React.FC = () => {
  const { 
    폴더목록, 
    활성폴더, 
    활성노트,
    폴더선택하기, 
    노트선택하기,
    새폴더생성하기,
    새노트생성하기
  } = Supabase상태사용하기();

  const [설정모달열림, 설정모달열림설정] = useState(false);
  const [설정대상폴더, 설정대상폴더설정] = useState<typeof 활성폴더>(null);
  const [확장된폴더목록, 확장된폴더목록설정] = useState<Set<string>>(new Set());
  
  // 공유된 태그 필터링 상태
  const { 
    선택된태그목록, 
    선택된태그목록설정,
    필터통계 
  } = 태그필터상태사용하기();

  const 폴더클릭처리 = (폴더아이디: string) => {
    폴더선택하기(폴더아이디); // 이미 내부에서 활성노트를 null로 설정함
    // 폴더 선택 시 해당 폴더 자동 확장
    확장된폴더목록설정(이전목록 => {
      const 새목록 = new Set(이전목록);
      새목록.add(폴더아이디);
      return 새목록;
    });
  };

  const 폴더확장토글 = (폴더아이디: string, 이벤트: React.MouseEvent) => {
    이벤트.stopPropagation();
    확장된폴더목록설정(이전목록 => {
      const 새목록 = new Set(이전목록);
      if (새목록.has(폴더아이디)) {
        새목록.delete(폴더아이디);
      } else {
        새목록.add(폴더아이디);
      }
      return 새목록;
    });
  };

  const 노트클릭처리 = (노트아이디: string, 이벤트: React.MouseEvent) => {
    이벤트.stopPropagation();
    노트선택하기(노트아이디);
  };

  const 새폴더생성클릭 = async () => {
    const 폴더이름 = prompt('새 폴더 이름을 입력하세요:');
    if (폴더이름 && 폴더이름.trim()) {
      try {
        await 새폴더생성하기(폴더이름.trim());
      } catch (오류) {
        console.error('폴더 생성 실패:', 오류);
      }
    }
  };

  const 새노트생성클릭 = async (폴더아이디: string, 이벤트: React.MouseEvent) => {
    이벤트.stopPropagation();
    const 노트제목 = prompt('새 노트 제목을 입력하세요:');
    if (노트제목 && 노트제목.trim()) {
      try {
        await 새노트생성하기(폴더아이디, 노트제목.trim());
        // 새 노트 생성 후 해당 폴더 확장
        확장된폴더목록설정(이전목록 => {
          const 새목록 = new Set(이전목록);
          새목록.add(폴더아이디);
          return 새목록;
        });
      } catch (오류) {
        console.error('노트 생성 실패:', 오류);
      }
    }
  };

  const 폴더설정클릭 = (폴더: typeof 활성폴더, 이벤트: React.MouseEvent) => {
    이벤트.stopPropagation(); // 폴더 선택 이벤트 방지
    설정대상폴더설정(폴더);
    설정모달열림설정(true);
  };

  const 입력방식아이콘 = (입력방식: string) => {
    switch (입력방식) {
      case '카테고리형': return '🏷️';
      case '대화형': return '💬';
      default: return '📝';
    }
  };

  return (
    <>
      <div className="폴더목록-컨테이너">
        <div className="폴더목록-제목">
          📁 폴더 목록
          <button 
            className="기본-버튼" 
            onClick={새폴더생성클릭}
            style={{ float: 'right', fontSize: '12px', padding: '4px 8px' }}
          >
            + 새 폴더
          </button>
        </div>
        
        <div className="폴더목록-리스트">
          {폴더목록.map((폴더) => {
            const 폴더확장됨 = 확장된폴더목록.has(폴더.아이디);
            return (
              <div key={폴더.아이디}>
                <div 
                  className={`폴더-아이템 ${활성폴더?.아이디 === 폴더.아이디 ? '활성' : ''}`}
                  onClick={() => 폴더클릭처리(폴더.아이디)}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    {/* 확장/축소 버튼 */}
                    <button
                      onClick={(e) => 폴더확장토글(폴더.아이디, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '10px',
                        marginRight: '4px',
                        opacity: 폴더.노트목록.length > 0 ? 1 : 0.3
                      }}
                      disabled={폴더.노트목록.length === 0}
                    >
                      {폴더.노트목록.length > 0 ? (폴더확장됨 ? '▼' : '▶') : '·'}
                    </button>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{입력방식아이콘(폴더.폴더설정.입력방식)}</span>
                        <span>{폴더.이름}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                        {폴더.노트목록.length}개 노트 · {폴더.폴더설정.입력방식}
                        {활성폴더?.아이디 === 폴더.아이디 && 선택된태그목록.length > 0 && (
                          <span style={{ color: '#007bff', marginLeft: '4px' }}>
                            (필터: {필터통계.현재폴더결과수}개)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button 
                      onClick={(e) => 새노트생성클릭(폴더.아이디, e)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '2px',
                        fontSize: '10px',
                        color: '#28a745'
                      }}
                      title="새 노트 추가"
                    >
                      📝+
                    </button>
                    <button 
                      onClick={(e) => 폴더설정클릭(폴더, e)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '2px',
                        fontSize: '12px'
                      }}
                      title="폴더 설정"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>

                {/* 노트 목록 (확장된 경우에만 표시) */}
                {폴더확장됨 && 폴더.노트목록.length > 0 && (
                  <div style={{ marginLeft: '20px', marginTop: '4px', marginBottom: '8px' }}>
                    {폴더.노트목록.map((노트) => (
                      <div
                        key={노트.아이디}
                        className={`노트-아이템 ${활성노트?.아이디 === 노트.아이디 ? '활성' : ''}`}
                        onClick={(e) => 노트클릭처리(노트.아이디, e)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          borderRadius: '3px',
                          margin: '2px 0',
                          backgroundColor: 활성노트?.아이디 === 노트.아이디 ? '#e3f2fd' : 'transparent',
                          border: 활성노트?.아이디 === 노트.아이디 ? '1px solid #2196f3' : '1px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          if (활성노트?.아이디 !== 노트.아이디) {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (활성노트?.아이디 !== 노트.아이디) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <span style={{ fontSize: '10px' }}>📝</span>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ 
                            fontWeight: 활성노트?.아이디 === 노트.아이디 ? 'bold' : 'normal',
                            color: 활성노트?.아이디 === 노트.아이디 ? '#1976d2' : '#333',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {노트.제목}
                          </div>
                          {노트.채팅메시지목록.length > 0 && (
                            <div style={{ 
                              fontSize: '9px', 
                              color: '#999',
                              marginTop: '1px'
                            }}>
                              {노트.채팅메시지목록.length}개 메시지
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 태그 클라우드 */}
        <태그클라우드
          폴더목록={폴더목록}
          활성폴더={활성폴더}
          선택된태그목록={선택된태그목록}
          태그선택변경={선택된태그목록설정}
          최대태그수={12}
        />
      </div>

      {/* 폴더 설정 모달 */}
      <폴더설정모달
        폴더={설정대상폴더}
        모달열림={설정모달열림}
        모달닫기={() => {
          설정모달열림설정(false);
          설정대상폴더설정(null);
        }}
      />
    </>
  );
};

export default 폴더목록;