
import React from 'react';
import { 스마트시간포맷팅 } from '../유틸/시간표시';

// 아이콘 타입 정의
type 아이콘타입 = '주인공' | '악당' | '주민' | '중요' | '기본';

// 캐릭터 아이콘 컴포넌트
const 캐릭터아이콘: React.FC<{ 아이콘: 아이콘타입 }> = ({ 아이콘 }) => {
  const 아이콘스타일: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    marginRight: '8px',
    color: 'white',
    flexShrink: 0,
  };

  switch (아이콘) {
    case '주인공':
      return <div style={{ ...아이콘스타일, backgroundColor: '#007bff' }}>P</div>;
    case '악당':
      return <div style={{ ...아이콘스타일, backgroundColor: '#dc3545' }}>V</div>;
    case '주민':
      return <div style={{ ...아이콘스타일, backgroundColor: '#6c757d' }}>R</div>;
    case '중요':
        return <div style={{ ...아이콘스타일, backgroundColor: '#ffc107' }}>!</div>;
    default:
      return <div style={{ ...아이콘스타일, backgroundColor: '#28a745' }}>C</div>;
  }
};

// 메시지 타입 정의
interface 메시지타입 {
  아이디: string;
  텍스트: string;
  타임스탬프: string;
  작성자?: string;
  말풍선위치?: '왼쪽' | '오른쪽';
  캐릭터아이콘?: 아이콘타입;
  말풍선색상?: string;
}

interface MessageBubbleProps {
  메시지: 메시지타입;
  시간표시여부: boolean;
  on시간표시토글: (id: string) => void;
  확장된시간목록: Set<string>;
  입력방식: '단순채팅' | '카테고리형' | '대화형'; // 🔥 입력방식별 아이콘 표시 제어
  카테고리정보?: {
    카테고리목록: string[];
    카테고리색상: any;
    카테고리이름: string;
    동적카테고리사용: boolean;
    카테고리표시데이터: string[];
    on카테고리편집?: (메시지아이디: string, 카테고리목록: string[]) => void;
  }; // 🔥 카테고리형 입력 시 카테고리 라벨 표시용
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  메시지, 
  시간표시여부,
  on시간표시토글,
  확장된시간목록,
  입력방식,
  카테고리정보
}) => {
  const {
    아이디,
    텍스트,
    타임스탬프,
    작성자,
    말풍선위치 = '왼쪽',
    캐릭터아이콘: 메시지캐릭터아이콘 = '기본',
    말풍선색상 = '#e9ecef',
  } = 메시지;

  const isRight = 말풍선위치 === '오른쪽';
  const 시간표시정보 = 스마트시간포맷팅(new Date(타임스탬프));
  const 시간확장됨 = 확장된시간목록.has(아이디);

  // 🔥 입력방식별 아이콘 표시 조건 설정 (기존 기능 보호)
  const 아이콘표시여부 = (() => {
    switch (입력방식) {
      case '대화형': 
        return true; // ✅ 필수 - 캐릭터별 개성 표현
      case '카테고리형': 
        return false; // ❌ 불필요 - 카테고리 라벨로 충분 (기존 설계 유지)
      case '단순채팅': 
        return false; // 🔶 선택적 - 기본적으로 불필요 (가독성/속도 우선)
      default: 
        return false;
    }
  })();

  const 컨테이너스타일: React.CSSProperties = {
    display: 'flex',
    marginBottom: '16px',
    justifyContent: isRight ? 'flex-end' : 'flex-start',
  };

  const 버블컨테이너스타일: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    maxWidth: '85%',
    flexDirection: isRight ? 'row-reverse' : 'row',
  };

  const 버블스타일: React.CSSProperties = {
    backgroundColor: isRight ? '#007bff' : 말풍선색상,
    color: isRight ? 'white' : '#212529',
    padding: '12px 16px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    wordBreak: 'break-word',
    position: 'relative',
    border: isRight ? 'none' : '1px solid rgba(0,123,255,0.1)',
  };

  const 작성자스타일: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '4px',
    color: isRight ? '#f8f9fa' : '#343a40',
    textAlign: isRight ? 'right' : 'left',
    marginRight: isRight ? '10px' : '0',
    marginLeft: isRight ? '0' : '10px',
  };

  const 시간스타일: React.CSSProperties = {
    fontSize: '11px',
    color: '#6c757d',
    cursor: 시간표시정보.클릭가능 ? 'pointer' : 'default',
    alignSelf: 'flex-end',
    margin: '0 5px',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={컨테이너스타일}>
      {/* 🔥 카테고리형 입력 시 카테고리 라벨 표시 */}
      {입력방식 === '카테고리형' && 카테고리정보 && 카테고리정보.카테고리목록.length > 0 && (
        <div 
          style={{
            backgroundColor: 카테고리정보.카테고리색상?.배경 || '#e0e0e0',
            color: 카테고리정보.카테고리색상?.텍스트 || '#333',
            padding: '4px 6px',
            borderRadius: '8px',
            fontSize: '9px',
            fontWeight: 'bold',
            marginRight: '8px',
            minWidth: '20px',
            textAlign: 'center',
            alignSelf: 'flex-start',
            marginTop: '2px',
            cursor: 카테고리정보.동적카테고리사용 && 카테고리정보.카테고리목록.length > 1 ? 'pointer' : 'default'
          }}
          onClick={() => {
            // 🔥 동적카테고리 사용 + 다중 카테고리일 때만 편집 가능
            if (카테고리정보?.동적카테고리사용 && 카테고리정보.카테고리목록.length > 1 && 카테고리정보.on카테고리편집) {
              카테고리정보.on카테고리편집(아이디, 카테고리정보.카테고리목록);
            }
          }}
          title={카테고리정보.카테고리목록.join(', ')} // 🔥 선택된 카테고리들 표시
        >
          {카테고리정보.동적카테고리사용 ? (
            // 동적 카테고리: 조합 이름을 3글자씩 세로 표시
            카테고리정보.카테고리표시데이터.map((줄, 인덱스) => (
              <div key={인덱스} style={{
                fontSize: '11px',
                color: 카테고리정보.카테고리색상?.텍스트,
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: '1.2',
                marginBottom: '1px'
              }}>
                {줄}
              </div>
            ))
          ) : (
            // 기본 카테고리: 세로선으로 구분하여 가로로 표시
            <div style={{
              fontSize: '11px',
              color: 카테고리정보.카테고리색상?.텍스트,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}>
              {카테고리정보.카테고리표시데이터.map((카테고리, 인덱스) => (
                <React.Fragment key={인덱스}>
                  {인덱스 > 0 && (
                    <span style={{ 
                      margin: '0 3px',
                      opacity: 0.7
                    }}>|</span>
                  )}
                  <span>{카테고리}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div style={버블컨테이너스타일}>
        {/* 🔥 입력방식별 조건부 아이콘 렌더링 - 기존 기능 보호 */}
        {아이콘표시여부 && <캐릭터아이콘 아이콘={메시지캐릭터아이콘} />}
        <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: isRight ? 'row-reverse' : 'row' }}>
          <div style={{
            order: isRight ? 2 : 1,
            // 🔥 아이콘 표시 여부에 따른 여백 조정 (기존 레이아웃 보호)
            ...(isRight ? 
              { marginRight: 아이콘표시여부 ? '8px' : '0px' } : 
              { marginLeft: 아이콘표시여부 ? '8px' : '0px' }
            )
          }}>
            {작성자 && <div style={작성자스타일}>{작성자}</div>}
            <div style={버블스타일}>
              {텍스트}
            </div>
          </div>
          {시간표시여부 && (
            <div 
              style={{...시간스타일, order: isRight ? 1 : 2}}
              title={시간표시정보.클릭가능 ? '상세 시간 보기' : 시간표시정보.전체시간}
              onClick={() => on시간표시토글(아이디)}
            >
              {시간확장됨 ? 시간표시정보.상세표시텍스트 : 시간표시정보.표시텍스트}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
