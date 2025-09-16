/**
 * 선택된 텍스트를 패턴에 따라 정렬하는 유틸리티 함수들
 */

/**
 * 텍스트를 패턴에 따라 정렬합니다.
 * 
 * @param text 정렬할 텍스트
 * @returns 정렬된 텍스트
 */
export function formatCodeAlignment(text: string): string {
  // 텍스트가 비어있으면 그대로 반환
  if (!text.trim()) return text;
  
  // 텍스트를 줄 단위로 분리
  const lines = text.split('\n');
  
  // 각 줄에서 패턴을 찾기 위한 정규식 패턴 정의
  const patternRegexes = [
    /Weapons=\(\s*strName=/,
    /iType=/,
    /ABILITIES\[\d+\]=/,
    /Properties\[\d+\]=/,
    /iDamage=/,
    /iEnvironmentDamage=/,
    /iRange=/,
    /iReactionRange=/,
    /iReactionFire=/,
    /iRadius=/,
    /iRealityRolls=/,
    /iCritical=/
  ];
  
  // 각 패턴의 위치를 저장할 배열
  const patternPositions: number[][] = Array(patternRegexes.length)
    .fill(0)
    .map(() => []);
  
  // 각 줄에서 패턴의 위치를 찾아 저장
  lines.forEach((line, lineIndex) => {
    patternRegexes.forEach((regex, patternIndex) => {
      const match = line.match(regex);
      if (match) {
        patternPositions[patternIndex].push(match.index!);
      } else {
        patternPositions[patternIndex].push(-1);
      }
    });
  });
  
  // 각 패턴의 최대 위치 찾기 (정렬 기준점)
  const maxPositions = patternPositions.map(positions => {
    const validPositions = positions.filter(pos => pos !== -1);
    return validPositions.length > 0 ? Math.max(...validPositions) : -1;
  });
  
  // 줄 정렬하기
  const alignedLines = lines.map((line, lineIndex) => {
    let result = line;
    let offset = 0;
    
    patternRegexes.forEach((regex, patternIndex) => {
      const currentPos = patternPositions[patternIndex][lineIndex];
      const maxPos = maxPositions[patternIndex];
      
      // 패턴이 존재하고 최대 위치가 유효하면 정렬
      if (currentPos !== -1 && maxPos !== -1) {
        const spacesToAdd = maxPos - currentPos - offset;
        
        if (spacesToAdd > 0) {
          const match = result.match(regex);
          if (match) {
            const matchIndex = match.index! + offset;
            const before = result.substring(0, matchIndex);
            const after = result.substring(matchIndex);
            const spaces = ' '.repeat(spacesToAdd);
            
            result = before + spaces + after;
            offset += spacesToAdd;
          }
        }
      }
    });
    
    return result;
  });
  
  // 정렬된 결과 반환
  return alignedLines.join('\n');
}

/**
 * 코드를 특정 패턴에 따라 일정한 간격으로 정렬합니다.
 * 주로 ABILITIES, Properties 등 반복되는 패턴에 적합합니다.
 * 
 * @param text 정렬할 텍스트
 * @returns 정렬된 텍스트
 */
export function formatCodeByPattern(text: string): string {
  // 텍스트가 비어있으면 그대로 반환
  if (!text.trim()) return text;
  
  // 텍스트를 줄 단위로 분리
  const lines = text.split('\n');
  
  // 주요 패턴을 찾아 분리
  const processedLines = lines.map(line => {
    // 기본적인 구분 패턴 (괄호, 콤마 등 구분자 앞뒤에 공백 추가)
    let processed = line
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .replace(/,/g, ', ')
      .replace(/=(\w+)/g, '= $1')
      .replace(/\s+/g, ' ');
    
    // ABILITIES 패턴 처리
    processed = processed.replace(/(ABILITIES\[\d+\])\s*=\s*(\w+)/g, 
      (match, key, value) => `${key.padEnd(14)} = ${value}`);
    
    // Properties 패턴 처리
    processed = processed.replace(/(Properties\[\d+\])\s*=\s*(\w+)/g, 
      (match, key, value) => `${key.padEnd(14)} = ${value}`);
    
    // iType 처리
    processed = processed.replace(/(iType)\s*=\s*(\w+)/g, 
      (match, key, value) => `${key.padEnd(8)} = ${value.padEnd(25)}`);
    
    // 기타 i로 시작하는 속성 정렬
    processed = processed.replace(/(i[A-Z]\w+)\s*=\s*(\w+)/g, 
      (match, key, value) => `${key.padEnd(20)} = ${value}`);
    
    return processed.replace(/\s+/g, ' ').trim();
  });
  
  // 정렬된 결과 반환
  return processedLines.join('\n');
}

/**
 * 선택된 텍스트를 좀 더 명확하게 정렬합니다.
 * 이 버전은 특별히 Weapons=(...), ABILITIES[n]=... 패턴에 최적화되어 있습니다.
 * 
 * @param text 정렬할 텍스트
 * @returns 정렬된 텍스트
 */
// 디버그 데이터 타입 정의
export interface AlignmentDebugData {
  originalText: string;
  detectedPatterns: string[];
  patternLengths: Record<string, number>;
  processedLines: string[];
  alignedText: string;
  hasChanged: boolean;
}

// 디버그 데이터를 저장하기 위한 전역 변수
let lastDebugData: AlignmentDebugData | null = null;

/**
 * 가장 최근의 디버그 데이터를 반환합니다.
 */
export function getLastDebugData(): AlignmentDebugData | null {
  return lastDebugData;
}

/**
 * 선택된 텍스트를 자동으로 정렬합니다.
 * 텍스트 내의 반복되는 패턴을 감지하고 일관되게 정렬합니다.
 * 
 * @param text 정렬할 텍스트
 * @param debug 디버그 모드 활성화 여부
 * @returns 정렬된 텍스트
 */
export function alignSelectedText(text: string, debug: boolean = false): string {
  // 디버그 데이터 초기화
  const debugData: AlignmentDebugData = {
    originalText: text,
    detectedPatterns: [],
    patternLengths: {},
    processedLines: [],
    alignedText: '',
    hasChanged: false
  };
  
  // 텍스트가 비어있으면 그대로 반환
  if (!text.trim()) return text;
  
  console.log("정렬 함수 입력 텍스트:", text.substring(0, 100) + (text.length > 100 ? '...' : ''));
  
  // 텍스트를 줄 단위로 분리
  const lines = text.split('\n');
  console.log("처리할 라인 수:", lines.length);
  
  // 1단계: 패턴 자동 인식
  // 각 줄에서 공통 패턴을 찾아 패턴 집합 생성
  const patternSet = detectCommonPatterns(lines);
  console.log("감지된 패턴:", Array.from(patternSet));
  
  // 디버그 데이터 저장
  debugData.detectedPatterns = Array.from(patternSet);
  
  if (patternSet.size === 0) {
    console.log("인식된 패턴이 없습니다. 원본 텍스트를 반환합니다.");
    
    // 디버그 데이터 저장 (변경 없음)
    if (debug) {
      debugData.alignedText = text;
      lastDebugData = debugData;
    }
    
    return text;
  }
  
  // 2단계: 패턴 정렬을 위한 분석
  // 각 패턴의 최대 길이 계산 (패딩 결정용)
  const patternMaxLength = calculatePatternMaxLengths(lines, patternSet);
  console.log("패턴별 최대 길이:", patternMaxLength);
  
  // 디버그 데이터 저장 (패턴 길이)
  patternMaxLength.forEach((value, key) => {
    debugData.patternLengths[key] = value;
  });
  
  // 3단계: 텍스트 정렬 처리
  const alignedLines = alignLinesWithPatterns(lines, patternSet, patternMaxLength);
  
  // 디버그 데이터 저장 (처리된 라인들)
  debugData.processedLines = [...alignedLines];
  
  // 4단계: 정렬 전후 비교 검증
  const alignedText = alignedLines.join('\n');
  const hasChanged = text !== alignedText;
  console.log("정렬 적용 여부:", hasChanged ? "변경됨" : "변경 없음");
  
  // 디버그 데이터 저장 (최종 결과)
  debugData.alignedText = alignedText;
  debugData.hasChanged = hasChanged;
  
  // 디버그 모드가 활성화된 경우 디버그 데이터 저장
  if (debug) {
    lastDebugData = debugData;
  }
  
  return alignedText;
}

/**
 * 텍스트 라인들에서 공통적으로 나타나는 패턴을 감지합니다.
 * 
 * @param lines 분석할 텍스트 라인 배열
 * @returns 감지된 패턴 집합
 */
function detectCommonPatterns(lines: string[]): Set<string> {
  // 감지할 패턴의 정규식 (키=값 형태)
  const patternRegex = /[a-zA-Z0-9_]+\[[0-9]+\]=[^,\s]+|[a-zA-Z0-9_]+=(?:[^,\s]+)/g;
  
  // 패턴의 출현 빈도 기록
  const patternFrequency: { [pattern: string]: number } = {};
  
  // 각 라인에서 패턴 추출
  for (const line of lines) {
    // 패턴들을 추출
    const matches = line.match(patternRegex);
    
    if (matches) {
      // 각 매치된 패턴에 대해
      for (const match of matches) {
        // 패턴의 키 부분만 추출 (예: "ABILITIES[0]=" 또는 "iType=")
        const patternKey = match.split('=')[0] + '=';
        patternFrequency[patternKey] = (patternFrequency[patternKey] || 0) + 1;
      }
    }
  }
  
  // 여러 줄에서 반복되는 패턴만 선택 (2개 이상의 라인에 출현)
  const commonPatterns = new Set<string>();
  for (const pattern in patternFrequency) {
    if (patternFrequency[pattern] >= 2) {
      commonPatterns.add(pattern);
    }
  }
  
  // 특별 처리: "Weapons=(" 패턴도 추가 (특수한 시작 패턴)
  if (lines.some(line => line.includes('Weapons=('))) {
    commonPatterns.add('Weapons=(');
  }
  
  return commonPatterns;
}

/**
 * 각 패턴의 최대 길이를 계산합니다.
 * 
 * @param lines 분석할 텍스트 라인 배열
 * @param patterns 감지된 패턴 집합
 * @returns 패턴별 최대 길이 맵
 */
function calculatePatternMaxLengths(lines: string[], patterns: Set<string>): Map<string, number> {
  const patternMaxLength = new Map<string, number>();
  
  // 초기 길이 설정
  patterns.forEach(pattern => {
    patternMaxLength.set(pattern, pattern.length + 5); // 기본 패딩 추가
  });
  
  // 각 라인에서 패턴의 실제 길이 확인
  for (const line of lines) {
    patterns.forEach(pattern => {
      if (pattern === 'Weapons=(') {
        // Weapons=( 패턴 특별 처리
        const weaponsMatch = line.match(/Weapons=\([^,]+/);
        if (weaponsMatch) {
          const length = weaponsMatch[0].length;
          if (length > (patternMaxLength.get(pattern) || 0)) {
            patternMaxLength.set(pattern, length + 2);
          }
        }
      } else {
        // 일반 패턴 처리
        const regex = new RegExp(`${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^,\\s;)]+`, 'g');
        const matches = line.match(regex);
        
        if (matches) {
          matches.forEach(match => {
            if (match.length > (patternMaxLength.get(pattern) || 0)) {
              patternMaxLength.set(pattern, match.length + 2);
            }
          });
        }
      }
    });
  }
  
  return patternMaxLength;
}

/**
 * 감지된 패턴과 최대 길이를 기반으로 텍스트 라인을 정렬합니다.
 * 이 새 버전은 원본 텍스트의 구조(콤마, 공백 등)를 유지하면서 정렬합니다.
 * 
 * @param lines 정렬할 텍스트 라인 배열
 * @param patterns 감지된 패턴 집합
 * @param patternMaxLength 패턴별 최대 길이 맵
 * @returns 정렬된 텍스트 라인 배열
 */
function alignLinesWithPatterns(
  lines: string[], 
  patterns: Set<string>, 
  patternMaxLength: Map<string, number>
): string[] {
  // 패턴 순서 결정 (Weapons=(가 맨 앞으로)
  const patternOrder = Array.from(patterns).sort((a, b) => {
    if (a === 'Weapons=(') return -1;
    if (b === 'Weapons=(') return 1;
    return a.localeCompare(b);
  });
  
  // 정렬된 라인을 저장할 배열
  const alignedLines: string[] = [];
  
  // 각 라인 처리
  for (const line of lines) {
    // 이 라인에 포함된 패턴이 있는지 확인
    const hasPattern = patternOrder.some(pattern => line.includes(pattern));
    
    if (!hasPattern) {
      // 패턴이 없는 라인은 그대로 유지
      alignedLines.push(line);
      continue;
    }
    
    // 각 패턴에 대해 위치와 길이 정보를 수집
    interface PatternInfo {
      pattern: string;
      index: number;
      text: string;
      endIndex: number;
      maxLength: number;
      padLength: number;
    }
    
    const patternInfos: PatternInfo[] = [];
    
    // 패턴 정보 수집
    for (const pattern of patternOrder) {
      const maxLength = patternMaxLength.get(pattern) || 0;
      
      let regex: RegExp;
      if (pattern === 'Weapons=(') {
        regex = /Weapons=\(\s*[^,]*/g;
      } else {
        // 패턴 뒤에 값과 구분자(콤마, 공백 등)까지 포함하는 정규식
        regex = new RegExp(`${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^,;)]*[,;)\\s]*`, 'g');
      }
      
      const matches = Array.from(line.matchAll(regex));
      if (matches.length > 0) {
        const match = matches[0];
        if (match.index !== undefined) {
          const matchedText = match[0];
          // 실제 패턴 값만 (콤마나 공백을 제외한 부분)
          const patternValue = matchedText.trim().replace(/[,;)]$/, '');
          
          patternInfos.push({
            pattern,
            index: match.index,
            text: matchedText,
            endIndex: match.index + matchedText.length,
            maxLength,
            padLength: Math.max(0, maxLength - patternValue.length)
          });
        }
      }
    }
    
    // 위치에 따라 패턴 정보 정렬
    patternInfos.sort((a, b) => a.index - b.index);
    
    // 패턴 사이의 공백을 조절하여 정렬
    let result = line;
    
    // 뒤에서부터 처리해서 인덱스 변화를 방지
    for (let i = patternInfos.length - 1; i >= 0; i--) {
      const info = patternInfos[i];
      const nextInfo = patternInfos[i + 1];
      
      // 현재 패턴과 다음 패턴 사이의 공백을 조절
      if (nextInfo) {
        // 현재 패턴 값과 다음 패턴 사이의 거리
        const currentGap = nextInfo.index - info.endIndex;
        // 필요한 공백의 수
        const neededPadding = info.padLength;
        
        // 공백 추가 또는 제거 필요
        if (neededPadding > 0 && currentGap < neededPadding) {
          // 공백 추가
          const spacesToAdd = neededPadding - currentGap;
          const padding = ' '.repeat(spacesToAdd);
          result = result.substring(0, info.endIndex) + padding + result.substring(info.endIndex);
        }
      } else if (i === patternInfos.length - 1) {
        // 마지막 패턴인 경우, 패턴 자체에 패딩 적용
        if (info.padLength > 0) {
          const padding = ' '.repeat(info.padLength);
          // 이미 끝에 공백이 있을 경우를 고려하여 패턴 바로 뒤에 공백 추가
          const endOfPattern = info.text.replace(/\s+$/, '');
          const paddingInsertPos = info.index + endOfPattern.length;
          result = result.substring(0, paddingInsertPos) + padding + result.substring(paddingInsertPos);
        }
      }
    }
    
    alignedLines.push(result);
  }
  
  return alignedLines;
}