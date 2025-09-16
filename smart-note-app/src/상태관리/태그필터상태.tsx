import React, { createContext, useContext, ReactNode } from 'react';
import { 폴더타입 } from '../타입';
import { useTagFilter } from '../훅/useTagFilter';

// 태그 필터링 상태를 위한 Context 타입 정의
interface 태그필터상태컨텍스트타입 {
  // 상태
  선택된태그목록: string[];
  필터모드: 'AND' | 'OR';
  
  // 필터링 결과
  필터링된노트목록: any[];
  전체필터링된노트목록: Array<{ 노트: any; 폴더: 폴더타입 }>;
  필터통계: {
    현재폴더결과수: number;
    전체결과수: number;
    전체노트수: number;
    필터링비율: number;
  };
  
  // 액션
  선택된태그목록설정: (태그목록: string[]) => void;
  필터모드설정: (모드: 'AND' | 'OR') => void;
  태그선택토글: (태그: string) => void;
  모든태그해제: () => void;
  필터초기화: () => void;
  
  // 상태 확인
  필터링활성: boolean;
}

// Context 생성
const 태그필터상태컨텍스트 = createContext<태그필터상태컨텍스트타입 | undefined>(undefined);

// Provider 컴포넌트
interface 태그필터상태제공자속성 {
  children: ReactNode;
  폴더목록: 폴더타입[];
  활성폴더: 폴더타입 | null;
}

export const 태그필터상태제공자: React.FC<태그필터상태제공자속성> = ({ 
  children, 
  폴더목록, 
  활성폴더 
}) => {
  const 태그필터훅결과 = useTagFilter(폴더목록, 활성폴더);

  return (
    <태그필터상태컨텍스트.Provider value={태그필터훅결과}>
      {children}
    </태그필터상태컨텍스트.Provider>
  );
};

// 커스텀 훅
export const 태그필터상태사용하기 = () => {
  const 상태 = useContext(태그필터상태컨텍스트);
  if (!상태) {
    throw new Error('태그필터상태사용하기는 태그필터상태제공자 내부에서만 사용할 수 있습니다');
  }
  return 상태;
};