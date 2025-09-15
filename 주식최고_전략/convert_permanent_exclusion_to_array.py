#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
영구제외 전략 히스토리를 배열 형태로 변환하는 스크립트
탈락전략과 동일한 구조로 변경
"""

import json
import os
from datetime import datetime

def convert_permanent_exclusion_to_array():
    """영구제외 전략 히스토리를 배열 형태로 변환"""
    
    기본경로 = r"C:\Users\ksj\OneDrive\바탕 화면\gemini\제작파일\주식최고_전략"
    원본파일 = os.path.join(기본경로, "영구제외_전략_히스토리.json")
    압축파일 = os.path.join(기본경로, "영구제외_전략_히스토리_압축.json")
    백업폴더 = os.path.join(기본경로, "백업")
    
    if not os.path.exists(원본파일):
        print(f"원본 파일이 없습니다: {원본파일}")
        return
    
    # 기존 파일 백업
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    백업파일 = os.path.join(백업폴더, f"영구제외_전략_히스토리_backup_{timestamp}.json")
    
    try:
        # 백업 생성
        with open(원본파일, 'r', encoding='utf-8') as f:
            원본데이터 = json.load(f)
        
        with open(백업파일, 'w', encoding='utf-8') as f:
            json.dump(원본데이터, f, ensure_ascii=False, indent=2)
        print(f"백업 완료: {백업파일}")
        
    except Exception as e:
        print(f"백업 실패: {e}")
        return
    
    # 변환 작업
    try:
        print("영구제외 전략 히스토리 배열 변환 시작...")
        
        # 새로운 압축 형태 데이터 구조
        압축데이터 = {
            "version": "2.0",
            "description": "영구제외 전략 히스토리 - 배열 형태",
            "structure": [
                "전략설명",
                "탈락시장목록", 
                "완전제외여부",
                "최초등록일"
            ],
            "시장매핑": {
                "상승장": 1,
                "하락장": 2, 
                "횡보장": 3
            },
            "strategies": []
        }
        
        시장매핑 = {"상승장": 1, "하락장": 2, "횡보장": 3}
        
        # 각 전략을 배열 형태로 변환
        변환된전략수 = 0
        for 전략설명, 전략정보 in 원본데이터.items():
            try:
                # 탈락시장을 숫자로 변환
                탈락시장숫자들 = []
                for 시장명 in 전략정보.get('탈락시장', []):
                    if 시장명 in 시장매핑:
                        탈락시장숫자들.append(시장매핑[시장명])
                
                # 배열 형태로 변환
                전략배열 = [
                    전략설명,                                    # 전략설명
                    탈락시장숫자들,                                # 탈락시장목록 (숫자배열)
                    전략정보.get('완전제외', False),              # 완전제외여부 
                    timestamp                                   # 최초등록일
                ]
                
                압축데이터["strategies"].append(전략배열)
                변환된전략수 += 1
                
            except Exception as e:
                print(f"전략 변환 실패 [{전략설명}]: {e}")
                continue
        
        # 압축 파일 저장
        with open(압축파일, 'w', encoding='utf-8') as f:
            json.dump(압축데이터, f, ensure_ascii=False, separators=(',', ':'))
        
        print("영구제외 전략 배열 변환 완료!")
        print(f"   원본: {len(원본데이터)}개 전략")
        print(f"   변환: {변환된전략수}개 전략")
        print(f"   저장: {압축파일}")
        
        # 파일 크기 비교
        원본크기 = os.path.getsize(원본파일) / 1024
        압축크기 = os.path.getsize(압축파일) / 1024
        절약률 = (1 - 압축크기/원본크기) * 100 if 원본크기 > 0 else 0
        
        print(f"   용량: {원본크기:.1f}KB → {압축크기:.1f}KB ({절약률:.1f}% 절약)")
        
    except Exception as e:
        print(f"변환 실패: {e}")
        return

if __name__ == "__main__":
    convert_permanent_exclusion_to_array()