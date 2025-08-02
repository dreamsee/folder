// 위치 관련 타입
export interface 위치타입 {
  x: number;
  y: number;
}

// 바둑판 관련 타입
export interface 바둑판타입 {
  가로: number;
  세로: number;
  배치정보: 배치정보타입[][];
}

export interface 배치정보타입 {
  점유됨: boolean;
  캐릭터아이디?: string;
  이동가능: boolean;
  공격범위내: boolean;
}

// 클래스 관련 타입
export type 클래스타입 = '전사' | '마법사' | '궁수' | '도적' | '기사' | '전체';

// 조합 관련 타입
export interface 조합재료타입 {
  아이디: string;
  수량: number;
}

export interface 조합레시피타입 {
  아이디: string;
  이름: string;
  결과아이템아이디?: string;
  결과스킬아이디?: string;
  필요재료: 조합재료타입[];
  조합비용: number;
  필요클래스: 클래스타입[];
  설명?: string;
}

// 캐릭터 관련 타입
export interface 캐릭터타입 {
  아이디: string;
  이름: string;
  레벨: number;
  체력: number;
  공격력: number;
  방어력: number;
  속도: number;
  특수능력?: string[];
  클래스: 클래스타입;
  등급: '일반' | '희귀' | '영웅' | '전설';
  설명?: string;
  위치?: 위치타입;
  이동범위: number;
  공격범위: number;
}

// 아이템 관련 타입
export interface 아이템타입 {
  아이디: string;
  이름: string;
  종류: '무기' | '방어구' | '소모품' | '재료' | '기타';
  등급: '일반' | '희귀' | '영웅' | '전설';
  능력치: {
    공격력?: number;
    방어력?: number;
    체력?: number;
    속도?: number;
    특수효과?: string[];
  };
  가격: number;
  설명?: string;
  사용가능클래스: 클래스타입[];
  재료여부: boolean;
  조합으로생성됨?: boolean;
  조합레시피아이디?: string;
}

// 스킬 관련 타입
export interface 스킬타입 {
  아이디: string;
  이름: string;
  종류: '공격' | '방어' | '버프' | '디버프' | '치유' | '재료';
  데미지: number;
  쿨다운: number;
  마나소비: number;
  사거리: number;
  효과범위: '단일' | '광역';
  설명?: string;
  사용가능클래스: 클래스타입[];
  재료여부: boolean;
  조합으로생성됨?: boolean;
  조합레시피아이디?: string;
}

// 전투 시뮬레이션 타입
export interface 전투결과타입 {
  승자: string;
  총데미지: {
    [캐릭터명: string]: number;
  };
  전투기록: 전투로그[];
  지속시간: number;
}

export interface 전투로그 {
  시간: number;
  행동자: string;
  행동: string;
  대상?: string;
  데미지?: number;
  효과?: string;
}

// 밸런스 점수 타입
export interface 밸런스점수타입 {
  총점: number;
  세부점수: {
    공격력밸런스: number;
    방어력밸런스: number;
    가격효율성: number;
    성장곡선: number;
  };
  평가: '매우좋음' | '좋음' | '보통' | '나쁨' | '매우나쁨';
}

// 배치 시뮬레이션 타입
export interface 배치시뮬레이션타입 {
  바둑판: 바둑판타입;
  배치캐릭터목록: 배치캐릭터타입[];
  현재턴: number;
  진행상태: '준비중' | '진행중' | '완료';
  승리조건: '전멸' | '점령' | '생존';
}

export interface 배치캐릭터타입 extends 캐릭터타입 {
  팀: '아군' | '적군';
  현재체력: number;
  행동완료: boolean;
  상태효과: 상태효과타입[];
}

export interface 상태효과타입 {
  종류: '독' | '화상' | '빙결' | '마비' | '버프' | '디버프';
  지속턴: number;
  효과값: number;
  설명: string;
}

export interface 배치전투결과타입 {
  승리팀: '아군' | '적군' | '무승부';
  총턴수: number;
  생존캐릭터: {
    아군: 배치캐릭터타입[];
    적군: 배치캐릭터타입[];
  };
  전투기록: 배치전투로그[];
  전술분석: {
    이동효율성: number;
    공격효율성: number;
    위치선택점수: number;
  };
}

export interface 배치전투로그 {
  턴: number;
  행동자: string;
  행동종류: '이동' | '공격' | '스킬' | '대기';
  시작위치?: 위치타입;
  종료위치?: 위치타입;
  대상?: string;
  대상위치?: 위치타입;
  데미지?: number;
  효과?: string;
  결과설명: string;
}

// 프로파일 시스템 타입
export type 프로파일뷰타입 = '상세' | '간단' | 'RPG스타일' | '카드형' | '통계';

export interface 캐릭터상세능력치타입 {
  체력: { 현재: number; 최대: number };
  마나: { 현재: number; 최대: number };
  공격력: number;
  방어력: number;
  치명타율: number;
  치명타피해: number;
  적중률: number;
  회피율: number;
  속도: number;
  저항력: number;
}

export interface 캐릭터상세정보타입 extends 캐릭터타입 {
  직업: string;
  장비: string[];
  스킬: {
    이름: string;
    설명: string;
    쿨다운?: string;
  }[];
  상세능력치: 캐릭터상세능력치타입;
}