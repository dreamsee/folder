// Supabase 데이터베이스 서비스
import { 타입드supabase } from './supabase';
import { 폴더타입, 노트타입, 채팅메시지타입, 폴더설정타입 } from '../타입';

export class 데이터베이스서비스 {
  
  // ===================
  // 폴더 관련 메서드들
  // ===================
  
  async 폴더목록가져오기(): Promise<폴더타입[]> {
    try {
      const { data: 폴더데이터, error: 폴더에러 } = await 타입드supabase
        .from('폴더목록')
        .select('*')
        .order('생성시간', { ascending: true });

      if (폴더에러) throw 폴더에러;

      const 폴더목록: 폴더타입[] = [];
      
      for (const 폴더 of 폴더데이터 || []) {
        // 각 폴더의 노트들 가져오기
        const { data: 노트데이터, error: 노트에러 } = await 타입드supabase
          .from('노트목록')
          .select('*')
          .eq('폴더아이디', 폴더.아이디)
          .order('생성시간', { ascending: true });

        if (노트에러) throw 노트에러;

        const 노트목록: 노트타입[] = [];

        for (const 노트 of 노트데이터 || []) {
          // 각 노트의 메시지들 가져오기
          const { data: 메시지데이터, error: 메시지에러 } = await 타입드supabase
            .from('채팅메시지목록')
            .select('*')
            .eq('노트아이디', 노트.아이디)
            .is('부모메시지아이디', null) // 루트 메시지만
            .order('타임스탬프', { ascending: true });

          if (메시지에러) throw 메시지에러;

          const 채팅메시지목록: 채팅메시지타입[] = [];

          for (const 메시지 of 메시지데이터 || []) {
            // 하위 메시지들 가져오기
            const { data: 하위메시지데이터, error: 하위메시지에러 } = await 타입드supabase
              .from('채팅메시지목록')
              .select('*')
              .eq('부모메시지아이디', 메시지.아이디)
              .order('타임스탬프', { ascending: true });

            if (하위메시지에러) throw 하위메시지에러;

            const 하위메시지목록: 채팅메시지타입[] = (하위메시지데이터 || []).map(하위메시지 => ({
              아이디: 하위메시지.아이디,
              텍스트: 하위메시지.텍스트,
              타임스탬프: new Date(하위메시지.타임스탬프),
              작성자: 하위메시지.작성자 || undefined,
              카테고리: 하위메시지.카테고리 || undefined,
              말풍선위치: (하위메시지 as any).말풍선위치 as '왼쪽' | '오른쪽' || undefined,
              하위메시지목록: []
            }));

            채팅메시지목록.push({
              아이디: 메시지.아이디,
              텍스트: 메시지.텍스트,
              타임스탬프: new Date(메시지.타임스탬프),
              작성자: 메시지.작성자 || undefined,
              카테고리: 메시지.카테고리 || undefined,
              말풍선위치: (메시지 as any).말풍선위치 as '왼쪽' | '오른쪽' || undefined,
              하위메시지목록: 하위메시지목록
            });
          }

          노트목록.push({
            아이디: 노트.아이디,
            제목: 노트.제목,
            내용: 노트.내용,
            요약: 노트.요약 || undefined,
            태그목록: 노트.태그목록 || undefined,
            노트설정: (노트 as any).노트설정 || undefined,
            채팅메시지목록: 채팅메시지목록,
            생성시간: new Date(노트.생성시간),
            수정시간: new Date(노트.수정시간)
          });
        }

        폴더목록.push({
          아이디: 폴더.아이디,
          이름: 폴더.이름,
          노트목록: 노트목록,
          폴더설정: (폴더 as any).폴더설정 as 폴더설정타입
        });
      }

      return 폴더목록;
    } catch (에러) {
      console.error('폴더 목록 가져오기 실패:', 에러);
      throw 에러;
    }
  }

  async 폴더생성하기(폴더이름: string, 폴더설정: 폴더설정타입): Promise<string> {
    try {
      const { data, error } = await 타입드supabase
        .from('폴더목록')
        .insert({
          이름: 폴더이름,
          폴더설정: 폴더설정 as any
        })
        .select()
        .single();

      if (error) throw error;
      return (data as any).아이디;
    } catch (에러) {
      console.error('폴더 생성 실패:', 에러);
      throw 에러;
    }
  }

  async 폴더삭제하기(폴더아이디: string): Promise<void> {
    try {
      const { error } = await 타입드supabase
        .from('폴더목록')
        .delete()
        .eq('아이디', 폴더아이디);

      if (error) throw error;
    } catch (에러) {
      console.error('폴더 삭제 실패:', 에러);
      throw 에러;
    }
  }

  async 폴더이름변경하기(폴더아이디: string, 새이름: string): Promise<void> {
    try {
      const { error } = await 타입드supabase
        .from('폴더목록')
        .update({ 이름: 새이름 })
        .eq('아이디', 폴더아이디);

      if (error) throw error;
    } catch (에러) {
      console.error('폴더 이름 변경 실패:', 에러);
      throw 에러;
    }
  }

  async 폴더설정업데이트하기(폴더아이디: string, 새설정: Partial<폴더설정타입>): Promise<void> {
    try {
      // 현재 설정 가져오기
      const { data: 현재폴더, error: 조회에러 } = await 타입드supabase
        .from('폴더목록')
        .select('폴더설정')
        .eq('아이디', 폴더아이디)
        .single();

      if (조회에러) throw 조회에러;

      // 설정 병합 (타입 단언 사용)
      const 현재설정 = (현재폴더 as any)?.폴더설정 || {};
      const 병합된설정 = { ...현재설정, ...새설정 };

      const { error } = await 타입드supabase
        .from('폴더목록')
        .update({ 폴더설정: 병합된설정 as any })
        .eq('아이디', 폴더아이디);

      if (error) throw error;
    } catch (에러) {
      console.error('폴더 설정 업데이트 실패:', 에러);
      throw 에러;
    }
  }

  // ===================
  // 노트 관련 메서드들
  // ===================

  async 노트생성하기(폴더아이디: string, 노트제목: string, 노트내용?: string): Promise<string> {
    try {
      const { data, error } = await 타입드supabase
        .from('노트목록')
        .insert({
          폴더아이디: 폴더아이디,
          제목: 노트제목,
          내용: 노트내용 || '',
          요약: ''
        })
        .select()
        .single();

      if (error) throw error;
      return (data as any).아이디;
    } catch (에러) {
      console.error('노트 생성 실패:', 에러);
      throw 에러;
    }
  }

  async 노트삭제하기(노트아이디: string): Promise<void> {
    try {
      const { error } = await 타입드supabase
        .from('노트목록')
        .delete()
        .eq('아이디', 노트아이디);

      if (error) throw error;
    } catch (에러) {
      console.error('노트 삭제 실패:', 에러);
      throw 에러;
    }
  }

  async 노트업데이트하기(노트아이디: string, 업데이트내용: Partial<노트타입>): Promise<void> {
    try {
      const 업데이트데이터: any = {};
      
      if (업데이트내용.제목 !== undefined) 업데이트데이터.제목 = 업데이트내용.제목;
      if (업데이트내용.내용 !== undefined) 업데이트데이터.내용 = 업데이트내용.내용;
      if (업데이트내용.요약 !== undefined) 업데이트데이터.요약 = 업데이트내용.요약;
      if (업데이트내용.태그목록 !== undefined) 업데이트데이터.태그목록 = 업데이트내용.태그목록;
      if (업데이트내용.노트설정 !== undefined) 업데이트데이터.노트설정 = 업데이트내용.노트설정;

      const { error } = await 타입드supabase
        .from('노트목록')
        .update(업데이트데이터)
        .eq('아이디', 노트아이디);

      if (error) throw error;
    } catch (에러) {
      console.error('노트 업데이트 실패:', 에러);
      throw 에러;
    }
  }

  // ===================
  // 메시지 관련 메서드들
  // ===================

  async 메시지추가하기(
    노트아이디: string, 
    메시지텍스트: string, 
    옵션?: { category?: string; author?: string; 말풍선위치?: '왼쪽' | '오른쪽'; 부모메시지아이디?: string }
  ): Promise<string> {
    try {
      const { data, error } = await 타입드supabase
        .from('채팅메시지목록')
        .insert({
          노트아이디: 노트아이디,
          부모메시지아이디: 옵션?.부모메시지아이디 || null,
          텍스트: 메시지텍스트,
          작성자: 옵션?.author || null,
          카테고리: 옵션?.category || null,
          말풍선위치: 옵션?.말풍선위치 || null
        })
        .select()
        .single();

      if (error) throw error;
      return (data as any).아이디;
    } catch (에러) {
      console.error('메시지 추가 실패:', 에러);
      throw 에러;
    }
  }

  // ===================
  // 데이터 마이그레이션
  // ===================

  async localStorage데이터마이그레이션하기(localStorage데이터: 폴더타입[]): Promise<void> {
    try {
      console.log('localStorage 데이터 마이그레이션 시작...');

      for (const 폴더 of localStorage데이터) {
        // 폴더 생성
        const 새폴더아이디 = await this.폴더생성하기(폴더.이름, 폴더.폴더설정);

        for (const 노트 of 폴더.노트목록) {
          // 노트 생성
          const 새노트아이디 = await this.노트생성하기(새폴더아이디, 노트.제목);
          
          // 노트 내용 업데이트
          await this.노트업데이트하기(새노트아이디, {
            내용: 노트.내용,
            요약: 노트.요약,
            태그목록: 노트.태그목록
          });

          // 루트 메시지들 추가
          for (const 메시지 of 노트.채팅메시지목록) {
            const 새메시지아이디 = await this.메시지추가하기(새노트아이디, 메시지.텍스트, {
              category: 메시지.카테고리,
              author: 메시지.작성자,
              말풍선위치: 메시지.말풍선위치
            });

            // 하위 메시지들 추가
            if (메시지.하위메시지목록 && 메시지.하위메시지목록.length > 0) {
              for (const 하위메시지 of 메시지.하위메시지목록) {
                await this.메시지추가하기(새노트아이디, 하위메시지.텍스트, {
                  category: 하위메시지.카테고리,
                  author: 하위메시지.작성자,
                  말풍선위치: 하위메시지.말풍선위치,
                  부모메시지아이디: 새메시지아이디
                });
              }
            }
          }
        }
      }

      console.log('localStorage 데이터 마이그레이션 완료!');
    } catch (에러) {
      console.error('데이터 마이그레이션 실패:', 에러);
      throw 에러;
    }
  }
}

// 싱글톤 인스턴스 생성
export const 데이터베이스 = new 데이터베이스서비스();