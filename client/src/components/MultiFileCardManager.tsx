import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit2, FolderPlus, Plus, Upload, Grid, Save, ChevronDown, ChevronRight, Download, Tag, Eye, EyeOff, Copy, ChevronUp, ArrowUp, ArrowDown, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MatchCard, LoadedFile, CardMatch, CardCategory } from '@/lib/multiFileCardTypes';
import { detectEncoding, encodeToEucKr, buildFullEucKrTable } from '@/lib/encodingUtils';
import {
  모든카드가져오기,
  카드추가하기,
  카드수정하기,
  카드삭제하기,
  카드저장하기,
  모든카테고리가져오기,
  카테고리추가하기,
  카테고리수정하기,
  카테고리저장하기,
  파일저장하기,
  파일불러오기,
  파일내용가져오기,
  카드생성하기,
  카드를파일에적용하기,
  모든카드를파일에적용하기
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
  const [newCardLines, setNewCardLines] = useState<{ file1: number[]; file2: number[]; file3: number[] }>({
    file1: [],
    file2: [],
    file3: []
  });
  const [linePreviews, setLinePreviews] = useState<{ [key: string]: string[] }>({});

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
  const [viewMode, setViewMode] = useState<'move' | 'expand'>('move');

  // 카드 순서 편집 상태
  const [editingOrderCardId, setEditingOrderCardId] = useState<string | null>(null);
  const [editingOrderValue, setEditingOrderValue] = useState<string>('');

  // 카테고리 순서 편집 상태
  const [editingCategoryOrderId, setEditingCategoryOrderId] = useState<string | null>(null);
  const [editingCategoryOrderValue, setEditingCategoryOrderValue] = useState<string>('');

  // 각 매칭 항목의 확장 상태 (fileIndex-lineNumber로 식별)
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  // 매칭 항목 스크롤용 ref
  const matchItemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 하이라이트된 항목 인덱스
  const [highlightedMatchIndex, setHighlightedMatchIndex] = useState<number | null>(null);

  // 유사 항목 찾기 다이얼로그
  interface SimilarCandidate {
    lineNumber: number;
    content: string;
    similarity: number;
  }
  const [showSimilarDialog, setShowSimilarDialog] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number | null>(null);
  const [similarCandidates, setSimilarCandidates] = useState<SimilarCandidate[]>([]);

  // 편집 다이얼로그 열릴 때 파일의 실제 내용으로 originalContent 갱신
  useEffect(() => {
    if (!selectedCardId) return;

    const selectedCard = cards.find(c => c.id === selectedCardId);
    if (!selectedCard) return;

    let updated = false;
    const updatedCard = { ...selectedCard };

    // matches의 originalContent 갱신
    if (selectedCard.matches) {
      updatedCard.matches = selectedCard.matches.map(match => {
        const file = files.find(f => f.index === match.fileIndex);
        if (!file || match.lineNumber < 1 || match.lineNumber > file.lines.length) {
          return match;
        }

        const actualContent = file.lines[match.lineNumber - 1];
        if (actualContent !== match.originalContent) {
          updated = true;
          return { ...match, originalContent: actualContent };
        }
        return match;
      });
    }

    // 변경사항이 있으면 카드 업데이트
    if (updated) {
      setCards(prev => prev.map(c => c.id === selectedCardId ? updatedCard : c));
      카드수정하기(selectedCardId, updatedCard);

      toast({
        title: "원본 내용 갱신",
        description: "파일의 현재 내용으로 원본이 갱신되었습니다",
        duration: 2000
      });
    }
  }, [selectedCardId]);

  // 키보드 이벤트로 하이라이트된 항목 이동
  useEffect(() => {
    if (!selectedCardId || highlightedMatchIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedCard = cards.find(c => c.id === selectedCardId);
      if (!selectedCard) return;

      if (e.key === 'ArrowUp' && highlightedMatchIndex > 0) {
        e.preventDefault();
        const newIdx = highlightedMatchIndex - 1;

        const updatedCards = cards.map(card => {
          if (card.id !== selectedCard.id) return card;
          const newMatches = [...card.matches];
          [newMatches[highlightedMatchIndex - 1], newMatches[highlightedMatchIndex]] =
            [newMatches[highlightedMatchIndex], newMatches[highlightedMatchIndex - 1]];
          return { ...card, matches: newMatches };
        });

        setCards(updatedCards);
        const updatedCard = updatedCards.find(c => c.id === selectedCard.id);
        if (updatedCard) {
          카드수정하기(updatedCard.id, updatedCard);
        }
        setHighlightedMatchIndex(newIdx);
      } else if (e.key === 'ArrowDown' && highlightedMatchIndex < selectedCard.matches.length - 1) {
        e.preventDefault();
        const newIdx = highlightedMatchIndex + 1;

        const updatedCards = cards.map(card => {
          if (card.id !== selectedCard.id) return card;
          const newMatches = [...card.matches];
          [newMatches[highlightedMatchIndex], newMatches[highlightedMatchIndex + 1]] =
            [newMatches[highlightedMatchIndex + 1], newMatches[highlightedMatchIndex]];
          return { ...card, matches: newMatches };
        });

        setCards(updatedCards);
        const updatedCard = updatedCards.find(c => c.id === selectedCard.id);
        if (updatedCard) {
          카드수정하기(updatedCard.id, updatedCard);
        }
        setHighlightedMatchIndex(newIdx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardId, highlightedMatchIndex, cards]);

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

  const loadData = async () => {
    const loadedFiles = await 파일불러오기();
    const loadedCards = await 모든카드가져오기();
    const loadedCategories = await 모든카테고리가져오기();
    setFiles(loadedFiles);
    setCards(loadedCards);
    setCategories(loadedCategories);

    // EUC-KR 파일이 있으면 인코딩 테이블 빌드
    const hasEucKrFile = loadedFiles.some(f => f.encoding === 'EUC-KR');
    if (hasEucKrFile) {
      await buildFullEucKrTable();
    }
  };

  // 파일 업로드
  const handleFileUpload = async (fileIndex: 0 | 1 | 2, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 바이너리로 읽기
    const rawData = await file.arrayBuffer();

    // 인코딩 감지 (EUC-KR 포함)
    const encoding = detectEncoding(rawData);

    // 디코딩
    const decoder = new TextDecoder(encoding === 'EUC-KR' ? 'euc-kr' : encoding);
    const content = decoder.decode(rawData);

    // EUC-KR 매핑 테이블 구축 (첫 EUC-KR 파일 로드시)
    if (encoding === 'EUC-KR') {
      await buildFullEucKrTable();
    }

    // 줄바꿈 문자 감지
    let lineEnding: '\r\n' | '\n' = '\n';
    if (content.includes('\r\n')) {
      lineEnding = '\r\n';
    }

    // lineEnding에 맞게 줄 분리
    const lineEndingRegex = lineEnding === '\r\n' ? /\r\n/ : /\n/;
    const lines = content.split(lineEndingRegex);

    const newFile: LoadedFile = {
      index: fileIndex,
      name: file.name,
      content,
      lines,
      rawData,
      encoding,
      lineEnding
    };

    const updatedFiles = files.filter(f => f.index !== fileIndex);
    updatedFiles.push(newFile);
    updatedFiles.sort((a, b) => a.index - b.index);

    setFiles(updatedFiles);
    await 파일저장하기(updatedFiles);

    toast({
      title: "파일 업로드 완료",
      description: `파일${fileIndex + 1}: ${file.name} (${lines.length}줄, ${encoding})`
    });
  };

  // 파일 삭제
  const handleFileRemove = async (fileIndex: 0 | 1 | 2) => {
    const file = files.find(f => f.index === fileIndex);
    if (!file) return;

    const updatedFiles = files.filter(f => f.index !== fileIndex);
    setFiles(updatedFiles);
    await 파일저장하기(updatedFiles);

    toast({
      title: "파일 삭제 완료",
      description: `파일${fileIndex + 1}: ${file.name}이(가) 삭제되었습니다`
    });
  };

  // 줄 번호 입력시 미리보기
  useEffect(() => {
    const loadPreviews = async () => {
      const previews: { [key: string]: string[] } = {};

      if (newCardLines.file1.length > 0) {
        const contents = await Promise.all(
          newCardLines.file1.map(lineNum => 파일내용가져오기(0, lineNum))
        );
        previews.file1 = contents.map(c => (c || '').replace(/[\r\n]+$/, '')).filter(c => c);
      }
      if (newCardLines.file2.length > 0) {
        const contents = await Promise.all(
          newCardLines.file2.map(lineNum => 파일내용가져오기(1, lineNum))
        );
        previews.file2 = contents.map(c => (c || '').replace(/[\r\n]+$/, '')).filter(c => c);
      }
      if (newCardLines.file3.length > 0) {
        const contents = await Promise.all(
          newCardLines.file3.map(lineNum => 파일내용가져오기(2, lineNum))
        );
        previews.file3 = contents.map(c => (c || '').replace(/[\r\n]+$/, '')).filter(c => c);
      }

      setLinePreviews(previews);
    };

    loadPreviews();
  }, [newCardLines, files]);

  // 유사도 계산 함수 (레벤슈타인 거리 기반)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 100 : ((maxLen - distance) / maxLen) * 100;
  };

  // 유사 항목 찾기
  const handleFindSimilar = (matchIndex: number) => {
    if (!selectedCardId) return;

    const selectedCard = cards.find(c => c.id === selectedCardId);
    if (!selectedCard) return;

    const match = selectedCard.matches[matchIndex];
    const file = files.find(f => f.index === match.fileIndex);
    if (!file) return;

    // 현재 수정본과 유사한 줄들을 찾기
    const candidates: SimilarCandidate[] = file.lines
      .map((line, index) => ({
        lineNumber: index + 1,
        content: line.replace(/[\r\n]+$/, ''),
        similarity: calculateSimilarity(match.modifiedContent, line.replace(/[\r\n]+$/, ''))
      }))
      .filter(candidate => candidate.similarity > 30) // 30% 이상 유사한 것만
      .sort((a, b) => b.similarity - a.similarity) // 유사도 높은 순
      .slice(0, 20); // 상위 20개만

    setSimilarCandidates(candidates);
    setCurrentMatchIndex(matchIndex);
    setShowSimilarDialog(true);
  };

  // 유사 항목 선택
  const handleSelectSimilar = (candidate: SimilarCandidate) => {
    if (!selectedCardId || currentMatchIndex === null) return;

    const selectedCard = cards.find(c => c.id === selectedCardId);
    if (!selectedCard) return;

    const updatedCards = cards.map(card => {
      if (card.id !== selectedCard.id) return card;
      return {
        ...card,
        matches: card.matches.map((m, i) =>
          i === currentMatchIndex
            ? { ...m, lineNumber: candidate.lineNumber, originalContent: candidate.content }
            : m
        )
      };
    });

    setCards(updatedCards);
    const updatedCard = updatedCards.find(c => c.id === selectedCard.id);
    if (updatedCard) {
      카드수정하기(updatedCard.id, updatedCard);
    }

    setShowSimilarDialog(false);
    setCurrentMatchIndex(null);
    setSimilarCandidates([]);

    toast({
      title: "원본 갱신 완료",
      description: `${candidate.lineNumber}줄로 원본이 갱신되었습니다`
    });
  };

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


  // 카드 생성
  const handleCreateCard = async () => {
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

    // 같은 카테고리의 카드 개수로 order 설정
    const categoryCardCount = cards.filter(c => c.categoryId === newCardCategory).length;
    const newCard = 카드생성하기(
      newCardName.trim(),
      newCardCategory,
      matches,
      categoryCardCount
    );

    await 카드추가하기(newCard);
    setCards([...cards, newCard]);

    // 폼 초기화
    setNewCardName('');
    setNewCardCategory('default');
    setNewCardLines({ file1: [], file2: [], file3: [] });
    setLinePreviews({});
    setShowNewCardDialog(false);

    toast({
      title: "카드 생성 완료",
      description: `${newCard.name} 카드가 생성되었습니다`
    });
  };

  // 카테고리 생성
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const newCategory = await 카테고리추가하기(newCategoryName.trim(), newCategoryColor);
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
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('정말 이 카드를 삭제하시겠습니까?')) return;

    await 카드삭제하기(cardId);
    setCards(cards.filter(c => c.id !== cardId));

    toast({
      title: "카드 삭제 완료",
      description: "카드가 삭제되었습니다"
    });
  };

  // 카드 순서 변경 (카테고리 내에서)
  const handleCardOrderChange = async (cardId: string, categoryId: string, newOrder: number) => {
    // 같은 카테고리의 카드들만 필터링 (order 순으로 정렬)
    const categoryCards = cards
      .filter(c => c.categoryId === categoryId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const otherCards = cards.filter(c => c.categoryId !== categoryId);

    // 현재 카드 찾기
    const currentIndex = categoryCards.findIndex(c => c.id === cardId);
    if (currentIndex === -1) return;

    // 새 순서가 유효한 범위인지 확인
    const targetIndex = Math.max(0, Math.min(newOrder - 1, categoryCards.length - 1));
    if (currentIndex === targetIndex) return;

    // 카드 재배열
    const reorderedCards = [...categoryCards];
    const [movedCard] = reorderedCards.splice(currentIndex, 1);
    reorderedCards.splice(targetIndex, 0, movedCard);

    // order 필드 업데이트
    const updatedCategoryCards = reorderedCards.map((card, idx) => ({
      ...card,
      order: idx
    }));

    // 전체 카드 목록 업데이트
    const updatedCards = [...otherCards, ...updatedCategoryCards];
    setCards(updatedCards);

    // IndexedDB 저장
    await 카드저장하기(updatedCards);

    toast({
      title: "순서 변경 완료",
      description: `${currentIndex + 1}번 → ${targetIndex + 1}번으로 이동했습니다`
    });

    // 편집 모드 종료
    setEditingOrderCardId(null);
    setEditingOrderValue('');
  };

  // 카테고리 순서 변경
  const handleCategoryOrderChange = async (categoryId: string, newOrder: number) => {
    // 현재 카테고리 찾기
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;

    // 새 순서가 유효한 범위인지 확인
    const targetIndex = Math.max(0, Math.min(newOrder - 1, categories.length - 1));
    if (currentIndex === targetIndex) return;

    // 카테고리 재배열
    const reorderedCategories = [...categories];
    const [movedCategory] = reorderedCategories.splice(currentIndex, 1);
    reorderedCategories.splice(targetIndex, 0, movedCategory);

    // order 필드 업데이트
    const updatedCategories = reorderedCategories.map((cat, idx) => ({
      ...cat,
      order: idx
    }));

    setCategories(updatedCategories);

    // IndexedDB 저장
    await 카테고리저장하기(updatedCategories);

    toast({
      title: "카테고리 순서 변경 완료",
      description: `${currentIndex + 1}번 → ${targetIndex + 1}번으로 이동했습니다`
    });

    // 편집 모드 종료
    setEditingCategoryOrderId(null);
    setEditingCategoryOrderValue('');
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
  const handlePatternClone = async () => {
    if (!cloneSourceCardId) return;

    const sourceCard = cards.find(c => c.id === cloneSourceCardId);
    if (!sourceCard) return;

    const newCards: MatchCard[] = [];

    // 현재 카테고리의 카드 개수 (새 카드의 order 시작점)
    let currentOrder = cards.filter(c => c.categoryId === sourceCard.categoryId).length;

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

      // 이름이 비어있으면 자동 생성
      const cardName = cloneCardNames[i]?.trim() || `${sourceCard.name}_복제${i + 1}`;

      const newCard: MatchCard = {
        id: `card-${Date.now()}-${i}`,
        name: cardName,
        categoryId: sourceCard.categoryId,
        matches: newMatches,
        order: currentOrder,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      newCards.push(newCard);
      currentOrder++;
    }

    // 카드 추가 및 저장 (순차 실행 - race condition 방지)
    for (const card of newCards) {
      await 카드추가하기(card);
    }
    setCards([...cards, ...newCards]);

    toast({
      title: "패턴 복제 완료",
      description: `${cloneCount}개의 카드가 생성되었습니다`
    });

    setShowPatternCloneDialog(false);
  };


  // 카드를 파일에 적용
  const handleApplyCardToFiles = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // 1. 파일에 적용
    const updatedFiles = 카드를파일에적용하기(card, files);
    setFiles(updatedFiles);
    await 파일저장하기(updatedFiles);

    // 2. 카드 업데이트 (originalContent를 modifiedContent로) - 불변성 유지
    const updatedCard = {
      ...card,
      matches: card.matches.map(match => ({
        ...match,
        originalContent: match.modifiedContent
      }))
    };

    // 3. State 업데이트
    setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));

    // 4. IndexedDB 저장
    await 카드수정하기(cardId, updatedCard);

    toast({
      title: "적용 완료",
      description: `${card.name} 카드의 변경사항이 파일에 적용되었습니다`
    });
  };

  // 파일에 수정사항이 있는지 확인
  const hasFileModifications = (fileIndex: 0 | 1 | 2): boolean => {
    return cards.some(card =>
      card.matches.some(match =>
        match.fileIndex === fileIndex && match.originalContent !== match.modifiedContent
      )
    );
  };

  // 파일 다운로드
  const handleDownloadFile = async (fileIndex: 0 | 1 | 2) => {
    const file = files.find(f => f.index === fileIndex);
    if (!file) return;

    // EUC-KR 파일이면 인코딩 테이블 빌드 확인
    if (file.encoding === 'EUC-KR') {
      await buildFullEucKrTable();
    }

    let blob: Blob;

    // 수정사항이 없고 rawData가 있으면 원본 그대로 다운로드
    if (!hasFileModifications(fileIndex) && file.rawData) {
      blob = new Blob([file.rawData], { type: 'application/octet-stream' });
    } else {
      // 수정사항이 있으면 텍스트 기반으로 인코딩
      const finalContent = file.lines.join(file.lineEnding || '\n');
      const encoding = file.encoding || 'UTF-8';

      if (encoding === 'UTF-16LE') {
        // UTF-16LE로 인코딩 (서로게이트 페어 처리)
        const utf16Codes: number[] = [];
        for (let i = 0; i < finalContent.length; i++) {
          utf16Codes.push(finalContent.charCodeAt(i));
        }

        // 바이트 배열 생성 (BOM + 데이터)
        const bytes = new Uint8Array((utf16Codes.length + 1) * 2);
        bytes[0] = 0xFF; // BOM LE
        bytes[1] = 0xFE;

        for (let i = 0; i < utf16Codes.length; i++) {
          const code = utf16Codes[i];
          bytes[(i + 1) * 2] = code & 0xFF;
          bytes[(i + 1) * 2 + 1] = (code >> 8) & 0xFF;
        }

        blob = new Blob([bytes], { type: 'application/octet-stream' });
      } else if (encoding === 'UTF-16BE') {
        // UTF-16BE로 인코딩 (서로게이트 페어 처리)
        const utf16Codes: number[] = [];
        for (let i = 0; i < finalContent.length; i++) {
          utf16Codes.push(finalContent.charCodeAt(i));
        }

        // 바이트 배열 생성 (BOM + 데이터)
        const bytes = new Uint8Array((utf16Codes.length + 1) * 2);
        bytes[0] = 0xFE; // BOM BE
        bytes[1] = 0xFF;

        for (let i = 0; i < utf16Codes.length; i++) {
          const code = utf16Codes[i];
          bytes[(i + 1) * 2] = (code >> 8) & 0xFF;
          bytes[(i + 1) * 2 + 1] = code & 0xFF;
        }

        blob = new Blob([bytes], { type: 'application/octet-stream' });
      } else if (encoding === 'EUC-KR') {
        // EUC-KR 인코딩 (한국어 게임 파일용)
        const eucKrBytes = encodeToEucKr(finalContent);
        blob = new Blob([eucKrBytes], { type: 'application/octet-stream' });
      } else {
        // UTF-8 인코딩
        const encoder = new TextEncoder();
        const encoded = encoder.encode(finalContent);

        // 원본에 BOM이 있었는지 확인
        let hasBOM = false;
        if (file.rawData) {
          const uint8Array = new Uint8Array(file.rawData);
          hasBOM = uint8Array.length >= 3 &&
                   uint8Array[0] === 0xEF &&
                   uint8Array[1] === 0xBB &&
                   uint8Array[2] === 0xBF;
        }

        if (hasBOM) {
          // BOM 추가
          const withBOM = new Uint8Array(encoded.length + 3);
          withBOM[0] = 0xEF;
          withBOM[1] = 0xBB;
          withBOM[2] = 0xBF;
          withBOM.set(encoded, 3);
          blob = new Blob([withBOM], { type: 'application/octet-stream' });
        } else {
          blob = new Blob([encoded], { type: 'application/octet-stream' });
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 전체 적용 및 다운로드
  const handleApplyAllAndDownload = async () => {
    if (cards.length === 0) {
      toast({
        title: "카드가 없습니다",
        description: "적용할 카드가 없습니다",
        variant: "destructive"
      });
      return;
    }

    try {
      // EUC-KR 파일이 있으면 인코딩 테이블 빌드 확인
      const hasEucKrFile = files.some(f => f.encoding === 'EUC-KR');
      if (hasEucKrFile) {
        await buildFullEucKrTable();
      }

      // 1. 모든 카드의 수정사항을 파일에 한 번에 적용
      const updatedFiles = 모든카드를파일에적용하기(cards, files);

      // 2. 카드의 originalContent를 modifiedContent로 업데이트
      const updatedCards = cards.map(card => ({
        ...card,
        matches: card.matches.map(match => ({
          ...match,
          originalContent: match.modifiedContent
        })),
        updatedAt: Date.now()
      }));

      // 모든 카드를 한번에 저장 (효율적)
      await 카드저장하기(updatedCards);

      // 3. 파일 상태 업데이트 및 저장
      setFiles(updatedFiles);
      setCards(updatedCards);
      await 파일저장하기(updatedFiles);

      // 4. 모든 파일 다운로드 (updatedFiles를 직접 사용)
      updatedFiles.forEach((file, index) => {
        setTimeout(() => {
          let blob: Blob;

          // 이 파일에 수정사항이 있는지 확인
          const fileHasModifications = cards.some(card =>
            card.matches.some(match =>
              match.fileIndex === file.index && match.originalContent !== match.modifiedContent
            )
          );

          // 수정사항이 없고 rawData가 있으면 원본 그대로 다운로드
          const originalFile = files.find(f => f.index === file.index);
          if (!fileHasModifications && originalFile?.rawData) {
            blob = new Blob([originalFile.rawData], { type: 'application/octet-stream' });
          } else {
            // 수정사항이 있으면 텍스트 기반으로 인코딩
            const finalContent = file.lines.join(file.lineEnding || '\n');
            const encoding = file.encoding || 'UTF-8';

            if (encoding === 'UTF-16LE') {
              const utf16Codes: number[] = [];
              for (let i = 0; i < finalContent.length; i++) {
                utf16Codes.push(finalContent.charCodeAt(i));
              }

              const bytes = new Uint8Array((utf16Codes.length + 1) * 2);
              bytes[0] = 0xFF;
              bytes[1] = 0xFE;

              for (let i = 0; i < utf16Codes.length; i++) {
                const code = utf16Codes[i];
                bytes[(i + 1) * 2] = code & 0xFF;
                bytes[(i + 1) * 2 + 1] = (code >> 8) & 0xFF;
              }

              blob = new Blob([bytes], { type: 'application/octet-stream' });
            } else if (encoding === 'UTF-16BE') {
              const utf16Codes: number[] = [];
              for (let i = 0; i < finalContent.length; i++) {
                utf16Codes.push(finalContent.charCodeAt(i));
              }

              const bytes = new Uint8Array((utf16Codes.length + 1) * 2);
              bytes[0] = 0xFE;
              bytes[1] = 0xFF;

              for (let i = 0; i < utf16Codes.length; i++) {
                const code = utf16Codes[i];
                bytes[(i + 1) * 2] = (code >> 8) & 0xFF;
                bytes[(i + 1) * 2 + 1] = code & 0xFF;
              }

              blob = new Blob([bytes], { type: 'application/octet-stream' });
            } else if (encoding === 'EUC-KR') {
              // EUC-KR 인코딩 (한국어 게임 파일용)
              const eucKrBytes = encodeToEucKr(finalContent);
              blob = new Blob([eucKrBytes], { type: 'application/octet-stream' });
            } else {
              const encoder = new TextEncoder();
              const encoded = encoder.encode(finalContent);

              let hasBOM = false;
              if (file.rawData) {
                const uint8Array = new Uint8Array(file.rawData);
                hasBOM = uint8Array.length >= 3 &&
                         uint8Array[0] === 0xEF &&
                         uint8Array[1] === 0xBB &&
                         uint8Array[2] === 0xBF;
              }

              if (hasBOM) {
                const withBOM = new Uint8Array(encoded.length + 3);
                withBOM[0] = 0xEF;
                withBOM[1] = 0xBB;
                withBOM[2] = 0xBF;
                withBOM.set(encoded, 3);
                blob = new Blob([withBOM], { type: 'application/octet-stream' });
              } else {
                blob = new Blob([encoded], { type: 'application/octet-stream' });
              }
            }
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        }, index * 300);
      });

      toast({
        title: "전체 적용 완료",
        description: `${updatedFiles.length}개 파일에 변경사항이 적용되었습니다`
      });
    } catch (error) {
      console.error('전체 적용 실패:', error);
      toast({
        title: "오류",
        description: "전체 적용 중 오류가 발생했습니다",
        variant: "destructive"
      });
    }
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
        order: card.order ?? 0,
        matches: card.matches.map(match => {
          const file = files.find(f => f.index === match.fileIndex);
          return {
            fileName: file?.name || `파일${match.fileIndex + 1}`,
            fileIndex: match.fileIndex,
            lineNumber: match.lineNumber,
            originalContent: match.originalContent,
            modifiedContent: match.modifiedContent
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
      await 카테고리저장하기(importedCategoriesList);
      createdCategoryCount = importedCategoriesList.length;

      // 2. 카드 완전 교체 (기존 카드 삭제, JSON의 카드만 사용)
      const importedCardsList: MatchCard[] = importedCards.map((mod: any) => {
        // matches의 fileIndex를 현재 로드된 파일명으로 재매핑 + 현재 파일 내용으로 originalContent 갱신
        const remappedMatches = (mod.matches || []).map((match: any) => {
          const currentFile = files.find(f => f.name === match.fileName);
          const fileIndex = currentFile?.index ?? match.fileIndex;

          // 현재 파일에서 실제 내용 가져오기 (협업 대응)
          let actualContent = match.originalContent; // 기본값
          if (currentFile && match.lineNumber > 0 && match.lineNumber <= currentFile.lines.length) {
            actualContent = currentFile.lines[match.lineNumber - 1]?.replace(/[\r\n]+$/, '') || match.originalContent;
          }

          return {
            fileIndex: fileIndex,
            lineNumber: match.lineNumber,
            originalContent: actualContent,  // 현재 파일의 실제 내용으로 갱신
            modifiedContent: match.modifiedContent
          };
        });

        return {
          id: mod.id,
          name: mod.name,
          categoryId: mod.categoryId || 'default',
          matches: remappedMatches,
          order: mod.order ?? 0,
          createdAt: mod.createdAt || Date.now(),
          updatedAt: Date.now()
        };
      });

      setCards(importedCardsList);
      await 카드저장하기(importedCardsList);
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
  const handleBulkCreateCards = async () => {
    if (!quickTagCategoryId || quickTagSelections.size === 0) return;

    let createdCount = 0;
    const cardsToAdd: MatchCard[] = [];

    // 현재 카테고리의 카드 개수 (새 카드의 order 시작점)
    let currentOrder = cards.filter(c => c.categoryId === quickTagCategoryId).length;

    for (const [subCategoryName, selection] of quickTagSelections) {
      const matches: any[] = [];

      // file1 매칭
      for (const lineNum of selection.lines.file1) {
        const content = await 파일내용가져오기(0, lineNum);
        const cleanContent = content?.replace(/[\r\n]+$/, '');
        if (cleanContent) {
          matches.push({
            fileIndex: 0,
            lineNumber: lineNum,
            originalContent: cleanContent,
            modifiedContent: cleanContent
          });
        }
      }

      // file2 매칭
      for (const lineNum of selection.lines.file2) {
        const content = await 파일내용가져오기(1, lineNum);
        const cleanContent = content?.replace(/[\r\n]+$/, '');
        if (cleanContent) {
          matches.push({
            fileIndex: 1,
            lineNumber: lineNum,
            originalContent: cleanContent,
            modifiedContent: cleanContent
          });
        }
      }

      // file3 매칭
      for (const lineNum of selection.lines.file3) {
        const content = await 파일내용가져오기(2, lineNum);
        const cleanContent = content?.replace(/[\r\n]+$/, '');
        if (cleanContent) {
          matches.push({
            fileIndex: 2,
            lineNumber: lineNum,
            originalContent: cleanContent,
            modifiedContent: cleanContent
          });
        }
      }

      if (matches.length > 0) {
        const card = 카드생성하기(
          subCategoryName,
          quickTagCategoryId,
          matches,
          currentOrder
        );
        cardsToAdd.push(card);
        createdCount++;
        currentOrder++;
      }
    }

    // 모든 카드 일괄 추가 (순차 실행 - race condition 방지)
    for (const card of cardsToAdd) {
      await 카드추가하기(card);
    }

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
    const loadedCards = await 모든카드가져오기();
    setCards(loadedCards);
  };

  // 카테고리별 카드 그룹화 (order 순으로 정렬)
  const sortedCategories = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const cardsByCategory = sortedCategories.map((category, categoryIndex) => ({
    category,
    categoryIndex,
    cards: cards
      .filter(card => card.categoryId === category.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }));

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="space-y-6">
      {/* 파일 업로드 섹션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>파일 업로드</CardTitle>
            <Button
              onClick={handleApplyAllAndDownload}
              variant="default"
              size="sm"
              disabled={files.length === 0 || cards.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              전체 적용 다운로드
            </Button>
          </div>
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
                      accept=".txt,.ini,.xml,.json,.kor,.int"
                      onChange={(e) => handleFileUpload(index as 0 | 1 | 2, e)}
                      className="text-xs"
                    />
                  </div>
                  {file && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>{file.name}</div>
                      <div>{file.lines.length}줄</div>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadFile(index as 0 | 1 | 2)}
                          className="h-6 text-xs flex-1"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          다운로드
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleFileRemove(index as 0 | 1 | 2)}
                          className="h-6 text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
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
        {cardsByCategory.map(({ category, categoryIndex, cards: categoryCards }) => {
          const isCollapsed = collapsedCategories.has(category.id);
          const isEditingCategoryOrder = editingCategoryOrderId === category.id;
          return (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors flex-1"
                  onClick={() => toggleCategory(category.id)}
                >
                  {/* 카테고리 순서 번호 */}
                  {isEditingCategoryOrder ? (
                    <Input
                      type="number"
                      value={editingCategoryOrderValue}
                      onChange={(e) => setEditingCategoryOrderValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newOrder = parseInt(editingCategoryOrderValue);
                          if (!isNaN(newOrder)) {
                            handleCategoryOrderChange(category.id, newOrder);
                          }
                        } else if (e.key === 'Escape') {
                          setEditingCategoryOrderId(null);
                          setEditingCategoryOrderValue('');
                        }
                      }}
                      onBlur={() => {
                        const newOrder = parseInt(editingCategoryOrderValue);
                        if (!isNaN(newOrder)) {
                          handleCategoryOrderChange(category.id, newOrder);
                        } else {
                          setEditingCategoryOrderId(null);
                          setEditingCategoryOrderValue('');
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-12 h-6 text-center text-xs p-1"
                      min={1}
                      max={categories.length}
                    />
                  ) : (
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-100 text-xs px-1.5 py-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategoryOrderId(category.id);
                        setEditingCategoryOrderValue(String(categoryIndex + 1));
                      }}
                      title="클릭하여 순서 변경"
                    >
                      {categoryIndex + 1}
                    </Badge>
                  )}
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
                  {categoryCards.map((card, cardIndex) => {
                    const isExpanded = expandedCardId === card.id;
                    const isEditingOrder = editingOrderCardId === card.id;
                    return (
                    <Card key={card.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* 순서 번호 */}
                            {isEditingOrder ? (
                              <Input
                                type="number"
                                value={editingOrderValue}
                                onChange={(e) => setEditingOrderValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newOrder = parseInt(editingOrderValue);
                                    if (!isNaN(newOrder)) {
                                      handleCardOrderChange(card.id, category.id, newOrder);
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingOrderCardId(null);
                                    setEditingOrderValue('');
                                  }
                                }}
                                onBlur={() => {
                                  const newOrder = parseInt(editingOrderValue);
                                  if (!isNaN(newOrder)) {
                                    handleCardOrderChange(card.id, category.id, newOrder);
                                  } else {
                                    setEditingOrderCardId(null);
                                    setEditingOrderValue('');
                                  }
                                }}
                                autoFocus
                                className="w-12 h-6 text-xs text-center p-1"
                                min={1}
                                max={categoryCards.length}
                              />
                            ) : (
                              <Badge
                                variant="outline"
                                className="cursor-pointer hover:bg-gray-100 min-w-[24px] justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOrderCardId(card.id);
                                  setEditingOrderValue(String(cardIndex + 1));
                                }}
                                title="클릭하여 순서 변경"
                              >
                                {cardIndex + 1}
                              </Badge>
                            )}
                            <CardTitle className="text-sm">{card.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
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

                        {linePreviews[key].map((preview, idx) => (
                          <div key={idx} className="overflow-x-auto whitespace-nowrap">
                            {selectedLines[idx]}: {preview}
                          </div>
                        ))}
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
                <div className="flex gap-2 mt-5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="h-8"
                  >
                    {showOriginal ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showOriginal ? '원본 숨기기' : '원본 보기'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewMode(prev => prev === 'move' ? 'expand' : 'move')}
                    className="h-8"
                  >
                    {viewMode === 'move' ? <ArrowUp className="h-4 w-4 mr-1" /> : <Menu className="h-4 w-4 mr-1" />}
                    {viewMode === 'move' ? '이동' : '확장'}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3">
                {selectedCard.matches.map((match, idx) => {
                  const matchId = `${match.fileIndex}-${match.lineNumber}`;
                  const isExpanded = expandedMatches.has(matchId);

                  return (
                    <div
                      key={idx}
                      className={`flex gap-2 p-2 rounded transition-colors cursor-pointer ${
                        highlightedMatchIndex === idx ? 'bg-blue-100 border-2 border-blue-400' : ''
                      }`}
                      ref={(el) => {
                        if (el) {
                          matchItemRefs.current.set(idx, el);
                        } else {
                          matchItemRefs.current.delete(idx);
                        }
                      }}
                      onClick={(e) => {
                        // 버튼이나 입력칸 클릭이 아닐 때만 하이라이트 해제
                        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.flex-1')) {
                          setHighlightedMatchIndex(null);
                        }
                      }}
                    >
                      {/* 좌측 버튼: 이동 모드 = 화살표, 확장 모드 = 햄버거 */}
                      {viewMode === 'move' ? (
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => {
                              const newIdx = idx - 1;
                              const updatedCards = cards.map(card => {
                                if (card.id !== selectedCard.id) return card;
                                const newMatches = [...card.matches];
                                [newMatches[idx - 1], newMatches[idx]] = [newMatches[idx], newMatches[idx - 1]];
                                return { ...card, matches: newMatches };
                              });

                              setCards(updatedCards);

                              // IndexedDB에 저장
                              const updatedCard = updatedCards.find(c => c.id === selectedCard.id);
                              if (updatedCard) {
                                카드수정하기(updatedCard.id, updatedCard);
                              }

                              // 하이라이트 설정
                              setHighlightedMatchIndex(newIdx);
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
                              const newIdx = idx + 1;
                              const updatedCards = cards.map(card => {
                                if (card.id !== selectedCard.id) return card;
                                const newMatches = [...card.matches];
                                [newMatches[idx], newMatches[idx + 1]] = [newMatches[idx + 1], newMatches[idx]];
                                return { ...card, matches: newMatches };
                              });

                              setCards(updatedCards);

                              // IndexedDB에 저장
                              const updatedCard = updatedCards.find(c => c.id === selectedCard.id);
                              if (updatedCard) {
                                카드수정하기(updatedCard.id, updatedCard);
                              }

                              // 하이라이트 설정
                              setHighlightedMatchIndex(newIdx);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpandedMatches(prev => {
                                const newSet = new Set(prev);
                                if (isExpanded) {
                                  newSet.delete(matchId);
                                } else {
                                  newSet.add(matchId);
                                }
                                return newSet;
                              });
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Menu className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

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
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium">원본</label>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFindSimilar(idx)}
                                  className="h-6 text-xs px-2"
                                >
                                  원본 가져오기
                                </Button>
                              </div>
                              <div className="text-sm bg-gray-50 p-2 rounded break-all">
                                {match.originalContent}
                              </div>
                            </div>
                          )}
                          <div>
                            {showOriginal && <label className="text-xs font-medium">수정</label>}
                            {viewMode === 'move' || !isExpanded ? (
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
                            ) : (
                              <div className="border border-gray-300 rounded bg-white p-2">
                                <textarea
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = el.scrollHeight + 'px';
                                    }
                                  }}
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
                                  onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                  spellCheck={false}
                                  className="w-full text-sm border-0 outline-none resize-none whitespace-pre-wrap font-mono overflow-hidden"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                                              {/* 삭제 버튼 */}
                        <div className="flex items-center pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!confirm('이 줄을 삭제하시겠습니까?')) return;    

                              const updatedCards = cards.map(card => {
                                if (card.id !== selectedCard.id) return card;       
                                return {
                                  ...card,
                                  matches: card.matches.filter((_, i) => i !== idx)
                                };
                              });

                              setCards(updatedCards);

                              const updatedCard = updatedCards.find(c => c.id  === selectedCard.id);
                              if (updatedCard) {
                                카드수정하기(selectedCard.id, updatedCard);  // ✅ cardId와 업데이트 데이터  
                              }

                              toast({
                                title: "줄 삭제 완료",
                                description: "매치 항목이 삭제되었습니다"
                              });
                            }}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="이 줄 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                    </div>
                  );
                })}
              </div>

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

      {/* 유사 항목 선택 다이얼로그 */}
      <Dialog open={showSimilarDialog} onOpenChange={setShowSimilarDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>원본 가져오기</DialogTitle>
            <DialogDescription>
              수정본과 유사한 줄을 선택하여 원본으로 설정합니다
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {similarCandidates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                유사한 항목이 없습니다
              </div>
            ) : (
              <div className="space-y-2">
                {similarCandidates.map((candidate, idx) => (
                  <div
                    key={idx}
                    className="border rounded p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => handleSelectSimilar(candidate)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {candidate.lineNumber}줄
                        </Badge>
                        <Badge
                          variant={
                            candidate.similarity >= 80
                              ? "default"
                              : candidate.similarity >= 60
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          유사도 {candidate.similarity.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                      {candidate.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSimilarDialog(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
