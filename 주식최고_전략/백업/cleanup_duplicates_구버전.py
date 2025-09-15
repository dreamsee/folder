#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
중복 전략 완전 제거 도구
탈락전략_압축.json과 영구제외_전략_히스토리_압축.json에서 중복을 영구 제거
"""

import json
import os
from datetime import datetime

class DuplicateRemover:
    def __init__(self):
        self.base_path = r"C:\Users\ksj\OneDrive\바탕 화면\gemini\제작파일\주식최고_전략"
        
    def remove_dropout_duplicates(self):
        """탈락전략 파일에서 중복 제거"""
        파일경로 = os.path.join(self.base_path, "탈락전략_압축.json")
        
        if not os.path.exists(파일경로):
            print(f"파일을 찾을 수 없습니다: {파일경로}")
            return False
            
        # 원본 파일 읽기
        with open(파일경로, 'r', encoding='utf-8') as f:
            원본데이터 = json.load(f)
            
        원본전략수 = len(원본데이터.get('strategies', []))
        print(f"원본 탈락전략 수: {원본전략수:,}개")
        
        # 중복 제거
        정리된전략들 = []
        중복확인집합 = set()
        중복제거수 = 0
        
        for 전략배열 in 원본데이터.get('strategies', []):
            # 전략 키 생성 (첫 5개 요소로)
            전략키 = (전략배열[0], 전략배열[1], 전략배열[2], 전략배열[3], 전략배열[4])
            
            if 전략키 in 중복확인집합:
                중복제거수 += 1
                continue
                
            중복확인집합.add(전략키)
            정리된전략들.append(전략배열)
            
        # 결과 데이터 구성
        정리된데이터 = 원본데이터.copy()
        정리된데이터['strategies'] = 정리된전략들
        정리된데이터['cleaned_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        정리된데이터['duplicate_removed'] = 중복제거수
        정리된데이터['original_count'] = 원본전략수
        정리된데이터['cleaned_count'] = len(정리된전략들)
        
        # 백업 파일명 생성
        백업파일경로 = 파일경로.replace('.json', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        
        # 백업 생성
        os.rename(파일경로, 백업파일경로)
        print(f"백업 생성: {os.path.basename(백업파일경로)}")
        
        # 정리된 파일 저장
        with open(파일경로, 'w', encoding='utf-8') as f:
            json.dump(정리된데이터, f, ensure_ascii=False, separators=(',', ':'))
            
        print(f"탈락전략 중복 제거 완료: {중복제거수:,}개 제거")
        print(f"최종 전략 수: {len(정리된전략들):,}개")
        
        return True
        
    def remove_permanent_exclusion_duplicates(self):
        """영구제외 전략 파일에서 중복 제거"""
        파일경로 = os.path.join(self.base_path, "영구제외_전략_히스토리_압축.json")
        
        if not os.path.exists(파일경로):
            print(f"파일을 찾을 수 없습니다: {파일경로}")
            return False
            
        # 원본 파일 읽기
        with open(파일경로, 'r', encoding='utf-8') as f:
            원본데이터 = json.load(f)
            
        원본전략수 = len(원본데이터.get('strategies', []))
        print(f"원본 영구제외 전략 수: {원본전략수:,}개")
        
        # 중복 제거
        정리된전략들 = []
        중복확인집합 = set()
        중복제거수 = 0
        
        for 전략배열 in 원본데이터.get('strategies', []):
            # 전략 키 생성 (첫 4개 요소로)
            전략키 = (전략배열[0], 전략배열[1], 전략배열[2], 전략배열[3])
            
            if 전략키 in 중복확인집합:
                중복제거수 += 1
                continue
                
            중복확인집합.add(전략키)
            정리된전략들.append(전략배열)
            
        # 결과 데이터 구성
        정리된데이터 = 원본데이터.copy()
        정리된데이터['strategies'] = 정리된전략들
        정리된데이터['cleaned_date'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        정리된데이터['duplicate_removed'] = 중복제거수
        정리된데이터['original_count'] = 원본전략수
        정리된데이터['cleaned_count'] = len(정리된전략들)
        
        # 백업 파일명 생성
        백업파일경로 = 파일경로.replace('.json', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        
        # 백업 생성
        os.rename(파일경로, 백업파일경로)
        print(f"백업 생성: {os.path.basename(백업파일경로)}")
        
        # 정리된 파일 저장
        with open(파일경로, 'w', encoding='utf-8') as f:
            json.dump(정리된데이터, f, ensure_ascii=False, separators=(',', ':'))
            
        print(f"영구제외 전략 중복 제거 완료: {중복제거수:,}개 제거")
        print(f"최종 전략 수: {len(정리된전략들):,}개")
        
        return True
        
    def get_file_sizes(self):
        """파일 크기 정보 출력"""
        files = [
            "탈락전략_압축.json",
            "영구제외_전략_히스토리_압축.json"
        ]
        
        print("\n=== 파일 크기 정보 ===")
        for 파일명 in files:
            파일경로 = os.path.join(self.base_path, 파일명)
            if os.path.exists(파일경로):
                크기 = os.path.getsize(파일경로) / 1024 / 1024  # MB
                print(f"{파일명}: {크기:.1f}MB")
            else:
                print(f"{파일명}: 파일 없음")

def main():
    remover = DuplicateRemover()
    
    print("=== 중복 전략 완전 제거 시작 ===")
    
    # 1. 탈락전략 중복 제거
    print("\n1. 탈락전략 파일 정리...")
    remover.remove_dropout_duplicates()
    
    # 2. 영구제외 전략 중복 제거  
    print("\n2. 영구제외 전략 파일 정리...")
    remover.remove_permanent_exclusion_duplicates()
    
    # 3. 결과 확인
    print("\n3. 정리 완료 상태 확인...")
    remover.get_file_sizes()
    
    print("\n=== 모든 중복 제거 완료 ===")
    print("백업 파일들이 생성되었으므로 필요시 복원 가능합니다.")

if __name__ == "__main__":
    main()