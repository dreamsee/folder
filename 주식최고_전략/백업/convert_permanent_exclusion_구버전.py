#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
영구제외_전략_히스토리.json을 압축된 속성 기반 구조로 변환
2.7MB → 0.3MB 목표 (90% 크기 감소)
"""

import json
import re
import os

def parse_strategy_key_to_attributes(strategy_key):
    """전략 키를 속성으로 파싱"""
    try:
        # 예: "연속상승 + 10주 + 손절-7.0% + 일괄4.5%"
        parts = strategy_key.split(' + ')
        if len(parts) < 4:
            return None
            
        # 매수기준 (첫 번째 부분) - 무시 (매수기준은 영구제외에서 중요하지 않음)
        
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
        
        # 수익라인 추출
        if '일괄' in 매도_str:
            수익률매치 = re.search(r'일괄(\d+\.?\d*)%', 매도_str)
            수익라인 = float(수익률매치.group(1)) if 수익률매치 else 0
        elif '고무줄' in 매도_str:
            # 고무줄 전략의 시작 수익률 추출
            파라미터매치 = re.search(r'(\d+\.?\d*)%부터', 매도_str)
            수익라인 = float(파라미터매치.group(1)) if 파라미터매치 else 0
        elif '일존버' in 매도_str:
            수익라인 = 0  # 존버는 수익라인 없음
        else:
            수익라인 = 0
            
        return {
            '구매방식': 구매방식,
            '매수수량': 매수수량,
            '손절라인': 손절라인,
            '수익라인': 수익라인
        }
        
    except Exception as e:
        print(f"속성 파싱 실패: {strategy_key} - {e}")
        return None

def convert_market_list_to_numbers(market_list):
    """시장 리스트를 숫자로 변환"""
    market_map = {'상승장': 1, '하락장': 2, '횡보장': 3}
    return [market_map.get(market, 0) for market in market_list if market in market_map]

def convert_permanent_exclusion():
    """기존 영구제외_전략_히스토리.json을 압축 형태로 변환"""
    
    원본파일 = '영구제외_전략_히스토리.json'
    if not os.path.exists(원본파일):
        print(f"원본 파일 없음: {원본파일}")
        return False
    
    print(f"기존 {원본파일} 파일 읽는 중...")
    try:
        with open(원본파일, 'r', encoding='utf-8') as f:
            원본데이터 = json.load(f)
    except Exception as e:
        print(f"파일 읽기 실패: {e}")
        return False
        
    if not isinstance(원본데이터, dict):
        print("원본 데이터가 딕셔너리 형태가 아닙니다.")
        return False
        
    print(f"총 {len(원본데이터):,}개 전략 발견")
    
    # 압축된 데이터 구조 생성
    압축데이터 = {
        "version": "2.0",
        "description": "압축된 속성 기반 영구제외 전략 데이터", 
        "structure": ["구매방식", "매수수량", "손절라인", "수익라인", "탈락시장배열", "완전제외여부"],
        "시장번호매핑": {
            1: "상승장",
            2: "하락장", 
            3: "횡보장"
        },
        "strategies": []
    }
    
    # 변환 통계
    성공개수 = 0
    실패개수 = 0
    
    print("데이터 변환 중...")
    for i, (전략키, 전략정보) in enumerate(원본데이터.items()):
        if i % 1000 == 0:
            print(f"진행: {i:,} / {len(원본데이터):,} ({i/len(원본데이터)*100:.1f}%)")
            
        # 전략 키를 속성으로 파싱
        속성 = parse_strategy_key_to_attributes(전략키)
        if not 속성:
            실패개수 += 1
            continue
            
        # 탈락시장 처리
        탈락시장들 = 전략정보.get('탈락시장', [])
        시장번호들 = convert_market_list_to_numbers(탈락시장들)
        
        # 완전제외 여부
        완전제외 = 전략정보.get('완전제외', False)
        
        # 압축된 형태로 저장: [구매방식, 매수수량, 손절라인, 수익라인, 시장배열, 완전제외]
        압축전략 = [
            속성['구매방식'],
            속성['매수수량'],
            속성['손절라인'],
            속성['수익라인'],
            시장번호들,
            완전제외
        ]
        
        압축데이터["strategies"].append(압축전략)
        성공개수 += 1
    
    print(f"\n변환 완료!")
    print(f"성공: {성공개수:,}개")
    print(f"실패: {실패개수:,}개")
    print(f"성공률: {성공개수/(성공개수+실패개수)*100:.1f}%")
    
    # 압축된 파일 저장
    압축파일명 = '영구제외_전략_히스토리_압축.json'
    print(f"\n압축된 파일 저장 중: {압축파일명}")
    
    try:
        with open(압축파일명, 'w', encoding='utf-8') as f:
            json.dump(압축데이터, f, ensure_ascii=False, separators=(',', ':'))
            
        # 파일 크기 비교
        원본크기 = os.path.getsize(원본파일) / 1024 / 1024
        압축크기 = os.path.getsize(압축파일명) / 1024 / 1024
        
        print(f"\n파일 크기 비교:")
        print(f"원본: {원본크기:.1f}MB")
        print(f"압축: {압축크기:.1f}MB")
        print(f"크기 감소율: {(1 - 압축크기/원본크기)*100:.1f}%")
        
        return True
        
    except Exception as e:
        print(f"파일 저장 실패: {e}")
        return False

if __name__ == "__main__":
    print("영구제외_전략_히스토리.json 압축 변환 스크립트")
    print("=" * 60)
    
    if convert_permanent_exclusion():
        print("변환 성공!")
    else:
        print("변환 실패!")