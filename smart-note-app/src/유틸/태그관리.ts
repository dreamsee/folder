// 태그 관리 유틸리티 함수들

// 태그 색상 팔레트 (밝고 선명한 색상들)
const 태그색상팔레트 = [
  '#ff6b6b', // 빨강
  '#4ecdc4', // 청록
  '#45b7d1', // 하늘
  '#f7b731', // 노랑
  '#5f27cd', // 보라
  '#00d2d3', // 민트
  '#ff9ff3', // 분홍
  '#54a0ff', // 파랑
  '#48dbfb', // 연파랑
  '#1dd1a1', // 초록
  '#feca57', // 주황
  '#ff6348', // 산호
  '#a29bfe', // 연보라
  '#fd79a8', // 연분홍
  '#6c5ce7', // 진보라
  '#00b894', // 에메랄드
];

// 문자열을 해시값으로 변환
const 문자열해시계산 = (문자열: string): number => {
  let 해시 = 0;
  for (let i = 0; i < 문자열.length; i++) {
    const 문자코드 = 문자열.charCodeAt(i);
    해시 = ((해시 << 5) - 해시) + 문자코드;
    해시 = 해시 & 해시; // 32비트 정수로 변환
  }
  return Math.abs(해시);
};

// 태그에 대한 고정 색상 반환
export const 태그색상가져오기 = (태그: string): string => {
  const 해시값 = 문자열해시계산(태그);
  const 색상인덱스 = 해시값 % 태그색상팔레트.length;
  return 태그색상팔레트[색상인덱스];
};

// 태그 텍스트 정규화 (공백 제거, 소문자 변환)
export const 태그정규화 = (태그: string): string => {
  return 태그.trim().toLowerCase();
};

// 태그 유효성 검사
export const 태그유효성검사 = (태그: string): boolean => {
  const 정규화된태그 = 태그정규화(태그);
  return 정규화된태그.length > 0 && 정규화된태그.length <= 20;
};

// 태그 배열에서 중복 제거
export const 태그중복제거 = (태그목록: string[]): string[] => {
  const 태그맵 = new Map<string, string>();
  
  for (const 태그 of 태그목록) {
    const 정규화된태그 = 태그정규화(태그);
    if (!태그맵.has(정규화된태그)) {
      태그맵.set(정규화된태그, 태그);
    }
  }
  
  return Array.from(태그맵.values());
};

// 태그 자동완성을 위한 검색
export const 태그검색 = (
  전체태그목록: string[],
  검색어: string,
  최대결과수: number = 10
): string[] => {
  const 정규화된검색어 = 태그정규화(검색어);
  
  if (!정규화된검색어) {
    return 전체태그목록.slice(0, 최대결과수);
  }
  
  return 전체태그목록
    .filter(태그 => 태그정규화(태그).includes(정규화된검색어))
    .slice(0, 최대결과수);
};

// 태그 빈도수 계산
export const 태그빈도계산 = (모든태그목록: string[][]): Map<string, number> => {
  const 빈도맵 = new Map<string, number>();
  
  for (const 태그목록 of 모든태그목록) {
    for (const 태그 of 태그목록) {
      const 정규화된태그 = 태그정규화(태그);
      빈도맵.set(정규화된태그, (빈도맵.get(정규화된태그) || 0) + 1);
    }
  }
  
  return 빈도맵;
};

// 인기 태그 추출
export const 인기태그추출 = (
  빈도맵: Map<string, number>,
  최대개수: number = 20
): Array<{ 태그: string; 빈도: number }> => {
  return Array.from(빈도맵.entries())
    .map(([태그, 빈도]) => ({ 태그, 빈도 }))
    .sort((a, b) => b.빈도 - a.빈도)
    .slice(0, 최대개수);
};