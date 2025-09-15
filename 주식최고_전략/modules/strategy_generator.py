#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
전략 생성 엔진 모듈 - 매수/매도/수량 조합 생성
모든 전략 조합 생성 로직 분리
"""

import random
from itertools import product

class StrategyGenerator:
    """전략 조합 생성을 전담하는 모듈"""
    
    def __init__(self):
        # 매수 전략 정의
        self.buy_strategies = {
            "시가매수": {"타입": "시가매수", "조건": "시가에서 즉시 매수"},
            "시가하락": {"타입": "시가하락", "범위": [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]},
            "전일하락": {"타입": "전일하락", "범위": [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0]},
            "20일선하락": {"타입": "20일선하락", "범위": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]},
            "60일선하락": {"타입": "60일선하락", "범위": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]},
            "120일선하락": {"타입": "120일선하락", "범위": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]},
            "모멘텀매수": {"타입": "모멘텀매수", "조건": "상승 모멘텀 감지시 매수"},
            "급등대기": {"타입": "급등대기", "범위": [3.0, 4.0, 5.0, 6.0, 7.0]},
            "고무줄매수": {"타입": "고무줄매수", "범위": [2.0, 3.0, 4.0, 5.0, 6.0]}
        }
        
        # 매수 수량 방식
        self.buy_quantities = {
            "퍼센트": {"방식": "1", "범위": [10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100]},
            "고정주식": {"방식": "2", "범위": [100, 200, 300, 500, 1000, 2000, 3000, 5000]}
        }
        
        # 손절 라인
        self.stop_loss_lines = [-1.0, -1.5, -2.0, -3.0, -4.0, -5.0, -6.0, -7.0, -8.0, -9.0, -10.0, -12.0, -15.0]
        
        # 매도 전략 정의
        self.sell_strategies = {
            "일괄매도": {"타입": "1", "수익률": [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 15.0]},
            "적극고무줄": {"타입": "2", "시작": [1.5, 2.0, 2.5, 3.0], "증가": [0.5, 1.0, 1.5, 2.0]},
            "대기고무줄": {"타입": "3", "시작": [3.0, 4.0, 5.0, 6.0], "증가": [2.0, 2.5, 3.0]},
            "급진고무줄": {"타입": "4", "시작": [1.0, 1.5, 2.0], "증가": [0.3, 0.5, 0.8, 1.0]},
            "일존버": {"타입": "5", "일수": [10, 15, 20, 25, 30]}
        }
    
    def generate_buy_strategies(self):
        """매수 전략 생성"""
        strategies = []
        
        for strategy_name, config in self.buy_strategies.items():
            if strategy_name in ["시가매수", "모멘텀매수"]:
                # 조건 없는 매수 전략
                strategies.append({
                    "매수기준": config["타입"],
                    "매수하락률": 0.0,
                    "전략설명": config["조건"]
                })
            else:
                # 하락률 기반 매수 전략
                for rate in config["범위"]:
                    strategies.append({
                        "매수기준": config["타입"],
                        "매수하락률": rate,
                        "전략설명": f"{strategy_name} {rate}% 하락시 매수"
                    })
        
        print(f"매수 전략 생성 완료: {len(strategies)}개")
        return strategies
    
    def generate_buy_quantities(self):
        """매수 수량 전략 생성"""
        quantities = []
        
        # 퍼센트 방식
        for percent in self.buy_quantities["퍼센트"]["범위"]:
            quantities.append({
                "구매방식": "1",
                "매수수량": percent,
                "설명": f"자산의 {percent}% 투자"
            })
        
        # 고정주식 방식
        for shares in self.buy_quantities["고정주식"]["범위"]:
            quantities.append({
                "구매방식": "2", 
                "매수수량": shares,
                "설명": f"고정 {shares}주 매수"
            })
        
        print(f"매수 수량 전략 생성 완료: {len(quantities)}개")
        return quantities
    
    def generate_stop_loss_strategies(self):
        """손절 전략 생성"""
        return self.stop_loss_lines.copy()
    
    def generate_sell_strategies(self):
        """매도 전략 생성"""
        strategies = []
        
        # 일괄 매도
        for profit_rate in self.sell_strategies["일괄매도"]["수익률"]:
            strategies.append({
                "매도전략": "1",
                "수익라인": profit_rate,
                "설명": f"일괄 {profit_rate}% 수익시 매도"
            })
        
        # 적극 고무줄
        for start in self.sell_strategies["적극고무줄"]["시작"]:
            for increase in self.sell_strategies["적극고무줄"]["증가"]:
                strategies.append({
                    "매도전략": "2",
                    "수익라인": f"{start},{increase}",
                    "설명": f"적극고무줄 {start}%부터 {increase}%씩"
                })
        
        # 대기 고무줄
        for start in self.sell_strategies["대기고무줄"]["시작"]:
            for increase in self.sell_strategies["대기고무줄"]["증가"]:
                strategies.append({
                    "매도전략": "3",
                    "수익라인": f"{start},{increase}",
                    "설명": f"대기고무줄 {start}%부터 {increase}%씩"
                })
        
        # 급진 고무줄
        for start in self.sell_strategies["급진고무줄"]["시작"]:
            for increase in self.sell_strategies["급진고무줄"]["증가"]:
                strategies.append({
                    "매도전략": "4",
                    "수익라인": f"{start},{increase}",
                    "설명": f"급진고무줄 {start}%부터 {increase}%씩"
                })
        
        # 일존버
        for days in self.sell_strategies["일존버"]["일수"]:
            strategies.append({
                "매도전략": "5",
                "수익라인": days,
                "설명": f"{days}일 존버 매도"
            })
        
        print(f"매도 전략 생성 완료: {len(strategies)}개")
        return strategies
    
    def generate_all_combinations(self, exclusion_manager=None):
        """모든 전략 조합 생성"""
        print("=== 전체 전략 조합 생성 시작 ===")
        
        # 각 전략 요소 생성
        buy_strategies = self.generate_buy_strategies()
        buy_quantities = self.generate_buy_quantities()
        stop_losses = self.generate_stop_loss_strategies()
        sell_strategies = self.generate_sell_strategies()
        
        print(f"구성 요소: 매수({len(buy_strategies)}) × 수량({len(buy_quantities)}) × 손절({len(stop_losses)}) × 매도({len(sell_strategies)})")
        
        total_combinations = len(buy_strategies) * len(buy_quantities) * len(stop_losses) * len(sell_strategies)
        print(f"이론적 총 조합 수: {total_combinations:,}개")
        
        # 조합 생성
        valid_strategies = []
        excluded_count = 0
        
        for i, (buy_strategy, quantity, stop_loss, sell_strategy) in enumerate(
            product(buy_strategies, buy_quantities, stop_losses, sell_strategies)
        ):
            # 전략 객체 생성
            strategy = {
                "매수기준": buy_strategy["매수기준"],
                "매수하락률": buy_strategy["매수하락률"],
                "구매방식": quantity["구매방식"],
                "매수수량": quantity["매수수량"],
                "손절라인": stop_loss,
                "매도전략": sell_strategy["매도전략"],
                "수익라인": sell_strategy["수익라인"],
                "전략설명": f"{buy_strategy['전략설명']} + {quantity['설명']} + 손절{stop_loss}% + {sell_strategy['설명']}"
            }
            
            # 제외 여부 확인
            if exclusion_manager and exclusion_manager.should_exclude(strategy):
                excluded_count += 1
                continue
            
            valid_strategies.append(strategy)
            
            # 진행률 출력 (10만개마다)
            if (i + 1) % 100000 == 0:
                print(f"진행: {i+1:,} / {total_combinations:,} ({(i+1)/total_combinations*100:.1f}%) - 유효: {len(valid_strategies):,}, 제외: {excluded_count:,}")
        
        print(f"\n전략 조합 생성 완료:")
        print(f"  총 조합: {total_combinations:,}개")
        print(f"  유효 전략: {len(valid_strategies):,}개")
        print(f"  제외된 전략: {excluded_count:,}개")
        print(f"  제외율: {excluded_count/total_combinations*100:.1f}%")
        
        return valid_strategies
    
    def generate_sample_strategies(self, count=1000, exclusion_manager=None):
        """샘플 전략 생성 (테스트용)"""
        print(f"=== 샘플 전략 {count}개 생성 ===")
        
        buy_strategies = self.generate_buy_strategies()
        buy_quantities = self.generate_buy_quantities()
        stop_losses = self.generate_stop_loss_strategies()
        sell_strategies = self.generate_sell_strategies()
        
        valid_strategies = []
        attempts = 0
        max_attempts = count * 10  # 최대 시도 횟수
        
        while len(valid_strategies) < count and attempts < max_attempts:
            # 랜덤 조합 선택
            buy_strategy = random.choice(buy_strategies)
            quantity = random.choice(buy_quantities)
            stop_loss = random.choice(stop_losses)
            sell_strategy = random.choice(sell_strategies)
            
            strategy = {
                "매수기준": buy_strategy["매수기준"],
                "매수하락률": buy_strategy["매수하락률"],
                "구매방식": quantity["구매방식"],
                "매수수량": quantity["매수수량"],
                "손절라인": stop_loss,
                "매도전략": sell_strategy["매도전략"],
                "수익라인": sell_strategy["수익라인"],
                "전략설명": f"{buy_strategy['전략설명']} + {quantity['설명']} + 손절{stop_loss}% + {sell_strategy['설명']}"
            }
            
            # 제외 여부 확인
            if exclusion_manager and exclusion_manager.should_exclude(strategy):
                attempts += 1
                continue
            
            # 중복 체크
            strategy_key = self._generate_strategy_key(strategy)
            if any(self._generate_strategy_key(s) == strategy_key for s in valid_strategies):
                attempts += 1
                continue
            
            valid_strategies.append(strategy)
            attempts += 1
        
        print(f"샘플 전략 생성 완료: {len(valid_strategies)}개 (시도: {attempts}회)")
        return valid_strategies
    
    def _generate_strategy_key(self, strategy):
        """전략 키 생성 (중복 체크용)"""
        return f"{strategy['매수기준']}_{strategy['매수하락률']}_{strategy['구매방식']}_{strategy['매수수량']}_{strategy['손절라인']}_{strategy['매도전략']}_{strategy['수익라인']}"
    
    def get_strategy_info(self):
        """전략 정보 요약 반환"""
        buy_count = sum(1 if s in ["시가매수", "모멘텀매수"] else len(self.buy_strategies[s]["범위"]) 
                       for s in self.buy_strategies.keys())
        quantity_count = sum(len(self.buy_quantities[q]["범위"]) for q in self.buy_quantities.keys())
        stop_loss_count = len(self.stop_loss_lines)
        
        sell_count = (
            len(self.sell_strategies["일괄매도"]["수익률"]) +
            len(self.sell_strategies["적극고무줄"]["시작"]) * len(self.sell_strategies["적극고무줄"]["증가"]) +
            len(self.sell_strategies["대기고무줄"]["시작"]) * len(self.sell_strategies["대기고무줄"]["증가"]) +
            len(self.sell_strategies["급진고무줄"]["시작"]) * len(self.sell_strategies["급진고무줄"]["증가"]) +
            len(self.sell_strategies["일존버"]["일수"])
        )
        
        return {
            "매수전략": buy_count,
            "수량전략": quantity_count,
            "손절전략": stop_loss_count,
            "매도전략": sell_count,
            "총조합수": buy_count * quantity_count * stop_loss_count * sell_count
        }