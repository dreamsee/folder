#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
최적화된 투자 분석 시스템 - 메인 컨트롤러
모든 모듈을 통합하는 메인 시스템

모든 기능 보존 + 최적화된 모듈화 구조
매수전략타입을 포함한 완전한 고유 식별자 시스템
"""

import os
import sys
import time
from datetime import datetime

# 모듈 임포트
try:
    from modules.data_manager import DataManager
    from modules.strategy_generator import StrategyGenerator
    from modules.strategy_attributes import StrategyAttributes
    from modules.exclusion_manager import ExclusionManager
    from modules.simulation_engine import SimulationEngine
    from modules.analysis_reporter import AnalysisReporter
except ImportError as e:
    print(f"모듈 임포트 오류: {e}")
    print("modules/ 폴더가 올바르게 설정되었는지 확인하세요.")
    sys.exit(1)

class OptimizedInvestmentSystem:
    """최적화된 투자 분석 시스템 - 메인 컨트롤러"""
    
    def __init__(self, base_path=None):
        if base_path is None:
            base_path = r"C:\Users\ksj\OneDrive\바탕 화면\gemini\제작파일\주식최고_전략"
        
        self.base_path = base_path
        print(f"=== 최적화된 투자 분석 시스템 초기화 ===")
        print(f"기본 경로: {base_path}")
        
        # 모듈 초기화
        self.data_manager = DataManager(base_path)
        self.strategy_generator = StrategyGenerator()
        self.strategy_attributes = StrategyAttributes()
        self.exclusion_manager = ExclusionManager(self.data_manager)
        self.simulation_engine = SimulationEngine()
        self.analysis_reporter = AnalysisReporter()
        
        # 시스템 상태
        self.current_market_data = None
        self.last_simulation_results = []
        self.system_stats = {
            '시스템시작시간': datetime.now(),
            '총시뮬레이션': 0,
            '성공시뮬레이션': 0,
            '분석보고서': 0
        }
        
        print("모든 모듈 초기화 완료!")
    
    def run_comprehensive_simulation(self, max_strategies=1000, market_days=135):
        """종합적인 시뮬레이션 실행"""
        print(f"\n=== 종합 시뮬레이션 실행 ({max_strategies:,}개 전략, {market_days}일) ===")
        
        start_time = time.time()
        
        # 1. 시장 데이터 생성
        print("\n1. 시장 데이터 생성...")
        self.current_market_data = self.simulation_engine.generate_market_data(market_days)
        market_sentiment = self.current_market_data['시장분위기']
        market_return = self.current_market_data['최종수익률']
        print(f"   시장 분위기: {market_sentiment}")
        print(f"   시장 수익률: {market_return:.2f}%")
        
        # 2. 제외 데이터 로드
        print("\n2. 제외 데이터 로드...")
        self.exclusion_manager.load_exclusion_data()
        exclusion_stats = self.exclusion_manager.get_exclusion_stats()
        print(f"   완전제외: {exclusion_stats.get('총완전제외', 0):,}개")
        print(f"   시장별제외: {exclusion_stats.get('총시장별제외', 0):,}개")
        print(f"   탈락기록: {exclusion_stats.get('총탈락기록', 0):,}개")
        
        # 3. 전략 생성 (샘플)
        print(f"\n3. 전략 생성 (최대 {max_strategies:,}개)...")
        valid_strategies = self.strategy_generator.generate_sample_strategies(
            count=max_strategies,
            exclusion_manager=self.exclusion_manager
        )
        print(f"   유효 전략: {len(valid_strategies):,}개")
        
        if not valid_strategies:
            print("❌ 유효한 전략이 없습니다.")
            return None
        
        # 4. 시뮬레이션 실행
        print(f"\n4. 시뮬레이션 실행...")
        self.last_simulation_results = []
        
        for i, strategy in enumerate(valid_strategies):
            if (i + 1) % 100 == 0:
                progress = (i + 1) / len(valid_strategies) * 100
                elapsed = time.time() - start_time
                estimated_total = elapsed / progress * 100
                remaining = estimated_total - elapsed
                print(f"   진행: {i+1:,}/{len(valid_strategies):,} ({progress:.1f}%) - 남은 시간: {remaining/60:.1f}분")
            
            result = self.simulation_engine.run_strategy_simulation(
                strategy=strategy,
                market_data=self.current_market_data,
                exclusion_manager=self.exclusion_manager
            )
            self.last_simulation_results.append(result)
        
        # 5. 결과 분석
        print("\n5. 결과 분석...")
        analysis_data = self.analysis_reporter.analyze_simulation_results(
            self.last_simulation_results,
            self.current_market_data
        )
        
        # 6. 분석 리포트 생성
        print("\n6. 분석 리포트 생성...")
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = os.path.join(self.base_path, f"시뮬레이션_분석_{timestamp}.json")
        self.analysis_reporter.save_analysis_report(analysis_data, report_file)
        
        # 7. 통계 업데이트
        self.system_stats['총시뮬레이션'] += len(valid_strategies)
        self.system_stats['성공시뮬레이션'] += len([r for r in self.last_simulation_results if r.get('수익률', 0) > 0])
        self.system_stats['분석보고서'] += 1
        
        elapsed_time = time.time() - start_time
        print(f"\n=== 시뮬레이션 완료 (소요시간: {elapsed_time/60:.1f}분) ===")
        
        # 요약 출력
        self._print_simulation_summary(analysis_data)
        
        return analysis_data
    
    def run_quick_test(self, test_strategies=100):
        """빠른 테스트 실행"""
        print(f"\n=== 빠른 테스트 ({test_strategies}개 전략) ===")
        
        # 간단한 시장 데이터
        self.current_market_data = self.simulation_engine.generate_market_data(30)
        
        # 제외 데이터 로드
        self.exclusion_manager.load_exclusion_data()
        
        # 샘플 전략 생성
        strategies = self.strategy_generator.generate_sample_strategies(
            count=test_strategies,
            exclusion_manager=self.exclusion_manager
        )
        
        if not strategies:
            print("❌ 테스트할 전략이 없습니다.")
            return None
        
        # 시뮬레이션 실행
        results = []
        for i, strategy in enumerate(strategies):
            if (i + 1) % 20 == 0:
                print(f"   테스트 진행: {i+1}/{len(strategies)}")
            
            result = self.simulation_engine.run_strategy_simulation(
                strategy=strategy,
                market_data=self.current_market_data,
                exclusion_manager=self.exclusion_manager
            )
            results.append(result)
        
        # 간단한 분석
        successful = [r for r in results if r.get('수익률', 0) > 0]
        avg_return = sum(r.get('수익률', 0) for r in results) / len(results)
        
        print(f"\n테스트 결과:")
        print(f"  성공 전략: {len(successful)}/{len(results)} ({len(successful)/len(results)*100:.1f}%)")
        print(f"  평균 수익률: {avg_return:.2f}%")
        print(f"  시장 수익률: {self.current_market_data['최종수익률']:.2f}%")
        
        return results
    
    def analyze_existing_results(self, results_file=None):
        """기존 결과 분석"""
        if results_file and os.path.exists(results_file):
            print(f"기존 결과 파일 분석: {results_file}")
            # 파일에서 결과 로드 로직 추가 필요
        elif self.last_simulation_results:
            print("마지막 시뮬레이션 결과 재분석...")
            analysis_data = self.analysis_reporter.analyze_simulation_results(
                self.last_simulation_results,
                self.current_market_data
            )
            
            # 텍스트 리포트 출력
            text_report = self.analysis_reporter.generate_text_report(analysis_data)
            print("\n" + text_report)
            
            return analysis_data
        else:
            print("분석할 결과가 없습니다. 먼저 시뮬레이션을 실행하세요.")
            return None
    
    def get_strategy_info(self):
        """전략 정보 조회"""
        info = self.strategy_generator.get_strategy_info()
        exclusion_stats = self.exclusion_manager.get_exclusion_stats()
        
        print("\n=== 전략 시스템 정보 ===")
        print(f"매수 전략: {info['매수전략']:,}개")
        print(f"수량 전략: {info['수량전략']:,}개")
        print(f"손절 전략: {info['손절전략']:,}개")
        print(f"매도 전략: {info['매도전략']:,}개")
        print(f"이론적 총 조합: {info['총조합수']:,}개")
        print("")
        print("=== 제외 시스템 정보 ===")
        print(f"완전제외 전략: {exclusion_stats.get('총완전제외', 0):,}개")
        print(f"시장별제외 전략: {exclusion_stats.get('총시장별제외', 0):,}개")
        print(f"탈락기록 전략: {exclusion_stats.get('총탈락기록', 0):,}개")
        
        return {'전략정보': info, '제외정보': exclusion_stats}
    
    def test_new_attribute_system(self):
        """새로운 속성 시스템 테스트"""
        print("\n=== 새로운 속성 시스템 테스트 ===")
        
        # 테스트 전략 생성
        test_strategies = [
            {
                '매수기준': '시가하락',
                '매수하락률': 2.0,
                '구매방식': '1',
                '매수수량': 50,
                '손절라인': -6.0,
                '매도전략': '2',
                '수익라인': '3.0,2.0'
            },
            {
                '매수기준': '모멘텀매수',
                '매수하락률': 0.0,
                '구매방식': '2',
                '매수수량': 1000,
                '손절라인': -4.0,
                '매도전략': '1',
                '수익라인': 5.0
            }
        ]
        
        for i, strategy in enumerate(test_strategies, 1):
            print(f"\n테스트 전략 {i}:")
            print(f"  원본: {strategy}")
            
            # 속성 변환
            attributes = self.strategy_attributes.convert_strategy_to_attributes(strategy)
            print(f"  속성: {attributes}")
            
            # 키 생성
            key = self.strategy_attributes.convert_strategy_to_key(strategy)
            print(f"  키: {key}")
            
            # 키 -> 속성 복원
            restored_attrs = self.strategy_attributes.convert_key_to_attributes(key)
            print(f"  복원속성: {restored_attrs}")
            
            # 속성 -> 전략 복원
            restored_strategy = self.strategy_attributes.convert_attributes_to_strategy(attributes)
            print(f"  복원전략: {restored_strategy}")
            
            # 유효성 검증
            is_valid, message = self.strategy_attributes.validate_strategy_attributes(attributes)
            print(f"  유효성: {is_valid} - {message}")
            
            # 요약
            summary = self.strategy_attributes.get_strategy_summary(attributes)
            print(f"  요약: {summary}")
        
        print("\n속성 시스템 테스트 완료!")
    
    def _print_simulation_summary(self, analysis_data):
        """시뮬레이션 요약 출력"""
        if not analysis_data:
            return
        
        basic = analysis_data.get('기본통계', {})
        performance = analysis_data.get('성능분석', {})
        market = analysis_data.get('시장분석', {})
        
        print(f"\n시뮬레이션 요약:")
        print(f"   총 전략: {basic.get('총전략수', 0):,}개")
        print(f"   성공률: {basic.get('성공률', 0):.1f}%")
        print(f"   평균 수익률: {basic.get('평균수익률', 0):.2f}%")
        print(f"   최고 수익률: {basic.get('최고수익률', 0):.2f}%")
        print(f"   시장 초과율: {market.get('시장초과율', 0):.1f}%")
        print(f"   샤프 비율: {performance.get('샤프비율', 0):.3f}")
    
    def get_system_status(self):
        """시스템 상태 조회"""
        uptime = datetime.now() - self.system_stats['시스템시작시간']
        sim_stats = self.simulation_engine.get_simulation_stats()
        
        print(f"\n=== 시스템 상태 ===")
        print(f"가동 시간: {str(uptime).split('.')[0]}")
        print(f"총 시뮬레이션: {self.system_stats['총시뮬레이션']:,}개")
        print(f"성공 시뮬레이션: {self.system_stats['성공시뮬레이션']:,}개")
        print(f"분석 보고서: {self.system_stats['분석보고서']}개")
        print(f"엔진 통계: {sim_stats}")
        
        return {
            '가동시간': str(uptime).split('.')[0],
            '시스템통계': self.system_stats,
            '엔진통계': sim_stats
        }


def main():
    """메인 함수 - 대화형 인터페이스"""
    system = OptimizedInvestmentSystem()
    
    while True:
        print("\n" + "=" * 50)
        print("최적화된 투자 분석 시스템")
        print("=" * 50)
        print("1. 종합 시뮬레이션 (1000개 전략)")
        print("2. 빠른 테스트 (100개 전략)")
        print("3. 결과 분석")
        print("4. 전략 정보 조회")
        print("5. 속성 시스템 테스트")
        print("6. 시스템 상태")
        print("7. 종료")
        
        try:
            choice = input("\n선택하세요 (1-7): ").strip()
            
            if choice == '1':
                strategies = input("전략 수 (기본 1000): ").strip()
                strategies = int(strategies) if strategies else 1000
                system.run_comprehensive_simulation(max_strategies=strategies)
                
            elif choice == '2':
                system.run_quick_test()
                
            elif choice == '3':
                system.analyze_existing_results()
                
            elif choice == '4':
                system.get_strategy_info()
                
            elif choice == '5':
                system.test_new_attribute_system()
                
            elif choice == '6':
                system.get_system_status()
                
            elif choice == '7':
                print("\n시스템을 종료합니다.")
                break
                
            else:
                print("잘못된 선택입니다.")
                
        except KeyboardInterrupt:
            print("\n\n시스템을 종료합니다.")
            break
        except Exception as e:
            print(f"오류 발생: {e}")
            input("계속하려면 엔터를 누르세요...")


if __name__ == "__main__":
    main()