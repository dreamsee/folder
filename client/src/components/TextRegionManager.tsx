import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, FolderPlus, ChevronDown, ChevronRight, GripVertical, Grid, Plus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// 타입 정의
interface TextRegion {
  id: string;
  name: string;
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
  originalValue: string;
  modifiedValue: string;
  categoryId: string;
  type?: 'single' | 'table';
  tableData?: TableRegionData;
}

interface TableRegionData {
  headers: string[];
  rows: TableRow[];
}

interface TableRow {
  label: string;
  cells: TableCell[];
}

interface TableCell {
  id: string;
  value: string;
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
  originalValue: string;
  modifiedValue: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  isCollapsed: boolean;
  order: number;
}

interface LineGroup {
  id: string;
  name: string;
  lines: number[];
  isVisible: boolean;
  isCollapsed: boolean;
  color: string;
}

interface TextRegionManagerProps {
  text: string;
  onTextChange: (newText: string) => void;
  modifiedDocumentId?: number;
  onRegionDataChange?: (regionData: { categories: Category[], regions: TextRegion[], lineGroups?: LineGroup[] }) => void;
  initialRegionData?: any;
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
];

export default function TextRegionManager({ text, onTextChange, modifiedDocumentId, onRegionDataChange, initialRegionData }: TextRegionManagerProps) {
  const [regions, setRegions] = useState<TextRegion[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: 'default', name: '기본 카테고리', color: '#6b7280', isCollapsed: false, order: 0 }
  ]);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [pendingSelection, setPendingSelection] = useState<{
    startLine: number;
    startChar: number;
    endLine: number;
    endChar: number;
    selectedText: string;
  } | null>(null);

  // 줄 그룹 관리 상태
  const [lineGroups, setLineGroups] = useState<LineGroup[]>([]);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [showAllLines, setShowAllLines] = useState<boolean>(true);
  const [isLineSelectionMode, setIsLineSelectionMode] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [showGroupDialog, setShowGroupDialog] = useState<boolean>(false);
  const [isGroupPanelCollapsed, setIsGroupPanelCollapsed] = useState<boolean>(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');
  const [lineNumberInput, setLineNumberInput] = useState<string>('');
  


  // 영역 관리 정보 불러오기 (로컬 스토리지에서)
  const regionData = null; // 서버 없이 로컬에서 관리

  // 수정된 문서의 regionData를 로드하는 useEffect
  useEffect(() => {
    if (modifiedDocumentId) {
      // localStorage에서 수정된 문서 데이터 가져오기
      const modifiedDocs = JSON.parse(localStorage.getItem('modifiedDocuments') || '[]');
      const currentDoc = modifiedDocs.find((doc: any) => doc.id === modifiedDocumentId);
      
      console.log(`📥 [REGION DEBUG] 수정된 문서 ID ${modifiedDocumentId}의 regionData 로드 시도`);
      console.log(`📥 [REGION DEBUG] 찾은 문서:`, currentDoc);
      
      if (currentDoc && currentDoc.regionData) {
        console.log(`📥 [REGION DEBUG] regionData 발견:`, currentDoc.regionData);
        const { categories, regions, lineGroups } = currentDoc.regionData;
        
        if (categories && categories.length > 0) {
          setCategories(categories);
          console.log(`📥 [REGION DEBUG] 카테고리 ${categories.length}개 로드됨`);
        }
        
        if (regions && regions.length > 0) {
          setRegions(regions);
          console.log(`📥 [REGION DEBUG] 영역 ${regions.length}개 로드됨`);
        }
        
        if (lineGroups && lineGroups.length > 0) {
          setLineGroups(lineGroups);
          console.log(`📥 [REGION DEBUG] 줄 그룹 ${lineGroups.length}개 로드됨`);
        }
      } else {
        console.log(`📥 [REGION DEBUG] regionData 없음, 기본 상태로 초기화`);
        setCategories([
          { id: 'default', name: '기본 카테고리', color: '#6b7280', isCollapsed: false, order: 0 }
        ]);
        setRegions([]);
        setLineGroups([]);
      }
    } else {
      console.log(`📥 [REGION DEBUG] modifiedDocumentId 없음, 기본 상태로 초기화`);
      setCategories([
        { id: 'default', name: '기본 카테고리', color: '#6b7280', isCollapsed: false, order: 0 }
      ]);
      setRegions([]);
      setLineGroups([]);
    }
  }, [modifiedDocumentId]);

  // 영역 데이터 변경 시 부모 컴포넌트에 알림
  useEffect(() => {
    if (onRegionDataChange) {
      console.log(`📤 [REGION DEBUG] 부모 컴포넌트로 데이터 전달:`, { categories, regions, lineGroups });
      onRegionDataChange({ categories, regions, lineGroups });
    } else {
      console.log(`📤 [REGION DEBUG] onRegionDataChange 콜백이 없음`);
    }
  }, [categories, regions, lineGroups, onRegionDataChange]);

  // 줄 번호 텍스트 파싱 함수
  const parseLineNumbers = (input: string): number[] => {
    if (!input.trim()) return [];
    
    const result: number[] = [];
    const parts = input.split(',').map(part => part.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        // 범위 처리 (예: 5-9)
        const [start, end] = part.split('-').map(num => parseInt(num.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= text.split('\n').length) {
              result.push(i - 1); // 0-based index로 변환
            }
          }
        }
      } else {
        // 개별 번호 처리 (예: 1, 3, 5)
        const num = parseInt(part);
        if (!isNaN(num) && num > 0 && num <= text.split('\n').length) {
          result.push(num - 1); // 0-based index로 변환
        }
      }
    }
    
    // 중복 제거 및 정렬
    const uniqueResult = result.filter((value, index, self) => self.indexOf(value) === index);
    return uniqueResult.sort((a, b) => a - b);
  };

  // 텍스트 입력으로 줄 선택하기
  const selectLinesFromInput = () => {
    const lineNumbers = parseLineNumbers(lineNumberInput);
    if (lineNumbers.length > 0) {
      setSelectedLines(lineNumbers);
      setLineNumberInput(''); // 입력창 초기화
    }
  };

  // 줄 그룹 관리 함수들
  const toggleLineSelection = (lineNumber: number) => {
    if (!isLineSelectionMode) return;
    
    setSelectedLines(prev => {
      if (prev.includes(lineNumber)) {
        return prev.filter(line => line !== lineNumber);
      } else {
        return [...prev, lineNumber].sort((a, b) => a - b);
      }
    });
  };

  const createLineGroup = () => {
    if (selectedLines.length === 0 || !newGroupName.trim()) return;
    
    const newGroup: LineGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      lines: [...selectedLines],
      isVisible: true,
      isCollapsed: false,
      color: COLORS[lineGroups.length % COLORS.length]
    };
    
    console.log('📝 [LINE GROUP DEBUG] 새 줄 그룹 생성:', newGroup);
    setLineGroups(prev => {
      const updated = [...prev, newGroup];
      console.log('📝 [LINE GROUP DEBUG] 줄 그룹 목록 업데이트:', updated);
      return updated;
    });
    setSelectedLines([]);
    setNewGroupName('');
    setShowGroupDialog(false);
  };

  const toggleGroupVisibility = (groupId: string) => {
    setLineGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, isVisible: !group.isVisible }
          : group
      )
    );
  };

  const toggleGroupCollapse = (groupId: string) => {
    setLineGroups(prev => 
      prev.map(group => 
        group.id === groupId 
          ? { ...group, isCollapsed: !group.isCollapsed }
          : group
      )
    );
  };

  const deleteLineGroup = (groupId: string) => {
    setLineGroups(prev => prev.filter(group => group.id !== groupId));
  };

  // 그룹 이름 편집 시작
  const startEditingGroupName = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditingGroupName(currentName);
  };

  // 그룹 이름 편집 완료
  const finishEditingGroupName = () => {
    if (editingGroupId && editingGroupName.trim()) {
      setLineGroups(prev => prev.map(group => 
        group.id === editingGroupId 
          ? { ...group, name: editingGroupName.trim() }
          : group
      ));
    }
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // 그룹 이름 편집 취소
  const cancelEditingGroupName = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const getVisibleLines = () => {
    if (showAllLines) {
      return Array.from({ length: text.split('\n').length }, (_, i) => i);
    }
    
    const visibleLines = new Set<number>();
    lineGroups.forEach(group => {
      if (group.isVisible) {
        group.lines.forEach(line => visibleLines.add(line));
      }
    });
    
    return Array.from(visibleLines).sort((a, b) => a - b);
  };

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingRegionId, setEditingRegionId] = useState<string | null>(null);
  
  // 테이블 영역 관련 상태
  const [showTableCreationDialog, setShowTableCreationDialog] = useState(false);
  const [tableHeaders, setTableHeaders] = useState<string[]>(['']);
  const [tableRowCount, setTableRowCount] = useState(3);
  const [tableName, setTableName] = useState('');
  const [tableCategory, setTableCategory] = useState('default');
  const [linkingTableCell, setLinkingTableCell] = useState<{tableId: string, rowIndex: number, cellIndex: number} | null>(null);
  
  // 새 영역 설정 관련 상태
  const [showRegionSetupDialog, setShowRegionSetupDialog] = useState(false);
  const [tempRegion, setTempRegion] = useState<TextRegion | null>(null);
  const [tempRegionName, setTempRegionName] = useState('');
  const [tempSelectedCategoryId, setTempSelectedCategoryId] = useState('default');
  const [tempNewCategoryName, setTempNewCategoryName] = useState('');
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 영역 선택 처리 (마우스 및 터치 지원)
  const handleTextSelection = () => {
    if (!textAreaRef.current || !isSelecting) return;
    
    const textArea = textAreaRef.current;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    
    if (start === end) return; // 선택된 텍스트가 없음
    
    const selectedText = text.substring(start, end);
    const lines = text.substring(0, start).split('\n');
    const startLine = lines.length - 1;
    const startChar = lines[lines.length - 1].length;
    
    const endLines = text.substring(0, end).split('\n');
    const endLine = endLines.length - 1;
    const endChar = endLines[endLines.length - 1].length;
    
    // 테이블 셀과 연동 중인 경우
    if (linkingTableCell) {
      linkTextToTableCell(selectedText, startLine, startChar, endLine, endChar);
      return;
    }
    
    // 임시 영역 생성하고 설정 다이얼로그 열기
    const newRegion: TextRegion = {
      id: Date.now().toString(),
      name: '',
      startLine,
      startChar,
      endLine,
      endChar,
      originalValue: selectedText,
      modifiedValue: selectedText,
      categoryId: 'default'
    };
    
    setTempRegion(newRegion);
    setTempRegionName('');
    setTempSelectedCategoryId('default');
    setTempNewCategoryName('');
    setShowRegionSetupDialog(true);
    setIsSelecting(false);
  };

  // 영역 값 수정 시 텍스트 업데이트
  const updateRegionValue = (regionId: string, newValue: string) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    
    // 텍스트 업데이트
    const lines = text.split('\n');
    const beforeText = lines.slice(0, region.startLine).join('\n') + 
                      (region.startLine > 0 ? '\n' : '') +
                      lines[region.startLine].substring(0, region.startChar);
    const afterText = lines[region.endLine].substring(region.endChar) +
                     (region.endLine < lines.length - 1 ? '\n' : '') +
                     lines.slice(region.endLine + 1).join('\n');
    
    const newText = beforeText + newValue + afterText;
    onTextChange(newText);
    
    // 영역 업데이트
    setRegions(prev => prev.map(r => 
      r.id === regionId ? { ...r, modifiedValue: newValue } : r
    ));
  };

  // 카테고리 생성
  const createCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: COLORS[categories.length % COLORS.length],
      isCollapsed: false,
      order: categories.length
    };
    
    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setShowNewCategoryDialog(false);
  };

  // 영역 설정 완료
  const confirmRegionSetup = () => {
    if (!tempRegion) return;

    let categoryId = tempSelectedCategoryId;
    let regionName = tempRegionName.trim();

    // 이름이 비어있으면 기본 이름 생성
    if (!regionName) {
      regionName = `영역 ${regions.length + 1}`;
    }

    // 새 카테고리를 생성하는 경우
    if (tempSelectedCategoryId === 'new' && tempNewCategoryName.trim()) {
      const newCategory: Category = {
        id: `category_${categories.length + 1}`,
        name: tempNewCategoryName.trim(),
        color: COLORS[categories.length % COLORS.length],
        isCollapsed: false,
        order: categories.length
      };
      
      setCategories(prev => [...prev, newCategory]);
      categoryId = newCategory.id;
    }

    // 영역 추가
    const finalRegion: TextRegion = {
      ...tempRegion,
      name: regionName,
      categoryId
    };

    console.log(`🎯 [REGION DEBUG] 새 영역 추가:`, finalRegion);
    setRegions(prev => {
      const newRegions = [...prev, finalRegion];
      console.log(`🎯 [REGION DEBUG] 업데이트된 영역 목록:`, newRegions);
      return newRegions;
    });
    
    // 상태 초기화
    setTempRegion(null);
    setTempRegionName('');
    setTempSelectedCategoryId('default');
    setTempNewCategoryName('');
    setShowRegionSetupDialog(false);
  };

  // 영역 설정 취소
  const cancelRegionSetup = () => {
    setTempRegion(null);
    setTempRegionName('');
    setTempSelectedCategoryId('default');
    setTempNewCategoryName('');
    setShowRegionSetupDialog(false);
  };

  // 영역을 다른 카테고리로 이동
  const moveRegionToCategory = (regionId: string, categoryId: string) => {
    setRegions(prev => prev.map(r => 
      r.id === regionId ? { ...r, categoryId } : r
    ));
  };

  // 카테고리별로 영역 그룹화
  const getRegionsByCategory = () => {
    const grouped: { [key: string]: TextRegion[] } = {};
    categories.forEach(cat => {
      grouped[cat.id] = regions.filter(r => r.categoryId === cat.id);
    });
    return grouped;
  };

  // 카테고리 토글
  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, isCollapsed: !cat.isCollapsed } : cat
    ));
  };

  // 영역 삭제
  const deleteRegion = (regionId: string) => {
    setRegions(prev => prev.filter(r => r.id !== regionId));
  };

  // 텍스트를 테이블 셀과 연동하는 함수
  const linkTextToTableCell = (selectedText: string, startLine: number, startChar: number, endLine: number, endChar: number) => {
    if (!linkingTableCell) return;
    
    const { tableId, rowIndex, cellIndex } = linkingTableCell;
    
    setRegions(prev => prev.map(region => {
      if (region.id === tableId && region.tableData) {
        const newTableData = { ...region.tableData };
        const cell = newTableData.rows[rowIndex].cells[cellIndex];
        
        // 셀 데이터 업데이트
        cell.value = selectedText;
        cell.startLine = startLine;
        cell.startChar = startChar;
        cell.endLine = endLine;
        cell.endChar = endChar;
        cell.originalValue = selectedText;
        cell.modifiedValue = selectedText;
        
        return { ...region, tableData: newTableData };
      }
      return region;
    }));
    
    // 연동 모드 해제
    setLinkingTableCell(null);
    setIsSelecting(false);
    
    console.log(`테이블 셀과 텍스트 연동 완료: "${selectedText}" -> 테이블 ${tableId}, 행 ${rowIndex + 1}, 열 ${cellIndex + 1}`);
  };

  // 테이블 선택 모드에서 텍스트 드래그 처리
  const handleTableSelectionMode = () => {
    if (!textAreaRef.current) return;
    
    const textArea = textAreaRef.current;
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    
    if (start === end) return; // 선택된 텍스트가 없음
    
    const selectedText = text.substring(start, end);
    const lines = text.substring(0, start).split('\n');
    const startLine = lines.length - 1;
    const startChar = lines[lines.length - 1].length;
    
    const endLines = text.substring(0, end).split('\n');
    const endLine = endLines.length - 1;
    const endChar = endLines[endLines.length - 1].length;
    
    // 대기 중인 선택 정보 저장
    setPendingSelection({
      startLine,
      startChar,
      endLine,
      endChar,
      selectedText
    });
  };

  const updateTextFromTableCell = (cell: TableCell, newValue: string) => {
    if (cell.startLine === undefined || cell.endLine === undefined) return;
    
    const lines = text.split('\n');
    const startPos = cell.startLine * 1 + cell.startChar;
    const endPos = cell.endLine * 1 + cell.endChar;
    
    // 텍스트 위치 계산
    let totalChars = 0;
    let actualStartPos = 0;
    let actualEndPos = 0;
    
    for (let i = 0; i <= Math.max(cell.startLine, cell.endLine); i++) {
      if (i === cell.startLine) {
        actualStartPos = totalChars + cell.startChar;
      }
      if (i === cell.endLine) {
        actualEndPos = totalChars + cell.endChar;
        break;
      }
      totalChars += lines[i].length + 1; // +1 for newline
    }
    
    // 텍스트 교체
    const newText = text.substring(0, actualStartPos) + newValue + text.substring(actualEndPos);
    onTextChange(newText);
    
    console.log(`테이블에서 텍스트 업데이트: "${cell.originalValue}" -> "${newValue}"`);
  };

  // 테이블 생성 함수
  const handleCreateTable = () => {
    console.log('테이블 생성:', { tableName, tableHeaders, tableRowCount, tableCategory });
    
    // 유효한 헤더만 필터링
    const validHeaders = tableHeaders.filter(h => h.trim());
    
    // 테이블 데이터 구조 생성 (빈 셀로 시작)
    const tableRows: TableRow[] = [];
    for (let i = 0; i < tableRowCount; i++) {
      const cells: TableCell[] = validHeaders.map((header, colIndex) => ({
        id: `cell_${Date.now()}_${i}_${colIndex}`,
        value: '',
        startLine: 0,
        startChar: 0,
        endLine: 0,
        endChar: 0,
        originalValue: '',
        modifiedValue: ''
      }));
      
      tableRows.push({
        label: `행 ${i + 1}`,
        cells
      });
    }

    // 새 테이블 영역 생성
    const newTableRegion: TextRegion = {
      id: `table_${Date.now()}`,
      name: tableName,
      startLine: 0,
      startChar: 0,
      endLine: 0,
      endChar: 0,
      originalValue: '',
      modifiedValue: '',
      categoryId: tableCategory,
      type: 'table',
      tableData: {
        headers: validHeaders,
        rows: tableRows
      }
    };

    // 영역 목록에 추가
    setRegions(prev => [...prev, newTableRegion]);

    // 대화상자 닫기 및 초기화
    setShowTableCreationDialog(false);
    setTableName('');
    setTableHeaders(['']);
    setTableRowCount(3);
    setTableCategory('default');
    
    // 테이블이 생성되면 영역 선택 모드 활성화
    setIsSelecting(true);
  };

  const regionsByCategory = getRegionsByCategory();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-3">
      {/* 왼쪽: 텍스트 에디터 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">텍스트 편집</h3>
          <div className="flex gap-2">
            <Button 
              variant={isSelecting ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsSelecting(!isSelecting)}
            >
              {isSelecting ? "선택 취소" : "영역 선택"}
            </Button>
            
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              {isSelectionMode ? "🎯 테이블 연결 중" : "🔗 테이블 연결 모드"}
            </Button>

            <Button 
              variant={isLineSelectionMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setIsLineSelectionMode(!isLineSelectionMode);
                if (!isLineSelectionMode) {
                  setSelectedLines([]);
                }
              }}
            >
              {isLineSelectionMode ? "줄 선택 종료" : "줄 그룹화"}
            </Button>
          </div>
        </div>

        {/* 줄 그룹 관리 패널 */}
        {(isLineSelectionMode || lineGroups.length > 0) && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader 
              className="pb-2 cursor-pointer hover:bg-blue-100"
              onClick={() => setIsGroupPanelCollapsed(!isGroupPanelCollapsed)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">줄 그룹 관리</CardTitle>
                <div className="flex items-center gap-2">
                  {isLineSelectionMode && (
                    <>
                      <Input
                        value={lineNumberInput}
                        onChange={(e) => setLineNumberInput(e.target.value)}
                        placeholder="예: 1,3,5 또는 5-9 (범위)"
                        className="w-48 h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            selectLinesFromInput();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={selectLinesFromInput}
                        disabled={!lineNumberInput.trim()}
                        className="h-8 px-2 text-xs"
                      >
                        선택
                      </Button>
                    </>
                  )}
                  {isLineSelectionMode && selectedLines.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setShowGroupDialog(true)}
                      className="h-8"
                    >
                      그룹 생성 ({selectedLines.length}줄)
                    </Button>
                  )}
                  {lineGroups.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {lineGroups.length}개 그룹
                    </Badge>
                  )}
                  {isGroupPanelCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            {!isGroupPanelCollapsed && (
              <CardContent className="space-y-3">
                {/* 전체 보기 컨트롤 */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={showAllLines}
                      onChange={(e) => setShowAllLines(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    전체 보기
                  </label>
                  
                  {/* 전체 그룹 접기/펼치기 컨트롤 */}
                  {lineGroups.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const allCollapsed = lineGroups.every(group => group.isCollapsed);
                      setLineGroups(prev => prev.map(group => ({
                        ...group,
                        isCollapsed: !allCollapsed
                      })));
                    }}
                    className="h-6 w-6 p-0"
                  >
                    {lineGroups.every(group => group.isCollapsed) ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                  )}
                  
                  
                </div>

                {/* 기존 그룹들 */}
                {lineGroups.length > 0 && (
                  <div className="space-y-2">
                    {lineGroups.map(group => (
                      <div key={group.id} className="bg-white rounded border">
                        <div className="flex items-center gap-2 p-2">
                          <input
                            type="checkbox"
                            checked={group.isVisible}
                            onChange={() => toggleGroupVisibility(group.id)}
                            disabled={showAllLines}
                            className="rounded border-gray-300"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleGroupCollapse(group.id)}
                            className="h-6 w-6 p-0"
                          >
                            {group.isCollapsed ? (
                              <ChevronRight className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </Button>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {editingGroupId === group.id ? (
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onBlur={finishEditingGroupName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  finishEditingGroupName();
                                } else if (e.key === 'Escape') {
                                  cancelEditingGroupName();
                                }
                              }}
                              className="text-sm font-medium flex-1 bg-white border rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="text-sm font-medium flex-1 cursor-pointer hover:bg-gray-100 rounded px-1 py-0"
                              onClick={() => startEditingGroupName(group.id, group.name)}
                              title="클릭하여 그룹 이름 편집"
                            >
                              {group.name}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {group.lines.length}줄
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteLineGroup(group.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {!group.isCollapsed && (
                          <div className="px-2 pb-2">
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              줄 번호: {group.lines.map(line => line + 1).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isLineSelectionMode && (
                  <div className="text-xs text-gray-600 bg-white p-2 rounded">
                    Ctrl+클릭으로 개별 줄 선택 및 해제 || Shift+클릭으로 범위 선택
                    {selectedLines.length > 0 && (
                      <div className="mt-1 font-medium">
                        선택된 줄: {selectedLines.map(line => line + 1).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}
        
        <div className="relative">
          {isLineSelectionMode ? (
            // 줄 선택 모드일 때 테이블 형태로 표시
            <div className="border rounded-lg overflow-hidden">
              <div className="h-96 overflow-y-auto">
                <table className="w-full font-mono text-sm">
                  <tbody>
                    {text.split('\n')
                      .map((line, lineIndex) => {
                        // 줄 그룹 필터링 적용
                        const isVisible = showAllLines || getVisibleLines().includes(lineIndex);
                        if (!showAllLines && !isVisible) return null;
                        
                        return (
                          <tr
                            key={lineIndex}
                            className={cn(
                              "border-b border-gray-100",
                              selectedLines.includes(lineIndex) ? "bg-blue-100" : "",
                              !isVisible ? "opacity-30" : ""
                            )}
                          >
                            {/* 줄 번호 셀 */}
                            <td
                              className={cn(
                                "bg-white px-3 py-0 text-xs cursor-pointer hover:bg-gray-50 min-w-[50px] text-center align-middle",
                                selectedLines.includes(lineIndex) ? "text-blue-600 font-bold" : "text-gray-300"
                              )}
                              onClick={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                  toggleLineSelection(lineIndex);
                                } else if (e.shiftKey && selectedLines.length > 0) {
                                  const lastSelected = selectedLines[selectedLines.length - 1];
                                  const start = Math.min(lastSelected, lineIndex);
                                  const end = Math.max(lastSelected, lineIndex);
                                  const rangeLines: number[] = [];
                                  for (let i = start; i <= end; i++) {
                                    rangeLines.push(i);
                                  }
                                  setSelectedLines(prev => {
                                    const newSelection = new Set([...prev, ...rangeLines]);
                                    return Array.from(newSelection).sort((a, b) => a - b);
                                  });
                                } else {
                                  setSelectedLines([lineIndex]);
                                }
                              }}
                            >
                              {lineIndex + 1}
                            </td>
                            
                            {/* 텍스트 셀 */}
                            <td className="p-1 w-full">
                              <div 
                                className={cn(
                                  "bg-white outline-none min-h-[20px] leading-1 whitespace-pre-wrap break-words",
                                  "cursor-text select-text bg-gray-50 text-gray-600"
                                )}
                              >
                                {line}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                      .filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // 일반 모드일 때 기존 텍스트 영역
            <div className="relative">
              <textarea
                ref={textAreaRef}
                value={showAllLines ? text : text.split('\n').filter((_, index) => getVisibleLines().includes(index)).join('\n')}
                onChange={(e) => onTextChange(e.target.value)}
                onMouseUp={isSelectionMode ? handleTableSelectionMode : handleTextSelection}
                onTouchEnd={isSelectionMode ? handleTableSelectionMode : handleTextSelection}
                className={cn(
                  "w-full h-96 p-4 font-mono text-sm border rounded-lg resize-none",
                  isSelecting ? "cursor-crosshair bg-blue-50 select-text" : "bg-white"
                )}
                placeholder="텍스트를 입력하고 드래그하여 영역을 선택하세요..."
              />
              {isSelecting && (
                <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  드래그하여 영역 선택
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽: 영역 관리 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">영역 관리</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowTableCreationDialog(true)}>
              <Grid className="h-4 w-4 mr-2" />
              테이블 생성
            </Button>
            <Button size="sm" onClick={() => setShowNewCategoryDialog(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              카테고리 추가
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map(category => (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader 
                className="pb-2 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {category.isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-sm">{category.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {regionsByCategory[category.id]?.length || 0}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {!category.isCollapsed && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {regionsByCategory[category.id]?.map(region => (
                      <div 
                        key={region.id}
                        className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                      >
                        
                        
                        <div className="flex-1 min-w-0">
                          {region.type === 'table' ? (
                            // 테이블 영역 표시
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Grid className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-600">{region.name}</span>
                                <Badge variant="secondary" className="text-xs">테이블</Badge>
                              </div> 
                              {region.tableData && (
                                <div className="bg-gray-50 rounded p-1 text-xs overflow-x-auto">
                                  <table className="border-collapse">
                                    <thead>
                                      <tr>
                                        <th className="sticky left-0 border border-gray-300 px-2 py-0.5 bg-gray-100 text-left text-xs font-medium min-w-[71px]">행</th>
                                        {region.tableData.headers.map((header, index) => (
                                          <th key={index} className="border border-gray-300 px-1 py-0.5 bg-gray-100 text-left text-xs font-medium min-w-[88px]">
                                            <Input
                                              value={header}
                                              onChange={(e) => {
                                                setRegions(prev => prev.map(r => {
                                                  if (r.id === region.id && r.tableData) {
                                                    const newTableData = { ...r.tableData };
                                                    newTableData.headers[index] = e.target.value;
                                                    return { ...r, tableData: newTableData };
                                                  }
                                                  return r;
                                                }));
                                              }}
                                              className="h-5 text-xs border-0 p-1 bg-transparent font-medium"
                                              placeholder={`헤더 ${index + 1}`}
                                            />
                                          </th>
                                        ))}
                                        <th className="border border-gray-300 px-1 py-0.5 bg-gray-100 text-center">
                                          <Button
                                            onClick={() => {
                                              setRegions(prev => prev.map(r => {
                                                if (r.id === region.id && r.tableData) {
                                                  const newTableData = { ...r.tableData };
                                                  newTableData.headers.push(`컬럼 ${newTableData.headers.length + 1}`);
                                                  // 모든 행에 새 셀 추가
                                                  newTableData.rows.forEach((row, rowIdx) => {
                                                    row.cells.push({
                                                      id: `cell_${region.id}_${rowIdx}_${newTableData.headers.length - 1}`,
                                                      value: '',
                                                      startLine: 0,
                                                      startChar: 0,
                                                      endLine: 0,
                                                      endChar: 0,
                                                      originalValue: '',
                                                      modifiedValue: ''
                                                    });
                                                  });
                                                  return { ...r, tableData: newTableData };
                                                }
                                                return r;
                                              }));
                                            }}
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0"
                                          >
                                            +
                                          </Button>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {region.tableData.rows.map((row, rowIndex) => (
                                        <tr key={rowIndex}>
                                          <td className="sticky left-0 border border-gray-300 px-1 py-0.5 text-xs font-medium bg-gray-50">
                                            <Input
                                              value={row.label}
                                              onChange={(e) => {
                                                setRegions(prev => prev.map(r => {
                                                  if (r.id === region.id && r.tableData) {
                                                    const newTableData = { ...r.tableData };
                                                    newTableData.rows[rowIndex].label = e.target.value;
                                                    return { ...r, tableData: newTableData };
                                                  }
                                                  return r;
                                                }));
                                              }}
                                              className="h-5 text-xs border-0 p-1 bg-transparent font-medium"
                                              placeholder={`행 ${rowIndex + 1}`}
                                            />
                                          </td>
                                          {row.cells.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="border border-gray-300 px-1 py-0.5 text-xs">
                                              <div className="flex items-center gap-1">
                                                <Input
                                                  value={cell.value}
                                                  onChange={(e) => {
                                                    setRegions(prev => prev.map(r => {
                                                      if (r.id === region.id && r.tableData) {
                                                        const newTableData = { ...r.tableData };
                                                        newTableData.rows[rowIndex].cells[cellIndex].value = e.target.value;
                                                        newTableData.rows[rowIndex].cells[cellIndex].modifiedValue = e.target.value;
                                                        
                                                        // 텍스트 영역과 연결된 경우 원본 텍스트 업데이트
                                                        if (cell.startLine !== undefined && cell.endLine !== undefined) {
                                                          updateTextFromTableCell(cell, e.target.value);
                                                        }
                                                        
                                                        return { ...r, tableData: newTableData };
                                                      }
                                                      return r;
                                                    }));
                                                  }}
                                                  className="h-6 text-xs border-0 p-1 bg-transparent flex-1"
                                                  placeholder="-"
                                                />
                                                <Button
                                                  size="sm"
                                                  variant={linkingTableCell?.tableId === region.id && 
                                                          linkingTableCell?.rowIndex === rowIndex && 
                                                          linkingTableCell?.cellIndex === cellIndex ? "destructive" : "outline"}
                                                  onClick={() => {
                                                    if (linkingTableCell?.tableId === region.id && 
                                                        linkingTableCell?.rowIndex === rowIndex && 
                                                        linkingTableCell?.cellIndex === cellIndex) {
                                                      // 연결 취소
                                                      setLinkingTableCell(null);
                                                      setIsSelecting(false);
                                                    } else {
                                                      // 연결 시작
                                                      setLinkingTableCell({ tableId: region.id, rowIndex, cellIndex });
                                                      setIsSelecting(true);
                                                    }
                                                  }}
                                                  className="h-5 w-5 p-0"
                                                >
                                                  <MapPin className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                      <tr>
                                        <td className="border border-gray-300 px-1 py-0.5 bg-gray-100 text-center">
                                          <Button
                                            onClick={() => {
                                              setRegions(prev => prev.map(r => {
                                                if (r.id === region.id && r.tableData) {
                                                  const newTableData = { ...r.tableData };
                                                  const newRowIndex = newTableData.rows.length;
                                                  const newRow = {
                                                    label: `행 ${newRowIndex + 1}`,
                                                    cells: newTableData.headers.map((_, cellIndex) => ({
                                                      id: `cell_${region.id}_${newRowIndex}_${cellIndex}`,
                                                      value: '',
                                                      startLine: 0,
                                                      startChar: 0,
                                                      endLine: 0,
                                                      endChar: 0,
                                                      originalValue: '',
                                                      modifiedValue: ''
                                                    }))
                                                  };
                                                  newTableData.rows.push(newRow);
                                                  return { ...r, tableData: newTableData };
                                                }
                                                return r;
                                              }));
                                            }}
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0"
                                          >
                                            +
                                          </Button>
                                        </td>
                                        {region.tableData.headers.map((_, index) => (
                                          <td key={index} className="border border-gray-300 px-1 py-0.5 bg-gray-100"></td>
                                        ))}
                                        <td className="border border-gray-300 px-1 py-0.5 bg-gray-100"></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ) : editingRegionId === region.id ? (
                            <Input
                              value={region.name}
                              onChange={(e) => {
                                setRegions(prev => prev.map(r => 
                                  r.id === region.id ? { ...r, name: e.target.value } : r
                                ));
                              }}
                              onBlur={() => setEditingRegionId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingRegionId(null);
                              }}
                              autoFocus
                              className="text-sm"
                            />
                          ) : (
                            <div 
                              className="font-medium text-sm cursor-pointer"
                              onClick={() => setEditingRegionId(region.id)}
                            >
                              {region.name}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-1">
                            {region.startLine}:{region.startChar} - {region.endLine}:{region.endChar}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {region.type !== 'table' && (
                            <Input
                              value={region.modifiedValue}
                              onChange={(e) => updateRegionValue(region.id, e.target.value)}
                              className="text-xs min-w-0 flex-1"
                              style={{ 
                                width: `${Math.max(region.modifiedValue.length * 8 + 16, 100)}px`
                              }}
                            />
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRegion(region.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {(!regionsByCategory[category.id] || regionsByCategory[category.id].length === 0) && (
                      <div className="text-sm text-gray-500 text-center py-4">
                        이 카테고리에는 영역이 없습니다
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* 영역 설정 다이얼로그 */}
      <Dialog open={showRegionSetupDialog} onOpenChange={setShowRegionSetupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 영역 설정</DialogTitle>
            <DialogDescription>
              선택한 영역의 이름과 카테고리를 설정하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">영역 이름</label>
              <Input
                value={tempRegionName}
                onChange={(e) => setTempRegionName(e.target.value)}
                placeholder="영역 이름을 입력하세요 (비워두면 자동 생성)"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <Select value={tempSelectedCategoryId} onValueChange={setTempSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ 새 카테고리 만들기</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tempSelectedCategoryId === 'new' && (
              <div>
                <label className="text-sm font-medium">새 카테고리 이름</label>
                <Input
                  value={tempNewCategoryName}
                  onChange={(e) => setTempNewCategoryName(e.target.value)}
                  placeholder="새 카테고리 이름을 입력하세요"
                />
              </div>
            )}

            {tempRegion && (
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-sm text-gray-600 mb-2">선택된 텍스트:</div>
                <div className="font-mono text-sm bg-white p-2 rounded border max-h-20 overflow-y-auto">
                  {tempRegion.originalValue}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  위치: {tempRegion.startLine}:{tempRegion.startChar} - {tempRegion.endLine}:{tempRegion.endChar}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelRegionSetup}>
              취소
            </Button>
            <Button 
              onClick={confirmRegionSetup} 
              disabled={
                tempSelectedCategoryId === 'new' && !tempNewCategoryName.trim()
              }
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 새 카테고리 생성 다이얼로그 */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 카테고리 만들기</DialogTitle>
            <DialogDescription>
              새로운 카테고리를 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">카테고리 이름</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="카테고리 이름을 입력하세요"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createCategory();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
              취소
            </Button>
            <Button onClick={createCategory} disabled={!newCategoryName.trim()}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 테이블 영역 생성 대화상자 */}
      <Dialog open={showTableCreationDialog} onOpenChange={setShowTableCreationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>테이블 영역 생성</DialogTitle>
            <DialogDescription>
              구조화된 데이터를 관리할 테이블 영역을 생성합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 테이블 이름 */}
            <div>
              <label className="text-sm font-medium">테이블 이름</label>
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="예: 무기 스펙, 캐릭터 정보"
              />
            </div>

            {/* 카테고리 선택 */}
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <Select value={tableCategory} onValueChange={setTableCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 컬럼 헤더 설정 */}
            <div>
              <label className="text-sm font-medium">컬럼 헤더</label>
              <div className="space-y-2">
                {tableHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={header}
                      onChange={(e) => {
                        const newHeaders = [...tableHeaders];
                        newHeaders[index] = e.target.value;
                        setTableHeaders(newHeaders);
                      }}
                      placeholder={`헤더 ${index + 1}`}
                    />
                    {tableHeaders.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newHeaders = tableHeaders.filter((_, i) => i !== index);
                          setTableHeaders(newHeaders);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTableHeaders([...tableHeaders, ''])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  컬럼 추가
                </Button>
              </div>
            </div>

            {/* 행 개수 설정 */}
            <div>
              <label className="text-sm font-medium">행 개수</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={tableRowCount}
                onChange={(e) => setTableRowCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowTableCreationDialog(false);
              setTableName('');
              setTableHeaders(['']);
              setTableRowCount(3);
              setTableCategory('default');
            }}>
              취소
            </Button>
            <Button 
              onClick={handleCreateTable}
              disabled={!tableName.trim() || tableHeaders.filter(h => h.trim()).length === 0}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 테이블 셀 선택 다이얼로그 */}
      <Dialog open={!!pendingSelection} onOpenChange={() => setPendingSelection(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>테이블 셀 선택</DialogTitle>
            <DialogDescription>
              선택한 텍스트 "{pendingSelection?.selectedText}"를 어느 테이블 셀에 연결하시겠습니까? (테이블 생성 필요)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {regions.filter(region => region.type === 'table').map(table => (
              <div key={table.id} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{table.name} 테이블</h4>
                {table.tableData && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="sticky left-0 border border-gray-300 px-2 py-1 bg-gray-100 z-20 min-w-[86px]"></th>
                          {table.tableData.headers.map((header, headerIndex) => (
                            <th key={headerIndex} className="border border-gray-300 px-2 py-1 bg-gray-100 text-left">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.tableData.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <td className="sticky left-0 border border-gray-300 px-2 py-1 bg-gray-50 font-medium z-10">
                              {row.label}
                            </td>
                            {row.cells.map((cell, cellIndex) => (
                              <td key={cellIndex} className="border border-gray-300 px-2 py-1 max-w-[156px]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-left justify-start"
                                  onClick={() => {
                                    if (pendingSelection) {
                                      // 셀에 위치 정보 연결
                                      setRegions(prev => prev.map(r => {
                                        if (r.id === table.id && r.tableData) {
                                          const newTableData = { ...r.tableData };
                                          newTableData.rows[rowIndex].cells[cellIndex] = {
                                            ...cell,
                                            startLine: pendingSelection.startLine,
                                            startChar: pendingSelection.startChar,
                                            endLine: pendingSelection.endLine,
                                            endChar: pendingSelection.endChar,
                                            originalValue: pendingSelection.selectedText,
                                            modifiedValue: pendingSelection.selectedText,
                                            value: pendingSelection.selectedText
                                          };
                                          return { ...r, tableData: newTableData };
                                        }
                                        return r;
                                      }));
                                      
                                      setPendingSelection(null);
                                      // 테이블 연결 모드는 계속 유지 (사용자가 직접 끌 때까지)
                                    }
                                  }}
                                >
                                  {cell.value || "✔️"}
                                </Button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingSelection(null)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 줄 그룹 생성 다이얼로그 */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 줄 그룹 생성</DialogTitle>
            <DialogDescription>
              선택한 {selectedLines.length}개 줄을 하나의 그룹으로 묶습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">그룹 이름</label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="그룹 이름을 입력하세요"
                autoFocus
              />
            </div>
            
            <div className="p-3 bg-gray-50 rounded border">
              <div className="text-sm text-gray-600 mb-2">선택된 줄:</div>
              <div className="text-sm font-mono">
                {selectedLines.map(line => line + 1).join(', ')}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                총 {selectedLines.length}줄이 선택되었습니다.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGroupDialog(false);
              setNewGroupName('');
            }}>
              취소
            </Button>
            <Button 
              onClick={createLineGroup}
              disabled={!newGroupName.trim()}
            >
              그룹 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}