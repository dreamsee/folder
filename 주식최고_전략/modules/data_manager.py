#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
데이터 관리자 모듈 - JSON 압축/로드/저장 전담
모든 JSON 파일 관련 작업 처리
"""

import json
import os
import shutil
from datetime import datetime

class DataManager:
    """JSON 데이터 압축, 로드, 저장을 전담하는 모듈"""
    
    def __init__(self, base_path):
        self.base_path = base_path
        
        # 파일 경로 설정
        self.files = {
            'dropout_strategies': os.path.join(base_path, "탈락전략.json"),
            'dropout_compressed': os.path.join(base_path, "탈락전략_압축.json"),
            'best_strategies': os.path.join(base_path, "최고전략_히스토리.json"),
            'permanent_exclusion': os.path.join(base_path, "영구제외_전략_히스토리.json"),
            'permanent_exclusion_compressed': os.path.join(base_path, "영구제외_전략_히스토리_압축.json"),
            'portfolio': os.path.join(base_path, "전략포트폴리오.json"),
            'comprehensive_ranking': os.path.join(base_path, "종합전략랭킹.json"),
            'comprehensive_ranking_backup': os.path.join(base_path, "종합전략랭킹_백업.json"),
            'market_performance': os.path.join(base_path, "시장상황별_전략성과.json"),
            'portfolio_composition': os.path.join(base_path, "포트폴리오_구성.json")
        }
    
    def load_json_safe(self, file_key, default=None):
        """안전한 JSON 파일 로드"""
        file_path = self.files.get(file_key)
        if not file_path or not os.path.exists(file_path):
            return default if default is not None else []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"JSON 로드 실패 ({file_key}): {e}")
            return default if default is not None else []
    
    def save_json_safe(self, file_key, data, backup=True):
        """안전한 JSON 파일 저장"""
        file_path = self.files.get(file_key)
        if not file_path:
            raise ValueError(f"알 수 없는 파일 키: {file_key}")
        
        # 백업 생성
        if backup and os.path.exists(file_path):
            backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            shutil.copy2(file_path, backup_path)
        
        # 임시 파일에 저장 후 원자적 이동
        temp_path = f"{file_path}.temp"
        try:
            with open(temp_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
            
            # 원자적 이동
            if os.path.exists(file_path):
                os.remove(file_path)
            os.rename(temp_path, file_path)
            
            return True
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            print(f"JSON 저장 실패 ({file_key}): {e}")
            return False
    
    def load_compressed_dropout_strategies(self):
        """압축된 탈락전략 로드"""
        compressed_file = self.files['dropout_compressed']
        
        if os.path.exists(compressed_file):
            return self._load_compressed_format(compressed_file)
        else:
            # 압축 파일이 없으면 원본에서 변환
            return self._convert_from_original_dropout()
    
    def _load_compressed_format(self, file_path):
        """압축된 형태의 탈락전략 파일 로드"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                compressed_data = json.load(f)
            
            영구제외_전략들 = set()
            임시기록_전략들 = {}
            
            # 압축 데이터 구조: [구매방식, 매수수량, 손절라인, 매도타입, 매도파라미터, 탈락횟수]
            for strategy_array in compressed_data.get('strategies', []):
                if len(strategy_array) >= 6:
                    # 새로운 고유 식별자 생성 (매수 전략 타입 포함)
                    strategy_key = f"{strategy_array[0]}_{strategy_array[1]:.3f}_{strategy_array[2]:.1f}_{strategy_array[3]}_{strategy_array[4]}"
                    dropout_count = strategy_array[5]
                    
                    if dropout_count >= 10:
                        영구제외_전략들.add(strategy_key)
                    else:
                        임시기록_전략들[strategy_key] = dropout_count
            
            return {
                '영구제외': 영구제외_전략들,
                '임시기록': 임시기록_전략들
            }
        except Exception as e:
            print(f"압축된 탈락전략 로드 실패: {e}")
            return {'영구제외': set(), '임시기록': {}}
    
    def _convert_from_original_dropout(self):
        """원본 탈락전략 파일을 압축 형태로 변환"""
        original_data = self.load_json_safe('dropout_strategies', [])
        if not original_data:
            return {'영구제외': set(), '임시기록': {}}
        
        # 변환 로직 (기존 코드 재사용)
        영구제외_전략들 = set()
        임시기록_전략들 = {}
        
        for item in original_data:
            strategy_key = item.get('strategy_key', '')
            dropout_count = item.get('탈락횟수', 1)
            
            if dropout_count >= 10:
                영구제외_전략들.add(strategy_key)
            else:
                임시기록_전략들[strategy_key] = dropout_count
        
        return {
            '영구제외': 영구제외_전략들,
            '임시기록': 임시기록_전략들
        }
    
    def load_permanent_exclusion_strategies(self):
        """영구제외 전략 로드 (압축 형태 우선)"""
        compressed_file = self.files['permanent_exclusion_compressed']
        
        if os.path.exists(compressed_file):
            try:
                with open(compressed_file, 'r', encoding='utf-8') as f:
                    compressed_data = json.load(f)
                
                시장별제외_전략들 = {}
                완전제외_전략들 = set()
                
                # 압축 데이터 구조: [구매방식, 매수수량, 손절라인, 수익라인, 시장번호, 완전제외여부]
                for strategy_array in compressed_data.get('strategies', []):
                    if len(strategy_array) >= 6:
                        strategy_key = f"{strategy_array[0]}_{strategy_array[1]:.3f}_{strategy_array[2]:.1f}_{strategy_array[3]:.1f}"
                        market_num = strategy_array[4]
                        is_complete_exclusion = strategy_array[5]
                        
                        if is_complete_exclusion:
                            완전제외_전략들.add(strategy_key)
                        else:
                            if market_num not in 시장별제외_전략들:
                                시장별제외_전략들[market_num] = set()
                            시장별제외_전략들[market_num].add(strategy_key)
                
                return {
                    '시장별제외': 시장별제외_전략들,
                    '완전제외': 완전제외_전략들
                }
            except Exception as e:
                print(f"압축된 영구제외 전략 로드 실패: {e}")
                return self._load_original_permanent_exclusion()
        else:
            return self._load_original_permanent_exclusion()
    
    def _load_original_permanent_exclusion(self):
        """원본 영구제외 전략 로드"""
        original_data = self.load_json_safe('permanent_exclusion', [])
        
        시장별제외_전략들 = {}
        완전제외_전략들 = set()
        
        for record in original_data:
            strategy_key = record.get('전략키', '')
            market_condition = record.get('시장상황', '')
            exclusion_type = record.get('제외유형', '')
            
            if exclusion_type == '완전제외':
                완전제외_전략들.add(strategy_key)
            elif market_condition:
                market_num = self._market_condition_to_number(market_condition)
                if market_num not in 시장별제외_전략들:
                    시장별제외_전략들[market_num] = set()
                시장별제외_전략들[market_num].add(strategy_key)
        
        return {
            '시장별제외': 시장별제외_전략들,
            '완전제외': 완전제외_전략들
        }
    
    def _market_condition_to_number(self, market_condition):
        """시장상황 문자열을 숫자로 변환"""
        market_mapping = {'상승장': 1, '하락장': 2, '횡보장': 3}
        return market_mapping.get(market_condition, 0)
    
    def save_dropout_strategies(self, dropout_data):
        """탈락전략 저장"""
        # 압축된 형태로 저장
        compressed_data = {
            "version": "3.0",
            "description": "개선된 속성 기반 탈락전략 데이터 (매수전략타입 포함)",
            "structure": ["매수전략타입", "구매방식", "매수수량", "손절라인", "매도타입", "매도파라미터", "탈락횟수"],
            "매도타입_맵": {
                0: "기타", 1: "일괄", 2: "적극고무줄", 
                3: "대기고무줄", 4: "급진고무줄", 5: "일존버"
            },
            "strategies": []
        }
        
        # 영구제외와 임시기록 통합
        all_strategies = {}
        
        # 영구제외 전략들 (탈락횟수 10)
        for strategy_key in dropout_data.get('영구제외', set()):
            all_strategies[strategy_key] = 10
        
        # 임시기록 전략들
        for strategy_key, count in dropout_data.get('임시기록', {}).items():
            all_strategies[strategy_key] = count
        
        # 압축 형태로 변환
        for strategy_key, dropout_count in all_strategies.items():
            # strategy_key 파싱하여 배열로 변환
            parts = strategy_key.split('_')
            if len(parts) >= 5:
                compressed_strategy = [
                    parts[0],  # 매수전략타입
                    int(parts[1]),  # 구매방식
                    float(parts[2]),  # 매수수량
                    float(parts[3]),  # 손절라인
                    int(parts[4]),  # 매도타입
                    parts[5] if len(parts) > 5 else "0",  # 매도파라미터
                    dropout_count  # 탈락횟수
                ]
                compressed_data["strategies"].append(compressed_strategy)
        
        return self.save_json_safe('dropout_compressed', compressed_data)
    
    def get_file_path(self, file_key):
        """파일 경로 반환"""
        return self.files.get(file_key)
    
    def create_backup(self, file_key, suffix=""):
        """파일 백업 생성"""
        file_path = self.files.get(file_key)
        if not file_path or not os.path.exists(file_path):
            return False
        
        backup_suffix = f"_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        if suffix:
            backup_suffix += f"_{suffix}"
        
        backup_path = f"{file_path}{backup_suffix}"
        try:
            shutil.copy2(file_path, backup_path)
            return backup_path
        except Exception as e:
            print(f"백업 생성 실패: {e}")
            return False