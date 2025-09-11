// JSON 파일 가져오기/내보내기 유틸리티

export interface 노트데이터 {
  원본문서목록: {
    id: number;
    제목: string;
    내용: string;
    생성일시: string;
  }[];
  수정된문서목록: {
    id: number;
    제목: string;
    내용: string;
    원본Id: number;
    영역데이터?: any;
    생성일시: string;
  }[];
}

// JSON 파일로 내보내기
export function JSON파일로내보내기(데이터: 노트데이터, 파일명: string = "노트비교_데이터") {
  const json문자열 = JSON.stringify(데이터, null, 2);
  const blob = new Blob([json문자열], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${파일명}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// JSON 파일에서 가져오기
export function JSON파일에서가져오기(): Promise<노트데이터> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('파일이 선택되지 않았습니다'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const 내용 = e.target?.result as string;
          const 데이터 = JSON.parse(내용) as 노트데이터;
          
          // 기본 유효성 검사
          if (!데이터.원본문서목록 || !데이터.수정된문서목록) {
            throw new Error('올바른 노트 데이터 형식이 아닙니다');
          }
          
          resolve(데이터);
        } catch (error) {
          reject(new Error('JSON 파일 파싱 오류: ' + error));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('파일 읽기 오류'));
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  });
}

// 현재 로컬스토리지 데이터를 JSON 형식으로 변환
export function 현재데이터를JSON형식으로변환(): 노트데이터 {
  const 원본문서목록 = JSON.parse(localStorage.getItem('originalDocuments') || '[]');
  const 수정된문서목록 = JSON.parse(localStorage.getItem('modifiedDocuments') || '[]');
  
  return {
    원본문서목록,
    수정된문서목록
  };
}

// JSON 데이터를 로컬스토리지에 저장
export function JSON데이터를로컬스토리지에저장(데이터: 노트데이터) {
  localStorage.setItem('originalDocuments', JSON.stringify(데이터.원본문서목록));
  localStorage.setItem('modifiedDocuments', JSON.stringify(데이터.수정된문서목록));
}

