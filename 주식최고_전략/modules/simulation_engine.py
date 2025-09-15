#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
시뮬레이션 실행 엔진 모듈 - 전략 실행 및 매매 시뮬레이션
모든 시뮬레이션 로직 분리
"""

import random
import math
from datetime import datetime

class SimulationEngine:
    """시뮬레이션 실행을 전담하는 모듈"""
    
    def __init__(self, initial_price=100):
        self.initial_price = initial_price
        self.current_price = initial_price
        
        # 시뮬레이션 설정
        self.trading_costs = {
            '매매수수료': 0.00015,  # 0.015%
            '증권거래세': 0.0023,   # 0.23% (매도시만)
            '농특세': 0.00046,      # 0.046% (매도시만)
            '슬리피지': 0.0002,     # 0.02% (시장충격비용)
            '거래비용반영': True
        }
        
        # 과거 데이터 (이동평균 계산용)
        self.historical_data = []
        self._generate_historical_data()
        
        # 가격 기록
        self.price_history = []
        
        # 시뮬레이션 통계
        self.simulation_stats = {
            '총시뮬레이션': 0,
            '성공전략': 0,
            '실패전략': 0,
            '평균수익률': 0.0
        }
    
    def _generate_historical_data(self):
        """과거 120일 데이터 생성 (이동평균용)"""
        print("과거 120일 데이터 생성 중...")
        
        prices = []
        current = self.initial_price
        
        # 120일 전부터 현재까지의 자연스러운 가격 변동
        for day in range(120):
            daily_change = random.uniform(-2.5, 2.5)  # 일일 변동률 -2.5% ~ +2.5%
            current = current * (1 + daily_change / 100)
            current = max(50, min(200, current))  # 50~200원 범위 제한
            prices.append(current)
        
        # 마지막 가격을 초기가격에 맞춤
        adjustment_ratio = self.initial_price / prices[-1]
        self.historical_data = [price * adjustment_ratio for price in prices]
        
        print(f"과거 데이터 생성 완료: {self.historical_data[0]:.1f}원 → {self.historical_data[-1]:.1f}원")
    
    def generate_market_data(self, days=135):
        """시장 데이터 생성"""
        print(f"=== {days}일간 시장 데이터 생성 ===")
        
        # 시장 분위기 결정
        market_sentiment = random.choices(
            ['강세장', '약세장', '횡보장', '변동성장'],
            weights=[25, 25, 35, 15]
        )[0]
        
        print(f"시장 분위기: {market_sentiment}")
        
        # 시장별 특성
        market_configs = {
            '강세장': {'trend': 0.1, 'volatility': 1.8, 'bias': 0.3},
            '약세장': {'trend': -0.1, 'volatility': 2.2, 'bias': -0.3},
            '횡보장': {'trend': 0.0, 'volatility': 1.5, 'bias': 0.0},
            '변동성장': {'trend': 0.05, 'volatility': 3.5, 'bias': 0.0}
        }
        
        config = market_configs[market_sentiment]
        
        # 일간 데이터 생성
        daily_data = []
        current_price = self.initial_price
        
        for day in range(days):
            # 기본 변동률
            base_change = random.normalvariate(0, config['volatility'])
            
            # 추세 적용
            trend_change = config['trend'] * (1 + day / days)  # 시간에 따른 추세 강화
            
            # 바이어스 적용
            bias_change = config['bias'] * random.uniform(0.5, 1.5)
            
            # 최종 변동률
            total_change = base_change + trend_change + bias_change
            
            # 가격 적용
            new_price = current_price * (1 + total_change / 100)
            new_price = max(20, min(500, new_price))  # 극단적 가격 제한
            
            daily_change = (new_price - current_price) / current_price * 100
            
            daily_data.append({
                '일차': day + 1,
                '시가': current_price,
                '종가': new_price,
                '일일변동률': daily_change,
                '누적변동률': (new_price - self.initial_price) / self.initial_price * 100
            })
            
            current_price = new_price
        
        # 시간별 데이터 생성 (일간 데이터 기반)
        hourly_data = []
        for daily in daily_data:
            hourly_data.extend(self._generate_hourly_data_from_daily(daily))
        
        return {
            '시장분위기': market_sentiment,
            '일간데이터': daily_data,
            '시간데이터': hourly_data,
            '최종수익률': (current_price - self.initial_price) / self.initial_price * 100
        }
    
    def _generate_hourly_data_from_daily(self, daily_data):
        """일간 데이터에서 시간별 데이터 생성"""
        start_price = daily_data['시가']
        end_price = daily_data['종가']
        day_num = daily_data['일차']
        
        hourly_data = []
        current = start_price
        
        # 9시간 거래 (9:00-18:00)
        for hour in range(9):
            # 시간대별 변동성 (장 초반/후반 높음, 점심시간 낮음)
            volatility_factors = [1.2, 1.0, 0.8, 0.6, 0.7, 1.0, 1.1, 1.3, 1.4]
            vol_factor = volatility_factors[hour]
            
            # 목표가에 도달하기 위한 진행률
            progress = (hour + 1) / 9
            target_progress_price = start_price + (end_price - start_price) * progress
            
            # 실제 변동 (목표가 ± 랜덤 변동)
            random_factor = random.uniform(-0.5, 0.5) * vol_factor
            new_price = target_progress_price * (1 + random_factor / 100)
            
            # 시간별 기록
            hourly_data.append({
                '일차': day_num,
                '시간': 9 + hour,
                '가격': new_price,
                '시간변동률': (new_price - current) / current * 100 if current > 0 else 0
            })
            
            current = new_price
        
        return hourly_data
    
    def run_strategy_simulation(self, strategy, market_data, exclusion_manager=None):
        """단일 전략 시뮬레이션 실행"""
        try:
            # 전략 초기화
            strategy_state = self._initialize_strategy_state(strategy)
            
            # 옐로우카드 패널티 적용
            if exclusion_manager:
                yellow_card_penalty = exclusion_manager.apply_yellow_card_penalty(strategy)
                strategy_state['초기패널티'] = yellow_card_penalty
                strategy_state['현재자산'] -= yellow_card_penalty
            
            # 일일 시뮬레이션 실행
            for day_data in market_data['일간데이터']:
                daily_result = self._simulate_daily_trading(strategy, strategy_state, day_data, market_data['시간데이터'])
                
                # 손절 체크
                current_return = (strategy_state['현재자산'] - strategy_state['초기자산']) / strategy_state['초기자산'] * 100
                if current_return <= strategy['손절라인']:
                    strategy_state['탈락일'] = day_data['일차']
                    strategy_state['탈락사유'] = f"손절선 도달: {current_return:.1f}%"
                    break
                
                # 수익 목표 달성 체크 (단순화)
                if current_return >= 5.0:  # 5% 수익 달성시 성공으로 간주
                    strategy_state['성공일'] = day_data['일차']
                    strategy_state['성공사유'] = f"목표 수익 달성: {current_return:.1f}%"
                    break
            
            # 최종 결과 계산
            final_result = self._calculate_final_result(strategy, strategy_state, market_data)
            
            # 통계 업데이트
            self.simulation_stats['총시뮬레이션'] += 1
            if final_result['수익률'] > 0:
                self.simulation_stats['성공전략'] += 1
            else:
                self.simulation_stats['실패전략'] += 1
            
            return final_result
            
        except Exception as e:
            print(f"시뮬레이션 실행 오류: {e}")
            return self._create_error_result(strategy, str(e))
    
    def _initialize_strategy_state(self, strategy):
        """전략 상태 초기화"""
        initial_asset = 10000000  # 1천만원
        
        return {
            '초기자산': initial_asset,
            '현재자산': initial_asset,
            '보유주식수': 0,
            '매수평균가': 0,
            '거래횟수': 0,
            '거래내역': [],
            '일일기록': [],
            '탈락일': None,
            '성공일': None,
            '탈락사유': '',
            '성공사유': '',
            '초기패널티': 0
        }
    
    def _simulate_daily_trading(self, strategy, strategy_state, day_data, hourly_data):
        """일일 거래 시뮬레이션"""
        day_num = day_data['일차']
        day_hourly_data = [h for h in hourly_data if h['일차'] == day_num]
        
        daily_trades = []
        
        for hour_data in day_hourly_data:
            current_price = hour_data['가격']
            
            # 매수 신호 확인
            if self._check_buy_signal(strategy, strategy_state, current_price, day_data):
                buy_result = self._execute_buy(strategy, strategy_state, current_price, day_num, hour_data['시간'])
                if buy_result:
                    daily_trades.append(buy_result)
            
            # 매도 신호 확인
            if strategy_state['보유주식수'] > 0:
                if self._check_sell_signal(strategy, strategy_state, current_price, day_data):
                    sell_result = self._execute_sell(strategy, strategy_state, current_price, day_num, hour_data['시간'])
                    if sell_result:
                        daily_trades.append(sell_result)
        
        # 일일 기록 저장
        daily_record = {
            '일차': day_num,
            '시작자산': strategy_state.get('일시작자산', strategy_state['현재자산']),
            '종료자산': strategy_state['현재자산'],
            '보유주식': strategy_state['보유주식수'],
            '거래수': len(daily_trades),
            '거래내역': daily_trades
        }
        strategy_state['일일기록'].append(daily_record)
        
        return daily_record
    
    def _check_buy_signal(self, strategy, strategy_state, current_price, day_data):
        """매수 신호 확인"""
        buy_strategy = strategy['매수기준']
        decline_rate = strategy.get('매수하락률', 0)
        
        if buy_strategy == '시가매수':
            return day_data['일차'] <= 1  # 첫날만 매수
        
        elif buy_strategy == '시가하락':
            시가 = day_data['시가']
            current_decline = (시가 - current_price) / 시가 * 100
            return current_decline >= decline_rate
        
        elif buy_strategy == '전일하락':
            if day_data['일차'] <= 1:
                return False
            전일종가 = self._get_previous_close(day_data['일차'])
            if 전일종가:
                decline = (전일종가 - current_price) / 전일종가 * 100
                return decline >= decline_rate
        
        elif buy_strategy == '모멘텀매수':
            return self._check_momentum_signal(current_price, day_data)
        
        # 기타 매수 전략들...
        return False
    
    def _check_sell_signal(self, strategy, strategy_state, current_price, day_data):
        """매도 신호 확인"""
        if strategy_state['보유주식수'] <= 0:
            return False
        
        # 현재 수익률 계산
        avg_buy_price = strategy_state['매수평균가']
        current_return = (current_price - avg_buy_price) / avg_buy_price * 100
        
        sell_strategy = strategy['매도전략']
        profit_target = strategy['수익라인']
        
        if sell_strategy == '1':  # 일괄매도
            return current_return >= float(profit_target)
        
        elif sell_strategy in ['2', '3', '4']:  # 고무줄매도
            return self._check_elastic_sell_signal(strategy, strategy_state, current_return, day_data)
        
        elif sell_strategy == '5':  # 일존버
            holding_days = day_data['일차'] - strategy_state.get('첫매수일', day_data['일차'])
            return holding_days >= int(profit_target)
        
        return False
    
    def _execute_buy(self, strategy, strategy_state, price, day, hour):
        """매수 실행"""
        buy_method = int(strategy['구매방식'])
        buy_amount = float(strategy['매수수량'])
        
        available_cash = strategy_state['현재자산']
        
        if buy_method == 1:  # 퍼센트 방식
            if buy_amount > 1:
                buy_amount = buy_amount / 100.0
            invest_amount = available_cash * buy_amount
        else:  # 고정주식 방식
            invest_amount = buy_amount * price
        
        if invest_amount > available_cash:
            return None
        
        # 거래비용 계산
        trade_cost = self._calculate_trading_cost('buy', invest_amount)
        actual_invest = invest_amount - trade_cost
        shares = actual_invest / price
        
        # 상태 업데이트
        if strategy_state['보유주식수'] > 0:
            # 추가 매수 - 평균단가 계산
            total_value = strategy_state['매수평균가'] * strategy_state['보유주식수'] + actual_invest
            strategy_state['보유주식수'] += shares
            strategy_state['매수평균가'] = total_value / strategy_state['보유주식수']
        else:
            # 첫 매수
            strategy_state['보유주식수'] = shares
            strategy_state['매수평균가'] = price
            strategy_state['첫매수일'] = day
        
        strategy_state['현재자산'] -= invest_amount
        strategy_state['거래횟수'] += 1
        
        trade_record = {
            '유형': '매수',
            '일차': day,
            '시간': hour,
            '가격': price,
            '주식수': shares,
            '금액': invest_amount,
            '수수료': trade_cost
        }
        strategy_state['거래내역'].append(trade_record)
        
        return trade_record
    
    def _execute_sell(self, strategy, strategy_state, price, day, hour):
        """매도 실행"""
        shares_to_sell = strategy_state['보유주식수']
        sell_amount = shares_to_sell * price
        
        # 거래비용 계산
        trade_cost = self._calculate_trading_cost('sell', sell_amount)
        actual_receive = sell_amount - trade_cost
        
        # 상태 업데이트
        strategy_state['현재자산'] += actual_receive
        strategy_state['보유주식수'] = 0
        strategy_state['매수평균가'] = 0
        strategy_state['거래횟수'] += 1
        
        trade_record = {
            '유형': '매도',
            '일차': day,
            '시간': hour,
            '가격': price,
            '주식수': shares_to_sell,
            '금액': sell_amount,
            '수수료': trade_cost,
            '실수령': actual_receive
        }
        strategy_state['거래내역'].append(trade_record)
        
        return trade_record
    
    def _calculate_trading_cost(self, trade_type, amount):
        """거래비용 계산"""
        if not self.trading_costs['거래비용반영']:
            return 0
        
        cost = 0
        
        # 매매수수료 (매수/매도 공통)
        cost += amount * self.trading_costs['매매수수료']
        
        # 슬리피지 (매수/매도 공통)
        cost += amount * self.trading_costs['슬리피지']
        
        if trade_type == 'sell':
            # 증권거래세 (매도시만)
            cost += amount * self.trading_costs['증권거래세']
            # 농특세 (매도시만)
            cost += amount * self.trading_costs['농특세']
        
        return cost
    
    def _check_momentum_signal(self, current_price, day_data):
        """모멘텀 신호 확인"""
        if len(self.historical_data) < 20:
            return False
        
        # 20일 이동평균 계산
        recent_20 = self.historical_data[-20:] + [current_price]
        ma_20 = sum(recent_20) / len(recent_20)
        
        # 상승 모멘텀 확인
        return current_price > ma_20 * 1.02  # 20일 평균보다 2% 이상 상승
    
    def _check_elastic_sell_signal(self, strategy, strategy_state, current_return, day_data):
        """고무줄 매도 신호 확인"""
        profit_line = strategy['수익라인']
        if ',' not in str(profit_line):
            return False
        
        start_profit, increment = map(float, str(profit_line).split(','))
        
        # 고무줄 단계별 수익률 계산
        holding_days = day_data['일차'] - strategy_state.get('첫매수일', day_data['일차'])
        stage = min(holding_days // 3, 10)  # 3일마다 단계 상승, 최대 10단계
        
        target_profit = start_profit + (increment * stage)
        
        return current_return >= target_profit
    
    def _get_previous_close(self, current_day):
        """전일 종가 가져오기"""
        # 실제 구현에서는 가격 히스토리에서 전일 종가를 찾아야 함
        if len(self.price_history) >= current_day - 1:
            return self.price_history[current_day - 2]
        return None
    
    def _calculate_final_result(self, strategy, strategy_state, market_data):
        """최종 결과 계산"""
        final_asset = strategy_state['현재자산']
        
        # 보유 주식이 있으면 현재가로 평가
        if strategy_state['보유주식수'] > 0:
            last_price = market_data['일간데이터'][-1]['종가']
            stock_value = strategy_state['보유주식수'] * last_price
            final_asset += stock_value
        
        initial_asset = strategy_state['초기자산']
        final_return = (final_asset - initial_asset) / initial_asset * 100
        
        result = {
            '전략': strategy,
            '초기자산': initial_asset,
            '최종자산': final_asset,
            '수익률': final_return,
            '거래횟수': strategy_state['거래횟수'],
            '탈락일': strategy_state.get('탈락일'),
            '성공일': strategy_state.get('성공일'),
            '탈락사유': strategy_state.get('탈락사유', ''),
            '성공사유': strategy_state.get('성공사유', ''),
            '초기패널티': strategy_state.get('초기패널티', 0),
            '거래내역': strategy_state['거래내역'][:10],  # 최근 10개만
            '시뮬레이션완료': True
        }
        
        return result
    
    def _create_error_result(self, strategy, error_message):
        """오류 결과 생성"""
        return {
            '전략': strategy,
            '초기자산': 10000000,
            '최종자산': 10000000,
            '수익률': -100.0,
            '거래횟수': 0,
            '탈락일': 1,
            '탈락사유': f'시뮬레이션 오류: {error_message}',
            '시뮬레이션완료': False,
            '오류': True
        }
    
    def get_simulation_stats(self):
        """시뮬레이션 통계 반환"""
        total = self.simulation_stats['총시뮬레이션']
        if total > 0:
            success_rate = self.simulation_stats['성공전략'] / total * 100
            self.simulation_stats['성공률'] = success_rate
        
        return self.simulation_stats.copy()
    
    def reset_stats(self):
        """통계 초기화"""
        for key in self.simulation_stats:
            if key != '평균수익률':
                self.simulation_stats[key] = 0
            else:
                self.simulation_stats[key] = 0.0