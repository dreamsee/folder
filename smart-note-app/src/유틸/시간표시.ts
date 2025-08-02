/**
 * 시간 표시 유틸리티 함수들
 * 오늘/어제/날짜 구분하여 스마트하게 표시
 */

export interface 시간표시결과 {
  표시텍스트: string;
  전체시간: string; // 툴팁용 전체 시간
  상세표시텍스트: string; // 클릭 시 표시할 상세 정보
  클릭가능: boolean; // 클릭 가능 여부 (오늘은 클릭 불가)
}

/**
 * 타임스탬프를 스마트하게 포맷팅
 * - 오늘: 시간만 표시 (15:30)
 * - 어제: "어제 15:30"
 * - 그 이전: 날짜 표시 (7/12)
 */
export const 스마트시간포맷팅 = (타임스탬프: Date): 시간표시결과 => {
  const 입력시간 = new Date(타임스탬프);
  const 현재시간 = new Date();
  
  // 오늘 날짜 계산 (시간 00:00:00으로 설정)
  const 오늘시작 = new Date(현재시간);
  오늘시작.setHours(0, 0, 0, 0);
  
  // 어제 날짜 계산
  const 어제시작 = new Date(오늘시작);
  어제시작.setDate(어제시작.getDate() - 1);
  
  // 시간 부분 포맷팅 (HH:MM)
  const 시간문자열 = `${입력시간.getHours().toString().padStart(2, '0')}:${입력시간.getMinutes().toString().padStart(2, '0')}`;
  
  // 전체 시간 (툴팁용) - 년/월/일 요일 시:분:초
  const 요일목록 = ['일', '월', '화', '수', '목', '금', '토'];
  const 요일 = 요일목록[입력시간.getDay()];
  const 전체시간 = `${입력시간.getFullYear()}년 ${입력시간.getMonth() + 1}월 ${입력시간.getDate()}일 (${요일}) ${시간문자열}:${입력시간.getSeconds().toString().padStart(2, '0')}`;
  
  // 날짜 구분에 따른 표시
  if (입력시간 >= 오늘시작) {
    // 오늘 - 시간만 표시 (클릭 불가)
    return {
      표시텍스트: 시간문자열,
      전체시간,
      상세표시텍스트: 시간문자열,
      클릭가능: false
    };
  } else if (입력시간 >= 어제시작) {
    // 어제 - "어제 시간" 형식 (클릭 시 상세 정보)
    const 상세표시 = `${입력시간.getFullYear()}년 ${입력시간.getMonth() + 1}월 ${입력시간.getDate()}일(${요일})\n${시간문자열}`;
    return {
      표시텍스트: `어제 ${시간문자열}`,
      전체시간,
      상세표시텍스트: 상세표시,
      클릭가능: true
    };
  } else {
    // 그 이전 - 월/일 형식 (클릭 시 상세 정보)
    const 날짜문자열 = `${입력시간.getMonth() + 1}/${입력시간.getDate()}`;
    const 상세표시 = `${입력시간.getFullYear()}년 ${입력시간.getMonth() + 1}월 ${입력시간.getDate()}일(${요일})\n${시간문자열}`;
    return {
      표시텍스트: 날짜문자열,
      전체시간,
      상세표시텍스트: 상세표시,
      클릭가능: true
    };
  }
};

/**
 * 기존 시간 포맷팅 함수 (호환성 유지)
 */
export const 시간포맷팅 = (타임스탬프: Date): string => {
  const 날짜객체 = new Date(타임스탬프);
  return `${날짜객체.getHours().toString().padStart(2, '0')}:${날짜객체.getMinutes().toString().padStart(2, '0')}`;
};