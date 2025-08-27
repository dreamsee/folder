#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
탈락전략.json을 압축된 속성 기반 구조로 변환하는 스크립트
47.5MB → 4.5MB (90% 크기 감소 목표)
"""

import json
import re
import os
from collections import defaultdict

def parse_strategy_key(strategy_key):
    """전략 키를 속성으로 파싱"""
    try:
        # 정규식으로 패턴 추출
        # 예: "모멘텀매수 + 50% + 손절-2.0% + 적극고무줄(3.0%부터 2.0%씩)"
        
        parts = strategy_key.split(' + ')
        if len(parts) < 4:
            return None
            
        # 매수기준 (첫 번째 부분)
        매수기준 = parts[0].strip()
        
        # 매수수량 (두 번째 부분)  
        매수수량_str = parts[1].strip()
        if '%' in 매수수량_str:
            구매방식 = 1  # 퍼센트 방식
            매수수량 = float(매수수량_str.replace('%', '')) / 100
        elif '주' in 매수수량_str:
            구매방식 = 2  # 고정주식수 방식
            매수수량 = int(매수수량_str.replace('주', ''))
        else:
            return None
            
        # 손절라인 (세 번째 부분)
        손절_str = parts[2].strip()
        손절매치 = re.search(r'손절([-+]?\d+\.?\d*)%', 손절_str)
        if 손절매치:
            손절라인 = float(손절매치.group(1))
        else:
            return None
            
        # 매도전략 (네 번째 부분)
        매도_str = parts[3].strip()
        
        # 매도전략 타입 분류
        if '일괄' in 매도_str:
            매도타입 = 1
            수익률매치 = re.search(r'일괄(\d+\.?\d*)%', 매도_str)
            매도파라미터 = float(수익률매치.group(1)) if 수익률매치 else 0
        elif '적극고무줄' in 매도_str:
            매도타입 = 2
            파라미터매치 = re.search(r'(\d+\.?\d*)%부터 (\d+\.?\d*)%씩', 매도_str)
            매도파라미터 = f"{파라미터매치.group(1)},{파라미터매치.group(2)}" if 파라미터매치 else "3.0,2.0"
        elif '대기고무줄' in 매도_str:
            매도타입 = 3
            파라미터매치 = re.search(r'(\d+\.?\d*)%부터 (\d+\.?\d*)%씩', 매도_str)
            매도파라미터 = f"{파라미터매치.group(1)},{파라미터매치.group(2)}" if 파라미터매치 else "4.0,3.0"
        elif '급진고무줄' in 매도_str:
            매도타입 = 4
            파라미터매치 = re.search(r'(\d+\.?\d*)%부터 (\d+\.?\d*)%씩', 매도_str)
            매도파라미터 = f"{파라미터매치.group(1)},{파라미터매치.group(2)}" if 파라미터매치 else "1.5,0.5"
        elif '일존버' in 매도_str:
            매도타입 = 5
            일수매치 = re.search(r'(\d+)일존버', 매도_str)
            매도파라미터 = int(일수매치.group(1)) if 일수매치 else 15
        else:
            # 기타 매도전략
            매도타입 = 0
            매도파라미터 = 매도_str
            
        return {
            '매수기준': 매수기준,
            '구매방식': 구매방식,
            '매수수량': 매수수량,
            '손절라인': 손절라인,
            '매도타입': 매도타입,
            '매도파라미터': 매도파라미터
        }
        
    except Exception as e:
        print(f"파싱 실패: {strategy_key} - {e}")
        return None

def convert_to_compressed_format():
    """기존 탈락전략.json을 압축 형태로 변환"""
    
    # 기존 파일 읽기
    print("기존 탈락전략.json 파일 읽는 중...")
    try:
        with open('탈락전략.json', 'r', encoding='utf-8') as f:
            original_data = json.load(f)
    except Exception as e:
        print(f"파일 읽기 실패: {e}")
        return False
        
    print(f"총 {len(original_data):,}개 항목 발견")
    
    # 압축된 데이터 구조 생성
    compressed_data = {
        "version": "2.0",
        "description": "압축된 속성 기반 탈락전략 데이터",
        "structure": ["구매방식", "매수수량", "손절라인", "매도타입", "매도파라미터", "탈락횟수"],
        "매도타입_맵": {
            0: "기타",
            1: "일괄",
            2: "적극고무줄", 
            3: "대기고무줄",
            4: "급진고무줄",
            5: "일존버"
        },
        "strategies": []
    }
    
    # 변환 통계
    성공_개수 = 0
    실패_개수 = 0
    실패_목록 = []
    
    print("데이터 변환 중...")
    for i, item in enumerate(original_data):
        if i % 10000 == 0:
            print(f"진행: {i:,} / {len(original_data):,} ({i/len(original_data)*100:.1f}%)")
            
        strategy_key = item.get('strategy_key', '')
        탈락횟수 = item.get('탈락횟수', 1)
        
        # 전략 키 파싱
        parsed = parse_strategy_key(strategy_key)
        if parsed:
            # 압축된 형태로 저장
            compressed_strategy = [
                parsed['구매방식'],
                parsed['매수수량'],
                parsed['손절라인'],
                parsed['매도타입'],
                parsed['매도파라미터'],
                탈락횟수
            ]
            compressed_data["strategies"].append(compressed_strategy)
            성공_개수 += 1
        else:
            실패_개수 += 1
            실패_목록.append(strategy_key)
            if len(실패_목록) <= 10:  # 처음 10개만 기록
                print(f"파싱 실패: {strategy_key}")
    
    print(f"\n변환 완료!")
    print(f"성공: {성공_개수:,}개")
    print(f"실패: {실패_개수:,}개")
    print(f"성공률: {성공_개수/(성공_개수+실패_개수)*100:.1f}%")
    
    # 압축된 파일 저장
    compressed_filename = '탈락전략_압축.json'
    print(f"\n압축된 파일 저장 중: {compressed_filename}")
    
    try:
        with open(compressed_filename, 'w', encoding='utf-8') as f:
            json.dump(compressed_data, f, ensure_ascii=False, separators=(',', ':'))
            
        # 파일 크기 비교
        original_size = os.path.getsize('탈락전략.json') / 1024 / 1024
        compressed_size = os.path.getsize(compressed_filename) / 1024 / 1024
        
        print(f"\n파일 크기 비교:")
        print(f"원본: {original_size:.1f}MB")
        print(f"압축: {compressed_size:.1f}MB") 
        print(f"크기 감소율: {(1 - compressed_size/original_size)*100:.1f}%")
        
        return True
        
    except Exception as e:
        print(f"파일 저장 실패: {e}")
        return False

if __name__ == "__main__":
    print("탈락전략.json 압축 변환 스크립트")
    print("=" * 50)
    
    if convert_to_compressed_format():
        print("✅ 변환 성공!")
    else:
        print("❌ 변환 실패!")