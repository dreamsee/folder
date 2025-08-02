import React, { useState } from 'react';
import { 캐릭터타입, 캐릭터상세정보타입, 프로파일뷰타입 } from '../타입';
import useGameDataStore from '../스토어/게임데이터스토어';
import './캐릭터프로파일.css';

interface 캐릭터프로파일Props {
  캐릭터데이터: 캐릭터타입;
  상세정보?: Partial<캐릭터상세정보타입>;
  뷰모드?: 프로파일뷰타입;
  편집중인장비스킬?: boolean;
  장비스킬편집완료?: () => void;
}

const 캐릭터프로파일: React.FC<캐릭터프로파일Props> = ({ 
  캐릭터데이터, 
  상세정보, 
  뷰모드 = '상세',
  편집중인장비스킬 = false,
  장비스킬편집완료
}) => {
  // 게임 데이터 스토어 연동
  const { 
    캐릭터장비얻기, 
    캐릭터스킬얻기, 
    캐릭터장비설정, 
    캐릭터스킬설정,
    클래스별아이템얻기,
    클래스별스킬얻기
  } = useGameDataStore();
  
  // 외부에서 뷰모드가 전달되면 해당 모드 사용, 아니면 내부 상태 사용
  const [내부프로파일모드, 내부프로파일모드설정] = useState<프로파일뷰타입>('상세');
  const 현재프로파일 = 뷰모드 || 내부프로파일모드;
  
  // 인라인 편집 관련 상태
  const [현재편집탭, 현재편집탭설정] = useState<'장착된아이템' | '보유스킬' | '추가가능'>('장착된아이템');
  
  // 현재 캐릭터의 장착된 아이템과 스킬 가져오기
  const 현재장착아이템목록 = 캐릭터장비얻기(캐릭터데이터.아이디);
  const 현재보유스킬목록 = 캐릭터스킬얻기(캐릭터데이터.아이디);
  
  // 해당 캐릭터가 사용할 수 있는 모든 아이템과 스킬
  const 사용가능아이템목록 = 클래스별아이템얻기(캐릭터데이터.클래스).filter(아이템 => !아이템.재료여부);
  const 사용가능스킬목록 = 클래스별스킬얻기(캐릭터데이터.클래스).filter(스킬 => !스킬.재료여부);
  
  // 장착되지 않은 사용 가능한 아이템과 스킬
  const 장착가능아이템목록 = 사용가능아이템목록.filter(아이템 => 
    !현재장착아이템목록.some(장착아이템 => 장착아이템.아이디 === 아이템.아이디)
  );
  const 추가가능스킬목록 = 사용가능스킬목록.filter(스킬 => 
    !현재보유스킬목록.some(보유스킬 => 보유스킬.아이디 === 스킬.아이디)
  );
  
  // 아이템 장착/해제 함수
  const 아이템장착해제 = (아이템아이디: string, 장착상태: boolean) => {
    const 현재장착아이디목록 = 현재장착아이템목록.map(아이템 => 아이템.아이디);
    let 새장착목록: string[];
    
    if (장착상태) {
      // 장착 해제
      새장착목록 = 현재장착아이디목록.filter(id => id !== 아이템아이디);
    } else {
      // 장착 추가
      새장착목록 = [...현재장착아이디목록, 아이템아이디];
    }
    
    캐릭터장비설정(캐릭터데이터.아이디, 새장착목록);
  };
  
  // 스킬 보유/제거 함수
  const 스킬보유제거 = (스킬아이디: string, 보유상태: boolean) => {
    const 현재보유스킬아이디목록 = 현재보유스킬목록.map(스킬 => 스킬.아이디);
    let 새보유목록: string[];
    
    if (보유상태) {
      // 스킬 제거
      새보유목록 = 현재보유스킬아이디목록.filter(id => id !== 스킬아이디);
    } else {
      // 스킬 추가
      새보유목록 = [...현재보유스킬아이디목록, 스킬아이디];
    }
    
    캐릭터스킬설정(캐릭터데이터.아이디, 새보유목록);
  };

  // 기본 캐릭터 데이터와 상세 정보 병합
  const 캐릭터: 캐릭터상세정보타입 = {
    ...캐릭터데이터,
    직업: 상세정보?.직업 || 캐릭터데이터.클래스,
    장비: 상세정보?.장비 || [],
    스킬: 상세정보?.스킬 || [],
    상세능력치: 상세정보?.상세능력치 || {
      체력: { 현재: 캐릭터데이터.체력, 최대: 캐릭터데이터.체력 },
      마나: { 현재: 100, 최대: 100 },
      공격력: 캐릭터데이터.공격력,
      방어력: 캐릭터데이터.방어력,
      치명타율: 25,
      치명타피해: 140,
      적중률: 0.85,
      회피율: 15,
      속도: 캐릭터데이터.속도,
      저항력: 30
    }
  };

  // 상세 프로파일 뷰
  const 상세프로파일 = () => (
    <div className="프로파일-상세">
      <div className="캐릭터-헤더">
        <h2>{캐릭터.이름}</h2>
        <div className="기본정보">
          <span className={`등급 ${캐릭터.등급}`}>{캐릭터.등급}</span>
          <span className="직업">{캐릭터.직업}</span>
          <span className="레벨">Lv.{캐릭터.레벨}</span>
        </div>
      </div>
      
      <div className="체력마나바">
        <div className="체력바">
          <div className="바-내용" style={{ width: `${(캐릭터.상세능력치.체력.현재 / 캐릭터.상세능력치.체력.최대) * 100}%` }}>
            {캐릭터.상세능력치.체력.현재} / {캐릭터.상세능력치.체력.최대}
          </div>
        </div>
        <div className="마나바">
          <div className="바-내용" style={{ width: `${(캐릭터.상세능력치.마나.현재 / 캐릭터.상세능력치.마나.최대) * 100}%` }}>
            {캐릭터.상세능력치.마나.현재} / {캐릭터.상세능력치.마나.최대}
          </div>
        </div>
      </div>

      {캐릭터.장비.length > 0 && (
        <div className="장비섹션">
          <h3>장비</h3>
          <div className="장비목록">
            {캐릭터.장비.map((아이템, 인덱스) => (
              <div key={인덱스} className="장비아이템">{아이템}</div>
            ))}
          </div>
        </div>
      )}

      <div className="능력치섹션">
        <h3>능력치</h3>
        <div className="능력치그리드">
          <div className="능력치항목">
            <span className="능력치아이콘">⚔️</span>
            <span className="능력치값">{캐릭터.상세능력치.공격력}</span>
          </div>
          <div className="능력치항목">
            <span className="능력치아이콘">🛡️</span>
            <span className="능력치값">{캐릭터.상세능력치.방어력}</span>
          </div>
          <div className="능력치항목">
            <span className="능력치아이콘">💥</span>
            <span className="능력치값">{캐릭터.상세능력치.치명타율}%</span>
          </div>
          <div className="능력치항목">
            <span className="능력치아이콘">🎯</span>
            <span className="능력치값">{캐릭터.상세능력치.치명타피해}%</span>
          </div>
          <div className="능력치항목">
            <span className="능력치아이콘">⚡</span>
            <span className="능력치값">{캐릭터.상세능력치.속도}</span>
          </div>
          <div className="능력치항목">
            <span className="능력치아이콘">🔮</span>
            <span className="능력치값">{캐릭터.상세능력치.저항력}</span>
          </div>
        </div>
      </div>

      <div className="추가능력치섹션">
        <h3>전투 속성</h3>
        <div className="능력치그리드">
          <div className="능력치항목">
            <span className="능력치아이콘">🏃</span>
            <span className="능력치이름">이동범위</span>
            <span className="능력치값">{캐릭터.이동범위}</span>
          </div>
          <div className="능력치항목">
            <span className="능력치아이콘">🎯</span>
            <span className="능력치이름">공격범위</span>
            <span className="능력치값">{캐릭터.공격범위}</span>
          </div>
        </div>
      </div>

      {캐릭터.특수능력 && 캐릭터.특수능력.length > 0 && (
        <div className="특수능력섹션">
          <h3>특수능력</h3>
          <div className="특수능력목록">
            {캐릭터.특수능력.map((능력, 인덱스) => (
              <div key={인덱스} className="특수능력항목">{능력}</div>
            ))}
          </div>
        </div>
      )}

      {캐릭터.스킬.length > 0 && (
        <div className="스킬섹션">
          <h3>스킬</h3>
          {캐릭터.스킬.map((스킬, 인덱스) => (
            <div key={인덱스} className="스킬정보">
              <h4>{스킬.이름}</h4>
              <p>{스킬.설명}</p>
              {스킬.쿨다운 && <span className="쿨다운">쿨다운: {스킬.쿨다운}</span>}
            </div>
          ))}
        </div>
      )}

      {캐릭터.설명 && (
        <div className="설명섹션">
          <h3>설명</h3>
          <p>{캐릭터.설명}</p>
        </div>
      )}
    </div>
  );

  // 간단 프로파일 뷰
  const 간단프로파일 = () => (
    <div className="프로파일-간단">
      <div className="간단-헤더">
        <h3>{캐릭터.이름} - {캐릭터.직업} Lv.{캐릭터.레벨}</h3>
        <span className={`등급태그 ${캐릭터.등급}`}>{캐릭터.등급}</span>
      </div>
      <div className="간단-능력치">
        <span>⚔️ {캐릭터.상세능력치.공격력}</span>
        <span>🛡️ {캐릭터.상세능력치.방어력}</span>
        <span>❤️ {캐릭터.상세능력치.체력.현재}/{캐릭터.상세능력치.체력.최대}</span>
        <span>⚡ {캐릭터.상세능력치.속도}</span>
      </div>
    </div>
  );

  // RPG 스타일 프로파일
  const RPG스타일프로파일 = () => (
    <div className="프로파일-rpg">
      <div className="rpg-캐릭터이미지">
        <div className="이미지플레이스홀더">
          {캐릭터.클래스 === '기사' ? '🛡️' : 
           캐릭터.클래스 === '마법사' ? '🧙' :
           캐릭터.클래스 === '궁수' ? '🏹' :
           캐릭터.클래스 === '도적' ? '🗡️' : '⚔️'}
        </div>
      </div>
      <div className="rpg-정보">
        <div className="rpg-이름바">
          <span className="이름">{캐릭터.이름}</span>
          <span className="레벨">Lv.{캐릭터.레벨}</span>
        </div>
        <div className="rpg-바">
          <div className="hp바">
            <label>HP</label>
            <div className="바">
              <div className="바채움" style={{ width: `${(캐릭터.상세능력치.체력.현재 / 캐릭터.상세능력치.체력.최대) * 100}%` }}></div>
              <span className="바텍스트">{캐릭터.상세능력치.체력.현재}/{캐릭터.상세능력치.체력.최대}</span>
            </div>
          </div>
          <div className="mp바">
            <label>MP</label>
            <div className="바">
              <div className="바채움" style={{ width: `${(캐릭터.상세능력치.마나.현재 / 캐릭터.상세능력치.마나.최대) * 100}%` }}></div>
              <span className="바텍스트">{캐릭터.상세능력치.마나.현재}/{캐릭터.상세능력치.마나.최대}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 카드형 프로파일
  const 카드형프로파일 = () => (
    <div className="프로파일-카드">
      <div className={`카드-헤더 ${캐릭터.등급}`}>
        <div className="카드-레벨">{캐릭터.레벨}</div>
        <div className="카드-타이틀">
          <h3>{캐릭터.이름}</h3>
          <p>{캐릭터.직업}</p>
        </div>
      </div>
      <div className="카드-이미지">
        <div className="이미지플레이스홀더">
          {캐릭터.클래스 === '기사' ? '🛡️' : 
           캐릭터.클래스 === '마법사' ? '🧙' :
           캐릭터.클래스 === '궁수' ? '🏹' :
           캐릭터.클래스 === '도적' ? '🗡️' : '⚔️'}
        </div>
      </div>
      <div className="카드-능력치">
        <div className="능력치행">
          <span>공격력</span>
          <span>{캐릭터.상세능력치.공격력}</span>
        </div>
        <div className="능력치행">
          <span>방어력</span>
          <span>{캐릭터.상세능력치.방어력}</span>
        </div>
        <div className="능력치행">
          <span>체력</span>
          <span>{캐릭터.상세능력치.체력.최대}</span>
        </div>
        <div className="능력치행">
          <span>속도</span>
          <span>{캐릭터.상세능력치.속도}</span>
        </div>
      </div>
    </div>
  );

  // 통계 프로파일
  const 통계프로파일 = () => {
    // 최대값 기준 설정 (등급별)
    const 최대값기준 = {
      일반: { 공격력: 50, 방어력: 50, 체력: 500, 속도: 100, 치명타율: 30, 저항력: 30 },
      희귀: { 공격력: 75, 방어력: 75, 체력: 750, 속도: 125, 치명타율: 40, 저항력: 40 },
      영웅: { 공격력: 100, 방어력: 100, 체력: 1000, 속도: 150, 치명타율: 50, 저항력: 50 },
      전설: { 공격력: 150, 방어력: 150, 체력: 1500, 속도: 200, 치명타율: 60, 저항력: 60 }
    };

    const 기준 = 최대값기준[캐릭터.등급];

    return (
      <div className="프로파일-통계">
        <h3>{캐릭터.이름} - 상세 통계</h3>
        <div className="통계-차트">
          <div className="통계항목">
            <label>공격력</label>
            <div className="통계바">
              <div className="통계바채움" style={{ width: `${(캐릭터.상세능력치.공격력 / 기준.공격력) * 100}%` }}></div>
              <span>{캐릭터.상세능력치.공격력}</span>
            </div>
          </div>
          <div className="통계항목">
            <label>방어력</label>
            <div className="통계바">
              <div className="통계바채움" style={{ width: `${(캐릭터.상세능력치.방어력 / 기준.방어력) * 100}%` }}></div>
              <span>{캐릭터.상세능력치.방어력}</span>
            </div>
          </div>
          <div className="통계항목">
            <label>체력</label>
            <div className="통계바">
              <div className="통계바채움" style={{ width: `${(캐릭터.상세능력치.체력.최대 / 기준.체력) * 100}%` }}></div>
              <span>{캐릭터.상세능력치.체력.최대}</span>
            </div>
          </div>
          <div className="통계항목">
            <label>속도</label>
            <div className="통계바">
              <div className="통계바채움" style={{ width: `${(캐릭터.상세능력치.속도 / 기준.속도) * 100}%` }}></div>
              <span>{캐릭터.상세능력치.속도}</span>
            </div>
          </div>
          <div className="통계항목">
            <label>치명타율</label>
            <div className="통계바">
              <div className="통계바채움" style={{ width: `${(캐릭터.상세능력치.치명타율 / 기준.치명타율) * 100}%` }}></div>
              <span>{캐릭터.상세능력치.치명타율}%</span>
            </div>
          </div>
          <div className="통계항목">
            <label>저항력</label>
            <div className="통계바">
              <div className="통계바채움" style={{ width: `${(캐릭터.상세능력치.저항력 / 기준.저항력) * 100}%` }}></div>
              <span>{캐릭터.상세능력치.저항력}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 프로파일 렌더링 함수
  const 프로파일렌더링 = () => {
    switch (현재프로파일) {
      case '상세':
        return 상세프로파일();
      case '간단':
        return 간단프로파일();
      case 'RPG스타일':
        return RPG스타일프로파일();
      case '카드형':
        return 카드형프로파일();
      case '통계':
        return 통계프로파일();
      default:
        return 상세프로파일();
    }
  };

  return (
    <div className="캐릭터프로파일">
      {/* 프로파일 선택기는 뷰모드가 외부에서 제어되지 않을 때만 표시 */}
      {!뷰모드 && (
        <div className="프로파일선택기">
          <div className="프로파일버튼그룹">
            <button 
              className={현재프로파일 === '상세' ? '활성' : ''} 
              onClick={() => 내부프로파일모드설정('상세')}
            >
              상세 보기
            </button>
            <button 
              className={현재프로파일 === '간단' ? '활성' : ''} 
              onClick={() => 내부프로파일모드설정('간단')}
            >
              간단 보기
            </button>
            <button 
              className={현재프로파일 === 'RPG스타일' ? '활성' : ''} 
              onClick={() => 내부프로파일모드설정('RPG스타일')}
            >
              RPG 스타일
            </button>
            <button 
              className={현재프로파일 === '카드형' ? '활성' : ''} 
              onClick={() => 내부프로파일모드설정('카드형')}
            >
              카드형
            </button>
            <button 
              className={현재프로파일 === '통계' ? '활성' : ''} 
              onClick={() => 내부프로파일모드설정('통계')}
            >
              통계 보기
            </button>
          </div>
        </div>
      )}
      
      <div className="프로파일컨테이너">
        {프로파일렌더링()}
        
        {/* 인라인 장비/스킬 편집 영역 */}
        {편집중인장비스킬 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">장비/스킬 편집</h4>
              <button
                onClick={장비스킬편집완료}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                편집 완료
              </button>
            </div>
            
            {/* 탭 네비게이션 */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-2 font-medium ${
                  현재편집탭 === '장착된아이템' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => 현재편집탭설정('장착된아이템')}
              >
                장착된 아이템 ({현재장착아이템목록.length}개)
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  현재편집탭 === '보유스킬' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => 현재편집탭설정('보유스킬')}
              >
                보유 스킬 ({현재보유스킬목록.length}개)
              </button>
              <button
                className={`px-4 py-2 font-medium ${
                  현재편집탭 === '추가가능' 
                    ? 'border-b-2 border-blue-500 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => 현재편집탭설정('추가가능')}
              >
                추가 가능 ({장착가능아이템목록.length + 추가가능스킬목록.length}개)
              </button>
            </div>
            
            {/* 탭 내용 */}
            <div className="bg-white rounded-lg border overflow-hidden">
              {현재편집탭 === '장착된아이템' && (
                <div className="p-4">
                  <h5 className="font-medium text-gray-900 mb-3">현재 장착된 아이템</h5>
                  {현재장착아이템목록.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">장착된 아이템이 없습니다</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {현재장착아이템목록.map((아이템) => (
                        <div key={아이템.아이디} className="flex items-center p-3 border rounded-lg bg-green-50 border-green-200">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">
                                {아이템.종류 === '무기' ? '⚔️' : 
                                 아이템.종류 === '방어구' ? '🛡️' : 
                                 아이템.종류 === '소모품' ? '🧪' : '📦'}
                              </span>
                              <h6 className="font-medium text-gray-900">{아이템.이름}</h6>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                아이템.등급 === '전설' ? 'bg-purple-100 text-purple-800' :
                                아이템.등급 === '영웅' ? 'bg-blue-100 text-blue-800' :
                                아이템.등급 === '희귀' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {아이템.등급}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{아이템.설명}</p>
                            <div className="flex space-x-3 text-sm">
                              {아이템.능력치.공격력 && (
                                <span className="text-red-600">공격력 +{아이템.능력치.공격력}</span>
                              )}
                              {아이템.능력치.방어력 && (
                                <span className="text-blue-600">방어력 +{아이템.능력치.방어력}</span>
                              )}
                              {아이템.능력치.체력 && (
                                <span className="text-green-600">체력 +{아이템.능력치.체력}</span>
                              )}
                              {아이템.능력치.속도 && (
                                <span className="text-yellow-600">속도 +{아이템.능력치.속도}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => 아이템장착해제(아이템.아이디, true)}
                            className="ml-3 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            해제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {현재편집탭 === '보유스킬' && (
                <div className="p-4">
                  <h5 className="font-medium text-gray-900 mb-3">현재 보유 스킬</h5>
                  {현재보유스킬목록.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">보유한 스킬이 없습니다</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {현재보유스킬목록.map((스킬) => (
                        <div key={스킬.아이디} className="flex items-center p-3 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">
                                {스킬.종류 === '공격' ? '⚔️' : 
                                 스킬.종류 === '방어' ? '🛡️' : 
                                 스킬.종류 === '버프' ? '✨' :
                                 스킬.종류 === '디버프' ? '💀' :
                                 스킬.종류 === '치유' ? '💚' : '🔮'}
                              </span>
                              <h6 className="font-medium text-gray-900">{스킬.이름}</h6>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                {스킬.종류}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{스킬.설명}</p>
                            <div className="flex space-x-3 text-sm">
                              {스킬.데미지 > 0 && (
                                <span className="text-red-600">데미지 {스킬.데미지}</span>
                              )}
                              <span className="text-blue-600">쿨다운 {스킬.쿨다운}턴</span>
                              <span className="text-purple-600">마나 {스킬.마나소비}</span>
                              <span className="text-green-600">사거리 {스킬.사거리}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => 스킬보유제거(스킬.아이디, true)}
                            className="ml-3 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            제거
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {현재편집탭 === '추가가능' && (
                <div className="p-4">
                  <div className="space-y-6">
                    {/* 추가 가능한 아이템 */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">추가 가능한 아이템 ({장착가능아이템목록.length}개)</h5>
                      {장착가능아이템목록.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">추가할 수 있는 아이템이 없습니다</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {장착가능아이템목록.map((아이템) => (
                            <div key={아이템.아이디} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-lg">
                                    {아이템.종류 === '무기' ? '⚔️' : 
                                     아이템.종류 === '방어구' ? '🛡️' : 
                                     아이템.종류 === '소모품' ? '🧪' : '📦'}
                                  </span>
                                  <h6 className="font-medium text-gray-900">{아이템.이름}</h6>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    아이템.등급 === '전설' ? 'bg-purple-100 text-purple-800' :
                                    아이템.등급 === '영웅' ? 'bg-blue-100 text-blue-800' :
                                    아이템.등급 === '희귀' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {아이템.등급}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{아이템.설명}</p>
                                <div className="flex space-x-3 text-sm">
                                  {아이템.능력치.공격력 && (
                                    <span className="text-red-600">공격력 +{아이템.능력치.공격력}</span>
                                  )}
                                  {아이템.능력치.방어력 && (
                                    <span className="text-blue-600">방어력 +{아이템.능력치.방어력}</span>
                                  )}
                                  {아이템.능력치.체력 && (
                                    <span className="text-green-600">체력 +{아이템.능력치.체력}</span>
                                  )}
                                  {아이템.능력치.속도 && (
                                    <span className="text-yellow-600">속도 +{아이템.능력치.속도}</span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => 아이템장착해제(아이템.아이디, false)}
                                className="ml-3 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                장착
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* 추가 가능한 스킬 */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">추가 가능한 스킬 ({추가가능스킬목록.length}개)</h5>
                      {추가가능스킬목록.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">추가할 수 있는 스킬이 없습니다</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {추가가능스킬목록.map((스킬) => (
                            <div key={스킬.아이디} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-lg">
                                    {스킬.종류 === '공격' ? '⚔️' : 
                                     스킬.종류 === '방어' ? '🛡️' : 
                                     스킬.종류 === '버프' ? '✨' :
                                     스킬.종류 === '디버프' ? '💀' :
                                     스킬.종류 === '치유' ? '💚' : '🔮'}
                                  </span>
                                  <h6 className="font-medium text-gray-900">{스킬.이름}</h6>
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                    {스킬.종류}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{스킬.설명}</p>
                                <div className="flex space-x-3 text-sm">
                                  {스킬.데미지 > 0 && (
                                    <span className="text-red-600">데미지 {스킬.데미지}</span>
                                  )}
                                  <span className="text-blue-600">쿨다운 {스킬.쿨다운}턴</span>
                                  <span className="text-purple-600">마나 {스킬.마나소비}</span>
                                  <span className="text-green-600">사거리 {스킬.사거리}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => 스킬보유제거(스킬.아이디, false)}
                                className="ml-3 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                추가
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default 캐릭터프로파일;