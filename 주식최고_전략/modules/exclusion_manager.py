#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
제외/탈락 관리 모듈 - 완전제외/임시탈락 전담
옐로우카드 패널티 시스템 포함
"""

from .strategy_attributes import StrategyAttributes

class ExclusionManager:
    """전략 제외 및 탈락 관리 전담 모듈"""
    
    def __init__(self, data_manager):
        self.data_manager = data_manager
        self.strategy_attributes = StrategyAttributes()
        
        # 캐시된 제외 데이터
        self._dropout_data = None
        self._permanent_exclusion_data = None
        self._cached_exclusion_keys = None
        
        # 성능 카운터
        self.exclusion_stats = {
            '완전제외': 0,
            '시장별제외': 0,
            '임시탈락': 0,
            '옐로우카드적용': 0
        }
    
    def load_exclusion_data(self):
        """제외 데이터 로드 (캐시 포함)"""
        if self._dropout_data is None:
            print("탈락전략 데이터 로드 중...")
            self._dropout_data = self.data_manager.load_compressed_dropout_strategies()
            print(f"탈락전략 로드 완료: 영구제외 {len(self._dropout_data['영구제외'])}개, 임시기록 {len(self._dropout_data['임시기록'])}개")
        
        if self._permanent_exclusion_data is None:
            print("영구제외 데이터 로드 중...")
            self._permanent_exclusion_data = self.data_manager.load_permanent_exclusion_strategies()
            완전제외수 = len(self._permanent_exclusion_data['완전제외'])
            시장별제외수 = sum(len(strategies) for strategies in self._permanent_exclusion_data['시장별제외'].values())
            print(f"영구제외 로드 완료: 완전제외 {완전제외수}개, 시장별제외 {시장별제외수}개")
        
        # 통합 제외 키 생성 (성능 최적화)
        if self._cached_exclusion_keys is None:
            self._generate_cached_exclusion_keys()
    
    def _generate_cached_exclusion_keys(self):
        """제외 키 캐시 생성 (성능 최적화)"""
        print("제외 키 캐시 생성 중...")
        self._cached_exclusion_keys = {
            '완전제외': set(),
            '시장별제외': {},
            '탈락기록': {}
        }
        
        # 완전제외 키
        if self._permanent_exclusion_data:
            self._cached_exclusion_keys['완전제외'] = self._permanent_exclusion_data['완전제외'].copy()
        
        # 시장별제외 키
        if self._permanent_exclusion_data:
            for market_num, strategies in self._permanent_exclusion_data['시장별제외'].items():
                self._cached_exclusion_keys['시장별제외'][market_num] = strategies.copy()
        
        # 탈락기록 키 (옐로우카드 적용)
        if self._dropout_data:
            # 영구제외된 탈락전략
            for strategy_key in self._dropout_data['영구제외']:
                self._cached_exclusion_keys['탈락기록'][strategy_key] = 10
            
            # 임시기록 탈락전략
            for strategy_key, count in self._dropout_data['임시기록'].items():
                self._cached_exclusion_keys['탈락기록'][strategy_key] = count
        
        total_cached = (
            len(self._cached_exclusion_keys['완전제외']) +
            sum(len(s) for s in self._cached_exclusion_keys['시장별제외'].values()) +
            len(self._cached_exclusion_keys['탈락기록'])
        )
        print(f"제외 키 캐시 생성 완료: {total_cached:,}개")
    
    def should_exclude(self, strategy, current_market=None):
        """전략이 제외되어야 하는지 확인"""
        # 제외 데이터 로드 (캐시 포함)
        self.load_exclusion_data()
        
        # 전략 키 생성
        strategy_key = self.strategy_attributes.convert_strategy_to_key(strategy)
        if not strategy_key:
            return False
        
        # 1. 완전제외 확인
        if self._is_completely_excluded(strategy_key):
            self.exclusion_stats['완전제외'] += 1
            return True
        
        # 2. 시장별제외 확인
        if current_market and self._is_market_excluded(strategy_key, current_market):
            self.exclusion_stats['시장별제외'] += 1
            return True
        
        return False
    
    def _is_completely_excluded(self, strategy_key):
        """완전제외 전략인지 확인"""
        if not self._cached_exclusion_keys:
            return False
        
        return strategy_key in self._cached_exclusion_keys['완전제외']
    
    def _is_market_excluded(self, strategy_key, market_condition):
        """시장별제외 전략인지 확인"""
        if not self._cached_exclusion_keys:
            return False
        
        # 시장상황을 숫자로 변환
        market_num = self._market_condition_to_number(market_condition)
        if market_num == 0:
            return False
        
        market_excluded = self._cached_exclusion_keys['시장별제외'].get(market_num, set())
        return strategy_key in market_excluded
    
    def _market_condition_to_number(self, market_condition):
        """시장상황을 숫자로 변환"""
        market_mapping = {'상승장': 1, '하락장': 2, '횡보장': 3}
        return market_mapping.get(market_condition, 0)
    
    def apply_yellow_card_penalty(self, strategy):
        """옐로우카드 패널티 적용 (탈락횟수 × 2)"""
        if not self._cached_exclusion_keys:
            return 0
        
        strategy_key = self.strategy_attributes.convert_strategy_to_key(strategy)
        if not strategy_key:
            return 0
        
        dropout_count = self._cached_exclusion_keys['탈락기록'].get(strategy_key, 0)
        if dropout_count > 0:
            penalty = dropout_count * 2
            self.exclusion_stats['옐로우카드적용'] += 1
            return penalty
        
        return 0
    
    def get_dropout_info(self, strategy):
        """전략의 탈락 정보 반환"""
        if not self._cached_exclusion_keys:
            return {'탈락횟수': 0, '옐로우카드': 0, '제외유형': None}
        
        strategy_key = self.strategy_attributes.convert_strategy_to_key(strategy)
        if not strategy_key:
            return {'탈락횟수': 0, '옐로우카드': 0, '제외유형': None}
        
        # 탈락횟수 확인
        dropout_count = self._cached_exclusion_keys['탈락기록'].get(strategy_key, 0)
        yellow_card = dropout_count * 2 if dropout_count > 0 else 0
        
        # 제외유형 확인
        exclusion_type = None
        if strategy_key in self._cached_exclusion_keys['완전제외']:
            exclusion_type = '완전제외'
        else:
            for market_num, strategies in self._cached_exclusion_keys['시장별제외'].items():
                if strategy_key in strategies:
                    exclusion_type = f'시장별제외({market_num})'
                    break
        
        return {
            '탈락횟수': dropout_count,
            '옐로우카드': yellow_card,
            '제외유형': exclusion_type
        }
    
    def add_dropout_strategy(self, strategy, dropout_info):
        """새로운 탈락전략 추가"""
        strategy_key = self.strategy_attributes.convert_strategy_to_key(strategy)
        if not strategy_key:
            return False
        
        dropout_date = dropout_info.get('탈락일', '')
        dropout_reason = dropout_info.get('탈락사유', '')
        market_condition = dropout_info.get('시장상황', '')
        final_return = dropout_info.get('최종수익률', 0.0)
        
        # 기존 탈락횟수 확인
        current_count = 0
        if self._dropout_data and strategy_key in self._dropout_data['임시기록']:
            current_count = self._dropout_data['임시기록'][strategy_key]
        elif self._dropout_data and strategy_key in self._dropout_data['영구제외']:
            current_count = 10  # 이미 영구제외됨
        
        new_count = current_count + 1
        
        # 새로운 탈락정보 생성
        new_dropout_info = {
            'strategy_key': strategy_key,
            '탈락횟수': new_count,
            '탈락일': dropout_date,
            '탈락사유': dropout_reason,
            '시장상황': market_condition,
            '최종수익률': final_return
        }
        
        # 메모리 캐시 업데이트
        if new_count >= 10:
            # 영구제외로 이동
            if self._dropout_data:
                self._dropout_data['영구제외'].add(strategy_key)
                if strategy_key in self._dropout_data['임시기록']:
                    del self._dropout_data['임시기록'][strategy_key]
        else:
            # 임시기록 업데이트
            if self._dropout_data:
                self._dropout_data['임시기록'][strategy_key] = new_count
        
        # 캐시 업데이트
        if self._cached_exclusion_keys:
            self._cached_exclusion_keys['탈락기록'][strategy_key] = new_count
        
        # 파일 저장은 배치로 처리 (성능 최적화)
        return True
    
    def save_dropout_data(self):
        """탈락 데이터 저장"""
        if self._dropout_data:
            return self.data_manager.save_dropout_strategies(self._dropout_data)
        return False
    
    def add_permanent_exclusion(self, strategy, exclusion_info):
        """영구제외 전략 추가"""
        strategy_key = self.strategy_attributes.convert_strategy_to_key(strategy)
        if not strategy_key:
            return False
        
        exclusion_type = exclusion_info.get('제외유형', '완전제외')
        market_condition = exclusion_info.get('시장상황', '')
        exclusion_reason = exclusion_info.get('제외사유', '')
        
        if exclusion_type == '완전제외':
            # 완전제외 추가
            if self._permanent_exclusion_data:
                self._permanent_exclusion_data['완전제외'].add(strategy_key)
            if self._cached_exclusion_keys:
                self._cached_exclusion_keys['완전제외'].add(strategy_key)
        else:
            # 시장별제외 추가
            market_num = self._market_condition_to_number(market_condition)
            if market_num > 0:
                if self._permanent_exclusion_data:
                    if market_num not in self._permanent_exclusion_data['시장별제외']:
                        self._permanent_exclusion_data['시장별제외'][market_num] = set()
                    self._permanent_exclusion_data['시장별제외'][market_num].add(strategy_key)
                
                if self._cached_exclusion_keys:
                    if market_num not in self._cached_exclusion_keys['시장별제외']:
                        self._cached_exclusion_keys['시장별제외'][market_num] = set()
                    self._cached_exclusion_keys['시장별제외'][market_num].add(strategy_key)
        
        return True
    
    def get_exclusion_stats(self):
        """제외 통계 반환"""
        stats = self.exclusion_stats.copy()
        
        if self._cached_exclusion_keys:
            stats['총완전제외'] = len(self._cached_exclusion_keys['완전제외'])
            stats['총시장별제외'] = sum(len(s) for s in self._cached_exclusion_keys['시장별제외'].values())
            stats['총탈락기록'] = len(self._cached_exclusion_keys['탈락기록'])
        
        return stats
    
    def clear_cache(self):
        """캐시 초기화"""
        self._dropout_data = None
        self._permanent_exclusion_data = None
        self._cached_exclusion_keys = None
        
        # 통계 초기화
        for key in self.exclusion_stats:
            self.exclusion_stats[key] = 0