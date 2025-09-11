import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 폴더타입, 노트타입, 폴더설정타입, 채팅메시지타입 } from '../타입';
import { 데이터베이스 } from '../서비스/데이터베이스서비스';
import { 최적화된데이터베이스 } from '../서비스/최적화된데이터베이스서비스';
import { 타입드supabase } from '../서비스/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { 기본폴더설정생성하기 } from '../유틸리티/설정유틸리티';

// Context 타입 정의
interface Supabase상태컨텍스트타입 {
  // 상태
  폴더목록: 폴더타입[];
  활성폴더: 폴더타입 | null;
  활성노트: 노트타입 | null;
  로딩중: boolean;
  에러: string | null;
  오프라인모드: boolean;
  
  // 폴더 관련 함수들
  폴더선택하기: (폴더아이디: string) => void;
  새폴더생성하기: (폴더이름: string) => Promise<void>;
  폴더삭제하기: (폴더아이디: string) => Promise<void>;
  폴더이름변경하기: (폴더아이디: string, 새이름: string) => Promise<void>;
  폴더설정업데이트하기: (폴더아이디: string, 새설정: Partial<폴더설정타입>) => Promise<void>;
  
  // 노트 관련 함수들
  노트선택하기: (노트아이디: string) => void;
  새노트생성하기: (폴더아이디: string, 노트제목: string, 노트내용?: string) => Promise<string>;
  노트삭제하기: (폴더아이디: string, 노트아이디: string) => Promise<void>;
  노트업데이트하기: (노트아이디: string, 업데이트내용: Partial<노트타입>) => Promise<void>;
  
  // 채팅 메시지 관련 함수들
  새메시지추가하기: (노트아이디: string, 메시지텍스트: string, 옵션?: { category?: string; author?: string; 말풍선위치?: '왼쪽' | '오른쪽'; 부모메시지아이디?: string }) => Promise<void>;
  
  // 데이터 관리 함수들
  데이터새로고침하기: () => Promise<void>;
  localStorage마이그레이션하기: () => Promise<void>;
}

// localStorage 키
const 저장소키 = {
  활성폴더아이디: 'smart-note-활성폴더아이디',
  활성노트아이디: 'smart-note-활성노트아이디'
};

// localStorage에서 기존 데이터 불러오기 (마이그레이션용)
const 기존localStorage데이터불러오기 = (): 폴더타입[] => {
  try {
    const 저장된문자열 = localStorage.getItem('smart-note-폴더목록');
    if (저장된문자열) {
      const 파싱된데이터 = JSON.parse(저장된문자열);
      return 파싱된데이터.map((폴더: any) => ({
        ...폴더,
        노트목록: 폴더.노트목록.map((노트: any) => ({
          ...노트,
          생성시간: new Date(노트.생성시간),
          수정시간: new Date(노트.수정시간),
          채팅메시지목록: 노트.채팅메시지목록.map((메시지: any) => ({
            ...메시지,
            타임스탬프: new Date(메시지.타임스탬프),
            하위메시지목록: 메시지.하위메시지목록 ? 메시지.하위메시지목록.map((하위메시지: any) => ({
              ...하위메시지,
              타임스탬프: new Date(하위메시지.타임스탬프)
            })) : []
          }))
        }))
      }));
    }
  } catch (오류) {
    console.error('기존 localStorage 데이터 불러오기 실패:', 오류);
  }
  return [];
};

// Context 생성
const Supabase상태컨텍스트 = createContext<Supabase상태컨텍스트타입 | undefined>(undefined);

// Provider 컴포넌트
interface Supabase상태제공자속성 {
  children: ReactNode;
}

export const Supabase상태제공자: React.FC<Supabase상태제공자속성> = ({ children }) => {
  const [폴더목록, 폴더목록설정] = useState<폴더타입[]>([]);
  const [활성폴더, 활성폴더설정] = useState<폴더타입 | null>(null);
  const [활성노트, 활성노트설정] = useState<노트타입 | null>(null);
  const [로딩중, 로딩중설정] = useState(true);
  const [에러, 에러설정] = useState<string | null>(null);
  const [실시간채널, 실시간채널설정] = useState<RealtimeChannel | null>(null);
  const [오프라인모드, 오프라인모드설정] = useState(false);

  // 초기 데이터 로드 및 실시간 구독 설정
  useEffect(() => {
    데이터새로고침하기();
    실시간구독설정하기();
    온라인상태감지설정하기();

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      실시간구독해제하기();
      온라인상태감지해제하기();
    };
  }, []);

  // 온라인/오프라인 상태 감지
  const 온라인상태감지설정하기 = () => {
    const 온라인처리 = () => {
      console.log('온라인 모드로 전환');
      오프라인모드설정(false);
      에러설정(null);
      // 온라인 복귀 시 데이터 동기화
      백그라운드동기화하기();
    };

    const 오프라인처리 = () => {
      console.log('오프라인 모드로 전환');
      오프라인모드설정(true);
      에러설정('인터넷 연결이 끊어졌습니다. 오프라인 모드로 동작합니다.');
    };

    window.addEventListener('online', 온라인처리);
    window.addEventListener('offline', 오프라인처리);

    // 초기 상태 설정
    오프라인모드설정(!navigator.onLine);
  };

  const 온라인상태감지해제하기 = () => {
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  };

  // 로컬 캐시에 데이터 저장
  const 로컬캐시저장하기 = (데이터: 폴더타입[]) => {
    try {
      const 캐시데이터 = {
        폴더목록: 데이터,
        저장시간: new Date().toISOString()
      };
      localStorage.setItem('supabase-cache', JSON.stringify(캐시데이터));
      console.log('로컬 캐시 저장 완료');
    } catch (오류) {
      console.error('로컬 캐시 저장 실패:', 오류);
    }
  };

  // 로컬 캐시에서 데이터 불러오기
  const 로컬캐시불러오기 = (): 폴더타입[] | null => {
    try {
      const 캐시문자열 = localStorage.getItem('supabase-cache');
      if (캐시문자열) {
        const 캐시데이터 = JSON.parse(캐시문자열);
        
        // 데이터 타입 변환
        const 변환된데이터 = 캐시데이터.폴더목록.map((폴더: any) => ({
          ...폴더,
          노트목록: 폴더.노트목록.map((노트: any) => ({
            ...노트,
            생성시간: new Date(노트.생성시간),
            수정시간: new Date(노트.수정시간),
            채팅메시지목록: 노트.채팅메시지목록.map((메시지: any) => ({
              ...메시지,
              타임스탬프: new Date(메시지.타임스탬프),
              하위메시지목록: 메시지.하위메시지목록 ? 메시지.하위메시지목록.map((하위메시지: any) => ({
                ...하위메시지,
                타임스탬프: new Date(하위메시지.타임스탬프)
              })) : []
            }))
          }))
        }));

        console.log('로컬 캐시 불러오기 완료 (저장시간:', 캐시데이터.저장시간, ')');
        return 변환된데이터;
      }
    } catch (오류) {
      console.error('로컬 캐시 불러오기 실패:', 오류);
    }
    return null;
  };

  // 실시간 구독 설정
  const 실시간구독설정하기 = () => {
    try {
      const 채널 = 타입드supabase
        .channel('데이터베이스-변경')
        .on(
          'postgres_changes',  
          { event: '*', schema: 'public', table: '폴더목록' },
          (payload) => {
            console.log('폴더 변경 감지:', payload);
            백그라운드동기화하기();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: '노트목록' },
          (payload) => {
            console.log('노트 변경 감지:', payload);
            백그라운드동기화하기();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: '채팅메시지목록' },
          (payload) => {
            console.log('메시지 변경 감지:', payload);
            백그라운드동기화하기();
          }
        )
        .subscribe((status) => {
          console.log('실시간 구독 상태:', status);
        });

      실시간채널설정(채널);
      console.log('실시간 구독 설정 완료');
    } catch (오류) {
      console.error('실시간 구독 설정 실패:', 오류);
    }
  };

  // 실시간 구독 해제
  const 실시간구독해제하기 = () => {
    if (실시간채널) {
      타입드supabase.removeChannel(실시간채널);
      실시간채널설정(null);
      console.log('실시간 구독 해제됨');
    }
  };

  // 데이터 새로고침 (로딩 화면 표시)
  const 데이터새로고침하기 = async () => {
    try {
      로딩중설정(true);
      에러설정(null);
      
      let 폴더데이터: 폴더타입[] = [];

      if (오프라인모드) {
        // 오프라인 모드: 로컬 캐시에서 불러오기
        const 캐시데이터 = 로컬캐시불러오기();
        if (캐시데이터) {
          폴더데이터 = 캐시데이터;
          console.log('오프라인 모드: 로컬 캐시에서 데이터 로드');
        } else {
          에러설정('오프라인 상태이고 로컬 캐시가 없습니다.');
        }
      } else {
        // 온라인 모드: 최적화된 Supabase 로딩
        try {
          console.time('⚡ 최적화된 데이터 로딩');
          폴더데이터 = await 최적화된데이터베이스.폴더목록가져오기();
          console.timeEnd('⚡ 최적화된 데이터 로딩');
          
          // 성공적으로 불러온 경우 로컬 캐시에 저장
          로컬캐시저장하기(폴더데이터);
          console.log('✅ 최적화된 로딩: 1회 JOIN 쿼리로 전체 데이터 로드 완료');
        } catch (서버오류) {
          // 서버 연결 실패 시 로컬 캐시 사용
          console.warn('서버 연결 실패, 로컬 캐시 사용:', 서버오류);
          const 캐시데이터 = 로컬캐시불러오기();
          if (캐시데이터) {
            폴더데이터 = 캐시데이터;
            에러설정('서버 연결에 실패했습니다. 로컬 캐시 데이터를 사용합니다.');
          } else {
            throw 서버오류;
          }
        }
      }

      폴더목록설정(폴더데이터);

      // 활성 상태 복원
      const 저장된활성폴더아이디 = localStorage.getItem(저장소키.활성폴더아이디);
      const 저장된활성노트아이디 = localStorage.getItem(저장소키.활성노트아이디);

      if (저장된활성폴더아이디) {
        const 복원폴더 = 폴더데이터.find(폴더 => 폴더.아이디 === 저장된활성폴더아이디);
        if (복원폴더) {
          활성폴더설정(복원폴더);
          
          if (저장된활성노트아이디) {
            const 복원노트 = 복원폴더.노트목록.find(노트 => 노트.아이디 === 저장된활성노트아이디);
            활성노트설정(복원노트 || 복원폴더.노트목록[0] || null);
          } else {
            활성노트설정(복원폴더.노트목록[0] || null);
          }
        }
      } else if (폴더데이터.length > 0) {
        활성폴더설정(폴더데이터[0]);
        활성노트설정(폴더데이터[0].노트목록[0] || null);
      }

      console.log('데이터 로드 완료');
    } catch (오류) {
      console.error('데이터 로드 실패:', 오류);
      에러설정('데이터를 불러오는데 실패했습니다.');
    } finally {
      로딩중설정(false);
    }
  };

  // 백그라운드 동기화 (로딩 화면 없이)
  const 백그라운드동기화하기 = async () => {
    try {
      에러설정(null);
      
      // 오프라인 모드에서는 백그라운드 동기화 하지 않음
      if (오프라인모드) {
        console.log('오프라인 모드: 백그라운드 동기화 건너뜀');
        return;
      }

      const 폴더데이터 = await 최적화된데이터베이스.캐시된폴더목록가져오기();
      
      // 성공적으로 불러온 경우 로컬 캐시 업데이트
      로컬캐시저장하기(폴더데이터);
      
      // 현재 활성 상태를 유지하면서 데이터만 업데이트
      const 현재활성폴더아이디 = 활성폴더?.아이디;
      const 현재활성노트아이디 = 활성노트?.아이디;
      
      폴더목록설정(폴더데이터);
      
      // 활성 상태 복원
      if (현재활성폴더아이디) {
        const 복원폴더 = 폴더데이터.find(폴더 => 폴더.아이디 === 현재활성폴더아이디);
        if (복원폴더) {
          활성폴더설정(복원폴더);
          
          if (현재활성노트아이디) {
            const 복원노트 = 복원폴더.노트목록.find(노트 => 노트.아이디 === 현재활성노트아이디);
            if (복원노트) {
              활성노트설정(복원노트);
            }
          }
        }
      }

      console.log('백그라운드 동기화 완료');
    } catch (오류) {
      console.error('백그라운드 동기화 실패:', 오류);
      // 백그라운드 동기화 실패는 에러창을 띄우지 않음
    }
  };

  // localStorage 마이그레이션
  const localStorage마이그레이션하기 = async () => {
    try {
      로딩중설정(true);
      에러설정(null);

      const 기존데이터 = 기존localStorage데이터불러오기();
      if (기존데이터.length > 0) {
        await 데이터베이스.localStorage데이터마이그레이션하기(기존데이터);
        
        // 마이그레이션 후 데이터 새로고침
        await 데이터새로고침하기();
        
        // 기존 localStorage 데이터는 백업용으로 이름 변경
        const 기존데이터문자열 = localStorage.getItem('smart-note-폴더목록');
        if (기존데이터문자열) {
          localStorage.setItem('smart-note-폴더목록-backup', 기존데이터문자열);
          localStorage.removeItem('smart-note-폴더목록');
        }
        
        alert('기존 데이터가 성공적으로 Supabase로 마이그레이션되었습니다!');
      } else {
        alert('마이그레이션할 기존 데이터가 없습니다.');
      }
    } catch (오류) {
      console.error('마이그레이션 실패:', 오류);
      에러설정('데이터 마이그레이션에 실패했습니다.');
    } finally {
      로딩중설정(false);
    }
  };

  // 활성 상태 저장
  useEffect(() => {
    if (활성폴더) {
      localStorage.setItem(저장소키.활성폴더아이디, 활성폴더.아이디);
    }
  }, [활성폴더]);

  useEffect(() => {
    if (활성노트) {
      localStorage.setItem(저장소키.활성노트아이디, 활성노트.아이디);
    }
  }, [활성노트]);

  // 폴더 선택 (원래 설계: 폴더 선택 시 통합뷰 표시)
  const 폴더선택하기 = (폴더아이디: string) => {
    const 선택된폴더 = 폴더목록.find(폴더 => 폴더.아이디 === 폴더아이디);
    if (선택된폴더) {
      활성폴더설정(선택된폴더);
      활성노트설정(null); // 폴더 선택 시 개별 노트 선택하지 않음 (폴더 통합뷰 표시)
      console.log('폴더 선택됨 (통합뷰):', 선택된폴더.이름);
    }
  };

  // 새 폴더 생성
  const 새폴더생성하기 = async (폴더이름: string) => {
    try {
      로딩중설정(true);
      
      const 기본설정: 폴더설정타입 = 기본폴더설정생성하기();
      
      await 데이터베이스.폴더생성하기(폴더이름, 기본설정);
      await 백그라운드동기화하기();
      
      console.log('새 폴더 생성됨:', 폴더이름);
    } catch (오류) {
      console.error('폴더 생성 실패:', 오류);
      에러설정('폴더 생성에 실패했습니다.');
    } finally {
      로딩중설정(false);
    }
  };

  // 폴더 삭제
  const 폴더삭제하기 = async (폴더아이디: string) => {
    try {
      로딩중설정(true);
      
      await 데이터베이스.폴더삭제하기(폴더아이디);
      await 백그라운드동기화하기();
      
      // 활성 폴더가 삭제된 폴더라면 첫 번째 폴더로 변경
      if (활성폴더?.아이디 === 폴더아이디) {
        const 남은폴더 = 폴더목록.filter(폴더 => 폴더.아이디 !== 폴더아이디);
        활성폴더설정(남은폴더[0] || null);
        활성노트설정(남은폴더[0]?.노트목록[0] || null);
      }
      
      console.log('폴더 삭제됨:', 폴더아이디);
    } catch (오류) {
      console.error('폴더 삭제 실패:', 오류);
      에러설정('폴더 삭제에 실패했습니다.');
    } finally {
      로딩중설정(false);
    }
  };

  // 폴더 이름 변경
  const 폴더이름변경하기 = async (폴더아이디: string, 새이름: string) => {
    try {
      await 데이터베이스.폴더이름변경하기(폴더아이디, 새이름);
      await 백그라운드동기화하기();
      
      console.log('폴더 이름 변경됨:', 새이름);
    } catch (오류) {
      console.error('폴더 이름 변경 실패:', 오류);
      에러설정('폴더 이름 변경에 실패했습니다.');
    }
  };

  // 폴더 설정 업데이트
  const 폴더설정업데이트하기 = async (폴더아이디: string, 새설정: Partial<폴더설정타입>) => {
    try {
      await 데이터베이스.폴더설정업데이트하기(폴더아이디, 새설정);
      await 백그라운드동기화하기();
      
      console.log('폴더 설정 업데이트됨:', 폴더아이디, 새설정);
    } catch (오류) {
      console.error('폴더 설정 업데이트 실패:', 오류);
      에러설정('폴더 설정 업데이트에 실패했습니다.');
    }
  };

  // 노트 선택
  const 노트선택하기 = (노트아이디: string) => {
    if (!활성폴더) return;
    
    const 선택된노트 = 활성폴더.노트목록.find(노트 => 노트.아이디 === 노트아이디);
    if (선택된노트) {
      활성노트설정(선택된노트);
      console.log('노트 선택됨:', 선택된노트.제목);
    }
  };

  // 새 노트 생성
  const 새노트생성하기 = async (폴더아이디: string, 노트제목: string, 노트내용?: string): Promise<string> => {
    // 1. 임시 노트 생성 및 즉시 UI 업데이트
    const 임시노트아이디 = `temp-note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const 새노트: 노트타입 = {
      아이디: 임시노트아이디,
      제목: 노트제목,
      내용: 노트내용 || '',
      요약: '',
      생성시간: new Date(),
      수정시간: new Date(),
      채팅메시지목록: []
    };

    // 즉시 UI 업데이트
    폴더목록설정(이전폴더목록 => 
      이전폴더목록.map(폴더 => 
        폴더.아이디 === 폴더아이디 
          ? { ...폴더, 노트목록: [...폴더.노트목록, 새노트] }
          : 폴더
      )
    );

    // 새 노트를 활성 노트로 즉시 설정
    활성노트설정(새노트);

    try {
      // 2. 백그라운드에서 서버에 저장
      const 실제노트아이디 = await 데이터베이스.노트생성하기(폴더아이디, 노트제목, 노트내용);
      
      // 3. 임시 ID를 실제 ID로 교체
      폴더목록설정(이전폴더목록 => 
        이전폴더목록.map(폴더 => 
          폴더.아이디 === 폴더아이디 
            ? { 
                ...폴더, 
                노트목록: 폴더.노트목록.map(노트 => 
                  노트.아이디 === 임시노트아이디 
                    ? { ...노트, 아이디: 실제노트아이디 }
                    : 노트
                )
              }
            : 폴더
        )
      );

      // 활성 노트 ID도 업데이트
      if (활성노트?.아이디 === 임시노트아이디) {
        활성노트설정(이전노트 => 
          이전노트 ? { ...이전노트, 아이디: 실제노트아이디 } : null
        );
      }
      
      console.log('새 노트 생성 완료:', 노트제목);
      return 실제노트아이디;
    } catch (오류) {
      // 4. 에러 발생 시 낙관적 업데이트 롤백
      폴더목록설정(이전폴더목록 => 
        이전폴더목록.map(폴더 => 
          폴더.아이디 === 폴더아이디 
            ? { ...폴더, 노트목록: 폴더.노트목록.filter(노트 => 노트.아이디 !== 임시노트아이디) }
            : 폴더
        )
      );

      // 활성 노트가 임시 노트였다면 null로 설정
      if (활성노트?.아이디 === 임시노트아이디) {
        활성노트설정(null);
      }

      console.error('노트 생성 실패 - 롤백됨:', 오류);
      에러설정('노트 생성에 실패했습니다.');
      throw 오류;
    }
  };

  // 노트 삭제
  const 노트삭제하기 = async (폴더아이디: string, 노트아이디: string) => {
    try {
      await 데이터베이스.노트삭제하기(노트아이디);
      await 백그라운드동기화하기();
      
      // 활성 노트가 삭제된 노트라면 null로 설정
      if (활성노트?.아이디 === 노트아이디) {
        활성노트설정(null);
      }
      
      console.log('노트 삭제됨:', 노트아이디);
    } catch (오류) {
      console.error('노트 삭제 실패:', 오류);
      에러설정('노트 삭제에 실패했습니다.');
    }
  };

  // 노트 업데이트 (낙관적 업데이트)
  const 노트업데이트하기 = async (노트아이디: string, 업데이트내용: Partial<노트타입>) => {
    // 1. 이전 상태 백업 (롤백용)
    const 이전노트상태 = 폴더목록.flatMap(폴더 => 폴더.노트목록).find(노트 => 노트.아이디 === 노트아이디);
    
    // 2. 즉시 UI 업데이트
    const 업데이트시간 = new Date();
    const 전체업데이트내용 = { ...업데이트내용, 수정시간: 업데이트시간 };

    폴더목록설정(이전폴더목록 => 
      이전폴더목록.map(폴더 => ({
        ...폴더,
        노트목록: 폴더.노트목록.map(노트 => 
          노트.아이디 === 노트아이디 
            ? { ...노트, ...전체업데이트내용 }
            : 노트
        )
      }))
    );

    // 활성 노트도 업데이트
    if (활성노트?.아이디 === 노트아이디) {
      활성노트설정(이전노트 => 
        이전노트 ? { ...이전노트, ...전체업데이트내용 } : null
      );
    }

    try {
      // 3. 백그라운드에서 서버에 저장
      await 데이터베이스.노트업데이트하기(노트아이디, 전체업데이트내용);
      
      console.log('노트 업데이트 완료:', 노트아이디, 업데이트내용);
    } catch (오류) {
      // 4. 에러 발생 시 이전 상태로 롤백
      if (이전노트상태) {
        폴더목록설정(이전폴더목록 => 
          이전폴더목록.map(폴더 => ({
            ...폴더,
            노트목록: 폴더.노트목록.map(노트 => 
              노트.아이디 === 노트아이디 ? 이전노트상태 : 노트
            )
          }))
        );

        if (활성노트?.아이디 === 노트아이디) {
          활성노트설정(이전노트상태);
        }
      }

      console.error('노트 업데이트 실패 - 롤백됨:', 오류);
      에러설정('노트 업데이트에 실패했습니다.');
    }
  };

  // 새 메시지 추가 (낙관적 업데이트)
  const 새메시지추가하기 = async (
    노트아이디: string, 
    메시지텍스트: string, 
    옵션?: { category?: string; author?: string; 말풍선위치?: '왼쪽' | '오른쪽'; 부모메시지아이디?: string }
  ) => {
    // 1. 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    const 임시메시지아이디 = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const 새메시지: 채팅메시지타입 = {
      아이디: 임시메시지아이디,
      텍스트: 메시지텍스트,
      타임스탬프: new Date(),
      카테고리: 옵션?.category,
      작성자: 옵션?.author,
      말풍선위치: 옵션?.말풍선위치,
      하위메시지목록: []
    };

    // 즉시 UI 업데이트
    폴더목록설정(이전폴더목록 => 
      이전폴더목록.map(폴더 => ({
        ...폴더,
        노트목록: 폴더.노트목록.map(노트 => 
          노트.아이디 === 노트아이디 
            ? { ...노트, 채팅메시지목록: [...노트.채팅메시지목록, 새메시지] }
            : 노트
        )
      }))
    );

    // 활성 노트도 업데이트
    if (활성노트?.아이디 === 노트아이디) {
      활성노트설정(이전노트 => 
        이전노트 ? { ...이전노트, 채팅메시지목록: [...이전노트.채팅메시지목록, 새메시지] } : null
      );
    }

    try {
      // 2. 백그라운드에서 서버에 저장
      const 실제메시지아이디 = await 데이터베이스.메시지추가하기(노트아이디, 메시지텍스트, 옵션);
      
      // 3. 임시 ID를 실제 ID로 교체 (백그라운드에서 조용히 처리)
      폴더목록설정(이전폴더목록 => 
        이전폴더목록.map(폴더 => ({
          ...폴더,
          노트목록: 폴더.노트목록.map(노트 => 
            노트.아이디 === 노트아이디 
              ? { 
                  ...노트, 
                  채팅메시지목록: 노트.채팅메시지목록.map(메시지 => 
                    메시지.아이디 === 임시메시지아이디 
                      ? { ...메시지, 아이디: 실제메시지아이디 }
                      : 메시지
                  )
                }
              : 노트
          )
        }))
      );

      if (활성노트?.아이디 === 노트아이디) {
        활성노트설정(이전노트 => 
          이전노트 ? { 
            ...이전노트, 
            채팅메시지목록: 이전노트.채팅메시지목록.map(메시지 => 
              메시지.아이디 === 임시메시지아이디 
                ? { ...메시지, 아이디: 실제메시지아이디 }
                : 메시지
            )
          } : null
        );
      }
      
      console.log('새 메시지 추가 완료:', 메시지텍스트);
    } catch (오류) {
      // 4. 에러 발생 시 낙관적 업데이트 롤백
      폴더목록설정(이전폴더목록 => 
        이전폴더목록.map(폴더 => ({
          ...폴더,
          노트목록: 폴더.노트목록.map(노트 => 
            노트.아이디 === 노트아이디 
              ? { 
                  ...노트, 
                  채팅메시지목록: 노트.채팅메시지목록.filter(메시지 => 메시지.아이디 !== 임시메시지아이디)
                }
              : 노트
          )
        }))
      );

      if (활성노트?.아이디 === 노트아이디) {
        활성노트설정(이전노트 => 
          이전노트 ? { 
            ...이전노트, 
            채팅메시지목록: 이전노트.채팅메시지목록.filter(메시지 => 메시지.아이디 !== 임시메시지아이디)
          } : null
        );
      }

      console.error('메시지 추가 실패 - 롤백됨:', 오류);
      에러설정('메시지 추가에 실패했습니다.');
    }
  };

  const 컨텍스트값: Supabase상태컨텍스트타입 = {
    폴더목록,
    활성폴더,
    활성노트,
    로딩중,
    에러,
    오프라인모드,
    폴더선택하기,
    새폴더생성하기,
    폴더삭제하기,
    폴더이름변경하기,
    폴더설정업데이트하기,
    노트선택하기,
    새노트생성하기,
    노트삭제하기,
    노트업데이트하기,
    새메시지추가하기,
    데이터새로고침하기,
    localStorage마이그레이션하기,
  };

  return (
    <Supabase상태컨텍스트.Provider value={컨텍스트값}>
      {children}
    </Supabase상태컨텍스트.Provider>
  );
};

// 커스텀 훅
export const Supabase상태사용하기 = () => {
  const 상태 = useContext(Supabase상태컨텍스트);
  if (!상태) {
    throw new Error('Supabase상태사용하기는 Supabase상태제공자 내부에서만 사용할 수 있습니다');
  }
  return 상태;
};