import React, { useState, useEffect } from 'react';
import { Supabase상태사용하기 } from '../상태관리/supabase상태';
import { 앱상태사용하기 } from '../상태관리/앱상태';
import 폴더통합뷰 from './폴더통합뷰';
import 태그입력 from './태그입력';
import 노트설정모달 from './노트설정모달';
import { 노트설정타입 } from '../타입';
import { useFolderTags } from '../훅/useFolderTags';

// 노트 패널 컴포넌트 - Supabase 연동
const 노트패널: React.FC = () => {
  const { 활성노트, 노트업데이트하기, 활성폴더, 노트선택하기 } = Supabase상태사용하기();
  const { 연상검색결과, 연상검색결과설정 } = 앱상태사용하기();
  // 뷰모드는 활성노트 상태에 따라 자동 결정 (원래 설계대로)
  const 뷰모드 = 활성노트 ? '개별노트' : '폴더통합';
  const [로컬제목, 로컬제목설정] = useState('');
  const [로컬내용, 로컬내용설정] = useState('');
  const [로컬요약, 로컬요약설정] = useState('');
  const [로컬태그목록, 로컬태그목록설정] = useState<string[]>([]);
  const [설정모달열림, 설정모달열림설정] = useState(false);
  
  // 폴더 내 태그 정보
  const { 전체태그목록 } = useFolderTags(활성폴더);

  // 활성 노트가 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    if (활성노트) {
      로컬제목설정(활성노트.제목);
      로컬내용설정(활성노트.내용);
      로컬요약설정(활성노트.요약 || '');
      로컬태그목록설정(활성노트.태그목록 || []);
    } else {
      로컬제목설정('');
      로컬내용설정('');
      로컬요약설정('');
      로컬태그목록설정([]);
    }
  }, [활성노트]);

  // 뷰모드는 활성노트 상태에 따라 자동으로 결정됨 (useEffect 불필요)

  const 노트저장하기 = async () => {
    if (!활성노트) {
      alert('저장할 노트가 없습니다.');
      return;
    }

    try {
      await 노트업데이트하기(활성노트.아이디, {
        제목: 로컬제목,
        내용: 로컬내용,
        요약: 로컬요약,
        태그목록: 로컬태그목록,
      });

      alert('노트가 저장되었습니다!');
    } catch (오류) {
      console.error('노트 저장 실패:', 오류);
      alert('노트 저장에 실패했습니다.');
    }
  };

  const 노트설정저장하기 = async (새설정: 노트설정타입) => {
    if (!활성노트) {
      throw new Error('저장할 노트가 없습니다.');
    }

    await 노트업데이트하기(활성노트.아이디, {
      노트설정: 새설정
    });
  };

  // 이 로직은 아래에서 처리됨 (중복 제거)

  // 연상 검색 결과가 있으면 우선 표시
  if (연상검색결과) {
    return (
      <div className="노트패널-컨테이너">
        {/* 연상 검색 결과 헤더 */}
        <div style={{ 
          padding: '16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#e3f2fd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔍 "{연상검색결과.검색키워드}" 검색 결과
          </div>
          <button
            onClick={() => 연상검색결과설정(null)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕ 닫기
          </button>
        </div>

        {/* 검색 결과 목록 */}
        <div style={{ padding: '16px' }}>
          {연상검색결과.검색결과.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              fontSize: '14px',
              padding: '40px 0'
            }}>
              "{연상검색결과.검색키워드}"와 관련된 노트를 찾을 수 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {연상검색결과.검색결과.map((결과, 인덱스) => (
                <div
                  key={`${결과.노트아이디}-${인덱스}`}
                  onClick={() => {
                    노트선택하기(결과.노트아이디);
                    연상검색결과설정(null); // 검색 결과 닫기
                  }}
                  style={{
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                    e.currentTarget.style.borderColor = '#1976d2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#333'
                  }}>
                    📝 {결과.노트제목}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    매칭 유형: {결과.매칭타입 === '제목' ? '제목에서 발견' : '내용에서 발견'}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#555',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {결과.관련내용}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 검색 정보 */}
          <div style={{ 
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666',
            textAlign: 'center'
          }}>
            검색 시간: {연상검색결과.검색시간.toLocaleString('ko-KR')} | 
            총 {연상검색결과.검색결과.length}개 결과 발견
          </div>
        </div>
      </div>
    );
  }

  // 활성 폴더가 없으면 폴더 선택 메시지 표시
  if (!활성폴더) {
    return (
      <div className="노트패널-컨테이너">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: '#999',
          fontSize: '18px'
        }}>
          폴더를 선택하세요
        </div>
      </div>
    );
  }

  // 활성 노트가 없으면 폴더 통합 뷰 표시 (원래 설계대로)
  if (!활성노트) {
    // 활성 폴더가 있으면 폴더 통합 뷰 표시
    if (활성폴더) {
      return (
        <div className="노트패널-컨테이너">
          {/* 현재 뷰 상태 표시 */}
          <div style={{ 
            padding: '16px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              color: '#28a745',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              📁 폴더 통합 뷰: {활성폴더.이름}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              marginLeft: '8px'
            }}>
              (폴더 선택됨)
            </div>
          </div>
          
          {/* 폴더 통합 뷰 표시 */}
          <폴더통합뷰 />
        </div>
      );
    }
    
    // 폴더도 노트도 없으면 선택 메시지 표시
    return (
      <div className="노트패널-컨테이너">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: '#999',
          fontSize: '16px',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          폴더를 선택하거나 노트를 선택해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="노트패널-컨테이너">
      {/* 현재 뷰 상태 표시 (원래 설계: 자동 전환) */}
      <div style={{ 
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: 뷰모드 === '개별노트' ? '#1976d2' : '#28a745',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {뷰모드 === '개별노트' ? (
            <>📝 개별 노트: {활성노트?.제목}</>
          ) : (
            <>📁 폴더 통합 뷰: {활성폴더?.이름}</>
          )}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#666',
          marginLeft: '8px'
        }}>
          {뷰모드 === '개별노트' ? '(개별 노트 선택됨)' : '(폴더 선택됨)'}
        </div>
      </div>

      {/* 상단 고정 요약/메모창 */}
      <div className="노트-상단-고정영역">
        <div className="노트-상단-제목">📝 요약 / 메모</div>
        <textarea
          className="노트-요약입력"
          placeholder="이 노트의 요약이나 임시 메모를 작성하세요..."
          value={로컬요약}
          onChange={(e) => 로컬요약설정(e.target.value)}
        />
      </div>

      {/* 노트 편집 영역 */}
      <div className="노트-편집영역">
        {/* 노트 제목 및 설정 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            className="노트제목-입력"
            placeholder="노트 제목을 입력하세요"
            value={로컬제목}
            onChange={(e) => 로컬제목설정(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => 설정모달열림설정(true)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="이 노트의 개별 설정"
          >
            ⚙️ 노트 설정
          </button>
        </div>

        {/* 노트 내용 */}
        <textarea
          className="노트내용-입력"
          placeholder="자유롭게 노트를 작성하세요..."
          value={로컬내용}
          onChange={(e) => 로컬내용설정(e.target.value)}
        />

        {/* 태그 입력 영역 */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600',
            color: '#555',
            marginBottom: '8px'
          }}>
            🏷️ 태그
          </div>
          <태그입력
            태그목록={로컬태그목록}
            태그목록변경={로컬태그목록설정}
            전체태그목록={전체태그목록}
            플레이스홀더="태그를 입력하세요 (Enter로 추가)"
          />
        </div>

        {/* 저장 버튼과 노트 정보 */}
        <div style={{ 
          marginTop: '16px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            생성: {활성노트.생성시간.toLocaleDateString('ko-KR')} {활성노트.생성시간.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            {활성노트.수정시간.getTime() !== 활성노트.생성시간.getTime() && (
              <span>
                <br />수정: {활성노트.수정시간.toLocaleDateString('ko-KR')} {활성노트.수정시간.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <button 
            className="주요-버튼"
            onClick={노트저장하기}
          >
            💾 저장
          </button>
        </div>
      </div>

      {/* 노트별 설정 모달 */}
      {활성노트 && 활성폴더 && (
        <노트설정모달
          노트={활성노트}
          폴더설정={활성폴더.폴더설정}
          열림={설정모달열림}
          닫기={() => 설정모달열림설정(false)}
          저장하기={노트설정저장하기}
        />
      )}
    </div>
  );
};

export default 노트패널;