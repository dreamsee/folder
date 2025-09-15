#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
결과 분석 및 출력 모듈 - 시뮬레이션 결과 분석 및 리포팅
모든 분석 및 출력 로직 분리
"""

import json
import math
from datetime import datetime
from collections import defaultdict

class AnalysisReporter:
    """시뮬레이션 결과 분석 및 리포팅 전담 모듈"""
    
    def __init__(self):
        # 분석 기준
        self.performance_criteria = {
            '최소수익률': 3.0,  # 최소 성공 기준
            '고수익기준': 10.0,  # 고수익 전략 기준
            '위험도기준': -5.0,  # 고위험 기준 (손실)
            '거래빈도기준': 50   # 고빈도 거래 기준
        }
        
        # 시장 상황 분류
        self.market_conditions = {
            '강세장': {'min_return': 5.0, 'description': '전체적 상승 추세'},
            '약세장': {'max_return': -2.0, 'description': '전체적 하락 추세'},
            '횡보장': {'min_return': -2.0, 'max_return': 5.0, 'description': '방향성 없는 등락'},
            '변동성장': {'volatility': 3.0, 'description': '급격한 변동성'}
        }
    
    def analyze_simulation_results(self, results_list, market_data):
        """시뮬레이션 결과 종합 분석"""
        if not results_list:
            return self._create_empty_analysis()
        
        print(f"=== {len(results_list):,}개 전략 결과 분석 시작 ===")
        
        # 기본 통계
        basic_stats = self._calculate_basic_statistics(results_list)
        
        # 성능 분석
        performance_analysis = self._analyze_performance(results_list)
        
        # 전략 분류
        strategy_classification = self._classify_strategies(results_list)
        
        # 시장 적합성 분석
        market_analysis = self._analyze_market_compatibility(results_list, market_data)
        
        # 리스크 분석
        risk_analysis = self._analyze_risks(results_list)
        
        # 거래 패턴 분석
        trading_analysis = self._analyze_trading_patterns(results_list)
        
        # 상위 전략 분석
        top_strategies = self._analyze_top_strategies(results_list)
        
        comprehensive_analysis = {
            '분석일시': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            '총전략수': len(results_list),
            '시장정보': self._extract_market_info(market_data),
            '기본통계': basic_stats,
            '성능분석': performance_analysis,
            '전략분류': strategy_classification,
            '시장분석': market_analysis,
            '리스크분석': risk_analysis,
            '거래분석': trading_analysis,
            '상위전략': top_strategies
        }
        
        print("결과 분석 완료!")
        return comprehensive_analysis
    
    def _calculate_basic_statistics(self, results_list):
        """기본 통계 계산"""
        returns = [r.get('수익률', 0) for r in results_list]
        trade_counts = [r.get('거래횟수', 0) for r in results_list]
        
        # 성공/실패 분류
        successful = [r for r in results_list if r.get('수익률', 0) > 0]
        failed = [r for r in results_list if r.get('수익률', 0) <= 0]
        
        return {
            '총전략수': len(results_list),
            '성공전략수': len(successful),
            '실패전략수': len(failed),
            '성공률': len(successful) / len(results_list) * 100 if results_list else 0,
            '평균수익률': sum(returns) / len(returns) if returns else 0,
            '최고수익률': max(returns) if returns else 0,
            '최저수익률': min(returns) if returns else 0,
            '수익률표준편차': self._calculate_std(returns),
            '평균거래횟수': sum(trade_counts) / len(trade_counts) if trade_counts else 0,
            '최대거래횟수': max(trade_counts) if trade_counts else 0
        }
    
    def _analyze_performance(self, results_list):
        """성능 분석"""
        returns = [r.get('수익률', 0) for r in results_list]
        
        # 수익률 구간별 분포
        distribution = {
            '고수익(10%+)': len([r for r in returns if r >= 10.0]),
            '중수익(3~10%)': len([r for r in returns if 3.0 <= r < 10.0]),
            '저수익(0~3%)': len([r for r in returns if 0 < r < 3.0]),
            '손실(0%미만)': len([r for r in returns if r <= 0])
        }
        
        # 성과 지표
        positive_returns = [r for r in returns if r > 0]
        performance_metrics = {
            '수익률분포': distribution,
            '샤프비율': self._calculate_sharpe_ratio(returns),
            '최대낙폭': min(returns) if returns else 0,
            '승률': len(positive_returns) / len(returns) * 100 if returns else 0,
            '평균수익': sum(positive_returns) / len(positive_returns) if positive_returns else 0,
            '수익편차': self._calculate_std(positive_returns) if positive_returns else 0
        }
        
        return performance_metrics
    
    def _classify_strategies(self, results_list):
        """전략 분류 분석"""
        # 매수 전략별 분류
        buy_strategy_performance = defaultdict(list)
        sell_strategy_performance = defaultdict(list)
        quantity_strategy_performance = defaultdict(list)
        
        for result in results_list:
            strategy = result.get('전략', {})
            return_rate = result.get('수익률', 0)
            
            # 매수 전략별
            buy_type = strategy.get('매수기준', 'Unknown')
            buy_strategy_performance[buy_type].append(return_rate)
            
            # 매도 전략별
            sell_type = strategy.get('매도전략', 'Unknown')
            sell_strategy_performance[sell_type].append(return_rate)
            
            # 수량 전략별
            buy_method = strategy.get('구매방식', '1')
            quantity_type = '퍼센트' if buy_method == '1' else '고정주식'
            quantity_strategy_performance[quantity_type].append(return_rate)
        
        return {
            '매수전략별성과': {k: {'평균': sum(v)/len(v), '개수': len(v)} for k, v in buy_strategy_performance.items()},
            '매도전략별성과': {k: {'평균': sum(v)/len(v), '개수': len(v)} for k, v in sell_strategy_performance.items()},
            '수량전략별성과': {k: {'평균': sum(v)/len(v), '개수': len(v)} for k, v in quantity_strategy_performance.items()}
        }
    
    def _analyze_market_compatibility(self, results_list, market_data):
        """시장 적합성 분석"""
        market_return = market_data.get('최종수익률', 0)
        market_sentiment = market_data.get('시장분위기', 'Unknown')
        
        # 시장 대비 성과
        outperforming = len([r for r in results_list if r.get('수익률', 0) > market_return])
        underperforming = len(results_list) - outperforming
        
        # 시장 상황별 최적 전략
        top_performers = sorted(results_list, key=lambda x: x.get('수익률', 0), reverse=True)[:10]
        
        return {
            '시장수익률': market_return,
            '시장분위기': market_sentiment,
            '시장초과전략': outperforming,
            '시장미달전략': underperforming,
            '시장초과율': outperforming / len(results_list) * 100 if results_list else 0,
            '최적전략특성': self._analyze_strategy_characteristics(top_performers)
        }
    
    def _analyze_risks(self, results_list):
        """리스크 분석"""
        returns = [r.get('수익률', 0) for r in results_list]
        
        # 손실 위험 분석
        losses = [r for r in returns if r < 0]
        severe_losses = [r for r in returns if r < -10.0]
        
        # 변동성 분석
        volatility = self._calculate_std(returns)
        
        # 위험 조정 수익률
        risk_free_rate = 1.0  # 무위험 수익률 가정
        risk_adjusted_return = (sum(returns) / len(returns) - risk_free_rate) / volatility if volatility > 0 else 0
        
        return {
            '변동성': volatility,
            '손실확률': len(losses) / len(returns) * 100 if returns else 0,
            '심각손실확률': len(severe_losses) / len(returns) * 100 if returns else 0,
            '최대손실': min(losses) if losses else 0,
            '평균손실': sum(losses) / len(losses) if losses else 0,
            '위험조정수익률': risk_adjusted_return,
            'VaR_95%': self._calculate_var(returns, 0.05),
            'VaR_99%': self._calculate_var(returns, 0.01)
        }
    
    def _analyze_trading_patterns(self, results_list):
        """거래 패턴 분석"""
        trade_counts = [r.get('거래횟수', 0) for r in results_list]
        
        # 거래 빈도별 분류
        high_frequency = [r for r in results_list if r.get('거래횟수', 0) >= 50]
        medium_frequency = [r for r in results_list if 10 <= r.get('거래횟수', 0) < 50]
        low_frequency = [r for r in results_list if r.get('거래횟수', 0) < 10]
        
        # 거래 빈도와 수익률 상관관계
        correlation = self._calculate_correlation(
            trade_counts,
            [r.get('수익률', 0) for r in results_list]
        )
        
        return {
            '평균거래횟수': sum(trade_counts) / len(trade_counts) if trade_counts else 0,
            '거래빈도분포': {
                '고빈도(50+)': len(high_frequency),
                '중빈도(10-49)': len(medium_frequency),
                '저빈도(10미만)': len(low_frequency)
            },
            '빈도별평균수익률': {
                '고빈도': sum(r.get('수익률', 0) for r in high_frequency) / len(high_frequency) if high_frequency else 0,
                '중빈도': sum(r.get('수익률', 0) for r in medium_frequency) / len(medium_frequency) if medium_frequency else 0,
                '저빈도': sum(r.get('수익률', 0) for r in low_frequency) / len(low_frequency) if low_frequency else 0
            },
            '거래빈도수익률상관계수': correlation
        }
    
    def _analyze_top_strategies(self, results_list):
        """상위 전략 분석"""
        # 수익률 기준 상위 전략
        top_by_return = sorted(results_list, key=lambda x: x.get('수익률', 0), reverse=True)[:20]
        
        # 리스크 조정 수익률 기준 상위 전략
        risk_adjusted_strategies = []
        for result in results_list:
            return_rate = result.get('수익률', 0)
            risk_score = abs(return_rate * 0.1)  # 간단한 위험 점수
            adjusted_score = return_rate - risk_score
            risk_adjusted_strategies.append((result, adjusted_score))
        
        top_by_risk_adjusted = sorted(risk_adjusted_strategies, key=lambda x: x[1], reverse=True)[:10]
        
        # 상위 전략 공통 특성 분석
        top_characteristics = self._analyze_strategy_characteristics([t[0] for t in top_by_return[:10]])
        
        return {
            '수익률상위10': [self._summarize_strategy_result(r) for r in top_by_return[:10]],
            '위험조정상위10': [self._summarize_strategy_result(t[0]) for t in top_by_risk_adjusted[:10]],
            '상위전략공통특성': top_characteristics
        }
    
    def _analyze_strategy_characteristics(self, strategies):
        """전략 특성 분석"""
        if not strategies:
            return {}
        
        characteristics = defaultdict(int)
        
        for result in strategies:
            strategy = result.get('전략', {})
            
            # 매수 전략
            buy_type = strategy.get('매수기준', 'Unknown')
            characteristics[f'매수_{buy_type}'] += 1
            
            # 매도 전략
            sell_type = strategy.get('매도전략', 'Unknown')
            characteristics[f'매도_{sell_type}'] += 1
            
            # 손절 라인
            stop_loss = strategy.get('손절라인', 0)
            if stop_loss <= -5.0:
                characteristics['보수적손절'] += 1
            elif stop_loss >= -2.0:
                characteristics['공격적손절'] += 1
            else:
                characteristics['중간손절'] += 1
        
        return dict(characteristics)
    
    def generate_text_report(self, analysis_data):
        """텍스트 리포트 생성"""
        report = []
        report.append("=" * 60)
        report.append("주식 투자 전략 시뮬레이션 분석 리포트")
        report.append("=" * 60)
        report.append(f"분석일시: {analysis_data['분석일시']}")
        report.append(f"총 분석 전략: {analysis_data['총전략수']:,}개")
        report.append("")
        
        # 기본 통계
        basic = analysis_data['기본통계']
        report.append("[ 기본 통계 ]")
        report.append(f"성공 전략: {basic['성공전략수']:,}개 ({basic['성공률']:.1f}%)")
        report.append(f"평균 수익률: {basic['평균수익률']:.2f}%")
        report.append(f"최고 수익률: {basic['최고수익률']:.2f}%")
        report.append(f"최저 수익률: {basic['최저수익률']:.2f}%")
        report.append(f"평균 거래횟수: {basic['평균거래횟수']:.1f}회")
        report.append("")
        
        # 성능 분석
        performance = analysis_data['성능분석']
        report.append("[ 성능 분석 ]")
        distribution = performance['수익률분포']
        for category, count in distribution.items():
            percentage = count / analysis_data['총전략수'] * 100
            report.append(f"{category}: {count:,}개 ({percentage:.1f}%)")
        
        report.append(f"샤프 비율: {performance['샤프비율']:.3f}")
        report.append(f"최대 낙폭: {performance['최대낙폭']:.2f}%")
        report.append("")
        
        # 시장 분석
        market = analysis_data['시장분석']
        report.append("[ 시장 적합성 분석 ]")
        report.append(f"시장 분위기: {market['시장분위기']}")
        report.append(f"시장 수익률: {market['시장수익률']:.2f}%")
        report.append(f"시장 초과 전략: {market['시장초과전략']:,}개 ({market['시장초과율']:.1f}%)")
        report.append("")
        
        # 리스크 분석
        risk = analysis_data['리스크분석']
        report.append("[ 리스크 분석 ]")
        report.append(f"변동성: {risk['변동성']:.2f}%")
        report.append(f"손실 확률: {risk['손실확률']:.1f}%")
        report.append(f"심각 손실 확률: {risk['심각손실확률']:.1f}%")
        report.append(f"위험 조정 수익률: {risk['위험조정수익률']:.3f}")
        report.append("")
        
        # 상위 전략
        top = analysis_data['상위전략']
        report.append("[ 상위 10개 전략 ]")
        for i, strategy_summary in enumerate(top['수익률상위10'], 1):
            report.append(f"{i:2d}. 수익률: {strategy_summary['수익률']:>7.2f}% | {strategy_summary['전략요약']}")
        
        report.append("")
        report.append("=" * 60)
        
        return '\n'.join(report)
    
    def _summarize_strategy_result(self, result):
        """전략 결과 요약"""
        strategy = result.get('전략', {})
        return {
            '수익률': result.get('수익률', 0),
            '거래횟수': result.get('거래횟수', 0),
            '전략요약': f"{strategy.get('매수기준', '')} + {strategy.get('구매방식', '')}방식 + 손절{strategy.get('손절라인', 0)}% + 매도{strategy.get('매도전략', '')}"
        }
    
    def _extract_market_info(self, market_data):
        """시장 정보 추출"""
        return {
            '시장분위기': market_data.get('시장분위기', 'Unknown'),
            '최종수익률': market_data.get('최종수익률', 0),
            '거래일수': len(market_data.get('일간데이터', []))
        }
    
    def _create_empty_analysis(self):
        """빈 분석 결과 생성"""
        return {
            '분석일시': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            '총전략수': 0,
            '오류': '분석할 결과가 없습니다.'
        }
    
    # 통계 계산 유틸리티 함수들
    def _calculate_std(self, values):
        """표준편차 계산"""
        if not values or len(values) < 2:
            return 0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)
    
    def _calculate_sharpe_ratio(self, returns, risk_free_rate=1.0):
        """샤프 비율 계산"""
        if not returns:
            return 0
        
        avg_return = sum(returns) / len(returns)
        std_return = self._calculate_std(returns)
        
        if std_return == 0:
            return 0
        
        return (avg_return - risk_free_rate) / std_return
    
    def _calculate_var(self, returns, confidence_level):
        """VaR (Value at Risk) 계산"""
        if not returns:
            return 0
        
        sorted_returns = sorted(returns)
        index = int(len(sorted_returns) * confidence_level)
        return sorted_returns[index] if index < len(sorted_returns) else sorted_returns[-1]
    
    def _calculate_correlation(self, x_values, y_values):
        """상관계수 계산"""
        if not x_values or not y_values or len(x_values) != len(y_values):
            return 0
        
        n = len(x_values)
        if n < 2:
            return 0
        
        mean_x = sum(x_values) / n
        mean_y = sum(y_values) / n
        
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_values, y_values))
        
        sum_sq_x = sum((x - mean_x) ** 2 for x in x_values)
        sum_sq_y = sum((y - mean_y) ** 2 for y in y_values)
        
        denominator = math.sqrt(sum_sq_x * sum_sq_y)
        
        if denominator == 0:
            return 0
        
        return numerator / denominator
    
    def save_analysis_report(self, analysis_data, file_path):
        """분석 리포트 저장"""
        try:
            # JSON 형태로 저장
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(analysis_data, f, ensure_ascii=False, indent=2)
            
            # 텍스트 리포트도 저장
            text_report = self.generate_text_report(analysis_data)
            text_file_path = file_path.replace('.json', '_리포트.txt')
            with open(text_file_path, 'w', encoding='utf-8') as f:
                f.write(text_report)
            
            print(f"분석 리포트 저장 완료: {file_path}")
            print(f"텍스트 리포트 저장 완료: {text_file_path}")
            return True
        except Exception as e:
            print(f"리포트 저장 실패: {e}")
            return False