import { useState, useMemo } from 'react';
import { 폴더타입, 노트타입 } from '../타입';

// 태그 필터링을 위한 훅
export const useTagFilter = (폴더목록: 폴더타입[], 활성폴더: 폴더타입 | null) => {
  const [선택된태그목록, 선택된태그목록설정] = useState<string[]>([]);
  const [필터모드, 필터모드설정] = useState<'AND' | 'OR'>('AND');

  // 태그 기반 노트 필터링
  const 필터링된노트목록 = useMemo(() => {
    if (!활성폴더 || 선택된태그목록.length === 0) {
      return 활성폴더?.노트목록 || [];
    }

    return 활성폴더.노트목록.filter(노트 => {
      const 노트태그목록 = 노트.태그목록 || [];
      
      if (필터모드 === 'AND') {
        // 모든 선택된 태그가 포함된 노트만
        return 선택된태그목록.every(선택태그 => 
          노트태그목록.some(노트태그 => 
            노트태그.toLowerCase().includes(선택태그.toLowerCase())
          )
        );
      } else {
        // 선택된 태그 중 하나라도 포함된 노트
        return 선택된태그목록.some(선택태그 => 
          노트태그목록.some(노트태그 => 
            노트태그.toLowerCase().includes(선택태그.toLowerCase())
          )
        );
      }
    });
  }, [활성폴더, 선택된태그목록, 필터모드]);

  // 전체 폴더에서 태그 기반 노트 검색
  const 전체필터링된노트목록 = useMemo(() => {
    if (선택된태그목록.length === 0) {
      return [];
    }

    const 결과목록: Array<{ 노트: 노트타입; 폴더: 폴더타입 }> = [];

    for (const 폴더 of 폴더목록) {
      for (const 노트 of 폴더.노트목록) {
        const 노트태그목록 = 노트.태그목록 || [];
        
        let 매칭 = false;
        if (필터모드 === 'AND') {
          매칭 = 선택된태그목록.every(선택태그 => 
            노트태그목록.some(노트태그 => 
              노트태그.toLowerCase().includes(선택태그.toLowerCase())
            )
          );
        } else {
          매칭 = 선택된태그목록.some(선택태그 => 
            노트태그목록.some(노트태그 => 
              노트태그.toLowerCase().includes(선택태그.toLowerCase())
            )
          );
        }

        if (매칭) {
          결과목록.push({ 노트, 폴더 });
        }
      }
    }

    return 결과목록;
  }, [폴더목록, 선택된태그목록, 필터모드]);

  // 태그 통계 정보
  const 필터통계 = useMemo(() => {
    const 현재폴더결과수 = 필터링된노트목록.length;
    const 전체결과수 = 전체필터링된노트목록.length;
    const 전체노트수 = 활성폴더?.노트목록.length || 0;
    
    return {
      현재폴더결과수,
      전체결과수,
      전체노트수,
      필터링비율: 전체노트수 > 0 ? Math.round((현재폴더결과수 / 전체노트수) * 100) : 0
    };
  }, [필터링된노트목록.length, 전체필터링된노트목록.length, 활성폴더?.노트목록.length]);

  // 태그 선택/해제
  const 태그선택토글 = (태그: string) => {
    선택된태그목록설정(이전목록 => 
      이전목록.includes(태그)
        ? 이전목록.filter(t => t !== 태그)
        : [...이전목록, 태그]
    );
  };

  // 모든 태그 해제
  const 모든태그해제 = () => {
    선택된태그목록설정([]);
  };

  // 필터 초기화
  const 필터초기화 = () => {
    선택된태그목록설정([]);
    필터모드설정('AND');
  };

  return {
    // 상태
    선택된태그목록,
    필터모드,
    
    // 필터링 결과
    필터링된노트목록,
    전체필터링된노트목록,
    필터통계,
    
    // 액션
    선택된태그목록설정,
    필터모드설정,
    태그선택토글,
    모든태그해제,
    필터초기화,
    
    // 상태 확인
    필터링활성: 선택된태그목록.length > 0
  };
};