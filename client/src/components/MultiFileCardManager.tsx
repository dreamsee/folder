import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit2, FolderPlus, Plus, Upload, Grid, Save, ChevronDown, ChevronRight, Download, Tag, Eye, EyeOff, Copy, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MatchCard, LoadedFile, CardMatch, CardCategory } from '@/lib/multiFileCardTypes';
import {
  모든카드가져오기,
  카드추가하기,
  카드수정하기,
  카드삭제하기,
  모든카테고리가져오기,
  카테고리추가하기,
  카테고리수정하기,
  파일저장하기,
  파일불러오기,
  파일내용가져오기,
  카드생성하기,
  카드를파일에적용하기,
  모든필드파싱하기,
  숫자필드파싱하기
} from '@/lib/multiFileCardUtils';

export default function MultiFileCardManager() {
  const { toast } = useToast();

  // 상태 관리
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [categories, setCategories] = useState<CardCategory[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // 다이얼로그 상태
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showEditCardDialog, setShowEditCardDialog] = useState(false);
  const [showPatternCloneDialog, setShowPatternCloneDialog] = useState(false);
  const [cloneSourceCardId, setCloneSourceCardId] = useState<string | null>(null);

  // 새 카드 생성 폼
  const [newCardName, setNewCardName] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('default');
  const [newCardIsTableMode, setNewCardIsTableMode] = useState(false);
  const [newCardLines, setNewCardLines] = useState<{ file1: number[]; file2: number[]; file3: number[] }>({
    file1: [],
    file2: [],
    file3: []
  });
  const [linePreviews, setLinePreviews] = useState<{ [key: string]: string[] }>({});
  const [parsedTablePreview, setParsedTablePreview] = useState<{ [key: string]: any[] }>({});

  // 파싱 규칙
  const [labelStartDelim, setLabelStartDelim] = useState(' ');
  const [labelEndDelim, setLabelEndDelim] = useState('=');
  const [valueStartDelim, setValueStartDelim] = useState('=');
  const [valueEndDelims, setValueEndDelims] = useState<string[]>([',']);

  // 탭별 스크롤 위치 저장
  const [scrollPositions, setScrollPositions] = useState<{ file1: number; file2: number; file3: number }>({
    file1: 0,
    file2: 0,
    file3: 0
  });
  const scrollRefs = useRef<{ file1: HTMLDivElement | null; file2: HTMLDivElement | null; file3: HTMLDivElement | null }>({
    file1: null,
    file2: null,
    file3: null
  });

  // 새 카테고리 폼
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  // 빠른 태그 모드
  interface QuickTagSelection {
    subCategoryName: string;
    lines: {
      file1: number[];
      file2: number[];
      file3: number[];
    };
  }
  const [quickTagMode, setQuickTagMode] = useState(false);
  const [quickTagCategoryId, setQuickTagCategoryId] = useState<string | null>(null);
  const [quickTagSelections, setQuickTagSelections] = useState<Map<string, QuickTagSelection>>(new Map());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileIndex: 0 | 1 | 2; lineNum: number } | null>(null);
  const [tempSelectedLines, setTempSelectedLines] = useState<{ file1: number[]; file2: number[]; file3: number[] }>({
    file1: [],
    file2: [],
    file3: []
  });

  // 카드 편집 다이얼로그 원본 보기/안보기
  const [showOriginal, setShowOriginal] = useState(true);

  // 패턴 복제 폼
  const [cloneCount, setCloneCount] = useState(1);
  const [cloneOffset, setCloneOffset] = useState(1);
  const [cloneCardNames, setCloneCardNames] = useState<string[]>([]);

  // 매치 추가 폼
  const [showAddMatchForm, setShowAddMatchForm] = useState(false);
  const [newMatchFileIndex, setNewMatchFileIndex] = useState<0 | 1 | 2>(0);
  const [selectedMatchesByFile, setSelectedMatchesByFile] = useState<Map<number, number[]>>(new Map());

  // 초기 로드
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFiles(파일불러오기());
    setCards(모든카드가져오기());
    setCategories(모든카테고리가져오기());
  };

  // 파일 업로드
  const handleFileUpload = async (fileIndex: 0 | 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const lines = content.split(/\r?\n/);

    const newFile: LoadedFile = {
      index: fileIndex,
      name: file.name,
      content,
      lines
    };

    const updatedFiles = files.filter(f => f.index !== fileIndex);
    updatedFiles.push(newFile);
    updatedFiles.sort((a, b) => a.index - b.index);

    setFiles(updatedFiles);
    파일저장하기(updatedFiles);

    toast({
      title: "파일 업로드 완료",
      description: `파일${fileIndex + 1}: ${file.name} (${lines.length}줄)`
    });
  };

  // 줄 번호 입력시 미리보기
  useEffect(() => {
    const previews: { [key: string]: string[] } = {};

    if (newCardLines.file1.length > 0) {
      previews.file1 = newCardLines.file1.map(lineNum => (파일내용가져오기(0, lineNum) || '').replace(/[\r\n]+$/, '')).filter(c => c);
    }
    if (newCardLines.file2.length > 0) {
      previews.file2 = newCardLines.file2.map(lineNum => (파일내용가져오기(1, lineNum) || '').replace(/[\r\n]+$/, '')).filter(c => c);
    }
    if (newCardLines.file3.length > 0) {
      previews.file3 = newCardLines.file3.map(lineNum => (파일내용가져오기(2, lineNum) || '').replace(/[\r\n]+$/, '')).filter(c => c);
    }

    setLinePreviews(previews);
  }, [newCardLines, files]);

  // 커스텀 파싱 함수
  const customParse = (text: string, fileIndex: 0 | 1 | 2, lineNumber: number) => {
    const fields: any[] = [];

    // 구분자 검증
    if (!labelStartDelim || !labelEndDelim || !valueStartDelim || valueEndDelims.length === 0) {
      return fields;
    }

    let pos = 0;
    while (pos < text.length) {
      // 라벨 시작 찾기
      const labelStartIdx = text.indexOf(labelStartDelim, pos);
      if (labelStartIdx === -1) break;

      // 라벨 끝 찾기
      const labelEndIdx = text.indexOf(labelEndDelim, labelStartIdx + labelStartDelim.length);
      if (labelEndIdx === -1) break;

      // 라벨 추출
      const label = text.substring(labelStartIdx + labelStartDelim.length, labelEndIdx).trim();

      // 값 시작 찾기
      const valueStartIdx = labelEndIdx + labelEndDelim.length;
      if (valueStartDelim && valueStartDelim !== labelEndDelim) {
        const actualValueStartIdx = text.indexOf(valueStartDelim, valueStartIdx);
        if (actualValueStartIdx === -1) break;
      }

      // 값 끝 찾기 (여러 구분자 중 가장 가까운 것)
      let valueEndIdx = -1;
      for (const delim of valueEndDelims) {
        const idx = text.indexOf(delim, valueStartIdx);
        if (idx !== -1 && (valueEndIdx === -1 || idx < valueEndIdx)) {
          valueEndIdx = idx;
        }
      }
      if (valueEndIdx === -1) valueEndIdx = text.length;

      // 값 추출
      const value = text.substring(valueStartIdx, valueEndIdx).trim();

      if (label) {
        fields.push({
          id: `field_${fileIndex}_${lineNumber}_${fields.length}_${Math.random().toString(36).substr(2, 9)}`,
          label,
          originalValue: value,
          modifiedValue: value,
          isNumeric: /^-?\d+\.?\d*%?$/.test(value),
          fileIndex,
          lineNumber
        });
      }

      pos = valueEndIdx + 1;
    }

    return fields;
  };

  // 테이블 모드일 때 파싱 미리보기
  useEffect(() => {
    if (!newCardIsTableMode) {
      setParsedTablePreview({});
      return;
    }

    const parsed: { [key: string]: any[] } = {};

    if (newCardLines.file1.length > 0 && linePreviews.file1) {
      parsed.file1 = newCardLines.file1.map((lineNum, idx) => {
        const content = linePreviews.file1[idx];
        const fields = customParse(content, 0, lineNum);
        return { lineNum, content, fields };
      });
    }
    if (newCardLines.file2.length > 0 && linePreviews.file2) {
      parsed.file2 = newCardLines.file2.map((lineNum, idx) => {
        const content = linePreviews.file2[idx];
        const fields = customParse(content, 1, lineNum);
        return { lineNum, content, fields };
      });
    }
    if (newCardLines.file3.length > 0 && linePreviews.file3) {
      parsed.file3 = newCardLines.file3.map((lineNum, idx) => {
        const content = linePreviews.file3[idx];
        const fields = customParse(content, 2, lineNum);
        return { lineNum, content, fields };
      });
    }

    setParsedTablePreview(parsed);
  }, [newCardIsTableMode, newCardLines, linePreviews, labelStartDelim, labelEndDelim, valueStartDelim, valueEndDelims]);

  // 카드 생성
  const handleCreateCard = () => {
    if (!newCardName.trim()) {
      toast({
        title: "오류",
        description: "카드 이름을 입력하세요",
        variant: "destructive"
      });
      return;
    }

    const matches: CardMatch[] = [];

    // 파일1
    if (newCardLines.file1.length > 0 && linePreviews.file1) {
      newCardLines.file1.forEach((lineNum, index) => {
        const content = linePreviews.file1[index];
        matches.push({
          fileIndex: 0,
          lineNumber: lineNum,
          originalContent: content,
          modifiedContent: content,
          startLine: lineNum - 1,
          startChar: 0,
          endLine: lineNum - 1,
          endChar: content.length
        });
      });
    }

    // 파일2
    if (newCardLines.file2.length > 0 && linePreviews.file2) {
      newCardLines.file2.forEach((lineNum, index) => {
        const content = linePreviews.file2[index];
        matches.push({
          fileIndex: 1,
          lineNumber: lineNum,
          originalContent: content,
          modifiedContent: content,
          startLine: lineNum - 1,
          startChar: 0,
          endLine: lineNum - 1,
          endChar: content.length
        });
      });
    }

    // 파일3
    if (newCardLines.file3.length > 0 && linePreviews.file3) {
      newCardLines.file3.forEach((lineNum, index) => {
        const content = linePreviews.file3[index];
        matches.push({
          fileIndex: 2,
          lineNumber: lineNum,
          originalContent: content,
          modifiedContent: content,
          startLine: lineNum - 1,
          startChar: 0,
          endLine: lineNum - 1,
          endChar: content.length
        });
      });
    }

    if (matches.length === 0) {
      toast({
        title: "오류",
        description: "최소 1개 이상의 줄을 선택하세요",
        variant: "destructive"
      });
      return;
    }

    const newCard = 카드생성하기(
      newCardName.trim(),
      newCardCategory,
      matches,
      newCardIsTableMode
    );

    카드추가하기(newCard);
    setCards([...cards, newCard]);

    // 폼 초기화
    setNewCardName('');
    setNewCardCategory('default');
    setNewCardIsTableMode(false);
    setNewCardLines({ file1: [], file2: [], file3: [] });
    setLinePreviews({});
    setShowNewCardDialog(false);

    toast({
      title: "카드 생성 완료",
      description: `${newCard.name} 카드가 생성되었습니다`
    });
  };

  // 카테고리 생성
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory = 카테고리추가하기(newCategoryName.trim(), newCategoryColor);
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
    setShowNewCategoryDialog(false);

    toast({
      title: "카테고리 생성 완료",
      description: `${newCategory.name} 카테고리가 생성되었습니다`
    });
  };

  // 카드 삭제
  const handleDeleteCard = (cardId: string) => {
    if (!confirm('정말 이 카드를 삭제하시겠습니까?')) return;

    카드삭제하기(cardId);
    setCards(cards.filter(c => c.id !== cardId));

    toast({
      title: "카드 삭제 완료",
      description: "카드가 삭제되었습니다"
    });
  };

  // 매치 추가
  const handleAddMatch = () => {
    if (!selectedCardId) return;

    // 모든 파일에서 선택된 줄들을 모음
    const allNewMatches: CardMatch[] = [];
    let totalCount = 0;

    selectedMatchesByFile.forEach((lineNumbers, fileIndex) => {
      const file = files.find(f => f.index === fileIndex);
      if (!file || lineNumbers.length === 0) return;

      lineNumbers.forEach(lineNumber => {
        const lineContent = file.lines[lineNumber - 1]?.replace(/[\r\n]+$/, '') || '';
        allNewMatches.push({
          fileIndex: fileIndex as 0 | 1 | 2,
          lineNumber: lineNumber,
          originalContent: lineContent,
          modifiedContent: lineContent,
          startLine: lineNumber - 1,
          startChar: 0,
          endLine: lineNumber - 1,
          endChar: lineContent.length
        });
        totalCount++;
      });
    });

    if (allNewMatches.length === 0) {
      toast({
        title: "입력 오류",
        description: "줄을 선택해주세요",
        variant: "destructive"
      });
      return;
    }

    setCards(prev => prev.map(card => {
      if (card.id !== selectedCardId) return card;
      return {
        ...card,
        matches: [...card.matches, ...allNewMatches]
      };
    }));

    // 로컬스토리지 업데이트
    const updatedCard = cards.find(c => c.id === selectedCardId);
    if (updatedCard) {
      카드수정하기(selectedCardId, {
        matches: [...updatedCard.matches, ...allNewMatches]
      });
    }

    setShowAddMatchForm(false);
    setSelectedMatchesByFile(new Map());

    toast({
      title: "매치 추가 완료",
      description: `${totalCount}개 줄이 추가되었습니다`
    });
  };

  // 패턴 복제
  const handlePatternClone = () => {
    if (!cloneSourceCardId) return;

    const sourceCard = cards.find(c => c.id === cloneSourceCardId);
    if (!sourceCard) return;

    const newCards: MatchCard[] = [];

    for (let i = 0; i < cloneCount; i++) {
      const offsetAmount = (i + 1) * cloneOffset;

      // matches 복제 및 줄 번호 오프셋 적용 + 실제 파일 내용 가져오기
      const newMatches: CardMatch[] = sourceCard.matches.map(match => {
        const newLineNumber = match.lineNumber + offsetAmount;
        const file = files.find(f => f.index === match.fileIndex);
        const newContent = (file?.lines[newLineNumber - 1]?.replace(/[\r\n]+$/, '')) || match.originalContent;

        return {
          ...match,
          lineNumber: newLineNumber,
          originalContent: newContent,
          modifiedContent: newContent
        };
      });

      // fields 복제 및 줄 번호 오프셋 적용 + 실제 파일 내용 가져오기 (테이블 모드인 경우)
      const newFields = sourceCard.fields?.map(field => {
        const newLineNumber = field.lineNumber + offsetAmount;
        const file = files.find(f => f.index === field.fileIndex);
        const newContent = (file?.lines[newLineNumber - 1]?.replace(/[\r\n]+$/, '')) || field.originalValue;

        // 필드 값 파싱 (테이블 모드)
        let parsedValue = newContent;
        if (sourceCard.isTableMode && newContent) {
          const parsed = 모든필드파싱하기(
            [newContent],
            labelStartDelim,
            labelEndDelim,
            valueStartDelim,
            valueEndDelims
          );
          if (parsed.length > 0) {
            const matchingField = parsed.find(p => p.label === field.label);
            if (matchingField) {
              parsedValue = matchingField.value;
            }
          }
        }

        return {
          ...field,
          id: `field-${Date.now()}-${Math.random()}`,
          lineNumber: newLineNumber,
          originalValue: parsedValue,
          modifiedValue: parsedValue
        };
      });

      // 이름이 비어있으면 자동 생성
      const cardName = cloneCardNames[i]?.trim() || `${sourceCard.name}_복제${i + 1}`;

      const newCard: MatchCard = {
        id: `card-${Date.now()}-${i}`,
        name: cardName,
        categoryId: sourceCard.categoryId,
        matches: newMatches,
        isTableMode: sourceCard.isTableMode,
        fields: newFields
      };

      newCards.push(newCard);
    }

    // 카드 추가 및 저장
    newCards.forEach(card => 카드추가하기(card));
    setCards([...cards, ...newCards]);

    toast({
      title: "패턴 복제 완료",
      description: `${cloneCount}개의 카드가 생성되었습니다`
    });

    setShowPatternCloneDialog(false);
  };

  // 카드 편집 - 필드 값 변경
  const handleFieldChange = (cardId: string, fieldId: string, newValue: string) => {
    setCards(prev => prev.map(card => {
      if (card.id !== cardId) return card;

      return {
        ...card,
        fields: card.fields?.map(field =>
          field.id === fieldId ? { ...field, modifiedValue: newValue } : field
        )
      };
    }));
  };

  // 카드를 파일에 적용
  const handleApplyCardToFiles = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // 1. 파일에 적용
    const updatedFiles = 카드를파일에적용하기(card, files);
    setFiles(updatedFiles);
    파일저장하기(updatedFiles);

    // 2. 카드 업데이트 (originalContent를 modifiedContent로) - 불변성 유지
    const updatedCard = {
      ...card,
      matches: card.matches.map(match => ({
        ...match,
        originalContent: match.modifiedContent
      })),
      fields: card.fields?.map(field => ({
        ...field,
        originalValue: field.modifiedValue
      }))
    };

    // 3. State 업데이트
    setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));

    // 4. 로컬스토리지 저장
    카드수정하기(cardId, updatedCard);

    toast({
      title: "적용 완료",
      description: `${card.name} 카드의 변경사항이 파일에 적용되었습니다`
    });
  };

  // 파일 다운로드
  const handleDownloadFile = (fileIndex: 0 | 1 | 2) => {
    const file = files.find(f => f.index === fileIndex);
    if (!file) return;

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 카테고리 접기/펼치기
  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 수정본 JSON 저장
  const handleExportModifications = () => {
    const exportData = {
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        order: cat.order
      })),
      cards: cards.map(card => ({
        id: card.id,
        name: card.name,
        categoryId: card.categoryId,
        isTableMode: card.isTableMode,
        matches: card.matches.map(match => {
          const file = files.find(f => f.index === match.fileIndex);
          return {
            fileName: file?.name || `파일${match.fileIndex + 1}`,
            fileIndex: match.fileIndex,
            lineNumber: match.lineNumber,
            originalContent: match.originalContent,
            modifiedContent: match.modifiedContent
          };
        }),
        fields: card.fields?.map(field => {
          const file = files.find(f => f.index === field.fileIndex);
          return {
            id: field.id,
            label: field.label,
            originalValue: field.originalValue,
            modifiedValue: field.modifiedValue,
            fileName: file?.name || `파일${field.fileIndex + 1}`,
            fileIndex: field.fileIndex,
            lineNumber: field.lineNumber
          };
        })
      }))
    };

    // 날짜 형식: YYYY-MM-DD
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `카테고리${categories.length}개_카드${cards.length}개_${dateStr}.json`;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "내보내기 완료",
      description: "카테고리와 카드 정보가 JSON 파일로 저장되었습니다"
    });
  };

  // 수정본 JSON 불러오기
  const handleImportModifications = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const importData = JSON.parse(content);

      // 구버전 호환성: 배열이면 cards만 있는 것으로 간주
      const isOldFormat = Array.isArray(importData);
      const importedCategories = isOldFormat ? [] : (importData.categories || []);
      const importedCards = isOldFormat ? importData : (importData.cards || []);

      let createdCategoryCount = 0;
      let createdCardCount = 0;

      // 1. 카테고리 완전 교체 (기존 카테고리 삭제)
      const importedCategoriesList: CardCategory[] = importedCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        color: cat.color || '#3b82f6',
        order: cat.order || 0
      }));

      // 기본 카테고리가 없으면 추가
      if (!importedCategoriesList.find(c => c.id === 'default')) {
        importedCategoriesList.unshift({
          id: 'default',
          name: '기본 카테고리',
          color: '#6b7280',
          order: 0
        });
      }

      setCategories(importedCategoriesList);
      localStorage.setItem('multiFileCardCategories', JSON.stringify(importedCategoriesList));
      createdCategoryCount = importedCategoriesList.length;

      // 2. 카드 완전 교체 (기존 카드 삭제, JSON의 카드만 사용)
      const importedCardsList: MatchCard[] = importedCards.map((mod: any) => {
        // matches의 fileIndex를 현재 로드된 파일명으로 재매핑
        const remappedMatches = (mod.matches || []).map((match: any) => {
          const currentFile = files.find(f => f.name === match.fileName);
          return {
            fileIndex: currentFile?.index ?? match.fileIndex,
            lineNumber: match.lineNumber,
            originalContent: match.originalContent,
            modifiedContent: match.modifiedContent
          };
        });

        // fields의 fileIndex도 재매핑
        const remappedFields = mod.fields?.map((field: any) => {
          const currentFile = files.find(f => f.name === field.fileName);
          return {
            id: field.id,
            label: field.label,
            originalValue: field.originalValue,
            modifiedValue: field.modifiedValue,
            fileIndex: currentFile?.index ?? field.fileIndex,
            lineNumber: field.lineNumber,
            isNumeric: /^-?\d+\.?\d*%?$/.test(field.originalValue)
          };
        });

        return {
          id: mod.id,
          name: mod.name,
          categoryId: mod.categoryId || 'default',
          isTableMode: mod.isTableMode || false,
          matches: remappedMatches,
          fields: remappedFields || undefined,
          createdAt: mod.createdAt || Date.now(),
          updatedAt: Date.now()
        };
      });

      setCards(importedCardsList);
      localStorage.setItem('multiFileCards', JSON.stringify(importedCardsList));
      createdCardCount = importedCardsList.length;

      toast({
        title: "불러오기 완료",
        description: `카테고리 ${createdCategoryCount}개, 카드 ${createdCardCount}개 불러옴`
      });
    } catch (error) {
      toast({
        title: "불러오기 실패",
        description: "JSON 파일 형식이 올바르지 않습니다",
        variant: "destructive"
      });
    }
  };

  // 빠른 태그: 선택된 줄을 부카테고리에 추가
  const handleAddToSubCategory = (subCategoryName: string) => {
    setQuickTagSelections(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(subCategoryName);

      if (existing) {
        // 기존 부카테고리에 추가
        newMap.set(subCategoryName, {
          subCategoryName,
          lines: {
            file1: [...new Set([...existing.lines.file1, ...tempSelectedLines.file1])].sort((a, b) => a - b),
            file2: [...new Set([...existing.lines.file2, ...tempSelectedLines.file2])].sort((a, b) => a - b),
            file3: [...new Set([...existing.lines.file3, ...tempSelectedLines.file3])].sort((a, b) => a - b)
          }
        });
      } else {
        // 새 부카테고리 생성
        newMap.set(subCategoryName, {
          subCategoryName,
          lines: { ...tempSelectedLines }
        });
      }

      return newMap;
    });

    // 임시 선택 초기화
    setTempSelectedLines({ file1: [], file2: [], file3: [] });
    setContextMenu(null);

    toast({
      title: "태그 추가",
      description: `"${subCategoryName}"에 줄이 추가되었습니다`
    });
  };

  // 빠른 태그: 모든 태그된 선택을 카드로 일괄 생성
  const handleBulkCreateCards = () => {
    if (!quickTagCategoryId || quickTagSelections.size === 0) return;

    let createdCount = 0;

    quickTagSelections.forEach((selection, subCategoryName) => {
      const matches: any[] = [];

      // file1 매칭
      selection.lines.file1.forEach(lineNum => {
        const content = 파일내용가져오기(0, lineNum)?.replace(/[\r\n]+$/, '');
        if (content) {
          matches.push({
            fileIndex: 0,
            lineNumber: lineNum,
            originalContent: content,
            modifiedContent: content
          });
        }
      });

      // file2 매칭
      selection.lines.file2.forEach(lineNum => {
        const content = 파일내용가져오기(1, lineNum)?.replace(/[\r\n]+$/, '');
        if (content) {
          matches.push({
            fileIndex: 1,
            lineNumber: lineNum,
            originalContent: content,
            modifiedContent: content
          });
        }
      });

      // file3 매칭
      selection.lines.file3.forEach(lineNum => {
        const content = 파일내용가져오기(2, lineNum)?.replace(/[\r\n]+$/, '');
        if (content) {
          matches.push({
            fileIndex: 2,
            lineNumber: lineNum,
            originalContent: content,
            modifiedContent: content
          });
        }
      });

      if (matches.length > 0) {
        const card = 카드생성하기(
          subCategoryName,
          quickTagCategoryId,
          matches,
          false
        );
        카드추가하기(card);
        createdCount++;
      }
    });

    // 초기화
    setQuickTagMode(false);
    setQuickTagCategoryId(null);
    setQuickTagSelections(new Map());
    setTempSelectedLines({ file1: [], file2: [], file3: [] });
    setShowNewCardDialog(false);

    toast({
      title: "카드 생성 완료",
      description: `${createdCount}개의 카드가 생성되었습니다`
    });

    // 카드 목록 새로고침
    setCards(모든카드가져오기());
  };

  // 카테고리별 카드 그룹화
  const cardsByCategory = categories.map(category => ({
    category,
    cards: cards.filter(card => card.categoryId === category.id)
  }));

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="space-y-6">
      {/* 파일 업로드 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>파일 업로드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(index => {
              const file = files.find(f => f.index === index);
              return (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">파일 {index + 1}</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".txt,.ini,.xml,.json"
                      onChange={(e) => handleFileUpload(index as 0 | 1 | 2, e)}
                      className="text-xs"
                    />
                  </div>
                  {file && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>{file.name}</div>
                      <div>{file.lines.length}줄</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadFile(index as 0 | 1 | 2)}
                        className="h-6 text-xs"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        다운로드
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 카드 관리 섹션 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">매칭 카드</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // 모든 카테고리가 접혀있는지 확인
              const allCollapsed = categories.every(cat => collapsedCategories.has(cat.id));

              if (allCollapsed) {
                // 전체 펼치기
                setCollapsedCategories(new Set());
              } else {
                // 전체 접기
                setCollapsedCategories(new Set(categories.map(c => c.id)));
              }
            }}
            className="h-9 w-9 p-0"
            title={categories.every(cat => collapsedCategories.has(cat.id)) ? "전체 펼치기" : "전체 접기"}
          >
            {categories.every(cat => collapsedCategories.has(cat.id)) ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportModifications} variant="outline" size="sm" disabled={cards.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            JSON 내보내기
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                JSON 불러오기
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImportModifications}
              className="hidden"
            />
          </label>
          <Button onClick={() => setShowNewCategoryDialog(true)} variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            카테고리 추가
          </Button>
        </div>
      </div>

      {/* 카드 목록 */}
      <div className="space-y-1">
        {cardsByCategory.map(({ category, cards: categoryCards }) => {
          const isCollapsed = collapsedCategories.has(category.id);
          return (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors flex-1"
                  onClick={() => toggleCategory(category.id)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {editingCategoryId === category.id ? (
                    <Input
                      value={category.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setCategories(prev => prev.map(c => c.id === category.id ? { ...c, name: newName } : c));
                        카테고리수정하기(category.id, { name: newName });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => setEditingCategoryId(null)}
                      autoFocus
                      className="text-lg h-7 px-2"
                    />
                  ) : (
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  )}
                  <Badge variant="secondary">{categoryCards.length}</Badge>
                </div>
                {editingCategoryId !== category.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategoryId(category.id);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (files.length === 0) {
                          toast({
                            title: "파일을 먼저 업로드하세요",
                            description: "카드를 생성하려면 파일을 업로드해야 합니다",
                            variant: "destructive"
                          });
                          return;
                        }
                        setNewCardCategory(category.id);
                        setShowNewCardDialog(true);
                      }}
                      className="h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      카드 추가
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            {!isCollapsed && (
            <CardContent>
              {categoryCards.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  카드가 없습니다
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryCards.map(card => {
                    const isExpanded = expandedCardId === card.id;
                    return (
                    <Card key={card.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{card.name}</CardTitle>
                          <div className="flex items-center gap-1">
                            {card.isTableMode && (
                              <Badge variant="outline" className="text-xs">
                                <Grid className="h-3 w-3 mr-1" />
                                테이블
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCloneSourceCardId(card.id);
                                setShowPatternCloneDialog(true);
                                setCloneCount(1);
                                setCloneOffset(1);
                                setCloneCardNames(['']);
                              }}
                              className="h-6 w-6 p-0"
                              title="패턴 복제"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCardId(card.id);
                              }}
                              className="h-6 w-6 p-0"
                              title="편집 (매치 추가)"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(card.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent
                        className="cursor-pointer"
                        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                      >
                        {!isExpanded ? (
                          <div className="text-xs space-y-1">
                            {card.matches.map((match, idx) => (
                              <div key={idx} className="text-gray-600 truncate">
                                파일{match.fileIndex + 1} {match.lineNumber}줄
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            {card.matches.map((match, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="text-xs text-gray-500">
                                  파일{match.fileIndex + 1} {match.lineNumber}줄
                                </div>
                                <textarea
                                  value={match.modifiedContent}
                                  onChange={(e) => {
                                    setCards(prev => prev.map(c => {
                                      if (c.id !== card.id) return c;
                                      return {
                                        ...c,
                                        matches: c.matches.map((m, i) =>
                                          i === idx ? { ...m, modifiedContent: e.target.value } : m
                                        )
                                      };
                                    }));
                                  }}
                                  className="w-full text-xs p-2 border border-gray-300 rounded resize-y min-h-[32px]"
                                  rows={3}
                                  spellCheck={false}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            )}
          </Card>
          );
        })}
      </div>

      {/* 새 카드 생성 다이얼로그 */}
      <Dialog
        open={showNewCardDialog}
        onOpenChange={(open) => {
          // 컨텍스트 메뉴가 열려있을 때는 다이얼로그가 닫히지 않도록
          if (!open && contextMenu) {
            return;
          }
          setShowNewCardDialog(open);
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>새 카드 생성</DialogTitle>
            <DialogDescription>
              {quickTagMode
                ? "빠른 태그 모드: Ctrl+클릭으로 줄 선택 → 우클릭하여 부카테고리에 추가"
                : "3개 파일의 줄 번호를 선택하여 카드를 생성합니다"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-sm font-medium">카드 이름</label>
              <Input
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="예: 검, 창, 활"
              />
            </div>

            <div>
              <label className="text-sm font-medium">카테고리</label>
              <Select value={newCardCategory} onValueChange={setNewCardCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCardIsTableMode}
                  onChange={(e) => setNewCardIsTableMode(e.target.checked)}
                  className="rounded"
                />
                <label className="text-sm font-medium">테이블 모드 (숫자 편집 최적화)</label>
              </div>

              <Button
                size="sm"
                variant={quickTagMode ? "default" : "outline"}
                onClick={() => {
                  if (quickTagMode) {
                    setQuickTagMode(false);
                    setQuickTagSelections(new Map());
                    setTempSelectedLines({ file1: [], file2: [], file3: [] });
                  } else {
                    setQuickTagMode(true);
                    setQuickTagCategoryId(newCardCategory);
                    setQuickTagSelections(new Map());
                    setTempSelectedLines({ file1: [], file2: [], file3: [] });
                  }
                }}
              >
                <Grid className="h-4 w-4 mr-1" />
                {quickTagMode ? '빠른 태그 종료' : '빠른 태그 모드'}
              </Button>
            </div>

            {quickTagMode && quickTagSelections.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
                <div className="text-sm font-medium text-gray-700">태그된 항목 ({quickTagSelections.size}개):</div>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {Array.from(quickTagSelections.entries()).map(([subCatName, selection]) => {
                    const totalLines = selection.lines.file1.length + selection.lines.file2.length + selection.lines.file3.length;
                    return (
                      <div key={subCatName} className="bg-white border border-gray-200 rounded p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{subCatName}</span>
                          <Badge variant="secondary" className="text-[10px]">{totalLines}줄</Badge>
                        </div>
                        <div className="text-gray-600 space-y-0.5">
                          {selection.lines.file1.length > 0 && <div>파일1: {selection.lines.file1.join(', ')}</div>}
                          {selection.lines.file2.length > 0 && <div>파일2: {selection.lines.file2.join(', ')}</div>}
                          {selection.lines.file3.length > 0 && <div>파일3: {selection.lines.file3.join(', ')}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {newCardIsTableMode && (
              <div className="bg-gray-50 p-3 rounded-md space-y-3 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">파싱 규칙 설정</div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">제목 열 시작</label>
                    <Input
                      value={labelStartDelim}
                      onChange={(e) => setLabelStartDelim(e.target.value)}
                      placeholder="예: 띄어쓰기"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">제목 열 끝</label>
                    <Input
                      value={labelEndDelim}
                      onChange={(e) => setLabelEndDelim(e.target.value)}
                      placeholder="예: ="
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">값 시작</label>
                    <Input
                      value={valueStartDelim}
                      onChange={(e) => setValueStartDelim(e.target.value)}
                      placeholder="예: ="
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">값 끝 구분자</label>
                    <div className="space-y-1">
                      {valueEndDelims.map((delim, idx) => (
                        <div key={idx} className="flex gap-1">
                          <Input
                            value={delim}
                            onChange={(e) => {
                              const newDelims = [...valueEndDelims];
                              newDelims[idx] = e.target.value;
                              setValueEndDelims(newDelims);
                            }}
                            placeholder="예: ,"
                            className="h-8 text-xs flex-1"
                          />
                          {valueEndDelims.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setValueEndDelims(valueEndDelims.filter((_, i) => i !== idx))}
                              className="h-8 px-2"
                            >
                              -
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setValueEndDelims([...valueEndDelims, ')'])}
                        className="h-8 text-xs w-full"
                      >
                        + 구분자 추가
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  예시: "BalanceMods_Easy=( eType=eChar_Sectoid, iDamage=-1 )" 에서<br/>
                  제목 열: " " ~ "=" 사이 (eType, iDamage)<br/>
                  값: "=" ~ "," 또는 ")" 사이 (eChar_Sectoid, -1)
                </div>
              </div>
            )}

            <Tabs defaultValue="file1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {[0, 1, 2].map(index => {
                  const file = files.find(f => f.index === index);
                  const key = `file${index + 1}` as 'file1' | 'file2' | 'file3';
                  const selectedLines = newCardLines[key];

                  return (
                    <TabsTrigger key={index} value={key}>
                      파일 {index + 1}
                      {file && ` (${file.name})`}
                      {selectedLines.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedLines.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {[0, 1, 2].map(index => {
                const file = files.find(f => f.index === index);
                const key = `file${index + 1}` as 'file1' | 'file2' | 'file3';
                const selectedLines = newCardLines[key];

                const toggleLine = (lineNum: number) => {
                  const currentLines = newCardLines[key];
                  if (currentLines.includes(lineNum)) {
                    setNewCardLines({
                      ...newCardLines,
                      [key]: currentLines.filter(l => l !== lineNum)
                    });
                  } else {
                    setNewCardLines({
                      ...newCardLines,
                      [key]: [...currentLines, lineNum].sort((a, b) => a - b)
                    });
                  }
                };

                return (
                  <TabsContent key={index} value={key} className="space-y-3 mt-3">
                    <div className="text-sm text-gray-600">
                      {selectedLines.length > 0 && `선택된 줄: ${selectedLines.join(', ')}`}
                    </div>

                    {file ? (
                      <div
                        ref={(el) => {
                          scrollRefs.current[key] = el;
                          // 스크롤 위치 복원
                          if (el && scrollPositions[key] > 0) {
                            el.scrollTop = scrollPositions[key];
                          }
                        }}
                        onScroll={(e) => {
                          // 스크롤 위치 저장
                          const target = e.currentTarget;
                          setScrollPositions(prev => ({
                            ...prev,
                            [key]: target.scrollTop
                          }));
                        }}
                        onContextMenu={(e) => {
                          // 빠른 태그 모드에서는 기본 컨텍스트 메뉴 차단
                          if (quickTagMode) {
                            e.preventDefault();
                          }
                        }}
                        className="border rounded-md max-h-96 overflow-auto bg-gray-50"
                      >
                        <div className="inline-block min-w-full">
                          {file.lines.map((line, lineIndex) => {
                            const lineNum = lineIndex + 1;
                            const isSelected = selectedLines.includes(lineNum);
                            const isTempSelected = quickTagMode && tempSelectedLines[key].includes(lineNum);

                            // 이미 태그된 줄인지 확인
                            let taggedSubCategory: string | null = null;
                            if (quickTagMode) {
                              for (const [subCatName, selection] of quickTagSelections) {
                                if (selection.lines[key].includes(lineNum)) {
                                  taggedSubCategory = subCatName;
                                  break;
                                }
                              }
                            }

                            return (
                              <div
                                key={lineIndex}
                                onClick={(e) => {
                                  if (quickTagMode) {
                                    // 빠른 태그 모드: Ctrl+클릭으로만 임시 선택
                                    if (e.ctrlKey || e.metaKey) {
                                      setTempSelectedLines(prev => {
                                        const current = prev[key];
                                        if (current.includes(lineNum)) {
                                          return { ...prev, [key]: current.filter(l => l !== lineNum) };
                                        } else {
                                          return { ...prev, [key]: [...current, lineNum].sort((a, b) => a - b) };
                                        }
                                      });
                                    }
                                  } else {
                                    // 일반 모드: 기존 동작
                                    toggleLine(lineNum);
                                  }
                                }}
                                onContextMenu={(e) => {
                                  if (quickTagMode) {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    // 임시 선택된 줄이 없으면 현재 줄만 선택
                                    if (tempSelectedLines[key].length === 0 && !tempSelectedLines.file1.length && !tempSelectedLines.file2.length && !tempSelectedLines.file3.length) {
                                      setTempSelectedLines({ file1: [], file2: [], file3: [], [key]: [lineNum] });
                                    }

                                    setContextMenu({
                                      x: e.clientX,
                                      y: e.clientY,
                                      fileIndex: index as 0 | 1 | 2,
                                      lineNum
                                    });
                                  }
                                }}
                                className={`px-3 py-1 text-xs cursor-pointer hover:bg-blue-50 transition-colors flex gap-2 ${
                                  taggedSubCategory
                                    ? 'bg-green-100 border-l-2 border-green-500'
                                    : isTempSelected
                                    ? 'bg-yellow-100 border-l-2 border-yellow-500'
                                    : isSelected
                                    ? 'bg-blue-100 font-medium'
                                    : ''
                                }`}
                              >
                                <span className="text-gray-400 min-w-[2rem] text-right flex-shrink-0">{lineNum}</span>
                                <span className="whitespace-nowrap flex gap-2 items-center">
                                  {line || '(빈 줄)'}
                                  {taggedSubCategory && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-[10px]">
                                      {taggedSubCategory}
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-8 border rounded-md">
                        파일을 먼저 업로드하세요
                      </div>
                    )}

                    {linePreviews[key] && linePreviews[key].length > 0 && (
                      <div className="text-xs bg-blue-50 p-3 rounded border border-blue-200 space-y-2">
                        <div className="font-medium">선택된 내용:</div>

                        {!newCardIsTableMode ? (
                          // 일반 모드: 텍스트만 표시
                          linePreviews[key].map((preview, idx) => (
                            <div key={idx} className="overflow-x-auto whitespace-nowrap">
                              {selectedLines[idx]}: {preview}
                            </div>
                          ))
                        ) : (
                          // 테이블 모드: 원본 + 파싱된 테이블 표시
                          parsedTablePreview[key] && parsedTablePreview[key].map((parsed, idx) => (
                            <div key={idx} className="space-y-1 border-t first:border-t-0 pt-2 first:pt-0">
                              <div className="font-medium text-gray-600">줄 {parsed.lineNum}:</div>
                              <div className="overflow-x-auto whitespace-nowrap text-gray-500 mb-1">
                                {parsed.content}
                              </div>
                              {parsed.fields.length > 0 && (
                                <div className="overflow-x-auto">
                                  <table className="text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-gray-100">
                                        {parsed.fields.map((field: any, fieldIdx: number) => (
                                          <th key={fieldIdx} className="border border-gray-300 px-2 py-1 whitespace-nowrap">
                                            {field.label}=
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        {parsed.fields.map((field: any, fieldIdx: number) => (
                                          <td key={fieldIdx} className="border border-gray-300 px-2 py-1 text-center">
                                            {field.originalValue}
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setShowNewCardDialog(false);
              setQuickTagMode(false);
              setQuickTagSelections(new Map());
              setTempSelectedLines({ file1: [], file2: [], file3: [] });
            }}>
              취소
            </Button>
            {quickTagMode ? (
              <Button
                onClick={handleBulkCreateCards}
                disabled={quickTagSelections.size === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {quickTagSelections.size}개 카드 일괄 생성
              </Button>
            ) : (
              <Button onClick={handleCreateCard}>
                생성
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 새 카테고리 생성 다이얼로그 */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 카테고리 만들기</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">카테고리 이름</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="예: 무기, 방어구, 소모품"
              />
            </div>

            <div>
              <label className="text-sm font-medium">색상</label>
              <Input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 빠른 태그 컨텍스트 메뉴 */}
      {contextMenu && quickTagMode && (
        <>
          {/* 배경 클릭시 메뉴 닫기 */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 999998, pointerEvents: 'auto' }}
            onClick={() => setContextMenu(null)}
          />

          {/* 컨텍스트 메뉴 */}
          <div
            className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[200px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              transform: 'translateY(-100%)',
              zIndex: 999999,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 새 부카테고리 만들기 */}
            <div
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                const name = prompt('새 부카테고리 이름:');
                if (name && name.trim()) {
                  handleAddToSubCategory(name.trim());
                }
              }}
            >
              <Plus className="h-4 w-4" />
              새 부카테고리 만들기
            </div>

            {/* 구분선 */}
            {quickTagSelections.size > 0 && (
              <div className="border-t border-gray-200 my-1" />
            )}

            {/* 기존 부카테고리 목록 */}
            {Array.from(quickTagSelections.keys()).map(subCatName => (
              <div
                key={subCatName}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToSubCategory(subCatName);
                }}
              >
                <Tag className="h-4 w-4 text-green-600" />
                {subCatName}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 카드 편집 다이얼로그 */}
      {selectedCard && (
        <Dialog open={!!selectedCardId} onOpenChange={() => setSelectedCardId(null)}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500">카드 이름</label>
                  <Input
                    value={selectedCard.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setCards(prev => prev.map(card =>
                        card.id === selectedCard.id ? { ...card, name: newName } : card
                      ));
                      카드수정하기(selectedCard.id, { name: newName });
                    }}
                    className="mt-1"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="h-8 mt-5"
                >
                  {showOriginal ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {showOriginal ? '원본 숨기기' : '원본 보기'}
                </Button>
              </div>
            </DialogHeader>

            {selectedCard.isTableMode && selectedCard.fields ? (
              // 테이블 모드
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">항목</th>
                        {showOriginal && <th className="border border-gray-300 px-3 py-2 text-left">원본</th>}
                        <th className="border border-gray-300 px-3 py-2 text-left">수정</th>
                        {showOriginal && <th className="border border-gray-300 px-3 py-2 text-left">파일</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCard.fields.map(field => (
                        <tr key={field.id}>
                          <td className="border border-gray-300 px-3 py-2 font-medium">
                            {field.label}
                          </td>
                          {showOriginal && (
                            <td className="border border-gray-300 px-3 py-2 text-gray-600">
                              {field.originalValue}
                            </td>
                          )}
                          <td className="border border-gray-300 px-3 py-2">
                            <Input
                              value={field.modifiedValue}
                              onChange={(e) => handleFieldChange(selectedCard.id, field.id, e.target.value)}
                              className="h-8"
                            />
                          </td>
                          {showOriginal && (
                            <td className="border border-gray-300 px-3 py-2 text-xs text-gray-500">
                              파일{field.fileIndex + 1} {field.lineNumber}줄
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // 일반 모드
              <div className="space-y-3">
                {selectedCard.matches.map((match, idx) => (
                  <div key={idx} className="flex gap-2">
                    {/* 순서 변경 버튼 */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => {
                          setCards(prev => prev.map(card => {
                            if (card.id !== selectedCard.id) return card;
                            const newMatches = [...card.matches];
                            [newMatches[idx - 1], newMatches[idx]] = [newMatches[idx], newMatches[idx - 1]];
                            return { ...card, matches: newMatches };
                          }));
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={idx === selectedCard.matches.length - 1}
                        onClick={() => {
                          setCards(prev => prev.map(card => {
                            if (card.id !== selectedCard.id) return card;
                            const newMatches = [...card.matches];
                            [newMatches[idx], newMatches[idx + 1]] = [newMatches[idx + 1], newMatches[idx]];
                            return { ...card, matches: newMatches };
                          }));
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* 매치 내용 */}
                    <div className={`flex-1 ${showOriginal ? "border rounded p-3" : ""}`}>
                      {showOriginal && (
                        <div className="text-xs text-gray-500 mb-2">
                          파일{match.fileIndex + 1} {match.lineNumber}줄
                        </div>
                      )}
                      <div className="space-y-2">
                        {showOriginal && (
                          <div>
                            <label className="text-xs font-medium">원본</label>
                            <div className="text-sm bg-gray-50 p-2 rounded break-all">
                              {match.originalContent}
                            </div>
                          </div>
                        )}
                        <div>
                          {showOriginal && <label className="text-xs font-medium">수정</label>}
                          <div className="overflow-x-auto border border-gray-300 rounded bg-white [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-[#e5e5e5] [&::-webkit-scrollbar-track]:bg-[#fafafa]">
                            <textarea
                              value={match.modifiedContent}
                              onChange={(e) => {
                                setCards(prev => prev.map(card => {
                                  if (card.id !== selectedCard.id) return card;
                                  return {
                                    ...card,
                                    matches: card.matches.map((m, i) =>
                                      i === idx ? { ...m, modifiedContent: e.target.value } : m
                                    )
                                  };
                                }));
                              }}
                              rows={1}
                              spellCheck={false}
                              className="w-full text-sm px-3 py-0 border-0 outline-none resize-none whitespace-nowrap block"
                              style={{ minWidth: '880px', height: '42px', overflowY: 'hidden' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 매치 추가 폼 */}
            <div className="border-t pt-4">
              {!showAddMatchForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMatchForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  매치 추가
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium">줄 선택</div>
                  <Tabs value={`file${newMatchFileIndex}`} onValueChange={(value) => {
                    const idx = parseInt(value.replace('file', ''));
                    setNewMatchFileIndex(idx as 0 | 1 | 2);
                  }}>
                    <TabsList className="grid w-full grid-cols-3">
                      {files.map(file => (
                        <TabsTrigger key={file.index} value={`file${file.index}`}>
                          파일 {file.index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {files.map(file => (
                      <TabsContent key={file.index} value={`file${file.index}`} className="mt-2">
                        <div className="border rounded max-h-[300px] max-w-[970px] overflow-auto text-xs">
                          {file.lines.map((line, lineIdx) => {
                            const lineNumber = lineIdx + 1;
                            const currentFileSelections = selectedMatchesByFile.get(file.index) || [];
                            const isSelected = currentFileSelections.includes(lineNumber);
                            return (
                              <div
                                key={lineIdx}
                                className={`flex hover:bg-blue-50 cursor-pointer ${
                                  isSelected ? 'bg-blue-100' : ''
                                }`}
                                onClick={(e) => {
                                  const newMap = new Map(selectedMatchesByFile);
                                  const current = newMap.get(file.index) || [];

                                  if (e.ctrlKey) {
                                    // Ctrl+클릭: 토글
                                    if (current.includes(lineNumber)) {
                                      const filtered = current.filter(n => n !== lineNumber);
                                      if (filtered.length === 0) {
                                        newMap.delete(file.index);
                                      } else {
                                        newMap.set(file.index, filtered);
                                      }
                                    } else {
                                      newMap.set(file.index, [...current, lineNumber].sort((a, b) => a - b));
                                    }
                                  } else {
                                    // 일반 클릭: 단일 선택 (현재 파일만)
                                    newMap.set(file.index, [lineNumber]);
                                  }
                                  setSelectedMatchesByFile(newMap);
                                }}
                              >
                                <div className="w-12 flex-shrink-0 text-right pr-2 text-gray-500 bg-gray-50 border-r select-none">
                                  {lineNumber}
                                </div>
                                <div className="flex-1 px-2 py-1 font-mono whitespace-pre">
                                  {line || ' '}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                  {selectedMatchesByFile.size > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {Array.from(selectedMatchesByFile.entries()).map(([fileIdx, lines]) => (
                        <div key={fileIdx}>
                          파일{fileIdx + 1}: {lines.length}개 줄 ({lines.join(', ')})
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddMatchForm(false);
                        setSelectedMatchesByFile(new Map());
                      }}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddMatch}
                      className="flex-1"
                      disabled={selectedMatchesByFile.size === 0}
                    >
                      추가
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setSelectedCardId(null);
                setShowAddMatchForm(false);
                setSelectedMatchesByFile(new Map());
              }}>
                닫기
              </Button>
              <Button onClick={() => {
                handleApplyCardToFiles(selectedCard.id);
                setSelectedCardId(null);
                setShowAddMatchForm(false);
                setSelectedMatchesByFile(new Map());
              }}>
                파일에 적용
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 패턴 복제 다이얼로그 */}
      {cloneSourceCardId && (
        <Dialog open={showPatternCloneDialog} onOpenChange={setShowPatternCloneDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>패턴 복제</DialogTitle>
              <DialogDescription>
                선택한 카드의 패턴을 복제하여 여러 개의 카드를 생성합니다
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">복제할 개수</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={cloneCount}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 1;
                    setCloneCount(count);
                    setCloneCardNames(Array(count).fill(''));
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">줄 번호 오프셋</label>
                <Input
                  type="number"
                  value={cloneOffset}
                  onChange={(e) => setCloneOffset(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  각 복제본의 줄 번호가 이 값만큼 증가합니다
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">카드 이름 (선택사항)</label>
                <p className="text-xs text-gray-500 mt-1">
                  비워두면 자동으로 "원본이름_복제1" 형식으로 생성됩니다
                </p>
                <div className="space-y-2 mt-2 max-h-[300px] overflow-y-auto">
                  {Array.from({ length: cloneCount }).map((_, idx) => (
                    <Input
                      key={idx}
                      placeholder={`카드 ${idx + 1} 이름 (선택사항)`}
                      value={cloneCardNames[idx] || ''}
                      onChange={(e) => {
                        const newNames = [...cloneCardNames];
                        newNames[idx] = e.target.value;
                        setCloneCardNames(newNames);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPatternCloneDialog(false)}>
                취소
              </Button>
              <Button onClick={handlePatternClone}>
                생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
