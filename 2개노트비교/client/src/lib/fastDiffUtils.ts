// Worker 인스턴스 관리
let diffWorker: Worker | null = null;

interface DiffResult {
  html: string;
  stats?: {
    originalLines: number;
    modifiedLines: number;
    chunks: number;
  };
}

interface DiffOptions {
  onProgress?: (progress: number, message?: string) => void;
  onPartialResult?: (html: string, chunkIndex: number) => void;
}

// Worker 초기화
function initWorker(): Worker {
  if (!diffWorker) {
    // Vite의 Worker 로드 방식
    diffWorker = new Worker(
      new URL('../workers/diff.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return diffWorker;
}

// 고속 diff 실행
export function performFastDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions = {}
): Promise<DiffResult> {
  return new Promise((resolve, reject) => {
    const worker = initWorker();
    
    // 타임아웃 설정 (30초)
    const timeout = setTimeout(() => {
      reject(new Error('Diff 처리 시간 초과 (30초)'));
    }, 30000);
    
    // 메시지 핸들러
    const handleMessage = (event: MessageEvent) => {
      const { type, data, progress, error } = event.data;
      
      switch (type) {
        case 'progress':
          if (options.onProgress) {
            options.onProgress(progress, data?.message);
          }
          break;
          
        case 'diff':
          if (data.isPartial && options.onPartialResult) {
            options.onPartialResult(data.html, data.chunkIndex);
          }
          break;
          
        case 'complete':
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          resolve({
            html: data.html,
            stats: data.stats
          });
          break;
          
        case 'error':
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          reject(new Error(error || 'Diff 처리 중 오류 발생'));
          break;
      }
    };
    
    // 리스너 등록
    worker.addEventListener('message', handleMessage);
    
    // diff 요청
    worker.postMessage({
      type: 'diff',
      originalText,
      modifiedText
    });
  });
}

// 인라인 diff를 위한 고속 처리
export async function performFastInlineDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions = {}
): Promise<DiffResult> {
  // 인라인은 단어 단위 비교가 필요하므로 다른 접근
  // 여기서는 간단히 라인 단위 diff를 인라인 스타일로 변환
  const result = await performFastDiff(originalText, modifiedText, options);
  
  // CSS 클래스 변경으로 인라인 스타일 적용
  const inlineHtml = result.html
    .replace(/diff-line/g, 'diff-inline')
    .replace(/diff-added/g, 'diff-inline-added')
    .replace(/diff-removed/g, 'diff-inline-removed');
  
  return {
    ...result,
    html: inlineHtml
  };
}

// Worker 정리
export function cleanupDiffWorker() {
  if (diffWorker) {
    diffWorker.terminate();
    diffWorker = null;
  }
}

// 페이지 단위 diff 실행
export function performPagedDiff(
  originalText: string,
  modifiedText: string,
  pageNumber: number,
  linesPerPage: number = 15,
  diffMode: 'line' | 'inline' = 'line',
  options: DiffOptions = {}
): Promise<DiffResult & { pageInfo?: any }> {
  return new Promise((resolve, reject) => {
    const worker = initWorker();
    
    // 타임아웃 설정 (5초 - 페이지 단위는 빠름)
    const timeout = setTimeout(() => {
      reject(new Error('페이지 diff 처리 시간 초과'));
    }, 5000);
    
    // 메시지 핸들러
    const handleMessage = (event: MessageEvent) => {
      const { type, data, error } = event.data;
      
      switch (type) {
        case 'paged-complete':
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          resolve({
            html: data.html,
            pageInfo: data.pageInfo
          });
          break;
          
        case 'error':
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          reject(new Error(error || '페이지 diff 처리 중 오류'));
          break;
      }
    };
    
    // 리스너 등록
    worker.addEventListener('message', handleMessage);
    
    // 페이지 diff 요청
    worker.postMessage({
      type: 'paged-diff',
      originalText,
      modifiedText,
      pageNumber,
      linesPerPage,
      diffMode
    });
  });
}

// 스트리밍 지원 페이지 diff 처리
export function performStreamingPagedDiff(
  originalText: string,
  modifiedText: string,
  pageNumber: number,
  linesPerPage: number = 15,
  diffMode: 'line' | 'inline' = 'line',
  onProgress?: (progress: number, partialHtml: string) => void
): Promise<{ html: string; pageInfo: any }> {
  return new Promise((resolve, reject) => {
    const worker = initWorker();
    
    const timeout = setTimeout(() => {
      worker.removeEventListener('message', handleMessage);
      reject(new Error('페이지 diff 처리 시간 초과'));
    }, 60000); // 1분 타임아웃
    
    const handleMessage = (event: MessageEvent) => {
      const { type, data, error } = event.data;
      
      switch (type) {
        case 'paged-progress':
          // 스트리밍 진행률 콜백 호출
          if (onProgress) {
            onProgress(data.progress, data.partialHtml);
          }
          break;
          
        case 'paged-complete':
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          resolve({
            html: data.html,
            pageInfo: data.pageInfo
          });
          break;
          
        case 'error':
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          reject(new Error(error || '페이지 diff 처리 중 오류'));
          break;
      }
    };
    
    // 리스너 등록
    worker.addEventListener('message', handleMessage);
    
    // 페이지 diff 요청
    worker.postMessage({
      type: 'paged-diff',
      originalText,
      modifiedText,
      pageNumber,
      linesPerPage,
      diffMode
    });
  });
}

// 메모리 사용량 모니터링
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
}

// 텍스트 크기 분석 (빠른 버전)
export function analyzeFastTextSize(originalText: string, modifiedText: string) {
  const totalChars = originalText.length + modifiedText.length;
  const estimatedLines = Math.ceil(totalChars / 80); // 평균 80자/줄 가정
  const memoryUsage = getMemoryUsage();
  
  // 동적 임계값 계산 (메모리 사용량 고려)
  let pagingThreshold = 10; // 기본 10B로 매우 낮춤 (모든 텍스트에서 페이징 사용)
  if (memoryUsage && memoryUsage.usagePercent > 70) {
    pagingThreshold = 5; // 메모리 부족 시 5B로 낮춤
  }
  
  return {
    totalChars,
    estimatedLines,
    memoryUsage,
    pagingThreshold,
    shouldUsePaging: totalChars > pagingThreshold,
    isLarge: totalChars > 500000, // 500KB 이상
    isVeryLarge: totalChars > 5000000, // 5MB 이상
    recommendedMethod: totalChars > 500000 ? 'streaming' : 'batch'
  };
}

// 페이지 정보 계산
export function calculatePageInfo(originalText: string, modifiedText: string, linesPerPage: number = 15) {
  const originalLines = originalText.split('\n').length;
  const modifiedLines = modifiedText.split('\n').length;
  const maxLines = Math.max(originalLines, modifiedLines);
  
  // 실제 데이터가 없거나 매우 적을 경우 최소 1페이지로 설정
  const totalPages = maxLines <= 0 ? 1 : Math.max(1, Math.ceil(maxLines / linesPerPage));
  
  return {
    totalPages,
    totalLines: maxLines,
    originalLines,
    modifiedLines,
    linesPerPage
  };
}