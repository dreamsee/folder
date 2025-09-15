#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
전략 속성 시스템 모듈 - 새로운 고유 식별자 포함
매수전략타입을 포함한 완전한 고유 식별자 시스템
"""

class StrategyAttributes:
    """전략 속성 변환 및 고유 식별자 생성 전담 모듈"""
    
    def __init__(self):
        # 매수 전략 타입 매핑 (새로운 고유 식별자 핵심)
        self.buy_strategy_mapping = {
            "시가매수": "SM",
            "시가하락": "SH", 
            "전일하락": "JH",
            "20일선하락": "20H",
            "60일선하락": "60H",
            "120일선하락": "120H",
            "모멘텀매수": "MM",
            "급등대기": "GD",
            "고무줄매수": "GMM"
        }
        
        # 역매핑 (복원용)
        self.reverse_buy_mapping = {v: k for k, v in self.buy_strategy_mapping.items()}
        
        # 매도 전략 타입 매핑
        self.sell_strategy_mapping = {
            "1": "일괄",
            "2": "적극고무줄",
            "3": "대기고무줄", 
            "4": "급진고무줄",
            "5": "일존버"
        }
    
    def convert_strategy_to_attributes(self, strategy):
        """전략을 속성으로 변환 (새로운 고유 식별자 포함)"""
        try:
            # 매수 전략 타입 (새로 추가된 핵심 요소)
            buy_strategy_type = strategy.get('매수기준', '')
            buy_strategy_code = self.buy_strategy_mapping.get(buy_strategy_type, 'UNK')
            
            # 매수 하락률
            buy_decline_rate = float(strategy.get('매수하락률', 0.0))
            
            # 구매 방식 (1: 퍼센트, 2: 고정주식)
            buy_method = int(strategy.get('구매방식', '1'))
            
            # 매수 수량 (퍼센트는 0.01-1.0, 고정주식은 정수)
            buy_quantity = strategy.get('매수수량', 0)
            if isinstance(buy_quantity, dict):
                # 딕셔너리 형태인 경우 (구버전 호환성)
                buy_quantity = float(buy_quantity.get('수량', 0))
            else:
                buy_quantity = float(buy_quantity)
            
            # 퍼센트 방식인 경우 비율로 변환
            if buy_method == 1 and buy_quantity > 1:
                buy_quantity = buy_quantity / 100.0
            
            # 손절 라인
            stop_loss = float(strategy.get('손절라인', 0.0))
            
            # 매도 전략 타입
            sell_strategy = str(strategy.get('매도전략', '1'))
            
            # 수익 라인 (매도 전략에 따라 다른 형태)
            profit_line = strategy.get('수익라인', 0)
            if isinstance(profit_line, str) and ',' in profit_line:
                # 고무줄 매도 (시작,증가)
                profit_parts = profit_line.split(',')
                profit_line = f"{float(profit_parts[0])},{float(profit_parts[1])}"
            else:
                # 일괄 매도 또는 일존버
                profit_line = float(profit_line) if sell_strategy != '5' else int(profit_line)
            
            return {
                '매수전략타입': buy_strategy_code,
                '매수하락률': buy_decline_rate,
                '구매방식': buy_method,
                '매수수량': buy_quantity,
                '손절라인': stop_loss,
                '매도전략': sell_strategy,
                '수익라인': profit_line
            }
        except Exception as e:
            print(f"전략 속성 변환 실패: {e}")
            print(f"문제 전략: {strategy}")
            return None
    
    def convert_strategy_to_key(self, strategy):
        """전략을 고유 키로 변환 (매수전략타입 포함)"""
        attributes = self.convert_strategy_to_attributes(strategy)
        if not attributes:
            return None
        
        # 새로운 고유 키 형태: 매수전략타입_매수하락률_구매방식_매수수량_손절라인_매도전략_수익라인
        key_parts = [
            attributes['매수전략타입'],
            f"{attributes['매수하락률']:.1f}",
            str(attributes['구매방식']),
            f"{attributes['매수수량']:.3f}",
            f"{attributes['손절라인']:.1f}",
            attributes['매도전략'],
            str(attributes['수익라인'])
        ]
        
        return '_'.join(key_parts)
    
    def convert_key_to_attributes(self, strategy_key):
        """키를 속성으로 변환 (복원용)"""
        try:
            parts = strategy_key.split('_')
            if len(parts) < 7:
                return None
            
            return {
                '매수전략타입': parts[0],
                '매수하락률': float(parts[1]),
                '구매방식': int(parts[2]),
                '매수수량': float(parts[3]),
                '손절라인': float(parts[4]),
                '매도전략': parts[5],
                '수익라인': parts[6]
            }
        except Exception as e:
            print(f"키 -> 속성 변환 실패: {e} (키: {strategy_key})")
            return None
    
    def convert_attributes_to_strategy(self, attributes):
        """속성을 전략 객체로 복원"""
        try:
            # 매수 전략 타입 복원
            buy_strategy_type = self.reverse_buy_mapping.get(attributes['매수전략타입'], 'Unknown')
            
            # 수익라인 처리
            profit_line = attributes['수익라인']
            if isinstance(profit_line, str) and ',' in profit_line:
                # 고무줄 형태 유지
                pass
            elif attributes['매도전략'] == '5':
                # 일존버는 정수로
                profit_line = int(float(profit_line))
            else:
                # 일괄 매도는 실수로
                profit_line = float(profit_line)
            
            return {
                '매수기준': buy_strategy_type,
                '매수하락률': attributes['매수하락률'],
                '구매방식': str(attributes['구매방식']),
                '매수수량': attributes['매수수량'],
                '손절라인': attributes['손절라인'],
                '매도전략': attributes['매도전략'],
                '수익라인': profit_line
            }
        except Exception as e:
            print(f"속성 -> 전략 복원 실패: {e}")
            return None
    
    def attributes_match(self, attr1, attr2, tolerance=0.001):
        """두 전략 속성이 일치하는지 확인 (오차 허용)"""
        if not attr1 or not attr2:
            return False
        
        try:
            # 정확히 일치해야 하는 항목들
            exact_match_keys = ['매수전략타입', '구매방식', '매도전략']
            for key in exact_match_keys:
                if attr1.get(key) != attr2.get(key):
                    return False
            
            # 오차를 허용하는 수치 항목들
            numeric_keys = ['매수하락률', '매수수량', '손절라인']
            for key in numeric_keys:
                val1 = float(attr1.get(key, 0))
                val2 = float(attr2.get(key, 0))
                if abs(val1 - val2) > tolerance:
                    return False
            
            # 수익라인 비교 (복잡한 형태 처리)
            profit1 = attr1.get('수익라인', '0')
            profit2 = attr2.get('수익라인', '0')
            
            if isinstance(profit1, str) and isinstance(profit2, str):
                if ',' in profit1 and ',' in profit2:
                    # 둘 다 고무줄 형태
                    parts1 = [float(p) for p in profit1.split(',')]
                    parts2 = [float(p) for p in profit2.split(',')]
                    if len(parts1) != len(parts2):
                        return False
                    for p1, p2 in zip(parts1, parts2):
                        if abs(p1 - p2) > tolerance:
                            return False
                else:
                    # 문자열 직접 비교
                    return profit1 == profit2
            else:
                # 숫자 비교
                try:
                    p1 = float(profit1)
                    p2 = float(profit2)
                    return abs(p1 - p2) <= tolerance
                except:
                    return str(profit1) == str(profit2)
            
            return True
        except Exception as e:
            print(f"속성 일치 확인 실패: {e}")
            return False
    
    def generate_strategy_hash(self, strategy):
        """전략 해시 생성 (빠른 중복 체크용)"""
        key = self.convert_strategy_to_key(strategy)
        if not key:
            return None
        
        # 간단한 해시 생성
        return hash(key) & 0x7FFFFFFF  # 양수로 제한
    
    def validate_strategy_attributes(self, attributes):
        """전략 속성 유효성 검증"""
        required_keys = ['매수전략타입', '매수하락률', '구매방식', '매수수량', '손절라인', '매도전략', '수익라인']
        
        # 필수 키 존재 확인
        for key in required_keys:
            if key not in attributes:
                return False, f"필수 속성 누락: {key}"
        
        # 매수전략타입 검증
        if attributes['매수전략타입'] not in self.reverse_buy_mapping:
            return False, f"유효하지 않은 매수전략타입: {attributes['매수전략타입']}"
        
        # 구매방식 검증 (1 또는 2)
        if attributes['구매방식'] not in [1, 2]:
            return False, f"유효하지 않은 구매방식: {attributes['구매방식']}"
        
        # 매수수량 범위 검증
        if attributes['구매방식'] == 1:  # 퍼센트
            if not (0.01 <= attributes['매수수량'] <= 1.0):
                return False, f"퍼센트 방식 매수수량 범위 오류: {attributes['매수수량']}"
        else:  # 고정주식
            if attributes['매수수량'] < 1:
                return False, f"고정주식 방식 매수수량 범위 오류: {attributes['매수수량']}"
        
        # 손절라인 검증 (음수여야 함)
        if attributes['손절라인'] >= 0:
            return False, f"손절라인은 음수여야 함: {attributes['손절라인']}"
        
        # 매도전략 검증
        if attributes['매도전략'] not in self.sell_strategy_mapping:
            return False, f"유효하지 않은 매도전략: {attributes['매도전략']}"
        
        return True, "유효한 전략 속성"
    
    def get_strategy_summary(self, attributes):
        """전략 속성 요약 생성"""
        if not attributes:
            return "유효하지 않은 전략"
        
        buy_type = self.reverse_buy_mapping.get(attributes['매수전략타입'], 'Unknown')
        buy_decline = attributes['매수하락률']
        buy_method = "퍼센트" if attributes['구매방식'] == 1 else "고정주식"
        buy_quantity = attributes['매수수량']
        stop_loss = attributes['손절라인']
        sell_type = self.sell_strategy_mapping.get(attributes['매도전략'], 'Unknown')
        profit_line = attributes['수익라인']
        
        quantity_str = f"{buy_quantity*100:.0f}%" if attributes['구매방식'] == 1 else f"{buy_quantity:.0f}주"
        
        if buy_decline > 0:
            buy_desc = f"{buy_type} {buy_decline}% 하락시"
        else:
            buy_desc = buy_type
        
        return f"{buy_desc} + {quantity_str} + 손절{stop_loss}% + {sell_type}({profit_line})"