import { useRef, useEffect, useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ComparisonMode } from "@/lib/types";
import { RefreshCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import TextAlignmentToolbar from "@/components/TextAlignmentToolbar";
import TextRegionManager from "@/components/TextRegionManager";
import ApplyToOriginalModal from "@/components/ApplyToOriginalModal";

interface ComparisonViewProps {
  originalText: string;
  modifiedText: string;
  onModifiedChange: (text: string) => void;
  onReset: () => void;
  mode: ComparisonMode;
  modifiedDocumentId?: number;
  originalDocumentId?: number;
  onRegionDataChange?: (regionData: any) => void;
  onOriginalUpdated?: () => void;
}

export default function ComparisonView({
  originalText,
  modifiedText,
  onModifiedChange,
  onReset,
  mode,
  modifiedDocumentId,
  originalDocumentId,
  onRegionDataChange,
  onOriginalUpdated,
}: ComparisonViewProps) {
  // 상하(top-bottom) 비교 모드에서 표시할 줄 수 상태
  const [visibleLines, setVisibleLines] = useState<number>(17);
  
  // 백업 관련 모달 상태
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  // refs for synchronized scrolling
  const originalEditorRef = useRef<HTMLDivElement>(null);
  const modifiedEditorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersOriginalRef = useRef<HTMLDivElement>(null);
  const lineNumbersModifiedRef = useRef<HTMLDivElement>(null);
  
  // 상하 비교 모드에서 원본과 수정본을 위한 두 번째 세트의 refs
  const topBottomOriginalRef = useRef<HTMLDivElement>(null);
  const topBottomModifiedRef = useRef<HTMLTextAreaElement>(null);
  const topBottomLineNumbersOriginalRef = useRef<HTMLDivElement>(null);
  const topBottomLineNumbersModifiedRef = useRef<HTMLDivElement>(null);

  // 높이 계산 - 원본과 수정본 중 더 큰 높이 사용 + 여유 공간 추가
  const maxLines = Math.max(originalText.split('\n').length, modifiedText.split('\n').length);
  // const containerHeight = Math.max(300, (maxLines + 3) * 21 + 40); // 여유 공간 추가

  // 동기화 함수 정의 - 재사용을 위해 분리
  const syncScroll = (source: HTMLElement | null, target: HTMLElement | null, lineNumbers: HTMLElement | null) => {
    // 요소가 존재하는지 안전하게 확인
    if (!source || !target) return;
    
    // 가로 및 세로 스크롤 동기화
    target.scrollLeft = source.scrollLeft;
    target.scrollTop = source.scrollTop;
    
    // 줄 번호 영역 세로 스크롤 동기화
    if (lineNumbers) {
      lineNumbers.scrollTop = source.scrollTop;
    }
  };

  // 좌우 비교 모드에서의 스크롤 동기화
  useEffect(() => {
    // mode가 바뀌거나 컴포넌트가 언마운트될 때마다 이벤트 리스너를 제거
    const cleanupListeners = () => {
      const originalEditor = originalEditorRef.current;
      const modifiedEditor = modifiedEditorRef.current;
      
      if (originalEditor) {
        originalEditor.onscroll = null;
      }
      
      if (modifiedEditor) {
        modifiedEditor.onscroll = null;
      }
    };
    
    // 이전 이벤트 리스너 정리
    cleanupListeners();
    
    // 현재 모드가 side-by-side가 아니면 리스너를 추가하지 않음
    if (mode !== 'side-by-side') return cleanupListeners;
    
    const originalEditor = originalEditorRef.current;
    const modifiedEditor = modifiedEditorRef.current;
    
    if (!originalEditor || !modifiedEditor) return cleanupListeners;

    // 이벤트 핸들러 - 인라인 함수 대신 onscroll 프로퍼티 사용
    originalEditor.onscroll = () => {
      if (originalEditor && modifiedEditor && lineNumbersModifiedRef.current) {
        syncScroll(originalEditor, modifiedEditor, lineNumbersModifiedRef.current);
      }
    };
    
    modifiedEditor.onscroll = () => {
      if (originalEditor && modifiedEditor && lineNumbersOriginalRef.current) {
        syncScroll(modifiedEditor, originalEditor, lineNumbersOriginalRef.current);
      }
    };

    return cleanupListeners;
  }, [mode]);
  
  // 상하 비교 모드에서의 스크롤 동기화
  useEffect(() => {
    // mode가 바뀌거나 컴포넌트가 언마운트될 때마다 이벤트 리스너를 제거
    const cleanupListeners = () => {
      const originalEditor = topBottomOriginalRef.current;
      const modifiedEditor = topBottomModifiedRef.current;
      
      if (originalEditor) {
        originalEditor.onscroll = null;
      }
      
      if (modifiedEditor) {
        modifiedEditor.onscroll = null;
      }
    };
    
    // 이전 이벤트 리스너 정리
    cleanupListeners();
    
    // 현재 모드가 top-bottom이 아니면 리스너를 추가하지 않음
    if (mode !== 'top-bottom') return cleanupListeners;
    
    const originalEditor = topBottomOriginalRef.current;
    const modifiedEditor = topBottomModifiedRef.current;
    
    if (!originalEditor || !modifiedEditor) return cleanupListeners;

    // 이벤트 핸들러 - 인라인 함수 대신 onscroll 프로퍼티 사용
    originalEditor.onscroll = () => {
      if (originalEditor && modifiedEditor) {
        syncScroll(originalEditor, modifiedEditor, topBottomLineNumbersModifiedRef.current);
      }
    };
    
    modifiedEditor.onscroll = () => {
      if (originalEditor && modifiedEditor) {
        syncScroll(modifiedEditor, originalEditor, topBottomLineNumbersOriginalRef.current);
      }
    };

    return cleanupListeners;
  }, [mode]);

  // Generate line numbers
  const originalLineNumbers = originalText.split('\n').map((_, i) => i + 1);
  const modifiedLineNumbers = modifiedText.split('\n').map((_, i) => i + 1);

  // 상하 비교 모드일 때 표시할 줄 수 계산
  const calculateDisplayHeight = (lineCount: number) => {
    // 1.5 line-height에서의 대략적인 높이 계산 (rem 단위)
    return Math.max(lineCount * 1., 2.3) + 'rem'; // 최소 2.3rem으로 제한
  };

  return (
    <div className={`flex ${mode === 'side-by-side' ? 'flex-col md:flex-row' : 'flex-col'} gap-0`}>
      {mode === 'edit-only' ? (
        // 편집 전용 모드 - 텍스트 편집 영역과 영역 관리 표시
        <div className="space-y-6">
          <div className="w-full bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium text-neutral-800">텍스트 편집</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">편집 전용 모드</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={onReset}
                  >
                    <RefreshCw className="h-4 w-4 text-neutral-500" />
                  </Button>
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="flex border rounded border-neutral-200 bg-gray-50 min-h-[500px] relative">
                {/* 줄 번호 영역 */}
                <div className="line-numbers w-10 flex-shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-100">
                  <div className="py-2 px-2 text-right">
                    {modifiedLineNumbers.map(num => (
                      <div key={num} className="text-neutral-400 font-mono text-xs leading-[1.7503]">{num}</div>
                    ))}
                  </div>
                </div>
                
                {/* 편집 가능한 텍스트 영역 */}
                <div className="relative flex-grow w-full">
                  <TextAlignmentToolbar 
                    textAreaRef={modifiedEditorRef} 
                    onTextChange={onModifiedChange} 
                  />
                  <textarea
                    ref={modifiedEditorRef}
                    className="w-full p-2 pl-2 font-mono border-0 resize-none focus:outline-none bg-white"
                    style={{ 
                      lineHeight: '1.5',
                      fontSize: '0.875rem',
                      minHeight: '500px',
                      height: `${Math.max(500, (modifiedText.split('\n').length * 21) + 47)}px`,
                      whiteSpace: 'pre',
                      overflowX: 'auto',
                      overflowY: 'auto',
                      width: 'max-content',
                      minWidth: '100%'
                    }}
                    value={modifiedText}
                    onChange={(e) => onModifiedChange(e.target.value)}
                    placeholder="수정할 텍스트를 입력하세요..."
                  />
                </div>
              </div>
            </CardContent>
          </div>
          
          {/* 영역 관리 시스템 */}
          <TextRegionManager 
            text={modifiedText}
            onTextChange={onModifiedChange}
            modifiedDocumentId={modifiedDocumentId}
            onRegionDataChange={onRegionDataChange}
          />
        </div>
      ) : mode === 'side-by-side' ? (
        // 좌우 비교 모드 (기존 코드)
        <>
          {/* 원본 문서 */}
          <div className={`editor-container bg-white rounded-lg shadow overflow-hidden flex flex-col md:w-1/2`}>
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium text-neutral-800">원본 메모</h2>
                <div className="flex items-center">
                  <span className="text-xs text-neutral-500">읽기 전용</span>
                </div>
              </div>
            </div>
            <CardContent className="p-0 flex-grow"> 
              <div className="flex border rounded border-neutral-200 bg-gray-50 min-h-[300px] relative">
                {/* 줄 번호 영역 */}
                <div 
                  ref={lineNumbersOriginalRef}
                  className="line-numbers w-10 flex-shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-100"
                >
                  <div className="py-2 px-2 text-right">
                    {originalLineNumbers.map(num => (
                      <div key={num} className="text-neutral-400 font-mono text-xs leading-[1.7503]">{num}</div>//1.7503 숫자와 글과의 간격을 맞춘 수치
                    ))}
                  </div>
                </div>
                
                {/* 텍스트 영역 */}
                <div 
                  ref={originalEditorRef}
                  className="flex-grow overflow-auto p-2 pl-2"
                  style={{ width: '100%' }}
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    syncScroll(target, modifiedEditorRef.current, lineNumbersModifiedRef.current);
                  }}
                >
                  <pre style={{ 
                    //fontFamily: "'Spoqa Han Sans', sans-serif",
                    fontSize: '0.875rem', 
                    lineHeight: '1.5', 
                    margin: 0,
                    whiteSpace: 'pre',       
                    width: 'max-content',    
                    minWidth: '100%',
                    height: 'auto'         
                  }}>
                    {originalText}
                  </pre>
                </div>
              </div>
            </CardContent>
          </div>
          
          {/* 수정 문서 */}
          <div className={`editor-container bg-white rounded-lg shadow overflow-hidden flex flex-col md:w-1/2`}>
            <div className="bg-neutral-50 px-4 py-1.5 border-b border-neutral-200">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium text-neutral-800">수정된 메모</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">편집 가능</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0" 
                    onClick={onReset}
                  >
                    <RefreshCw className="h-4 w-4 text-neutral-500" />
                  </Button>
                </div>
              </div>
            </div>
            <CardContent className="p-0 flex-grow">
              <div className="flex border rounded border-neutral-200 bg-gray-50 min-h-[300px] relative">
                {/* 줄 번호 영역 */}
                <div 
                  ref={lineNumbersModifiedRef}
                  className="line-numbers w-10 flex-shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-100"
                >
                  <div className="py-2 px-2 text-right">
                    {modifiedLineNumbers.map(num => (
                      <div key={num} className="text-neutral-400 font-mono text-xs leading-[1.7503]">{num}</div> //1.7503 숫자와 글과의 간격을 맞춘 수치
                    ))}
                  </div>
                </div>
                
                {/* 편집 가능한 텍스트 영역 */}
                <div className="relative flex-grow w-full">
                  <TextAlignmentToolbar 
                    textAreaRef={modifiedEditorRef} 
                    onTextChange={onModifiedChange} 
                  />
                  <textarea
                    ref={modifiedEditorRef}
                    className="w-full p-2 pl-2 font-mono border-0 resize-none focus:outline-none bg-white"
                    style={{ 
                      lineHeight: '1.5',
                      fontSize: '0.875rem',
                      minHeight: '300px',
                      height: `${Math.max(300, (modifiedText.split('\n').length * 21) + 47)}px`, // 텍스트 높이 + 여유분 -3px
                      whiteSpace: 'pre',
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      width: 'max-content',
                      minWidth: '100%'
                    }}
                    onScroll={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      syncScroll(target, originalEditorRef.current, lineNumbersOriginalRef.current);
                    }}
                    value={modifiedText}
                    onChange={(e) => onModifiedChange(e.target.value)}
                    placeholder="수정할 텍스트를 입력하세요..."
                  />
                </div>
              </div>
            </CardContent>
          </div>
        </>
      ) : (
        // 상하 비교 모드 (새 구현)
        <>
          {/* 상하 비교 모드 컨트롤 패널 */}
          <div className="w-full bg-white rounded-lg shadow p-4 mb-2">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium text-neutral-800 min-w-[100px]">
                표시할 줄 수: {visibleLines}
              </div>
              <div className="flex-grow">
                <Slider
                  value={[visibleLines]}
                  min={1}  // 최소값을 1로 설정
                  max={100}
                  step={4}  // 4씩 변경 가능하도록 설정
                  onValueChange={(values) => setVisibleLines(values[0])}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={onReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                초기화
              </Button>
            </div>
          </div>

          {/* 원본 문서 */}
          <div className="w-full bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <h2 className="text-sm font-medium text-neutral-800">원본 메모</h2>
            </div>
            <CardContent className="p-0">
              <div className="flex border rounded border-neutral-200 bg-gray-50 relative"
                style={{ height: calculateDisplayHeight(visibleLines) }}
              >
                {/* 줄 번호 영역 */}
                <div 
                  ref={topBottomLineNumbersOriginalRef}
                  className="line-numbers w-8 flex-shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-100"
                  style={{ maxHeight: calculateDisplayHeight(visibleLines) }}
                >
                  <div className="py-2 px-2 text-right">
                    {originalLineNumbers.map(num => (
                      <div key={num} className="text-neutral-400 font-mono text-xs leading-[1.7503]">{num}</div>//1.7503 숫자와 글과의 간격을 맞춘 수치
                    ))}
                  </div>
                </div>
                
                {/* 텍스트 영역 */}
                <div 
                  ref={topBottomOriginalRef}
                  className="flex-grow overflow-auto p-2 pl-2"
                  style={{ 
                    width: '100%',
                    height: calculateDisplayHeight(visibleLines)
                  }}
                >
                  <pre style={{ 
                    //fontFamily: "'Spoqa Han Sans', sans-serif",
                    fontSize: '0.875rem', 
                    lineHeight: '1.5', 
                    margin: 0,
                    whiteSpace: 'pre',
                    width: 'max-content',
                    minWidth: '100%'
                  }}>
                    {originalText}
                  </pre>
                </div>
              </div>
            </CardContent>
          </div>
          
          {/* 수정 문서 */}
          <div className="w-full bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <h2 className="text-sm font-medium text-neutral-800">수정된 메모</h2>
            </div>
            <CardContent className="p-0">
              <div className="flex border rounded border-neutral-200 relative"
                style={{ height: calculateDisplayHeight(visibleLines) }}
              >
                {/* 줄 번호 영역 */}
                <div 
                  ref={topBottomLineNumbersModifiedRef}
                  className="line-numbers w-8 flex-shrink-0 overflow-hidden border-r border-neutral-200 bg-neutral-100"
                  style={{ maxHeight: calculateDisplayHeight(visibleLines) }}
                >
                  <div className="py-2 px-2 text-right">
                    {modifiedLineNumbers.map(num => (
                      <div key={num} className="text-neutral-400 font-mono text-xs leading-[1.7503]">{num}</div>//1.7503 숫자와 글과의 간격을 맞춘 수치
                    ))}
                  </div>
                </div>
                
                {/* 편집 가능한 텍스트 영역 */}
                <div className="relative flex-grow w-full" 
                  style={{ height: calculateDisplayHeight(visibleLines) }}
                >
                  <TextAlignmentToolbar 
                    textAreaRef={topBottomModifiedRef}
                    onTextChange={onModifiedChange}
                  />
                  <textarea
                    ref={topBottomModifiedRef}
                    className="flex-grow p-2 pl-2 font-mono border-0 resize-none focus:outline-none bg-white"
                    style={{ 
                     // fontFamily: "'Spoqa Han Sans', sans-serif",
                      lineHeight: '1.5',
                      whiteSpace: 'pre',
                      overflowX: 'auto',
                      overflowY: 'auto',
                      fontSize: '0.875rem',
                      width: '100%',
                      minWidth: '100%',
                      height: '100%'
                    }}
                    value={modifiedText}
                    onChange={(e) => onModifiedChange(e.target.value)}
                    placeholder="수정할 텍스트를 입력하세요..."
                  />
                </div>
              </div>
            </CardContent>
          </div>
        </>
      )}
      
      {/* 백업 관련 모달들 */}
      {originalDocumentId && (
        <>
          <ApplyToOriginalModal
            isOpen={isApplyModalOpen}
            onClose={() => setIsApplyModalOpen(false)}
            originalId={originalDocumentId}
            modifiedContent={modifiedText}
            onSuccess={() => {
              onOriginalUpdated?.();
            }}
          />
        </>
      )}
    </div>
  );
}
