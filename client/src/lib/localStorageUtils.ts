// IndexedDB 기반 데이터 관리 유틸리티
import { openDB, DBSchema, IDBPDatabase } from 'idb';

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

// IndexedDB 스키마 정의
interface NoteCompareDB extends DBSchema {
  originalDocuments: {
    key: number;
    value: 원본문서;
    indexes: { 'by-title': string };
  };
  modifiedDocuments: {
    key: number;
    value: 수정된문서;
    indexes: { 'by-originalId': number };
  };
  multiFileCards: {
    key: number;
    value: any;
  };
  multiFileCardCategories: {
    key: number;
    value: any;
  };
  multiFileLoadedFiles: {
    key: number;
    value: any;
  };
}

const DB_NAME = 'noteCompareDB';
const DB_VERSION = 1;

// DB 인스턴스 캐시
let dbInstance: IDBPDatabase<NoteCompareDB> | null = null;

// DB 연결 함수
async function getDB(): Promise<IDBPDatabase<NoteCompareDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<NoteCompareDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 원본 문서 스토어
      if (!db.objectStoreNames.contains('originalDocuments')) {
        const originalStore = db.createObjectStore('originalDocuments', { keyPath: 'id' });
        originalStore.createIndex('by-title', 'title');
      }

      // 수정된 문서 스토어
      if (!db.objectStoreNames.contains('modifiedDocuments')) {
        const modifiedStore = db.createObjectStore('modifiedDocuments', { keyPath: 'id' });
        modifiedStore.createIndex('by-originalId', 'originalId');
      }

      // MultiFileCard 관련 스토어
      if (!db.objectStoreNames.contains('multiFileCards')) {
        db.createObjectStore('multiFileCards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('multiFileCardCategories')) {
        db.createObjectStore('multiFileCardCategories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('multiFileLoadedFiles')) {
        db.createObjectStore('multiFileLoadedFiles', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// 다음 ID 생성
async function 다음ID생성(storeName: 'originalDocuments' | 'modifiedDocuments'): Promise<number> {
  const db = await getDB();
  const allItems = await db.getAll(storeName);
  return allItems.length > 0 ? Math.max(...allItems.map(item => item.id)) + 1 : 1;
}

// ========== 원본 문서 관련 함수들 ==========

export async function 모든원본문서가져오기(): Promise<원본문서[]> {
  const db = await getDB();
  return await db.getAll('originalDocuments');
}

export async function 원본문서저장하기(문서목록: 원본문서[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('originalDocuments', 'readwrite');
  await tx.store.clear();
  for (const doc of 문서목록) {
    await tx.store.put(doc);
  }
  await tx.done;
}

export async function 원본문서추가하기(문서: Omit<원본문서, 'id' | 'createdAt'>): Promise<원본문서> {
  const db = await getDB();
  const newId = await 다음ID생성('originalDocuments');
  const 새문서: 원본문서 = {
    ...문서,
    id: newId,
    createdAt: new Date().toISOString()
  };

  await db.put('originalDocuments', 새문서);
  return 새문서;
}

export async function 원본문서수정하기(id: number, 업데이트내용: Partial<원본문서>): Promise<원본문서 | null> {
  const db = await getDB();
  const 기존문서 = await db.get('originalDocuments', id);

  if (!기존문서) return null;

  const 수정된문서 = { ...기존문서, ...업데이트내용 };
  await db.put('originalDocuments', 수정된문서);
  return 수정된문서;
}

export async function ID로원본문서찾기(id: number): Promise<원본문서 | null> {
  const db = await getDB();
  const doc = await db.get('originalDocuments', id);
  return doc || null;
}

export async function 원본문서삭제하기(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('originalDocuments', id);
}

// ========== 수정된 문서 관련 함수들 ==========

export async function 모든수정된문서가져오기(): Promise<수정된문서[]> {
  const db = await getDB();
  return await db.getAll('modifiedDocuments');
}

export async function 수정된문서저장하기(문서목록: 수정된문서[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('modifiedDocuments', 'readwrite');
  await tx.store.clear();
  for (const doc of 문서목록) {
    await tx.store.put(doc);
  }
  await tx.done;
}

export async function 수정된문서추가하기(문서: Omit<수정된문서, 'id' | 'createdAt'>): Promise<수정된문서> {
  const db = await getDB();
  const newId = await 다음ID생성('modifiedDocuments');
  const 새문서: 수정된문서 = {
    ...문서,
    id: newId,
    createdAt: new Date().toISOString()
  };

  await db.put('modifiedDocuments', 새문서);
  return 새문서;
}

export async function 원본ID로수정된문서찾기(원본Id: number): Promise<수정된문서[]> {
  const db = await getDB();
  return await db.getAllFromIndex('modifiedDocuments', 'by-originalId', 원본Id);
}

export async function ID로수정된문서찾기(id: number): Promise<수정된문서 | null> {
  const db = await getDB();
  const doc = await db.get('modifiedDocuments', id);
  return doc || null;
}

export async function 수정된문서수정하기(id: number, 업데이트내용: Partial<수정된문서>): Promise<수정된문서 | null> {
  const db = await getDB();
  const 기존문서 = await db.get('modifiedDocuments', id);

  if (!기존문서) return null;

  const 수정된문서결과 = { ...기존문서, ...업데이트내용 };
  await db.put('modifiedDocuments', 수정된문서결과);
  return 수정된문서결과;
}

export async function 수정된문서삭제하기(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('modifiedDocuments', id);
}

// ========== 전체 데이터 관리 ==========

export async function 모든데이터삭제(): Promise<void> {
  const db = await getDB();
  await db.clear('originalDocuments');
  await db.clear('modifiedDocuments');
  await db.clear('multiFileCards');
  await db.clear('multiFileCardCategories');
  await db.clear('multiFileLoadedFiles');
}

export async function 데이터존재확인(): Promise<boolean> {
  const 원본목록 = await 모든원본문서가져오기();
  return 원본목록.length > 0;
}

// ========== MultiFileCard 관련 함수들 ==========

export async function 모든MultiFileCard가져오기(): Promise<any[]> {
  const db = await getDB();
  return await db.getAll('multiFileCards');
}

export async function MultiFileCard저장하기(cards: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('multiFileCards', 'readwrite');
  await tx.store.clear();
  for (const card of cards) {
    await tx.store.put(card);
  }
  await tx.done;
}

export async function 모든MultiFileCardCategories가져오기(): Promise<any[]> {
  const db = await getDB();
  return await db.getAll('multiFileCardCategories');
}

export async function MultiFileCardCategories저장하기(categories: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('multiFileCardCategories', 'readwrite');
  await tx.store.clear();
  for (const cat of categories) {
    await tx.store.put(cat);
  }
  await tx.done;
}

export async function 모든MultiFileLoadedFiles가져오기(): Promise<any[]> {
  const db = await getDB();
  return await db.getAll('multiFileLoadedFiles');
}

export async function MultiFileLoadedFiles저장하기(files: any[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('multiFileLoadedFiles', 'readwrite');
  await tx.store.clear();
  for (const file of files) {
    await tx.store.put(file);
  }
  await tx.done;
}

// ========== 저장소 용량 정보 ==========

export interface StorageInfo {
  used: number;
  max: number;
  comfortable: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger';
  usedFormatted: string;
  maxFormatted: string;
  comfortableFormatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// IndexedDB 용량 정보 가져오기 (비동기)
export async function getStorageInfoAsync(): Promise<StorageInfo> {
  // IndexedDB는 용량 제한이 디스크 용량의 50%까지 가능
  // 여기서는 실제 사용량만 계산하고, 최대값은 표시용으로 설정
  const MAX_STORAGE = 500 * 1024 * 1024;        // 500MB (표시용)
  const COMFORTABLE_STORAGE = 100 * 1024 * 1024; // 100MB (쾌적 기준)

  try {
    // Storage Manager API 사용 (지원되는 경우)
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || MAX_STORAGE;

      const percentage = (used / quota) * 100;
      let status: 'good' | 'warning' | 'danger';
      if (percentage < 50) {
        status = 'good';
      } else if (percentage < 80) {
        status = 'warning';
      } else {
        status = 'danger';
      }

      return {
        used,
        max: quota,
        comfortable: COMFORTABLE_STORAGE,
        percentage,
        status,
        usedFormatted: formatBytes(used),
        maxFormatted: formatBytes(quota),
        comfortableFormatted: formatBytes(COMFORTABLE_STORAGE)
      };
    }
  } catch (e) {
    console.warn('Storage estimate failed:', e);
  }

  // 폴백: 데이터 크기 직접 계산
  const db = await getDB();
  const original = await db.getAll('originalDocuments');
  const modified = await db.getAll('modifiedDocuments');
  const multiCards = await db.getAll('multiFileCards');

  const totalSize = JSON.stringify([...original, ...modified, ...multiCards]).length * 2;
  const percentage = (totalSize / MAX_STORAGE) * 100;

  let status: 'good' | 'warning' | 'danger';
  if (percentage < 50) {
    status = 'good';
  } else if (percentage < 80) {
    status = 'warning';
  } else {
    status = 'danger';
  }

  return {
    used: totalSize,
    max: MAX_STORAGE,
    comfortable: COMFORTABLE_STORAGE,
    percentage,
    status,
    usedFormatted: formatBytes(totalSize),
    maxFormatted: formatBytes(MAX_STORAGE),
    comfortableFormatted: formatBytes(COMFORTABLE_STORAGE)
  };
}

// 동기 버전 (호환성을 위해 캐시된 값 반환)
let cachedStorageInfo: StorageInfo | null = null;

export function getStorageInfo(): StorageInfo {
  // 캐시된 값이 있으면 반환
  if (cachedStorageInfo) return cachedStorageInfo;

  // 없으면 기본값 반환하고 백그라운드에서 업데이트
  const defaultInfo: StorageInfo = {
    used: 0,
    max: 500 * 1024 * 1024,
    comfortable: 100 * 1024 * 1024,
    percentage: 0,
    status: 'good',
    usedFormatted: '계산 중...',
    maxFormatted: '500 MB',
    comfortableFormatted: '100 MB'
  };

  // 비동기로 실제 값 업데이트
  getStorageInfoAsync().then(info => {
    cachedStorageInfo = info;
  });

  return defaultInfo;
}

// 주기적으로 캐시 업데이트
setInterval(() => {
  getStorageInfoAsync().then(info => {
    cachedStorageInfo = info;
  });
}, 5000);

// ========== localStorage에서 마이그레이션 ==========

export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    const originalDocs = localStorage.getItem('originalDocuments');
    const modifiedDocs = localStorage.getItem('modifiedDocuments');
    const multiFileCards = localStorage.getItem('multiFileCards');
    const multiFileCategories = localStorage.getItem('multiFileCardCategories');
    const multiFileLoadedFiles = localStorage.getItem('multiFileLoadedFiles');

    let migrated = false;

    if (originalDocs) {
      const docs = JSON.parse(originalDocs);
      if (docs.length > 0) {
        await 원본문서저장하기(docs);
        migrated = true;
      }
    }

    if (modifiedDocs) {
      const docs = JSON.parse(modifiedDocs);
      if (docs.length > 0) {
        await 수정된문서저장하기(docs);
        migrated = true;
      }
    }

    if (multiFileCards) {
      const cards = JSON.parse(multiFileCards);
      if (cards.length > 0) {
        await MultiFileCard저장하기(cards);
        migrated = true;
      }
    }

    if (multiFileCategories) {
      const categories = JSON.parse(multiFileCategories);
      if (categories.length > 0) {
        await MultiFileCardCategories저장하기(categories);
        migrated = true;
      }
    }

    if (multiFileLoadedFiles) {
      const files = JSON.parse(multiFileLoadedFiles);
      if (files.length > 0) {
        await MultiFileLoadedFiles저장하기(files);
        migrated = true;
      }
    }

    if (migrated) {
      // 마이그레이션 완료 후 localStorage 정리 (선택적)
      console.log('IndexedDB 마이그레이션 완료');
      // localStorage.removeItem('originalDocuments');
      // localStorage.removeItem('modifiedDocuments');
      // 안전을 위해 localStorage는 유지 (사용자가 수동으로 삭제 가능)
    }

    return migrated;
  } catch (e) {
    console.error('마이그레이션 실패:', e);
    return false;
  }
}

// 앱 시작 시 자동 마이그레이션 확인
(async () => {
  const db = await getDB();
  const originalCount = await db.count('originalDocuments');

  // IndexedDB가 비어있고 localStorage에 데이터가 있으면 마이그레이션
  if (originalCount === 0 && localStorage.getItem('originalDocuments')) {
    console.log('localStorage에서 IndexedDB로 마이그레이션 시작...');
    await migrateFromLocalStorage();
  }
})();
