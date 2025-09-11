// 공통 오류 처리 유틸리티
// 반복되는 TypeScript 오류 패턴 표준화

import { 기본감정타입, 감정강도타입 } from '../타입';

// ===== 안전한 타입 캐스팅 =====

/**
 * 안전한 감정강도 타입 캐스팅
 */
export const 안전한감정강도캐스팅 = (값: number): 감정강도타입 => {
  const 제한된값 = Math.max(1, Math.min(10, Math.round(값)));
  return 제한된값 as 감정강도타입;
};

/**
 * 안전한 에너지레벨 캐스팅
 */
export const 안전한에너지레벨캐스팅 = (값: number): 1 | 2 | 3 | 4 | 5 => {
  const 제한된값 = Math.max(1, Math.min(5, Math.round(값)));
  return 제한된값 as 1 | 2 | 3 | 4 | 5;
};

/**
 * 안전한 집중도 캐스팅
 */
export const 안전한집중도캐스팅 = (값: number): 1 | 2 | 3 | 4 | 5 => {
  const 제한된값 = Math.max(1, Math.min(5, Math.round(값)));
  return 제한된값 as 1 | 2 | 3 | 4 | 5;
};

/**
 * 범용 안전한 타입 캐스팅
 */
export const 안전한타입캐스팅 = <T>(값: any, 기본값: T, 유효성검사?: (v: any) => boolean): T => {
  if (유효성검사 && !유효성검사(값)) {
    return 기본값;
  }
  return 값 as T;
};

// ===== 안전한 JSON 처리 =====

/**
 * 안전한 JSON 파싱
 */
export const 안전한JSON파싱 = <T>(jsonString: string, 기본값: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return 기본값;
  }
};

/**
 * 안전한 JSON 문자열화
 */
export const 안전한JSON문자열화 = (객체: any, 기본값: string = '{}'): string => {
  try {
    return JSON.stringify(객체);
  } catch {
    return 기본값;
  }
};

// ===== 안전한 배열 접근 =====

/**
 * 안전한 배열 접근
 */
export const 안전한배열접근 = <T>(배열: T[], 인덱스: number, 기본값: T): T => {
  if (배열 && 인덱스 >= 0 && 인덱스 < 배열.length) {
    return 배열[인덱스];
  }
  return 기본값;
};

/**
 * 안전한 객체 속성 접근
 */
export const 안전한객체접근 = <T>(객체: any, 경로: string, 기본값: T): T => {
  try {
    return 경로.split('.').reduce((obj, key) => obj?.[key], 객체) ?? 기본값;
  } catch {
    return 기본값;
  }
};

// ===== 안전한 함수 실행 =====

/**
 * 안전한 함수 실행 (오류 시 기본값 반환)
 */
export const 안전한함수실행 = <T>(실행함수: () => T, 기본값: T): T => {
  try {
    return 실행함수();
  } catch {
    return 기본값;
  }
};

/**
 * 안전한 비동기 함수 실행
 */
export const 안전한비동기실행 = async <T>(
  실행함수: () => Promise<T>, 
  기본값: T
): Promise<T> => {
  try {
    return await 실행함수();
  } catch {
    return 기본값;
  }
};

// ===== 디바운스 & 스로틀 =====

/**
 * 디바운스 함수
 */
export const 디바운스 = <T extends (...args: any[]) => any>(
  함수: T,
  지연시간: number
): ((...args: Parameters<T>) => void) => {
  let 타이머: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(타이머);
    타이머 = setTimeout(() => 함수(...args), 지연시간);
  };
};

/**
 * 스로틀 함수
 */
export const 스로틀 = <T extends (...args: any[]) => any>(
  함수: T,
  지연시간: number
): ((...args: Parameters<T>) => void) => {
  let 마지막실행 = 0;
  return (...args: Parameters<T>) => {
    const 현재시간 = Date.now();
    if (현재시간 - 마지막실행 >= 지연시간) {
      마지막실행 = 현재시간;
      함수(...args);
    }
  };
};

// ===== 재시도 로직 =====

/**
 * 재시도 함수
 */
export const 재시도실행 = async <T>(
  실행함수: () => Promise<T>,
  최대재시도: number = 3,
  지연시간: number = 1000
): Promise<T> => {
  for (let i = 0; i < 최대재시도; i++) {
    try {
      return await 실행함수();
    } catch (error) {
      if (i === 최대재시도 - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 지연시간 * (i + 1)));
    }
  }
  throw new Error('재시도 한계 도달');
};

// ===== 유효성 검사 헬퍼 =====

/**
 * 감정 유효성 검사
 */
export const 유효한감정인지확인 = (값: any): 값 is 기본감정타입 => {
  const 유효한감정들: 기본감정타입[] = ['기쁨', '슬픔', '분노', '두려움', '놀람', '혐오', '중립'];
  return 유효한감정들.includes(값);
};

/**
 * 감정강도 유효성 검사
 */
export const 유효한감정강도인지확인 = (값: any): 값 is 감정강도타입 => {
  return Number.isInteger(값) && 값 >= 1 && 값 <= 10;
};

/**
 * 에너지레벨 유효성 검사
 */
export const 유효한에너지레벨인지확인 = (값: any): boolean => {
  return Number.isInteger(값) && 값 >= 1 && 값 <= 5;
};

// ===== 사용 예제 (주석) =====

/*
// 기존 코드 (반복적인 오류 발생)
const 전체강도 = Math.min(10, 5 + 최고점수 * 2) as 감정강도타입; // ❌

// 개선된 코드 (표준 유틸리티 사용)
const 전체강도 = 안전한감정강도캐스팅(Math.min(10, 5 + 최고점수 * 2)); // ✅

// JSON 파싱 오류 방지
const 설정데이터 = 안전한JSON파싱(사용자입력, { 기본설정: true }); // ✅

// 배열 접근 오류 방지
const 첫번째항목 = 안전한배열접근(목록, 0, '기본값'); // ✅
*/