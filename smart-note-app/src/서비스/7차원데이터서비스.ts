// 7차원 노트 시스템 데이터 서비스
// Phase 1: CRUD 및 분석 서비스

import { 타입드supabase } from './supabase';
import {
  우선순위차원타입,
  감정차원타입,
  맥락차원타입,
  채팅메시지타입,
  노트타입,
  메시지유형타입,
  노트유형타입
} from '../타입';
import {
  칠차원유효성검사,
  칠차원기본값생성,
  감정분석헬퍼,
  맥락추론헬퍼,
  칠차원분석
} from '../유틸/7차원데이터유틸';

export class 칠차원데이터서비스 {

  // ===== 우선순위 차원 관리 =====

  /**
   * 메시지 우선순위 설정
   */
  static async 메시지우선순위설정(
    메시지아이디: string,
    우선순위데이터: 우선순위차원타입
  ): Promise<void> {
    // 유효성 검사
    if (!칠차원유효성검사.우선순위검증(우선순위데이터)) {
      throw new Error('우선순위 데이터가 유효하지 않습니다.');
    }

    const { error } = await 타입드supabase
      .from('채팅메시지목록')
      .update({ 우선순위차원: 우선순위데이터 })
      .eq('아이디', 메시지아이디);

    if (error) throw error;
  }

  /**
   * 노트 우선순위 설정
   */
  static async 노트우선순위설정(
    노트아이디: string,
    우선순위데이터: 우선순위차원타입
  ): Promise<void> {
    // 유효성 검사
    if (!칠차원유효성검사.우선순위검증(우선순위데이터)) {
      throw new Error('우선순위 데이터가 유효하지 않습니다.');
    }

    const { error } = await 타입드supabase
      .from('노트목록')
      .update({ 우선순위차원: 우선순위데이터 })
      .eq('아이디', 노트아이디);

    if (error) throw error;
  }

  /**
   * 우선순위별 메시지 조회
   */
  static async 우선순위별메시지조회(
    우선순위레벨: number,
    긴급도?: string
  ): Promise<채팅메시지타입[]> {
    let 쿼리 = 타입드supabase
      .from('채팅메시지목록')
      .select('*')
      .not('우선순위차원', 'is', null);

    // 우선순위 레벨 필터
    쿼리 = 쿼리.eq('우선순위차원->>우선순위레벨', 우선순위레벨.toString());

    // 긴급도 필터 (선택적)
    if (긴급도) {
      쿼리 = 쿼리.eq('우선순위차원->>긴급도', 긴급도);
    }

    const { data, error } = await 쿼리.order('타임스탬프', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== 감정 차원 관리 =====

  /**
   * 메시지 감정 분석 및 저장
   */
  static async 메시지감정분석저장(
    메시지아이디: string,
    텍스트: string,
    수동감정데이터?: Partial<감정차원타입>
  ): Promise<감정차원타입> {
    // 자동 감정 분석
    const 자동분석결과 = 감정분석헬퍼.텍스트감정분석(텍스트);
    
    // 기본 감정 데이터 생성
    const 감정데이터: 감정차원타입 = {
      기분상태: 자동분석결과,
      텍스트톤: '중립적',
      ...수동감정데이터 // 수동 데이터가 있으면 덮어쓰기
    };

    // 유효성 검사
    if (!칠차원유효성검사.감정검증(감정데이터)) {
      throw new Error('감정 데이터가 유효하지 않습니다.');
    }

    const { error } = await 타입드supabase
      .from('채팅메시지목록')
      .update({ 감정차원: 감정데이터 })
      .eq('아이디', 메시지아이디);

    if (error) throw error;
    return 감정데이터;
  }

  /**
   * 감정별 메시지 조회
   */
  static async 감정별메시지조회(
    주감정: string,
    최소강도?: number
  ): Promise<채팅메시지타입[]> {
    let 쿼리 = 타입드supabase
      .from('채팅메시지목록')
      .select('*')
      .eq('감정차원->기분상태->>주감정', 주감정);

    // 최소 강도 필터 (선택적)
    if (최소강도) {
      쿼리 = 쿼리.gte('감정차원->기분상태->>전체강도', 최소강도);
    }

    const { data, error } = await 쿼리.order('타임스탬프', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * 감정 변화 추적
   */
  static async 감정변화추적(
    노트아이디: string,
    기간?: { 시작: Date; 끝: Date }
  ): Promise<{
    메시지아이디: string;
    시간: Date;
    주감정: string;
    강도: number;
    변화설명?: string;
  }[]> {
    let 쿼리 = 타입드supabase
      .from('채팅메시지목록')
      .select('*')
      .eq('노트아이디', 노트아이디)
      .not('감정차원', 'is', null);

    // 기간 필터 (선택적)
    if (기간) {
      쿼리 = 쿼리.gte('타임스탬프', 기간.시작.toISOString())
                 .lte('타임스탬프', 기간.끝.toISOString());
    }

    const { data, error } = await 쿼리.order('타임스탬프', { ascending: true });

    if (error) throw error;

    // 감정 변화 분석
    const 결과 = [];
    let 이전감정: any = null;

    for (const 메시지 of data || []) {
      const 감정데이터 = 메시지.감정차원 as 감정차원타입;
      const 현재감정 = 감정데이터.기분상태;

      let 변화설명: string | undefined;
      if (이전감정) {
        변화설명 = 감정분석헬퍼.감정변화계산(이전감정, 현재감정);
      }

      결과.push({
        메시지아이디: 메시지.아이디,
        시간: new Date(메시지.타임스탬프),
        주감정: 현재감정.주감정,
        강도: 현재감정.전체강도,
        변화설명
      });

      이전감정 = 현재감정;
    }

    return 결과;
  }

  // ===== 맥락 차원 관리 =====

  /**
   * 메시지 맥락 자동 설정
   */
  static async 메시지맥락자동설정(
    메시지아이디: string,
    텍스트: string,
    환경정보?: Partial<맥락차원타입['환경정보']>
  ): Promise<맥락차원타입> {
    const 현재시간 = new Date();
    
    // 자동 맥락 추론
    const 맥락데이터: 맥락차원타입 = {
      상황유형: 맥락추론헬퍼.시간대상황추론(현재시간),
      작성목적: 맥락추론헬퍼.작성목적추론(텍스트),
      환경정보: {
        집중도: 3,
        ...환경정보
      }
    };

    // 유효성 검사
    if (!칠차원유효성검사.맥락검증(맥락데이터)) {
      throw new Error('맥락 데이터가 유효하지 않습니다.');
    }

    const { error } = await 타입드supabase
      .from('채팅메시지목록')
      .update({ 맥락차원: 맥락데이터 })
      .eq('아이디', 메시지아이디);

    if (error) throw error;
    return 맥락데이터;
  }

  /**
   * 상황별 메시지 조회
   */
  static async 상황별메시지조회(
    상황유형: string,
    작성목적?: string
  ): Promise<채팅메시지타입[]> {
    let 쿼리 = 타입드supabase
      .from('채팅메시지목록')
      .select('*')
      .eq('맥락차원->>상황유형', 상황유형);

    // 작성 목적 필터 (선택적)
    if (작성목적) {
      쿼리 = 쿼리.eq('맥락차원->>작성목적', 작성목적);
    }

    const { data, error } = await 쿼리.order('타임스탬프', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===== 관계 차원 관리 =====

  /**
   * 메시지 관계 연결
   */
  static async 메시지관계연결(
    메시지아이디: string,
    관련메시지목록: string[]
  ): Promise<void> {
    const { error } = await 타입드supabase
      .from('채팅메시지목록')
      .update({ 관련메시지목록 })
      .eq('아이디', 메시지아이디);

    if (error) throw error;
  }

  /**
   * 메시지 유형 설정
   */
  static async 메시지유형설정(
    메시지아이디: string,
    메시지유형: 메시지유형타입
  ): Promise<void> {
    const { error } = await 타입드supabase
      .from('채팅메시지목록')
      .update({ 메시지유형 })
      .eq('아이디', 메시지아이디);

    if (error) throw error;
  }

  /**
   * 노트 관계 연결
   */
  static async 노트관계연결(
    노트아이디: string,
    관련노트목록: string[]
  ): Promise<void> {
    const { error } = await 타입드supabase
      .from('노트목록')
      .update({ 관련노트목록 })
      .eq('아이디', 노트아이디);

    if (error) throw error;
  }

  /**
   * 노트 유형 설정
   */
  static async 노트유형설정(
    노트아이디: string,
    노트유형: 노트유형타입
  ): Promise<void> {
    const { error } = await 타입드supabase
      .from('노트목록')
      .update({ 노트유형 })
      .eq('아이디', 노트아이디);

    if (error) throw error;
  }

  // ===== 7차원 분석 및 검색 =====

  /**
   * 7차원 종합 분석
   */
  static async 칠차원종합분석(노트아이디: string): Promise<{
    노트정보: any;
    차원별활용률: any;
    개선제안: string[];
    관련패턴: any;
  }> {
    // 노트의 모든 메시지 조회
    const { data: 메시지목록, error } = await 타입드supabase
      .from('채팅메시지목록')
      .select('*')
      .eq('노트아이디', 노트아이디);

    if (error) throw error;

    const 총메시지수 = 메시지목록?.length || 0;
    const 우선순위활용수 = 메시지목록?.filter(m => m.우선순위차원).length || 0;
    const 감정기록수 = 메시지목록?.filter(m => m.감정차원).length || 0;
    const 맥락기록수 = 메시지목록?.filter(m => m.맥락차원).length || 0;

    const 차원별활용률 = {
      우선순위활용률: 총메시지수 > 0 ? Math.round((우선순위활용수 / 총메시지수) * 100) : 0,
      감정기록률: 총메시지수 > 0 ? Math.round((감정기록수 / 총메시지수) * 100) : 0,
      맥락완성률: 총메시지수 > 0 ? Math.round((맥락기록수 / 총메시지수) * 100) : 0
    };

    // 개선 제안 생성
    const 개선제안: string[] = [];
    if (차원별활용률.우선순위활용률 < 50) {
      개선제안.push('우선순위를 설정하면 중요한 내용을 더 잘 관리할 수 있습니다.');
    }
    if (차원별활용률.감정기록률 < 30) {
      개선제안.push('감정 상태를 기록하면 감정 패턴을 파악할 수 있습니다.');
    }
    if (차원별활용률.맥락완성률 < 40) {
      개선제안.push('상황 정보를 추가하면 나중에 맥락을 더 잘 이해할 수 있습니다.');
    }

    // 노트 정보 조회
    const { data: 노트정보 } = await 타입드supabase
      .from('노트목록')
      .select('*')
      .eq('아이디', 노트아이디)
      .single();

    return {
      노트정보,
      차원별활용률,
      개선제안,
      관련패턴: {} // 추후 구현
    };
  }

  /**
   * 7차원 기반 스마트 검색
   */
  static async 칠차원스마트검색(검색조건: {
    키워드?: string;
    우선순위레벨?: number;
    감정?: string;
    상황유형?: string;
    작성목적?: string;
    기간?: { 시작: Date; 끝: Date };
  }): Promise<채팅메시지타입[]> {
    let 쿼리 = 타입드supabase
      .from('채팅메시지목록')
      .select('*');

    // 키워드 검색
    if (검색조건.키워드) {
      쿼리 = 쿼리.ilike('텍스트', `%${검색조건.키워드}%`);
    }

    // 우선순위 필터
    if (검색조건.우선순위레벨) {
      쿼리 = 쿼리.eq('우선순위차원->>우선순위레벨', 검색조건.우선순위레벨.toString());
    }

    // 감정 필터
    if (검색조건.감정) {
      쿼리 = 쿼리.eq('감정차원->기분상태->>주감정', 검색조건.감정);
    }

    // 상황 필터
    if (검색조건.상황유형) {
      쿼리 = 쿼리.eq('맥락차원->>상황유형', 검색조건.상황유형);
    }

    // 목적 필터
    if (검색조건.작성목적) {
      쿼리 = 쿼리.eq('맥락차원->>작성목적', 검색조건.작성목적);
    }

    // 기간 필터
    if (검색조건.기간) {
      쿼리 = 쿼리.gte('타임스탬프', 검색조건.기간.시작.toISOString())
                 .lte('타임스탬프', 검색조건.기간.끝.toISOString());
    }

    const { data, error } = await 쿼리
      .order('타임스탬프', { ascending: false })
      .limit(100); // 최대 100개

    if (error) throw error;
    return data || [];
  }

  // ===== 배치 처리 및 유틸리티 =====

  /**
   * 메시지 7차원 데이터 일괄 처리
   */
  static async 메시지칠차원일괄처리(
    메시지목록: { 아이디: string; 텍스트: string }[]
  ): Promise<{ 성공: number; 실패: number; 오류목록: string[] }> {
    let 성공 = 0;
    let 실패 = 0;
    const 오류목록: string[] = [];

    for (const 메시지 of 메시지목록) {
      try {
        // 감정 분석
        await this.메시지감정분석저장(메시지.아이디, 메시지.텍스트);
        
        // 맥락 자동 설정
        await this.메시지맥락자동설정(메시지.아이디, 메시지.텍스트);
        
        성공++;
      } catch (error) {
        실패++;
        오류목록.push(`메시지 ${메시지.아이디}: ${error}`);
      }
    }

    return { 성공, 실패, 오류목록 };
  }

  /**
   * 7차원 데이터 삭제
   */
  static async 칠차원데이터삭제(
    대상타입: 'message' | 'note',
    대상아이디: string,
    삭제차원: ('우선순위' | '감정' | '맥락')[]
  ): Promise<void> {
    const 테이블명 = 대상타입 === 'message' ? '채팅메시지목록' : '노트목록';
    const 업데이트데이터: any = {};

    for (const 차원 of 삭제차원) {
      switch (차원) {
        case '우선순위':
          업데이트데이터.우선순위차원 = null;
          break;
        case '감정':
          업데이트데이터.감정차원 = null;
          break;
        case '맥락':
          업데이트데이터.맥락차원 = null;
          break;
      }
    }

    const { error } = await 타입드supabase
      .from(테이블명)
      .update(업데이트데이터)
      .eq('아이디', 대상아이디);

    if (error) throw error;
  }
}