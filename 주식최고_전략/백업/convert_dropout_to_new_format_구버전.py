#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
탈락전략 압축 파일을 새로운 형태로 변환
매수전략타입과 매수하락률을 포함한 새로운 키 형태로 변환
"""

import json
import os
from datetime import datetime

def convert_old_key_to_new(old_key, strategy_data=None):
    """구버전 키를 신버전 키로 변환"""
    # 구버전 키 형태: "구매방식_매수수량_손절라인_매도타입_매도파라미터"
    # 신버전 키 형태: "매수전략타입_매수하락률_구매방식_매수수량_손절라인_매도타입_매도파라미터"
    
    # 기본값 설정 (실제 데이터가 없을 때)
    매수전략타입 = "Unknown"
    매수하락률 = 0.0
    
    # strategy_data에서 정보 추출 시도
    if strategy_data:
        매수전략타입 = strategy_data.get('매수기준', 'Unknown')
        매수하락률 = strategy_data.get('매수하락률', 0.0)
    
    # 구버전 키가 이미 신버전 형태인지 확인
    parts = old_key.split('_')
    if len(parts) >= 7:  # 이미 신버전
        return old_key
    
    # 구버전 키를 신버전으로 변환
    if len(parts) >= 5:
        구매방식 = parts[0]
        매수수량 = parts[1]
        손절라인 = parts[2]
        매도타입 = parts[3]
        매도파라미터 = '_'.join(parts[4:]) if len(parts) > 4 else "0"
        
        # 새로운 키 생성
        new_key = f"{매수전략타입}_{매수하락률:.1f}_{구매방식}_{매수수량}_{손절라인}_{매도타입}_{매도파라미터}"
        return new_key
    
    return old_key  # 변환 실패시 원본 반환

def convert_dropout_file():
    """탈락전략_압축.json 파일을 새로운 형태로 변환"""
    
    file_path = "탈락전략_압축.json"
    
    if not os.path.exists(file_path):
        print(f"파일을 찾을 수 없습니다: {file_path}")
        return False
    
    # 기존 파일 백업
    backup_path = f"탈락전략_압축_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    print("탈락전략 파일 변환 시작...")
    
    # 파일 읽기
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 백업 생성
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"백업 생성: {backup_path}")
    
    # 새로운 구조 생성
    new_data = {
        "version": "3.0",
        "description": "매수전략타입 포함 새로운 형태의 탈락전략 데이터",
        "structure": ["매수전략타입", "매수하락률", "구매방식", "매수수량", "손절라인", "매도타입", "매도파라미터", "탈락횟수"],
        "매도타입_맵": data.get("매도타입_맵", {
            0: "기타", 1: "일괄", 2: "적극고무줄", 
            3: "대기고무줄", 4: "급진고무줄", 5: "일존버"
        }),
        "strategies": []
    }
    
    # 전략 변환
    converted_count = 0
    failed_count = 0
    
    for strategy_array in data.get('strategies', []):
        try:
            if len(strategy_array) >= 6:
                # 구버전: [구매방식, 매수수량, 손절라인, 매도타입, 매도파라미터, 탈락횟수]
                구매방식 = strategy_array[0]
                매수수량 = strategy_array[1]
                손절라인 = strategy_array[2]
                매도타입 = strategy_array[3]
                매도파라미터 = strategy_array[4]
                탈락횟수 = strategy_array[5]
                
                # 매수전략타입 추론 (간단한 로직)
                if 매수수량 <= 0.3:  # 30% 이하
                    매수전략타입 = "시가하락"
                    매수하락률 = 2.0
                elif 매수수량 <= 0.5:  # 50% 이하
                    매수전략타입 = "전일하락"
                    매수하락률 = 3.0
                elif 매수수량 <= 0.7:  # 70% 이하
                    매수전략타입 = "20일선하락"
                    매수하락률 = 4.0
                else:
                    매수전략타입 = "모멘텀매수"
                    매수하락률 = 0.0
                
                # 신버전: [매수전략타입, 매수하락률, 구매방식, 매수수량, 손절라인, 매도타입, 매도파라미터, 탈락횟수]
                new_strategy = [
                    매수전략타입,
                    매수하락률,
                    구매방식,
                    매수수량,
                    손절라인,
                    매도타입,
                    매도파라미터,
                    탈락횟수
                ]
                
                new_data["strategies"].append(new_strategy)
                converted_count += 1
                
            else:
                failed_count += 1
                
        except Exception as e:
            print(f"변환 실패: {e}")
            failed_count += 1
    
    # 새로운 파일 저장
    new_file_path = "탈락전략_압축_신버전.json"
    with open(new_file_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, separators=(',', ':'))
    
    print(f"\n변환 완료!")
    print(f"  성공: {converted_count:,}개")
    print(f"  실패: {failed_count}개")
    print(f"  새 파일: {new_file_path}")
    
    # 파일 크기 비교
    old_size = os.path.getsize(file_path) / 1024 / 1024
    new_size = os.path.getsize(new_file_path) / 1024 / 1024
    print(f"\n파일 크기:")
    print(f"  원본: {old_size:.1f}MB")
    print(f"  신버전: {new_size:.1f}MB")
    
    return True

def create_key_mapping():
    """구버전 키와 신버전 키 매핑 테이블 생성"""
    
    print("\n키 매핑 테이블 생성 중...")
    
    # 매핑 테이블
    mapping = {}
    
    # 전략 타입별 매핑 규칙
    strategy_patterns = [
        ("시가매수", 0.0),
        ("시가하락", [1.0, 2.0, 3.0, 4.0, 5.0]),
        ("전일하락", [1.0, 2.0, 3.0, 4.0, 5.0]),
        ("20일선하락", [2.0, 3.0, 4.0, 5.0, 6.0]),
        ("모멘텀매수", 0.0)
    ]
    
    # 구매방식별 매핑
    for 구매방식 in [1, 2]:
        # 매수수량별
        if 구매방식 == 1:  # 퍼센트
            매수수량_리스트 = [0.1, 0.2, 0.3, 0.5, 0.7, 1.0]
        else:  # 고정주식
            매수수량_리스트 = [100, 500, 1000, 2000]
        
        for 매수수량 in 매수수량_리스트:
            # 손절라인별
            for 손절라인 in [-2.0, -3.0, -5.0, -7.0, -10.0]:
                # 매도타입별
                for 매도타입 in [1, 2, 3, 4, 5]:
                    # 구버전 키
                    old_key = f"{구매방식}_{매수수량}_{손절라인}_{매도타입}_5.0"
                    
                    # 매수전략 추론 (매수수량 기반)
                    if 구매방식 == 1:
                        if 매수수량 <= 0.3:
                            전략타입 = "시가하락"
                            하락률 = 2.0
                        elif 매수수량 <= 0.5:
                            전략타입 = "전일하락"
                            하락률 = 3.0
                        else:
                            전략타입 = "모멘텀매수"
                            하락률 = 0.0
                    else:
                        전략타입 = "시가매수"
                        하락률 = 0.0
                    
                    # 신버전 키
                    new_key = f"{전략타입}_{하락률:.1f}_{구매방식}_{매수수량}_{손절라인}_{매도타입}_5.0"
                    
                    mapping[old_key] = new_key
    
    # 매핑 저장
    mapping_file = "탈락전략_키매핑.json"
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    
    print(f"키 매핑 테이블 생성 완료: {len(mapping)}개")
    print(f"파일 저장: {mapping_file}")
    
    return mapping

if __name__ == "__main__":
    print("=== 탈락전략 파일 신버전 변환 ===")
    
    # 1. 탈락전략 파일 변환
    if convert_dropout_file():
        print("\n✅ 변환 성공!")
        
        # 2. 키 매핑 테이블 생성
        create_key_mapping()
        
        print("\n다음 단계:")
        print("1. 탈락전략_압축_신버전.json 파일을 확인하세요.")
        print("2. 확인 후 원본 파일을 교체하려면:")
        print("   - 탈락전략_압축.json을 삭제")
        print("   - 탈락전략_압축_신버전.json을 탈락전략_압축.json으로 이름 변경")
    else:
        print("\n❌ 변환 실패!")