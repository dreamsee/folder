// 3개 파일 매칭 시스템 유틸 함수

import { MatchCard, CardMatch, LoadedFile, CardCategory, ChangeDetection } from './multiFileCardTypes';

// localStorage 키
const STORAGE_KEY_CARDS = 'multiFileCards';
const STORAGE_KEY_CATEGORIES = 'multiFileCardCategories';
const STORAGE_KEY_FILES = 'multiFileLoadedFiles';

// ==================== 파일 관리 ====================

export function 파일저장하기(files: LoadedFile[]): void {
  // rawData는 ArrayBuffer이므로 localStorage에 저장 불가 (제외)
  const filesToSave = files.map(({ rawData, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(filesToSave));
}

export function 파일불러오기(): LoadedFile[] {
  const data = localStorage.getItem(STORAGE_KEY_FILES);
  return data ? JSON.parse(data) : [];
}

export function 파일내용가져오기(fileIndex: 0 | 1 | 2, lineNumber: number): string | null {
  const files = 파일불러오기();
  const file = files.find(f => f.index === fileIndex);

  if (!file || lineNumber < 1 || lineNumber > file.lines.length) {
    return null;
  }

  return file.lines[lineNumber - 1]; // 1-based to 0-based
}

// ==================== 카테고리 관리 ====================

export function 모든카테고리가져오기(): CardCategory[] {
  const data = localStorage.getItem(STORAGE_KEY_CATEGORIES);
  if (!data) {
    // 기본 카테고리 생성
    const defaultCategory: CardCategory = {
      id: 'default',
      name: '기본 카테고리',
      color: '#6b7280',
      order: 0
    };
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify([defaultCategory]));
    return [defaultCategory];
  }
  return JSON.parse(data);
}

export function 카테고리추가하기(name: string, color: string): CardCategory {
  const categories = 모든카테고리가져오기();
  const newCategory: CardCategory = {
    id: `category_${Date.now()}`,
    name,
    color,
    order: categories.length
  };
  categories.push(newCategory);
  localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  return newCategory;
}

export function 카테고리수정하기(categoryId: string, updatedCategory: Partial<CardCategory>): void {
  const categories = 모든카테고리가져오기();
  const index = categories.findIndex(c => c.id === categoryId);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updatedCategory };
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
  }
}

// ==================== 카드 관리 ====================

export function 모든카드가져오기(): MatchCard[] {
  const data = localStorage.getItem(STORAGE_KEY_CARDS);
  return data ? JSON.parse(data) : [];
}

export function 카드저장하기(cards: MatchCard[]): void {
  localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
}

export function 카드추가하기(card: MatchCard): void {
  const cards = 모든카드가져오기();
  cards.push(card);
  카드저장하기(cards);
}

export function 카드수정하기(cardId: string, updatedCard: Partial<MatchCard>): void {
  const cards = 모든카드가져오기();
  const index = cards.findIndex(c => c.id === cardId);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updatedCard, updatedAt: Date.now() };
    카드저장하기(cards);
  }
}

export function 카드삭제하기(cardId: string): void {
  const cards = 모든카드가져오기();
  const filtered = cards.filter(c => c.id !== cardId);
  카드저장하기(filtered);
}


// ==================== 텍스트 업데이트 ====================

// 고유 식별자 추출 (키워드 기반 매칭용)
function 식별자추출(text: string): string | null {
  const trimmed = text.trim();

  // 패턴 1: m_aItemNames[123]= 형태
  const arrayPattern = /^(m_a[A-Za-z]+\[[^\]]+\]\s*=)/;
  const arrayMatch = trimmed.match(arrayPattern);
  if (arrayMatch) return arrayMatch[1];

  // 패턴 2: Characters=( 형태 (괄호 포함)
  const functionPattern = /^([A-Za-z_][A-Za-z0-9_]*\s*=\s*\()/;
  const functionMatch = trimmed.match(functionPattern);
  if (functionMatch) return functionMatch[1];

  // 패턴 3: Weapons=( 형태 (strName="" 등 내부 파라미터 있는 경우)
  const configPattern = /^([A-Za-z_][A-Za-z0-9_]*\s*=\s*\(\s*[a-zA-Z_])/;
  const configMatch = trimmed.match(configPattern);
  if (configMatch) {
    const baseMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*\s*=\s*\()/);
    if (baseMatch) return baseMatch[1];
  }

  // 패턴 4: 일반적인 KEY=VALUE 형태
  const keyValuePattern = /^([A-Za-z_][A-Za-z0-9_]*\s*=)/;
  const keyValueMatch = trimmed.match(keyValuePattern);
  if (keyValueMatch) return keyValueMatch[1];

  return null;
}

// 두 문자열의 유사도 계산 (0~1 사이 값)
function 유사도계산(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = (s1: string, s2: string): number => {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };

  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

export function 원본에서내용찾기(fileContent: string, originalContent: string, oldLineNumber: number): number | null {
  const lines = fileContent.split('\n');

  // 0. 키워드 기반 매칭 (최우선)
  const identifier = 식별자추출(originalContent);
  if (identifier) {
    // 고유 식별자가 있으면 전체 파일에서 검색
    for (let i = 0; i < lines.length; i++) {
      const lineIdentifier = 식별자추출(lines[i]);
      if (lineIdentifier && lineIdentifier === identifier) {
        return i + 1; // 1-based
      }
    }
  }

  // 1. 원래 줄 번호에서 정확히 확인
  if (oldLineNumber > 0 && oldLineNumber <= lines.length) {
    const currentLine = lines[oldLineNumber - 1];

    // 1-1. 전체 라인이 정확히 일치하는지 확인 (trim 후)
    if (currentLine.trim() === originalContent.trim()) {
      return oldLineNumber;
    }

    // 1-2. originalContent가 전체 라인을 포함하는지 확인 (일반 모드용)
    if (originalContent.includes(currentLine.trim())) {
      return oldLineNumber;
    }

    // 1-3. 부분 매칭은 정확한 경우만 (앞뒤 문자가 구분자인 경우)
    if (currentLine.includes(originalContent)) {
      const index = currentLine.indexOf(originalContent);
      const before = index > 0 ? currentLine[index - 1] : '';
      const after = index + originalContent.length < currentLine.length ? currentLine[index + originalContent.length] : '';

      // 앞뒤가 구분자이거나 없으면 매칭
      const isSeparator = (char: string) => !char || /[\s=,;()[\]{}]/.test(char);
      if (isSeparator(before) && isSeparator(after)) {
        return oldLineNumber;
      }
    }
  }

  // 2. 주변 줄에서 유사도 검색 (±5줄)
  const searchRange = 5;
  const startIdx = Math.max(0, oldLineNumber - 1 - searchRange);
  const endIdx = Math.min(lines.length - 1, oldLineNumber - 1 + searchRange);

  let bestMatch: { line: number; similarity: number } | null = null;

  for (let i = startIdx; i <= endIdx; i++) {
    const similarity = 유사도계산(lines[i], originalContent);
    if (similarity >= 0.7) {  // 70% 이상 유사
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { line: i + 1, similarity };
      }
    }
  }

  if (bestMatch) {
    return bestMatch.line;
  }

  // 3. 전체 파일에서 정확히 검색
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];

    // 3-1. 전체 라인이 정확히 일치하는지 확인 (trim 후)
    if (currentLine.trim() === originalContent.trim()) {
      return i + 1; // 1-based
    }

    // 3-2. originalContent가 전체 라인을 포함하는지 확인 (일반 모드용)
    if (originalContent.includes(currentLine.trim())) {
      return i + 1;
    }

    // 3-3. 부분 매칭은 정확한 경우만 (앞뒤 문자가 구분자인 경우)
    if (currentLine.includes(originalContent)) {
      const index = currentLine.indexOf(originalContent);
      const before = index > 0 ? currentLine[index - 1] : '';
      const after = index + originalContent.length < currentLine.length ? currentLine[index + originalContent.length] : '';

      // 앞뒤가 구분자이거나 없으면 매칭
      const isSeparator = (char: string) => !char || /[\s=,;()[\]{}]/.test(char);
      if (isSeparator(before) && isSeparator(after)) {
        return i + 1;
      }
    }
  }

  // 4. 전체 파일에서 유사도 검색
  bestMatch = null;
  for (let i = 0; i < lines.length; i++) {
    const similarity = 유사도계산(lines[i], originalContent);
    if (similarity >= 0.7) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { line: i + 1, similarity };
      }
    }
  }

  if (bestMatch) {
    return bestMatch.line;
  }

  return null; // 찾지 못함
}

export function 텍스트교체하기(
  fileContent: string,
  lineNumber: number,
  oldContent: string,
  newContent: string,
  replaceWholeLine: boolean = false,
  lineEnding: '\r\n' | '\n' = '\n'
): string {
  // lineEnding에 맞게 줄 분리
  const lineEndingRegex = lineEnding === '\r\n' ? /\r\n/ : /\n/;
  const lines = fileContent.split(lineEndingRegex);

  if (lineNumber < 1 || lineNumber > lines.length) {
    console.error('줄 번호가 범위를 벗어났습니다:', lineNumber);
    return fileContent;
  }

  const lineIndex = lineNumber - 1;

  if (replaceWholeLine) {
    // 전체 줄 교체 (일반 모드)
    lines[lineIndex] = newContent;
  } else {
    // 부분 문자열 교체 (테이블 모드)
    lines[lineIndex] = lines[lineIndex].replace(oldContent, newContent);
  }

  return lines.join(lineEnding);
}

export function 카드를파일에적용하기(card: MatchCard, files: LoadedFile[]): LoadedFile[] {
  // React state 불변성 유지: map으로 새 객체 생성
  return files.map(file => {
    let newContent = file.content;
    let hasChanges = false;

    // 매칭별로 업데이트 (전체 줄 교체)
    const matchesForThisFile = card.matches.filter(m => m.fileIndex === file.index);

    matchesForThisFile.forEach(match => {
        if (match.originalContent !== match.modifiedContent) {
          // 줄번호 기준으로 직접 변경 (원본 내용 검증 없음)
          newContent = 텍스트교체하기(
            newContent,
            match.lineNumber,
            match.originalContent,
            match.modifiedContent,
            true,  // 전체 줄 교체
            file.lineEnding || '\n'
          );
          hasChanges = true;
        }
      });

    // 변경사항이 있으면 새 객체 반환, 없으면 원본 반환
    if (hasChanges) {
      // lineEnding에 맞게 줄 분리
      const lineEndingRegex = file.lineEnding === '\r\n' ? /\r\n/ : /\n/;
      return {
        ...file,
        content: newContent,
        lines: newContent.split(lineEndingRegex)
      };
    }

    return file;
  });
}

// 여러 카드를 한 번에 파일에 적용
export function 모든카드를파일에적용하기(cards: MatchCard[], files: LoadedFile[]): LoadedFile[] {
  // 파일별로 모든 매치를 모음
  const matchesByFile = new Map<number, CardMatch[]>();

  cards.forEach(card => {
    card.matches.forEach(match => {
      if (!matchesByFile.has(match.fileIndex)) {
        matchesByFile.set(match.fileIndex, []);
      }
      matchesByFile.get(match.fileIndex)!.push(match);
    });
  });

  // 각 파일에 대해 한 번에 적용
  return files.map(file => {
    const matchesForThisFile = matchesByFile.get(file.index);
    if (!matchesForThisFile || matchesForThisFile.length === 0) {
      return file;
    }

    // lines 배열 복사
    const lineEndingRegex = file.lineEnding === '\r\n' ? /\r\n/ : /\n/;
    const newLines = [...file.lines];
    let hasChanges = false;

    // 각 매치에 대해 직접 lines 배열 수정
    matchesForThisFile.forEach(match => {
      if (match.originalContent !== match.modifiedContent) {
        const lineIndex = match.lineNumber - 1;
        if (lineIndex >= 0 && lineIndex < newLines.length) {
          newLines[lineIndex] = match.modifiedContent;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      const newContent = newLines.join(file.lineEnding || '\n');
      return {
        ...file,
        content: newContent,
        lines: newLines
      };
    }

    return file;
  });
}

// ==================== 변경 감지 ====================

export function 변경사항감지하기(oldFiles: LoadedFile[], newFiles: LoadedFile[], cards: MatchCard[]): ChangeDetection[] {
  const detections: ChangeDetection[] = [];

  cards.forEach(card => {
    const changes: ChangeDetection['changes'] = [];

    card.matches.forEach(match => {
      const oldFile = oldFiles.find(f => f.index === match.fileIndex);
      const newFile = newFiles.find(f => f.index === match.fileIndex);

      if (!oldFile || !newFile) return;

      // 원본 내용으로 새 파일에서 위치 찾기
      const newLineNumber = 원본에서내용찾기(newFile.content, match.originalContent, match.lineNumber);

      if (newLineNumber === null) {
        // 삭제됨
        changes.push({
          fileIndex: match.fileIndex,
          oldLine: match.lineNumber,
          newLine: null,
          oldContent: match.originalContent,
          newContent: null,
          isModified: true
        });
      } else if (newLineNumber !== match.lineNumber) {
        // 줄 번호 변경됨
        const newContent = newFile.lines[newLineNumber - 1];
        changes.push({
          fileIndex: match.fileIndex,
          oldLine: match.lineNumber,
          newLine: newLineNumber,
          oldContent: match.originalContent,
          newContent,
          isModified: match.originalContent !== newContent
        });
      }
    });

    if (changes.length > 0) {
      detections.push({
        cardId: card.id,
        cardName: card.name,
        changes
      });
    }
  });

  return detections;
}

// ==================== 카드 생성 헬퍼 ====================

export function 카드생성하기(
  name: string,
  categoryId: string,
  matches: CardMatch[]
): MatchCard {
  const card: MatchCard = {
    id: `card_${Date.now()}`,
    name,
    categoryId,
    matches,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  return card;
}
