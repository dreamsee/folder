import { useMemo } from 'react';
import { 폴더타입 } from '../타입';
import { 태그빈도계산, 인기태그추출 } from '../유틸/태그관리';

// 폴더 내 모든 태그를 수집하고 관리하는 훅
export const useFolderTags = (활성폴더: 폴더타입 | null) => {
  // 폴더 내 모든 태그 수집
  const 전체태그목록 = useMemo(() => {
    if (!활성폴더) return [];
    
    const 태그세트 = new Set<string>();
    
    활성폴더.노트목록.forEach(노트 => {
      if (노트.태그목록) {
        노트.태그목록.forEach(태그 => 태그세트.add(태그));
      }
    });
    
    return Array.from(태그세트).sort();
  }, [활성폴더]);

  // 태그 빈도 계산
  const 태그빈도맵 = useMemo(() => {
    if (!활성폴더) return new Map<string, number>();
    
    const 모든태그목록 = 활성폴더.노트목록
      .map(노트 => 노트.태그목록 || [])
      .filter(태그목록 => 태그목록.length > 0);
    
    return 태그빈도계산(모든태그목록);
  }, [활성폴더]);

  // 인기 태그 목록
  const 인기태그목록 = useMemo(() => {
    return 인기태그추출(태그빈도맵, 10);
  }, [태그빈도맵]);

  return {
    전체태그목록,
    태그빈도맵,
    인기태그목록
  };
};