// localStorage 기반 데이터 관리 유틸리티

export interface 원본문서 {
  id: number;
  title: string;
  content: string;
  isBackup?: boolean;
  backupName?: string;
  parentId?: number;
  createdAt: string;
}

export interface 수정된문서 {
  id: number;
  title: string;
  content: string;
  originalId: number;
  regionData?: any;
  createdAt: string;
}

// localStorage 키 상수
const 원본문서키 = 'originalDocuments';
const 수정된문서키 = 'modifiedDocuments';

// 다음 ID 생성
function 다음ID생성(목록: any[]): number {
  return 목록.length > 0 ? Math.max(...목록.map(item => item.id)) + 1 : 1;
}

// 원본 문서 관련 함수들
export function 모든원본문서가져오기(): 원본문서[] {
  const 저장된데이터 = localStorage.getItem(원본문서키);
  return 저장된데이터 ? JSON.parse(저장된데이터) : [];
}

export function 원본문서저장하기(문서목록: 원본문서[]): void {
  localStorage.setItem(원본문서키, JSON.stringify(문서목록));
}

export function 원본문서추가하기(문서: Omit<원본문서, 'id' | 'createdAt'>): 원본문서 {
  const 기존목록 = 모든원본문서가져오기();
  const 새문서: 원본문서 = {
    ...문서,
    id: 다음ID생성(기존목록),
    createdAt: new Date().toISOString()
  };
  
  기존목록.push(새문서);
  원본문서저장하기(기존목록);
  return 새문서;
}

export function 원본문서수정하기(id: number, 업데이트내용: Partial<원본문서>): 원본문서 | null {
  const 기존목록 = 모든원본문서가져오기();
  const 인덱스 = 기존목록.findIndex(doc => doc.id === id);
  
  if (인덱스 === -1) return null;
  
  기존목록[인덱스] = { ...기존목록[인덱스], ...업데이트내용 };
  원본문서저장하기(기존목록);
  return 기존목록[인덱스];
}

export function ID로원본문서찾기(id: number): 원본문서 | null {
  const 기존목록 = 모든원본문서가져오기();
  return 기존목록.find(doc => doc.id === id) || null;
}

// 수정된 문서 관련 함수들
export function 모든수정된문서가져오기(): 수정된문서[] {
  const 저장된데이터 = localStorage.getItem(수정된문서키);
  return 저장된데이터 ? JSON.parse(저장된데이터) : [];
}

export function 수정된문서저장하기(문서목록: 수정된문서[]): void {
  localStorage.setItem(수정된문서키, JSON.stringify(문서목록));
}

export function 수정된문서추가하기(문서: Omit<수정된문서, 'id' | 'createdAt'>): 수정된문서 {
  const 기존목록 = 모든수정된문서가져오기();
  const 새문서: 수정된문서 = {
    ...문서,
    id: 다음ID생성(기존목록),
    createdAt: new Date().toISOString()
  };
  
  기존목록.push(새문서);
  수정된문서저장하기(기존목록);
  return 새문서;
}

export function 원본ID로수정된문서찾기(원본Id: number): 수정된문서[] {
  const 기존목록 = 모든수정된문서가져오기();
  return 기존목록.filter(doc => doc.originalId === 원본Id);
}

export function ID로수정된문서찾기(id: number): 수정된문서 | null {
  const 기존목록 = 모든수정된문서가져오기();
  return 기존목록.find(doc => doc.id === id) || null;
}

export function 수정된문서수정하기(id: number, 업데이트내용: Partial<수정된문서>): 수정된문서 | null {
  const 기존목록 = 모든수정된문서가져오기();
  const 인덱스 = 기존목록.findIndex(doc => doc.id === id);
  
  if (인덱스 === -1) return null;
  
  기존목록[인덱스] = { ...기존목록[인덱스], ...업데이트내용 };
  수정된문서저장하기(기존목록);
  return 기존목록[인덱스];
}


// 모든 데이터 삭제
export function 모든데이터삭제(): void {
  localStorage.removeItem(원본문서키);
  localStorage.removeItem(수정된문서키);
}

// 데이터 존재 여부 확인
export function 데이터존재확인(): boolean {
  const 원본목록 = 모든원본문서가져오기();
  return 원본목록.length > 0;
}