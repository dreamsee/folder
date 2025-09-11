// 7차원 데이터 서비스 테스트
// Jest 단위 테스트 + Mocking

import { 칠차원데이터서비스 } from '../7차원데이터서비스';
import { 타입드supabase } from '../supabase';

// Supabase 모킹
jest.mock('../supabase', () => ({
  타입드supabase: {
    from: jest.fn()
  }
}));

describe('7차원 데이터 서비스', () => {
  let mockFrom: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockNot: jest.Mock;
  let mockOrder: jest.Mock;
  let mockLimit: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    // 모든 모킹 함수 초기화
    mockUpdate = jest.fn().mockReturnThis();
    mockSelect = jest.fn().mockReturnThis();
    mockEq = jest.fn().mockReturnThis();
    mockNot = jest.fn().mockReturnThis();
    mockOrder = jest.fn().mockReturnThis();
    mockLimit = jest.fn().mockReturnThis();
    mockSingle = jest.fn().mockReturnValue({ data: null, error: null });

    mockFrom = jest.fn().mockReturnValue({
      update: mockUpdate,
      select: mockSelect,
      eq: mockEq,
      not: mockNot,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle
    });

    (타입드supabase.from as jest.Mock) = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('우선순위 차원 관리', () => {
    test('메시지 우선순위를 설정한다', async () => {
      const 우선순위데이터 = {
        우선순위레벨: 4 as any,
        긴급도: '당일' as any,
        중요도매트릭스: {
          긴급하고중요함: true,
          중요하지만긴급하지않음: false,
          긴급하지만중요하지않음: false,
          긴급하지도중요하지도않음: false
        }
      };

      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      await 칠차원데이터서비스.메시지우선순위설정('test-message-id', 우선순위데이터);

      expect(mockFrom).toHaveBeenCalledWith('채팅메시지목록');
      expect(mockUpdate).toHaveBeenCalledWith({ 우선순위차원: 우선순위데이터 });
      expect(mockEq).toHaveBeenCalledWith('아이디', 'test-message-id');
    });

    test('잘못된 우선순위 데이터를 거부한다', async () => {
      const 잘못된우선순위 = {
        우선순위레벨: 6 as any, // 범위 초과
        긴급도: '당일' as any,
        중요도매트릭스: {
          긴급하고중요함: true,
          중요하지만긴급하지않음: false,
          긴급하지만중요하지않음: false,
          긴급하지도중요하지도않음: false
        }
      };

      await expect(
        칠차원데이터서비스.메시지우선순위설정('test-message-id', 잘못된우선순위)
      ).rejects.toThrow('우선순위 데이터가 유효하지 않습니다.');
    });

    test('우선순위별 메시지를 조회한다', async () => {
      const 예상결과 = [
        { 아이디: 'msg1', 텍스트: '중요한 메시지' },
        { 아이디: 'msg2', 텍스트: '또 다른 중요한 메시지' }
      ];

      mockSelect.mockReturnValue({
        not: mockNot.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockReturnValue({
              data: 예상결과,
              error: null
            })
          })
        })
      });

      const 결과 = await 칠차원데이터서비스.우선순위별메시지조회(4, '당일');

      expect(결과).toEqual(예상결과);
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockNot).toHaveBeenCalledWith('우선순위차원', 'is', null);
    });
  });

  describe('감정 차원 관리', () => {
    test('메시지 감정을 분석하고 저장한다', async () => {
      const 테스트텍스트 = '오늘 정말 좋은 하루였어요!';
      
      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      const 결과 = await 칠차원데이터서비스.메시지감정분석저장(
        'test-message-id',
        테스트텍스트
      );

      expect(결과.기분상태.주감정).toBe('기쁨');
      expect(mockFrom).toHaveBeenCalledWith('채팅메시지목록');
      expect(mockUpdate).toHaveBeenCalled();
    });

    test('수동 감정 데이터를 우선한다', async () => {
      const 테스트텍스트 = '슬픈 내용';
      const 수동감정데이터 = {
        기분상태: {
          주감정: '기쁨' as any,
          전체강도: 8 as any,
          에너지레벨: 4 as any
        },
        텍스트톤: '긍정적' as any
      };

      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      const 결과 = await 칠차원데이터서비스.메시지감정분석저장(
        'test-message-id',
        테스트텍스트,
        수동감정데이터
      );

      expect(결과.기분상태.주감정).toBe('기쁨'); // 수동 데이터 우선
      expect(결과.텍스트톤).toBe('긍정적');
    });

    test('감정별 메시지를 조회한다', async () => {
      const 예상결과 = [
        { 아이디: 'msg1', 텍스트: '기쁜 메시지' }
      ];

      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            data: 예상결과,
            error: null
          })
        })
      });

      const 결과 = await 칠차원데이터서비스.감정별메시지조회('기쁨', 5);

      expect(결과).toEqual(예상결과);
      expect(mockEq).toHaveBeenCalledWith('감정차원->기분상태->>주감정', '기쁨');
    });

    test('감정 변화를 추적한다', async () => {
      const 모킹메시지들 = [
        {
          아이디: 'msg1',
          타임스탬프: '2025-01-31T10:00:00Z',
          감정차원: {
            기분상태: { 주감정: '중립', 전체강도: 5, 에너지레벨: 3 }
          }
        },
        {
          아이디: 'msg2',
          타임스탬프: '2025-01-31T11:00:00Z',
          감정차원: {
            기분상태: { 주감정: '기쁨', 전체강도: 8, 에너지레벨: 4 }
          }
        }
      ];

      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          not: mockNot.mockReturnValue({
            order: mockOrder.mockReturnValue({
              data: 모킹메시지들,
              error: null
            })
          })
        })
      });

      const 결과 = await 칠차원데이터서비스.감정변화추적('test-note-id');

      expect(결과).toHaveLength(2);
      expect(결과[0].주감정).toBe('중립');
      expect(결과[1].주감정).toBe('기쁨');
      expect(결과[1].변화설명).toContain('중립에서 기쁨으로');
    });
  });

  describe('맥락 차원 관리', () => {
    test('메시지 맥락을 자동 설정한다', async () => {
      const 테스트텍스트 = '회의 계획을 세워보자';
      
      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      const 결과 = await 칠차원데이터서비스.메시지맥락자동설정(
        'test-message-id',
        테스트텍스트
      );

      expect(결과.작성목적).toBe('계획');
      expect(결과.환경정보.집중도).toBeDefined();
      expect(mockFrom).toHaveBeenCalledWith('채팅메시지목록');
    });

    test('환경 정보를 병합한다', async () => {
      const 테스트텍스트 = '일반 메모';
      const 환경정보 = {
        디바이스: 'PC' as any,
        집중도: 5 as any
      };

      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      const 결과 = await 칠차원데이터서비스.메시지맥락자동설정(
        'test-message-id',
        테스트텍스트,
        환경정보
      );

      expect(결과.환경정보.디바이스).toBe('PC');
      expect(결과.환경정보.집중도).toBe(5);
    });

    test('상황별 메시지를 조회한다', async () => {
      const 예상결과 = [
        { 아이디: 'msg1', 텍스트: '업무 메시지' }
      ];

      mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder.mockReturnValue({
            data: 예상결과,
            error: null
          })
        })
      });

      const 결과 = await 칠차원데이터서비스.상황별메시지조회('업무', '계획');

      expect(결과).toEqual(예상결과);
      expect(mockEq).toHaveBeenCalledWith('맥락차원->>상황유형', '업무');
    });
  });

  describe('관계 차원 관리', () => {
    test('메시지 관계를 연결한다', async () => {
      const 관련메시지목록 = ['msg1', 'msg2', 'msg3'];

      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      await 칠차원데이터서비스.메시지관계연결('test-message-id', 관련메시지목록);

      expect(mockUpdate).toHaveBeenCalledWith({ 관련메시지목록 });
      expect(mockEq).toHaveBeenCalledWith('아이디', 'test-message-id');
    });

    test('메시지 유형을 설정한다', async () => {
      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      await 칠차원데이터서비스.메시지유형설정('test-message-id', '질문');

      expect(mockUpdate).toHaveBeenCalledWith({ 메시지유형: '질문' });
    });

    test('노트 관계를 연결한다', async () => {
      const 관련노트목록 = ['note1', 'note2'];

      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      await 칠차원데이터서비스.노트관계연결('test-note-id', 관련노트목록);

      expect(mockFrom).toHaveBeenCalledWith('노트목록');
      expect(mockUpdate).toHaveBeenCalledWith({ 관련노트목록 });
    });
  });

  describe('7차원 분석 및 검색', () => {
    test('7차원 종합 분석을 수행한다', async () => {
      const 모킹메시지들 = [
        {
          아이디: 'msg1',
          우선순위차원: { 우선순위레벨: 4 },
          감정차원: { 기분상태: { 주감정: '기쁨' } },
          맥락차원: { 상황유형: '업무' }
        },
        {
          아이디: 'msg2',
          우선순위차원: null,
          감정차원: { 기분상태: { 주감정: '중립' } },
          맥락차원: null
        }
      ];

      const 모킹노트정보 = {
        아이디: 'test-note-id',
        제목: '테스트 노트'
      };

      mockSelect.mockReturnValueOnce({
        eq: mockEq.mockReturnValue({
          data: 모킹메시지들,
          error: null
        })
      }).mockReturnValueOnce({
        eq: mockEq.mockReturnValue({
          single: mockSingle.mockReturnValue({
            data: 모킹노트정보,
            error: null
          })
        })
      });

      const 결과 = await 칠차원데이터서비스.칠차원종합분석('test-note-id');

      expect(결과.차원별활용률.우선순위활용률).toBe(50); // 2개 중 1개
      expect(결과.차원별활용률.감정기록률).toBe(100); // 2개 중 2개
      expect(결과.차원별활용률.맥락완성률).toBe(50); // 2개 중 1개
      expect(결과.개선제안).toContain('우선순위를 설정하면');
    });

    test('7차원 스마트 검색을 수행한다', async () => {
      const 검색조건 = {
        키워드: '회의',
        우선순위레벨: 4,
        감정: '기쁨',
        상황유형: '업무',
        작성목적: '계획'
      };

      const 예상결과 = [
        { 아이디: 'msg1', 텍스트: '회의 계획' }
      ];

      // 복잡한 체이닝 모킹
      const mockChain = {
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({
          data: 예상결과,
          error: null
        })
      };

      mockSelect.mockReturnValue(mockChain);

      const 결과 = await 칠차원데이터서비스.칠차원스마트검색(검색조건);

      expect(결과).toEqual(예상결과);
      expect(mockChain.ilike).toHaveBeenCalledWith('텍스트', '%회의%');
      expect(mockChain.eq).toHaveBeenCalledWith('우선순위차원->>우선순위레벨', '4');
    });
  });

  describe('배치 처리 및 유틸리티', () => {
    test('메시지 7차원 데이터를 일괄 처리한다', async () => {
      const 메시지목록 = [
        { 아이디: 'msg1', 텍스트: '좋은 하루입니다' },
        { 아이디: 'msg2', 텍스트: '회의 계획을 세웁시다' }
      ];

      // 각 메시지마다 2번의 업데이트 (감정, 맥락)가 발생
      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      const 결과 = await 칠차원데이터서비스.메시지칠차원일괄처리(메시지목록);

      expect(결과.성공).toBe(2);
      expect(결과.실패).toBe(0);
      expect(결과.오류목록).toHaveLength(0);
    });

    test('7차원 데이터를 삭제한다', async () => {
      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: null })
      });

      await 칠차원데이터서비스.칠차원데이터삭제(
        'message',
        'test-message-id',
        ['우선순위', '감정']
      );

      expect(mockUpdate).toHaveBeenCalledWith({
        우선순위차원: null,
        감정차원: null
      });
      expect(mockEq).toHaveBeenCalledWith('아이디', 'test-message-id');
    });
  });

  describe('에러 처리', () => {
    test('데이터베이스 에러를 전파한다', async () => {
      const 데이터베이스에러 = new Error('Database connection failed');
      
      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({ error: 데이터베이스에러 })
      });

      const 우선순위데이터 = {
        우선순위레벨: 3 as any,
        긴급도: '당일' as any,
        중요도매트릭스: {
          긴급하고중요함: true,
          중요하지만긴급하지않음: false,
          긴급하지만중요하지않음: false,
          긴급하지도중요하지도않음: false
        }
      };

      await expect(
        칠차원데이터서비스.메시지우선순위설정('test-id', 우선순위데이터)
      ).rejects.toThrow('Database connection failed');
    });

    test('빈 결과를 올바르게 처리한다', async () => {
      mockSelect.mockReturnValue({
        not: mockNot.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockReturnValue({
              data: null, // 빈 결과
              error: null
            })
          })
        })
      });

      const 결과 = await 칠차원데이터서비스.우선순위별메시지조회(5);

      expect(결과).toEqual([]);
    });
  });
});