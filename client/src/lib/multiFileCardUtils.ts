// 3개 파일 매칭 시스템 유틸 함수

import { MatchCard, CardMatch, CardField, LoadedFile, CardCategory, ChangeDetection } from './multiFileCardTypes';

// localStorage 키
const STORAGE_KEY_CARDS = 'multiFileCards';
const STORAGE_KEY_CATEGORIES = 'multiFileCardCategories';
const STORAGE_KEY_FILES = 'multiFileLoadedFiles';

// ==================== 파일 관리 ====================

export function 파일저장하기(files: LoadedFile[]): void {
  localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
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

// ==================== 숫자 필드 파싱 ====================

export function 숫자필드파싱하기(text: string, fileIndex: 0 | 1 | 2, lineNumber: number): CardField[] {
  const fields: CardField[] = [];

  // 패턴 1: 함수 호출 형태 파싱 (예: BalanceMods_Easy=( eType=eChar_Sectoid, iDamage=-1, ... ))
  // 공백과 '=' 사이를 라벨로, '='와 ',' 또는 ')' 사이를 값으로
  const functionPattern = /\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^,)]+)/g;
  let funcMatch;
  while ((funcMatch = functionPattern.exec(text)) !== null) {
    const value = funcMatch[2].trim();
    fields.push({
      id: `field_${Date.now()}_${fields.length}`,
      label: funcMatch[1],
      originalValue: value,
      modifiedValue: value,
      isNumeric: /^-?\d+\.?\d*%?$/.test(value),
      fileIndex,
      lineNumber
    });
  }

  // 패턴 2: 간단한 KEY=VALUE (예: ATK=10, CONVENTIONAL_COST=15)
  if (fields.length === 0) {
    const pattern1 = /([A-Z_]+)\s*=\s*(\d+\.?\d*%?)/g;
    let match1;
    while ((match1 = pattern1.exec(text)) !== null) {
      fields.push({
        id: `field_${Date.now()}_${fields.length}`,
        label: match1[1],
        originalValue: match1[2],
        modifiedValue: match1[2],
        isNumeric: true,
        fileIndex,
        lineNumber
      });
    }
  }

  // 패턴 3: 한글키=값 (예: 공격력=10, 철=5)
  if (fields.length === 0) {
    const pattern2 = /([\u4e00-\u9fa5\uac00-\ud7a3]+)\s*=\s*(\d+\.?\d*%?)/g;
    let match2;
    while ((match2 = pattern2.exec(text)) !== null) {
      fields.push({
        id: `field_${Date.now()}_${fields.length}`,
        label: match2[1],
        originalValue: match2[2],
        modifiedValue: match2[2],
        isNumeric: true,
        fileIndex,
        lineNumber
      });
    }
  }

  // 패턴 4: "라벨: 숫자" (예: Attack: 10)
  if (fields.length === 0) {
    const pattern3 = /([^:,]+):\s*(\d+\.?\d*%?)/g;
    let match3;
    while ((match3 = pattern3.exec(text)) !== null) {
      const label = match3[1].trim();
      if (label && label.length < 50) {
        fields.push({
          id: `field_${Date.now()}_${fields.length}`,
          label,
          originalValue: match3[2],
          modifiedValue: match3[2],
          isNumeric: true,
          fileIndex,
          lineNumber
        });
      }
    }
  }

  return fields;
}

export function 모든필드파싱하기(matches: CardMatch[]): CardField[] {
  const allFields: CardField[] = [];

  matches.forEach(match => {
    const numericFields = 숫자필드파싱하기(match.originalContent, match.fileIndex, match.lineNumber);
    allFields.push(...numericFields);

    // 텍스트 필드도 추가 (숫자가 없는 경우)
    if (numericFields.length === 0) {
      allFields.push({
        id: `field_${Date.now()}_${allFields.length}`,
        label: `파일${match.fileIndex + 1}_줄${match.lineNumber}`,
        originalValue: match.originalContent,
        modifiedValue: match.modifiedContent,
        isNumeric: false,
        fileIndex: match.fileIndex,
        lineNumber: match.lineNumber
      });
    }
  });

  return allFields;
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
    if (lines[oldLineNumber - 1].includes(originalContent)) {
      return oldLineNumber;
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
    if (lines[i].includes(originalContent)) {
      return i + 1; // 1-based
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
  replaceWholeLine: boolean = false
): string {
  const lines = fileContent.split('\n');

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

  return lines.join('\n');
}

export function 카드를파일에적용하기(card: MatchCard, files: LoadedFile[]): LoadedFile[] {
  // React state 불변성 유지: map으로 새 객체 생성
  return files.map(file => {
    let newContent = file.content;
    let hasChanges = false;

    if (card.isTableMode && card.fields) {
      // 테이블 모드: 필드별로 업데이트
      const fieldsForThisFile = card.fields.filter(f => f.fileIndex === file.index);

      fieldsForThisFile.forEach(field => {
        if (field.originalValue !== field.modifiedValue) {
          // 실제 줄 번호 찾기 (텍스트 기반 검색)
          const actualLineNumber = 원본에서내용찾기(newContent, field.originalValue, field.lineNumber);

          if (actualLineNumber !== null) {
            newContent = 텍스트교체하기(
              newContent,
              actualLineNumber,
              field.originalValue,
              field.modifiedValue,
              false  // 부분 교체
            );
            hasChanges = true;
          } else {
            console.warn(`파일${file.index + 1}에서 원본 내용을 찾을 수 없습니다:`, field.originalValue);
          }
        }
      });
    } else {
      // 일반 모드: 매칭별로 업데이트 (전체 줄 교체)
      const matchesForThisFile = card.matches.filter(m => m.fileIndex === file.index);

      matchesForThisFile.forEach(match => {
        if (match.originalContent !== match.modifiedContent) {
          // 실제 줄 번호 찾기 (텍스트 기반 검색)
          const actualLineNumber = 원본에서내용찾기(newContent, match.originalContent, match.lineNumber);

          if (actualLineNumber !== null) {
            newContent = 텍스트교체하기(
              newContent,
              actualLineNumber,
              match.originalContent,
              match.modifiedContent,
              true  // 전체 줄 교체
            );
            hasChanges = true;
          } else {
            console.warn(`파일${file.index + 1}에서 원본 내용을 찾을 수 없습니다:`, match.originalContent);
          }
        }
      });
    }

    // 변경사항이 있으면 새 객체 반환, 없으면 원본 반환
    if (hasChanges) {
      return {
        ...file,
        content: newContent,
        lines: newContent.split('\n')
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
  matches: CardMatch[],
  isTableMode: boolean
): MatchCard {
  const card: MatchCard = {
    id: `card_${Date.now()}`,
    name,
    categoryId,
    matches,
    isTableMode,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (isTableMode) {
    card.fields = 모든필드파싱하기(matches);
  }

  return card;
}
