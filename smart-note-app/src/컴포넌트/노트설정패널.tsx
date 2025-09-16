import React, { useState } from 'react';
import { 노트타입, 폴더설정타입, 노트설정타입 } from '../타입';
import { 노트설정병합하기 } from '../유틸리티/설정유틸리티';

interface 노트설정패널속성 {
  노트: 노트타입;
  폴더설정: 폴더설정타입;
  설정업데이트: (노트아이디: string, 새설정: Partial<노트설정타입>) => Promise<void>;
  닫기: () => void;
}

const 노트설정패널: React.FC<노트설정패널속성> = ({ 
  노트, 
  폴더설정, 
  설정업데이트, 
  닫기 
}) => {
  const { 채팅표시설정, 요약표시설정 } = 노트설정병합하기(노트.노트설정, 폴더설정);
  
  const [로컬채팅설정, 로컬채팅설정설정] = useState(채팅표시설정);
  const [로컬요약설정, 로컬요약설정설정] = useState(요약표시설정);
  const [저장중, 저장중설정] = useState(false);

  const 설정저장하기 = async () => {
    if (저장중) return;
    
    저장중설정(true);
    try {
      const 새노트설정: Partial<노트설정타입> = {
        ...노트.노트설정,
        채팅표시설정: 로컬채팅설정,
        요약표시설정: 로컬요약설정
      };
      
      await 설정업데이트(노트.아이디, 새노트설정);
      닫기();
    } catch (에러) {
      console.error('설정 저장 실패:', 에러);
      alert('설정 저장에 실패했습니다.');
    } finally {
      저장중설정(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '12px'
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            ⚙️ {노트.제목} 설정
          </h3>
          <button
            onClick={닫기}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 채팅 표시 설정 */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#333' }}>
            💬 채팅 메시지 표시 설정
          </h4>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              최대 표시 개수:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={로컬채팅설정.최대표시개수}
              onChange={(e) => 로컬채팅설정설정(prev => ({
                ...prev,
                최대표시개수: parseInt(e.target.value) || 1
              }))}
              style={{
                width: '80px',
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
              개 (나머지는 "더보기"로 표시)
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              정렬 순서:
            </label>
            <select
              value={로컬채팅설정.표시순서}
              onChange={(e) => 로컬채팅설정설정(prev => ({
                ...prev,
                표시순서: e.target.value as '최신순' | '시간순'
              }))}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="최신순">최신순 (최근 메시지부터)</option>
              <option value="시간순">시간순 (오래된 메시지부터)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={로컬채팅설정.스크롤표시여부}
                onChange={(e) => 로컬채팅설정설정(prev => ({
                  ...prev,
                  스크롤표시여부: e.target.checked
                }))}
                style={{ marginRight: '6px' }}
              />
              확장 시 스크롤 영역 표시
            </label>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', marginLeft: '20px' }}>
              체크하면 "더보기" 클릭 시 스크롤 가능한 영역으로 표시됩니다.
            </div>
          </div>
        </div>

        {/* 요약 표시 설정 */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#333' }}>
            📝 요약 표시 설정
          </h4>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              기본 상태:
            </label>
            <select
              value={로컬요약설정.기본상태}
              onChange={(e) => 로컬요약설정설정(prev => ({
                ...prev,
                기본상태: e.target.value as '접힘' | '펼침'
              }))}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="접힘">접힘 (클릭해서 펼치기)</option>
              <option value="펼침">펼침 (항상 표시)</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              접힌 상태일 때 표시 위치:
            </label>
            <select
              value={로컬요약설정.접힘시위치}
              onChange={(e) => 로컬요약설정설정(prev => ({
                ...prev,
                접힘시위치: e.target.value as '상단' | '하단'
              }))}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="상단">상단 (채팅 위에 표시)</option>
              <option value="하단">하단 (노트 내용 아래 표시)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={로컬요약설정.자동요약생성}
                onChange={(e) => 로컬요약설정설정(prev => ({
                  ...prev,
                  자동요약생성: e.target.checked
                }))}
                style={{ marginRight: '6px' }}
              />
              자동 요약 생성 (향후 기능)
            </label>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', marginLeft: '20px' }}>
              요약이 비어있을 때 채팅 내용을 기반으로 자동 생성합니다.
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <button
            onClick={닫기}
            disabled={저장중}
            className="기본-버튼"
            style={{ padding: '8px 16px' }}
          >
            취소
          </button>
          <button
            onClick={설정저장하기}
            disabled={저장중}
            className="주요-버튼"
            style={{ padding: '8px 16px' }}
          >
            {저장중 ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default 노트설정패널;