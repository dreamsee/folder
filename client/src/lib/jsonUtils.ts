// JSON 파일 가져오기/내보내기 유틸리티 (IndexedDB 호환)
import {
  모든원본문서가져오기,
  모든수정된문서가져오기,
  원본문서저장하기,
  수정된문서저장하기,
  모든MultiFileCard가져오기,
  모든MultiFileCardCategories가져오기,
  모든MultiFileLoadedFiles가져오기,
  MultiFileCard저장하기,
  MultiFileCardCategories저장하기,
  MultiFileLoadedFiles저장하기
} from './localStorageUtils';

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
  // MultiFileCard 시스템 데이터 추가
  multiFileCards?: any[];
  multiFileCardCategories?: any[];
  multiFileLoadedFiles?: any[];
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
          const 데이터 = JSON.parse(내용);

          // 기본 유효성 검사 - 두 형식 중 하나라도 있으면 허용
          const has노트비교 = 데이터.원본문서목록 || 데이터.수정된문서목록;
          const hasMultiFileCard = 데이터.multiFileCards || Array.isArray(데이터);

          if (!has노트비교 && !hasMultiFileCard) {
            throw new Error('올바른 데이터 형식이 아닙니다');
          }

          // MultiFileCard 배열 형식인 경우 변환
          if (Array.isArray(데이터)) {
            const 변환된데이터: 노트데이터 = {
              원본문서목록: [],
              수정된문서목록: [],
              multiFileCards: 데이터
            };
            resolve(변환된데이터);
          } else {
            // 누락된 필드는 빈 배열로 초기화
            const 정규화된데이터: 노트데이터 = {
              원본문서목록: 데이터.원본문서목록 || [],
              수정된문서목록: 데이터.수정된문서목록 || [],
              multiFileCards: 데이터.multiFileCards,
              multiFileCardCategories: 데이터.multiFileCardCategories,
              multiFileLoadedFiles: 데이터.multiFileLoadedFiles
            };
            resolve(정규화된데이터);
          }
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

// 현재 IndexedDB 데이터를 JSON 형식으로 변환 (비동기)
export async function 현재데이터를JSON형식으로변환(): Promise<노트데이터> {
  const 원본문서목록Raw = await 모든원본문서가져오기();
  const 수정된문서목록Raw = await 모든수정된문서가져오기();
  const multiFileCards = await 모든MultiFileCard가져오기();
  const multiFileCardCategories = await 모든MultiFileCardCategories가져오기();
  const multiFileLoadedFiles = await 모든MultiFileLoadedFiles가져오기();

  // 디버그: groupId가 있는 카드 확인
  const groupedCards = multiFileCards.filter((c: any) => c.groupId);
  console.log('[내보내기] IndexedDB에서 가져온 카드 중 groupId가 있는 카드 수:', groupedCards.length);
  if (groupedCards.length > 0) {
    console.log('[내보내기] groupId가 있는 카드:', groupedCards.map((c: any) => ({
      id: c.id,
      name: c.name,
      groupId: c.groupId,
      groupName: c.groupName
    })));
  }

  // 내보내기용 형식으로 변환
  const 원본문서목록 = 원본문서목록Raw.map(doc => ({
    id: doc.id,
    제목: doc.title,
    내용: doc.content,
    생성일시: doc.createdAt
  }));

  const 수정된문서목록 = 수정된문서목록Raw.map(doc => ({
    id: doc.id,
    제목: doc.title,
    내용: doc.content,
    원본Id: doc.originalId,
    영역데이터: doc.regionData,
    생성일시: doc.createdAt
  }));

  return {
    원본문서목록,
    수정된문서목록,
    multiFileCards: multiFileCards.length > 0 ? multiFileCards : undefined,
    multiFileCardCategories: multiFileCardCategories.length > 0 ? multiFileCardCategories : undefined,
    multiFileLoadedFiles: multiFileLoadedFiles.length > 0 ? multiFileLoadedFiles : undefined,
  };
}

// JSON 데이터를 IndexedDB에 저장 (비동기)
export async function JSON데이터를로컬스토리지에저장(데이터: 노트데이터): Promise<void> {
  // 2개 문서 비교 시스템 데이터 저장
  if (데이터.원본문서목록 && 데이터.원본문서목록.length > 0) {
    // JSON 형식에서 내부 형식으로 변환
    const 원본문서들 = 데이터.원본문서목록.map(doc => ({
      id: doc.id,
      title: doc.제목,
      content: doc.내용,
      createdAt: doc.생성일시
    }));
    await 원본문서저장하기(원본문서들);
  }

  if (데이터.수정된문서목록 && 데이터.수정된문서목록.length > 0) {
    const 수정된문서들 = 데이터.수정된문서목록.map(doc => ({
      id: doc.id,
      title: doc.제목,
      content: doc.내용,
      originalId: doc.원본Id,
      regionData: doc.영역데이터,
      createdAt: doc.생성일시
    }));
    await 수정된문서저장하기(수정된문서들);
  }

  // MultiFileCard 시스템 데이터 저장
  if (데이터.multiFileCards && 데이터.multiFileCards.length > 0) {
    await MultiFileCard저장하기(데이터.multiFileCards);
  }
  if (데이터.multiFileCardCategories && 데이터.multiFileCardCategories.length > 0) {
    await MultiFileCardCategories저장하기(데이터.multiFileCardCategories);
  }
  if (데이터.multiFileLoadedFiles && 데이터.multiFileLoadedFiles.length > 0) {
    await MultiFileLoadedFiles저장하기(데이터.multiFileLoadedFiles);
  }
}
