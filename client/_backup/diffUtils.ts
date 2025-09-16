// diff-match-patch 라이브러리를 사용한 텍스트 비교 유틸리티
import DiffMatchPatch from 'diff-match-patch';

/**
 * 텍스트 라인 정보를 담는 인터페이스
 */
interface LineInfo {
  content: string;
  trimmed: string;
  isEmpty: boolean;
  originalIndex: number;
}

/**
 * 텍스트를 라인 정보로 변환
 */
function parseTextToLines(text: string): LineInfo[] {
  const lines = text.split('\n');
  return lines.map((line, index) => ({
    content: line,
    trimmed: line.trim(),
    isEmpty: line.trim() === '',
    originalIndex: index
  }));
}

/**
 * 유사도 기반 라인 매칭
 */
function calculateLineSimilarity(line1: string, line2: string): number {
  if (line1 === line2) return 1.0;
  if (line1.trim() === '' || line2.trim() === '') return 0.0;
  
  // 간단한 유사도 계산 (공통 문자 비율)
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(line1, line2);
  dmp.diff_cleanupSemantic(diffs);
  
  let commonChars = 0;
  let totalChars = Math.max(line1.length, line2.length);
  
  for (const [operation, text] of diffs) {
    if (operation === 0) { // 동일한 부분
      commonChars += text.length;
    }
  }
  
  return totalChars > 0 ? commonChars / totalChars : 0;
}

/**
 * 스마트 라인 매칭 - 내용 유사도 기반
 */
function smartLineMatching(originalLines: LineInfo[], modifiedLines: LineInfo[]): Array<{
  originalIndex: number | null;
  modifiedIndex: number | null;
  similarity: number;
}> {
  const matches: Array<{
    originalIndex: number | null;
    modifiedIndex: number | null;
    similarity: number;
  }> = [];
  
  const usedOriginal = new Set<number>();
  const usedModified = new Set<number>();
  
  // 1. 완전히 일치하는 라인들 먼저 매칭
  for (let i = 0; i < originalLines.length; i++) {
    for (let j = 0; j < modifiedLines.length; j++) {
      if (usedOriginal.has(i) || usedModified.has(j)) continue;
      
      if (originalLines[i].content === modifiedLines[j].content) {
        matches.push({
          originalIndex: i,
          modifiedIndex: j,
          similarity: 1.0
        });
        usedOriginal.add(i);
        usedModified.add(j);
        break;
      }
    }
  }
  
  // 2. 유사도가 높은 라인들 매칭 (임계값 0.5 이상)
  for (let i = 0; i < originalLines.length; i++) {
    if (usedOriginal.has(i)) continue;
    
    let bestMatch = -1;
    let bestSimilarity = 0;
    
    for (let j = 0; j < modifiedLines.length; j++) {
      if (usedModified.has(j)) continue;
      
      const similarity = calculateLineSimilarity(originalLines[i].content, modifiedLines[j].content);
      if (similarity > bestSimilarity && similarity >= 0.5) {
        bestMatch = j;
        bestSimilarity = similarity;
      }
    }
    
    if (bestMatch !== -1) {
      matches.push({
        originalIndex: i,
        modifiedIndex: bestMatch,
        similarity: bestSimilarity
      });
      usedOriginal.add(i);
      usedModified.add(bestMatch);
    }
  }
  
  // 3. 매칭되지 않은 라인들 추가
  for (let i = 0; i < originalLines.length; i++) {
    if (!usedOriginal.has(i)) {
      matches.push({
        originalIndex: i,
        modifiedIndex: null,
        similarity: 0
      });
    }
  }
  
  for (let j = 0; j < modifiedLines.length; j++) {
    if (!usedModified.has(j)) {
      matches.push({
        originalIndex: null,
        modifiedIndex: j,
        similarity: 0
      });
    }
  }
  
  return matches.sort((a, b) => {
    const aIndex = a.originalIndex !== null ? a.originalIndex : (a.modifiedIndex || 0) + 1000;
    const bIndex = b.originalIndex !== null ? b.originalIndex : (b.modifiedIndex || 0) + 1000;
    return aIndex - bIndex;
  });
}

/**
 * 두 텍스트를 비교하여 차이점이 강조된 HTML을 반환합니다. (라인 방식 - 스마트 매칭)
 * 
 * @param originalText 원본 텍스트
 * @param modifiedText 수정된 텍스트
 * @returns 차이점이 강조된 HTML 문자열
 */
export function compareTexts(originalText: string, modifiedText: string): string {
  // 텍스트를 라인 정보로 변환
  const originalLines = parseTextToLines(originalText);
  const modifiedLines = parseTextToLines(modifiedText);
  
  // 스마트 라인 매칭 수행
  const matches = smartLineMatching(originalLines, modifiedLines);
  
  const result: string[] = [];
  
  for (const match of matches) {
    const originalLine = match.originalIndex !== null ? originalLines[match.originalIndex].content : "";
    const modifiedLine = match.modifiedIndex !== null ? modifiedLines[match.modifiedIndex].content : "";
    
    // 빈 줄 처리 (둘 다 빈 줄이거나 한쪽만 빈 줄인 경우)
    if (originalLine.trim() === "" && modifiedLine.trim() === "") {
      result.push(`<div class="diff-line">&nbsp;</div>`);
      continue;
    }
    
    // 한쪽만 빈 줄인 경우: 내용이 있는 쪽을 표시
    if (originalLine.trim() === "" && modifiedLine.trim() !== "") {
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      result.push(`<div class="diff-line"><span class="diff-added">${lineContent}</span></div>`);
      continue;
    }
    
    if (originalLine.trim() !== "" && modifiedLine.trim() === "") {
      const lineContent = escapeHtml(originalLine) || '&nbsp;';
      result.push(`<div class="diff-line"><span class="diff-removed">${lineContent}</span></div>`);
      continue;
    }
    
    // 매칭되지 않은 라인들 (추가되거나 삭제된 라인)
    if (match.originalIndex === null) {
      // 추가된 라인
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      result.push(`<div class="diff-line"><span class="diff-added">${lineContent}</span></div>`);
      continue;
    }
    
    if (match.modifiedIndex === null) {
      // 삭제된 라인
      const lineContent = escapeHtml(originalLine) || '&nbsp;';
      result.push(`<div class="diff-line"><span class="diff-removed">${lineContent}</span></div>`);
      continue;
    }
    
    // 완전히 일치하는 라인
    if (match.similarity === 1.0) {
      const lineContent = escapeHtml(originalLine) || '&nbsp;';
      result.push(`<div class="diff-line">${lineContent}</div>`);
    } else {
      // 유사하지만 다른 라인: 문자 단위로 정교하게 비교
      result.push(diffLinesDetailed(originalLine, modifiedLine));
    }
  }
  
  return result.join('');
}

/**
 * 두 텍스트 라인의 차이를 문자 단위로 정교하게 비교합니다.
 * diff-match-patch를 사용하여 실제 변경된 부분만 하이라이트합니다.
 */
function diffLinesDetailed(originalLine: string, modifiedLine: string): string {
  const lineContent = (line: string) => escapeHtml(line) || '&nbsp;';

  if (!originalLine && modifiedLine) {
    return `<div class="diff-line"><span class="diff-added">${lineContent(modifiedLine)}</span></div>`;
  }
  if (originalLine && !modifiedLine) {
    return `<div class="diff-line"><span class="diff-removed">${lineContent(originalLine)}</span></div>`;
  }
  
  // diff-match-patch를 사용하여 문자 단위로 비교
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(originalLine, modifiedLine);
  dmp.diff_cleanupSemantic(diffs);
  
  let html = '<div class="diff-line">';
  
  for (let i = 0; i < diffs.length; i++) {
    const [operation, text] = diffs[i];
    const escapedText = escapeHtml(text);
    
    switch (operation) {
      case DiffMatchPatch.DIFF_INSERT:
        html += `<span class="diff-added">${escapedText}</span>`;
        break;
      case DiffMatchPatch.DIFF_DELETE:
        html += `<span class="diff-removed">${escapedText}</span>`;
        break;
      case DiffMatchPatch.DIFF_EQUAL:
        html += escapedText;
        break;
    }
  }
  
  html += '</div>';
  return html;
}

/**
 * 두 텍스트 라인의 차이를 단어 단위로 비교합니다.
 */
function diffLines(originalLine: string, modifiedLine: string): string {
  const lineContent = (line: string) => escapeHtml(line) || '&nbsp;';
  // 간단한 구현으로, 실제로는 더 정교한 알고리즘 필요
  if (!originalLine && modifiedLine) {
    return `<div class="diff-line"><span class="diff-added">${lineContent(modifiedLine)}</span></div>`;
  }
  if (originalLine && !modifiedLine) {
    return `<div class="diff-line"><span class="diff-removed">${lineContent(originalLine)}</span></div>`;
  }
  
  // 원본과 수정본이 완전히 다른 경우
  if (originalLine !== modifiedLine) {
    return `<div class="diff-line"><span class="diff-removed">${lineContent(originalLine)}</span></div>
            <div class="diff-line"><span class="diff-added">${lineContent(modifiedLine)}</span></div>`;
  }
  
  return `<div class="diff-line">${lineContent(originalLine)}</div>`;
}

/**
 * HTML 특수 문자를 이스케이프하면서 공백 문자를 보존합니다.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
    // 공백과 탭은 white-space: pre-wrap으로 처리하므로 그대로 유지
}

/**
 * 인라인 방식으로 변경사항을 표시하는 함수 (스마트 매칭)
 * 수정된 부분만 하이라이트 하여 문맥을 유지하면서 변경사항을 확인할 수 있습니다.
 * 삭제된 내용은 빼고, 수정된 내용만 색상으로 표시합니다.
 */
export function compareTextsInline(originalText: string, modifiedText: string): string {
  const dmp = new DiffMatchPatch();
  
  // 텍스트를 라인 정보로 변환
  const originalLines = parseTextToLines(originalText);
  const modifiedLines = parseTextToLines(modifiedText);
  
  // 스마트 라인 매칭 수행
  const matches = smartLineMatching(originalLines, modifiedLines);
  
  let html = '';
  
  for (const match of matches) {
    const originalLine = match.originalIndex !== null ? originalLines[match.originalIndex].content : "";
    const modifiedLine = match.modifiedIndex !== null ? modifiedLines[match.modifiedIndex].content : "";
    
    // 빈 줄 처리 (둘 다 빈 줄이거나 한쪽만 빈 줄인 경우)
    if (originalLine.trim() === "" && modifiedLine.trim() === "") {
      html += `<div class="diff-line">&nbsp;</div>`;
      continue;
    }
    
    // 한쪽만 빈 줄인 경우: 결과물 중심으로 표시 (인라인 방식)
    if (originalLine.trim() === "" && modifiedLine.trim() !== "") {
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      html += `<div class="diff-line"><span class="inline-diff-added">${lineContent}</span></div>`;
      continue;
    }
    
    if (originalLine.trim() !== "" && modifiedLine.trim() === "") {
      // 인라인 방식에서는 삭제된 라인을 표시하지 않음 (결과물 중심)
      html += `<div class="diff-line">&nbsp;</div>`;
      continue;
    }
    
    // 매칭되지 않은 라인들
    if (match.originalIndex === null) {
      // 추가된 라인
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      html += `<div class="diff-line"><span class="inline-diff-added">${lineContent}</span></div>`;
      continue;
    }
    
    if (match.modifiedIndex === null) {
      // 삭제된 라인 - 인라인에서는 무시 (결과물 중심)
      html += `<div class="diff-line">&nbsp;</div>`;
      continue;
    }
    
    // 완전히 일치하는 라인
    if (match.similarity === 1.0) {
      const lineContent = escapeHtml(originalLine) || '&nbsp;';
      html += `<div class="diff-line">${lineContent}</div>`;
      continue;
    }
    
    // 유사하지만 다른 라인: 문자 단위로 비교 (인라인 방식)
    const diffs = dmp.diff_main(originalLine, modifiedLine);
    dmp.diff_cleanupSemantic(diffs);
    
    let lineHtml = '';
    
    // 수정된 라인 렌더링 (인라인 방식: 삭제된 내용 제외, 결과물 중심)
    for (const [operation, text] of diffs) {
      const escapedText = escapeHtml(text);
      
      if (operation === 1) { // 추가
        lineHtml += `<span class="inline-diff-added">${escapedText}</span>`;
      } else if (operation === -1) { // 삭제
        // 인라인 방식에서는 삭제된 내용을 표시하지 않음 (결과물 중심)
        continue;
      } else { // 변경 없음
        lineHtml += escapedText;
      }
    }
    
    if (!lineHtml.trim()) {
      lineHtml = '&nbsp;';
    }

    html += `<div class="diff-line">${lineHtml}</div>`;
  }
  
  return html;
}

/**
 * 텍스트 복잡도를 체크하여 처리 방식을 결정하는 함수
 */
function shouldUseSimpleMatching(originalText: string, modifiedText: string): boolean {
  const originalLines = originalText.split('\n');
  const modifiedLines = modifiedText.split('\n');
  
  // 줄 수 기준 임계값 (베스트 상태로 복원)
  const MAX_LINES = 50;
  
  // 총 문자 수 기준 임계값 (베스트 상태로 복원)
  const MAX_CHARS = 5000;
  
  // 평균 줄 길이 기준 임계값 (베스트 상태로 복원)
  const MAX_AVG_LINE_LENGTH = 150;
  
  const totalLines = Math.max(originalLines.length, modifiedLines.length);
  const totalChars = originalText.length + modifiedText.length;
  const avgLineLength = totalChars / totalLines;
  
  return totalLines > MAX_LINES || 
         totalChars > MAX_CHARS || 
         avgLineLength > MAX_AVG_LINE_LENGTH;
}

/**
 * 단순 라인 매칭 알고리즘 (성능 최적화용)
 */
function simpleLineMatching(originalText: string, modifiedText: string, diffMode: 'line' | 'inline'): string {
  const originalLines = originalText.split('\n');
  const modifiedLines = modifiedText.split('\n');
  
  const result: string[] = [];
  
  for (let i = 0; i < modifiedLines.length; i++) {
    const modifiedLine = modifiedLines[i];
    const originalLine = i < originalLines.length ? originalLines[i] : "";
    
    if (modifiedLine === originalLine) {
      // 완전히 일치
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      result.push(`<div class="diff-line">${lineContent}</div>`);
    } else if (originalLine === "") {
      // 새로 추가된 줄
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
      result.push(`<div class="diff-line"><span class="${className}">${lineContent}</span></div>`);
    } else if (modifiedLine === "") {
      // 빈 줄
      result.push(`<div class="diff-line">&nbsp;</div>`);
    } else {
      // 수정된 줄 - 전체 하이라이트
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
      result.push(`<div class="diff-line"><span class="${className}">${lineContent}</span></div>`);
    }
  }
  
  return result.join('');
}

/**
 * 수정된 텍스트 기준으로 차이점 비교 결과 생성 (에디터용)
 * 우측 수정 텍스트와 줄 위치를 동기화하여 편집 중 참조하기 쉽게 만듭니다.
 */
export function compareTextsForEditor(originalText: string, modifiedText: string, diffMode: 'line' | 'inline'): string {
  // 텍스트 복잡도 체크
  if (shouldUseSimpleMatching(originalText, modifiedText)) {
    return simpleLineMatching(originalText, modifiedText, diffMode);
  }
  
  // 텍스트를 라인 정보로 변환
  const originalLines = parseTextToLines(originalText);
  const modifiedLines = parseTextToLines(modifiedText);
  
  // 스마트 라인 매칭 수행
  const matches = smartLineMatching(originalLines, modifiedLines);
  
  // 수정된 텍스트 기준으로 결과 재정렬
  const modifiedBasedResult = new Array(modifiedLines.length).fill(null);
  
  // 각 매칭 결과를 수정된 텍스트의 줄 위치에 맞게 배치
  for (const match of matches) {
    if (match.modifiedIndex !== null) {
      const modifiedLine = modifiedLines[match.modifiedIndex].content;
      const originalLine = match.originalIndex !== null ? originalLines[match.originalIndex].content : "";
      
      // 빈 줄 처리
      if (modifiedLine.trim() === "" && originalLine.trim() === "") {
        modifiedBasedResult[match.modifiedIndex] = `<div class="diff-line">&nbsp;</div>`;
      } else if (modifiedLine.trim() === "" && originalLine.trim() !== "") {
        // 원본에는 내용이 있었지만 수정본에서는 빈 줄
        modifiedBasedResult[match.modifiedIndex] = `<div class="diff-line">&nbsp;</div>`;
      } else if (modifiedLine.trim() !== "" && originalLine.trim() === "") {
        // 새로 추가된 줄
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
        modifiedBasedResult[match.modifiedIndex] = `<div class="diff-line"><span class="${className}">${lineContent}</span></div>`;
      } else if (match.similarity === 1.0) {
        // 완전히 일치하는 경우
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        modifiedBasedResult[match.modifiedIndex] = `<div class="diff-line">${lineContent}</div>`;
      } else if (match.originalIndex !== null) {
        // 유사하지만 다른 경우 - 문자 단위로 비교
        if (diffMode === 'inline') {
          modifiedBasedResult[match.modifiedIndex] = generateInlineEditableDiff(originalLine, modifiedLine);
        } else {
          modifiedBasedResult[match.modifiedIndex] = generateLineEditableDiff(originalLine, modifiedLine);
        }
      } else {
        // 새로 추가된 줄 (매칭되지 않음)
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
        modifiedBasedResult[match.modifiedIndex] = `<div class="diff-line"><span class="${className}">${lineContent}</span></div>`;
      }
    }
  }
  
  // null인 항목들 처리 (예상치 못한 경우)
  for (let i = 0; i < modifiedBasedResult.length; i++) {
    if (modifiedBasedResult[i] === null) {
      const lineContent = escapeHtml(modifiedLines[i].content) || '&nbsp;';
      const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
      modifiedBasedResult[i] = `<div class="diff-line"><span class="${className}">${lineContent}</span></div>`;
    }
  }
  
  return modifiedBasedResult.join('');
}


/**
 * 에디터용 인라인 diff 생성
 */
function generateInlineEditableDiff(originalLine: string, modifiedLine: string): string {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(originalLine, modifiedLine);
  dmp.diff_cleanupSemantic(diffs);
  
  let html = '<div class="diff-line">';
  
  for (const [operation, text] of diffs) {
    const escapedText = escapeHtml(text);
    
    if (operation === 1) { // 추가
      html += `<span class="inline-diff-added">${escapedText}</span>`;
    } else if (operation === -1) { // 삭제 - 인라인에서는 표시하지 않음
      continue;
    } else { // 동일
      html += escapedText;
    }
  }
  
  html += '</div>';
  return html;
}

/**
 * 에디터용 라인 diff 생성
 */
function generateLineEditableDiff(originalLine: string, modifiedLine: string): string {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(originalLine, modifiedLine);
  dmp.diff_cleanupSemantic(diffs);
  
  let html = '<div class="diff-line">';
  
  for (const [operation, text] of diffs) {
    const escapedText = escapeHtml(text);
    
    if (operation === 1) { // 추가
      html += `<span class="diff-added">${escapedText}</span>`;
    } else if (operation === -1) { // 삭제
      html += `<span class="diff-removed">${escapedText}</span>`;
    } else { // 동일
      html += escapedText;
    }
  }
  
  html += '</div>';
  return html;
}

/**
 * 텍스트 변경 영역을 감지하는 함수
 * 이전 텍스트와 현재 텍스트를 비교하여 변경된 줄 범위를 반환합니다.
 */
export function detectChangedRegion(oldText: string, newText: string): {
  startLine: number;
  endLine: number;
  oldLines: string[];
  newLines: string[];
} {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // 변경된 시작 줄 찾기
  let startLine = 0;
  const minLength = Math.min(oldLines.length, newLines.length);
  
  for (let i = 0; i < minLength; i++) {
    if (oldLines[i] !== newLines[i]) {
      startLine = i;
      break;
    }
    if (i === minLength - 1) {
      startLine = i + 1;
    }
  }
  
  // 변경된 끝 줄 찾기 (뒤에서부터)
  let endLine = Math.max(oldLines.length, newLines.length) - 1;
  
  for (let i = 0; i < minLength; i++) {
    const oldIndex = oldLines.length - 1 - i;
    const newIndex = newLines.length - 1 - i;
    
    if (oldIndex < startLine || newIndex < startLine) {
      break;
    }
    
    if (oldLines[oldIndex] !== newLines[newIndex]) {
      endLine = Math.max(oldIndex, newIndex);
      break;
    }
  }
  
  // 안전하게 범위 조정
  if (startLine > endLine) {
    if (oldLines.length !== newLines.length) {
      endLine = Math.max(oldLines.length, newLines.length) - 1;
    } else {
      endLine = startLine;
    }
  }
  
  return {
    startLine,
    endLine: Math.max(endLine, startLine),
    oldLines,
    newLines
  };
}

/**
 * 하이브리드 diff 계산 함수
 * 변경된 영역은 정확한 스마트 매칭, 변경되지 않은 영역은 빠른 단순 매칭을 사용합니다.
 */
export function calculateIncrementalDiff(
  originalText: string,
  previousModifiedText: string,
  currentModifiedText: string,
  previousResult: string,
  diffMode: 'line' | 'inline'
): string {
  // 변경된 영역 감지
  const changedRegion = detectChangedRegion(previousModifiedText, currentModifiedText);
  
  // 변경사항이 없으면 이전 결과 그대로 반환
  if (changedRegion.startLine === changedRegion.endLine && 
      changedRegion.startLine < changedRegion.oldLines.length &&
      changedRegion.startLine < changedRegion.newLines.length &&
      changedRegion.oldLines[changedRegion.startLine] === changedRegion.newLines[changedRegion.startLine]) {
    return previousResult;
  }
  
  // 전체 텍스트를 다시 계산하되, 변경된 영역만 정확한 매칭 사용
  return compareTextsForEditorWithRegion(originalText, currentModifiedText, diffMode, changedRegion);
}

/**
 * 변경 영역을 고려한 효율적인 diff 계산
 */
function compareTextsForEditorWithRegion(
  originalText: string, 
  modifiedText: string, 
  diffMode: 'line' | 'inline',
  changedRegion: { startLine: number; endLine: number; oldLines: string[]; newLines: string[]; }
): string {
  // 전체 텍스트가 작으면 기존 정확한 방식 사용
  if (shouldUseSimpleMatching(originalText, modifiedText)) {
    return simpleLineMatching(originalText, modifiedText, diffMode);
  }
  
  const originalLines = originalText.split('\n');
  const modifiedLines = modifiedText.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < modifiedLines.length; i++) {
    const modifiedLine = modifiedLines[i];
    const originalLine = i < originalLines.length ? originalLines[i] : "";
    
    // 변경된 영역 내의 줄인지 확인
    const isInChangedRegion = i >= changedRegion.startLine && i <= changedRegion.endLine;
    
    if (isInChangedRegion) {
      // 변경된 영역: 정확한 diff 계산
      if (modifiedLine === originalLine) {
        // 완전히 일치
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        result.push(`<div class="diff-line">${lineContent}</div>`);
      } else if (originalLine === "") {
        // 새로 추가된 줄
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
        result.push(`<div class="diff-line"><span class="${className}">${lineContent}</span></div>`);
      } else if (modifiedLine === "") {
        // 빈 줄
        result.push(`<div class="diff-line">&nbsp;</div>`);
      } else {
        // 수정된 줄 - 문자 단위로 정확한 비교
        if (diffMode === 'inline') {
          result.push(generateInlineEditableDiff(originalLine, modifiedLine));
        } else {
          result.push(generateLineEditableDiff(originalLine, modifiedLine));
        }
      }
    } else {
      // 변경되지 않은 영역: 빠른 처리
      if (modifiedLine === originalLine) {
        // 완전히 일치
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        result.push(`<div class="diff-line">${lineContent}</div>`);
      } else if (originalLine === "") {
        // 새로 추가된 줄
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
        result.push(`<div class="diff-line"><span class="${className}">${lineContent}</span></div>`);
      } else if (modifiedLine === "") {
        // 빈 줄
        result.push(`<div class="diff-line">&nbsp;</div>`);
      } else {
        // 수정된 줄 - 단순 전체 하이라이트
        const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
        const className = diffMode === 'inline' ? 'inline-diff-added' : 'diff-added';
        result.push(`<div class="diff-line"><span class="${className}">${lineContent}</span></div>`);
      }
    }
  }
  
  return result.join('');
}

/**
 * HTML에서 실제 텍스트 내용을 추출하는 함수 (비교용)
 */
function extractTextFromDiffLine(htmlLine: string): string {
  // HTML 태그를 제거하고 실제 텍스트만 추출
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlLine;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // &nbsp;를 공백으로 변환
  return textContent.replace(/\u00A0/g, ' ').trim();
}

/**
 * diff 줄에서 실제 텍스트 내용을 추출하되, 하이라이트 정보는 유지하는 함수
 */
function getTextContentForMatching(htmlLine: string): string {
  // 하이라이트 태그 내부의 텍스트만 추출하여 비교
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlLine;
  
  // diff-added, diff-removed 등의 스타일 태그 내부 텍스트만 추출
  const highlightSpans = tempDiv.querySelectorAll('span[class*="diff-"]');
  if (highlightSpans.length > 0) {
    // 하이라이트 스타일이 있는 경우, 그 내부 텍스트들을 조합
    let combinedText = '';
    for (const span of highlightSpans) {
      combinedText += span.textContent || '';
    }
    return combinedText.trim();
  }
  
  // 하이라이트가 없는 경우 전체 텍스트 추출
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  return textContent.replace(/\u00A0/g, ' ').trim();
}

/**
 * diff 결과를 수정된 텍스트의 줄 수에 맞게 후처리하는 함수
 * 정확한 diff 계산 결과를 유지하면서 줄 위치를 동기화합니다.
 */
export function adjustDiffToModifiedLines(diffResult: string, modifiedText: string): string {
  const modifiedLines = modifiedText.split('\n');
  
  // diff 결과를 줄 단위로 분할
  const diffLines = diffResult.split('</div>').map(line => 
    line.includes('<div') ? line + '</div>' : line
  ).filter(line => line.trim());
  
  // 각 diff 줄에서 실제 텍스트 내용 추출 (하이라이트 정보 고려)
  const diffTexts = diffLines.map(line => getTextContentForMatching(line));
  
  // 수정된 텍스트의 각 줄에 대해 매핑
  const adjustedLines: string[] = [];
  
  for (let i = 0; i < modifiedLines.length; i++) {
    const modifiedLine = modifiedLines[i];
    const trimmedModifiedLine = modifiedLine.trim();
    
    // 수정된 텍스트 줄과 매칭되는 diff 줄 찾기
    let matchedDiffLine = null;
    let bestMatchIndex = -1;
    
    for (let j = 0; j < diffTexts.length; j++) {
      const diffText = diffTexts[j];
      
      // 완전히 일치하는 경우
      if (diffText === trimmedModifiedLine || diffText === modifiedLine) {
        matchedDiffLine = diffLines[j];
        bestMatchIndex = j;
        break;
      }
      
      // 빈 줄인 경우
      if (trimmedModifiedLine === '' && diffText === '') {
        matchedDiffLine = diffLines[j];
        bestMatchIndex = j;
        break;
      }
    }
    
    if (matchedDiffLine) {
      // 매칭된 diff 줄 사용
      adjustedLines.push(matchedDiffLine);
      // 사용된 diff 줄 제거 (중복 사용 방지)
      if (bestMatchIndex !== -1) {
        diffTexts[bestMatchIndex] = '___USED___';
      }
    } else {
      // 매칭되지 않은 경우 새로 추가된 줄로 처리
      const lineContent = escapeHtml(modifiedLine) || '&nbsp;';
      adjustedLines.push(`<div class="diff-line">${lineContent}</div>`);
    }
  }
  
  return adjustedLines.join('');
}

/**
 * 두 문자열 사이의 차이점을 찾는 함수
 * diff-match-patch 라이브러리를 사용하여 더 정확한 차이점을 찾습니다.
 */
export function findDiff(oldStr: string, newStr: string): { added: string[], removed: string[] } {
  const added: string[] = [];
  const removed: string[] = [];
  
  // diff-match-patch를 활용한 구현
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(oldStr, newStr);
  dmp.diff_cleanupSemantic(diffs);
  
  // diff 결과를 파싱하여 added와 removed 배열에 추가
  for (const [operation, text] of diffs) {
    if (operation === 1) { // 추가
      added.push(text);
    } else if (operation === -1) { // 삭제
      removed.push(text);
    }
  }
  
  return { added, removed };
}
