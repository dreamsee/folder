import { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  compareTextsForEditor, 
  analyzeTextSize, 
  alignTextsForSyncScroll, 
  calculateVisibleAreaDiff,
  AlignedLine,
  TextSizeAnalysis 
} from "@/lib/diffUtils";
import { Save, RotateCcw, RefreshCw, Eye, Zap } from "lucide-react";

interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffResult: string;
  diffMode: 'line' | 'inline';
  originalText: string;
  modifiedText: string;
  onModifiedTextChange: (text: string) => void;
}

export default function DiffModal({ isOpen, onClose, diffResult, diffMode, originalText, modifiedText, onModifiedTextChange }: DiffModalProps) {
  // 모달 내부에서 관리하는 임시 텍스트 상태
  const [tempModifiedText, setTempModifiedText] = useState(modifiedText);
  const [currentDiffResult, setCurrentDiffResult] = useState(diffResult);
  
  // 변경사항 감지를 위한 상태
  const [hasChanges, setHasChanges] = useState(false);
  
  // 대용량 모드 관련 상태
  const [textAnalysis, setTextAnalysis] = useState<TextSizeAnalysis | null>(null);
  const [alignedLines, setAlignedLines] = useState<AlignedLine[]>([]);
  const [isAlignmentMode, setIsAlignmentMode] = useState(false);
  const [visibleStartLine] = useState(0);
  const [visibleEndLine, setVisibleEndLine] = useState(100);
  const [isCalculatingAlignment, setIsCalculatingAlignment] = useState(false);
  
  // 미리보기 모드 관련 상태
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // 스크롤 동기화용 ref
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  
  // 모달이 열릴 때 초기 상태 설정
  useEffect(() => {
    if (isOpen) {
      setTempModifiedText(modifiedText);
      setCurrentDiffResult(diffResult);
      setHasChanges(false);
      
      // 미리보기 모드 감지 (diffResult가 비어있으면 미리보기 모드)
      const isPreview = !diffResult;
      setIsPreviewMode(isPreview);
      
      // 텍스트 크기 분석
      const analysis = analyzeTextSize(originalText, modifiedText);
      setTextAnalysis(analysis);
      
      if (!isPreview) {
        // 일반 모드: 대용량/초대용량인 경우 정렬 모드 활성화
        if (analysis.shouldUseAlignment) {
          setIsAlignmentMode(true);
          setIsCalculatingAlignment(true);
          
          // 비동기로 정렬 계산
          setTimeout(() => {
            const aligned = alignTextsForSyncScroll(originalText, modifiedText);
            setAlignedLines(aligned);
            setVisibleEndLine(Math.min(analysis.recommendedChunkSize - 1, aligned.length - 1));
            setIsCalculatingAlignment(false);
          }, 100);
        } else {
          setIsAlignmentMode(false);
          setAlignedLines([]);
        }
      } else {
        // 미리보기 모드: 정렬 모드 비활성화
        setIsAlignmentMode(false);
        setAlignedLines([]);
        setIsCalculatingAlignment(false);
      }
    }
  }, [isOpen, modifiedText, diffResult, originalText]);

  // 수동 diff 갱신 함수 - 모드에 따라 다른 처리
  const updateDiff = useCallback(() => {
    if (isAlignmentMode && alignedLines.length > 0) {
      // 대용량 모드: 가시 영역만 계산
      updateVisibleAreaDiff();
    } else {
      // 일반 모드: 전체 diff 계산
      const newDiffResult = compareTextsForEditor(originalText, tempModifiedText, diffMode);
      setCurrentDiffResult(newDiffResult);
      setHasChanges(false);
    }
  }, [originalText, tempModifiedText, diffMode, isAlignmentMode, alignedLines, visibleStartLine, visibleEndLine]);

  // 가시 영역 diff 갱신 함수
  const updateVisibleAreaDiff = useCallback(() => {
    if (alignedLines.length === 0) return;
    
    const visibleDiff = calculateVisibleAreaDiff(
      alignedLines,
      visibleStartLine,
      visibleEndLine,
      diffMode
    );
    
    setCurrentDiffResult(visibleDiff.originalHtml);
    setHasChanges(false);
  }, [alignedLines, visibleStartLine, visibleEndLine, diffMode]);

  // 미리보기에서 인라인 모드로 전환
  const switchToInlineMode = useCallback(() => {
    setIsPreviewMode(false);
    
    // 텍스트 분석을 다시 수행
    const analysis = analyzeTextSize(originalText, tempModifiedText);
    
    if (analysis.shouldUseAlignment) {
      // 대용량인 경우 정렬 모드 활성화
      setIsAlignmentMode(true);
      setIsCalculatingAlignment(true);
      
      setTimeout(() => {
        const aligned = alignTextsForSyncScroll(originalText, tempModifiedText);
        setAlignedLines(aligned);
        setVisibleEndLine(Math.min(analysis.recommendedChunkSize - 1, aligned.length - 1));
        setIsCalculatingAlignment(false);
      }, 100);
    } else {
      // 일반 크기인 경우 바로 diff 계산
      const newDiffResult = compareTextsForEditor(originalText, tempModifiedText, 'inline');
      setCurrentDiffResult(newDiffResult);
    }
  }, [originalText, tempModifiedText]);

  // 미리보기에서 라인 모드로 전환
  const switchToLineMode = useCallback(() => {
    setIsPreviewMode(false);
    
    // 텍스트 분석을 다시 수행
    const analysis = analyzeTextSize(originalText, tempModifiedText);
    
    if (analysis.shouldUseAlignment) {
      // 대용량인 경우 정렬 모드 활성화
      setIsAlignmentMode(true);
      setIsCalculatingAlignment(true);
      
      setTimeout(() => {
        const aligned = alignTextsForSyncScroll(originalText, tempModifiedText);
        setAlignedLines(aligned);
        setVisibleEndLine(Math.min(analysis.recommendedChunkSize - 1, aligned.length - 1));
        setIsCalculatingAlignment(false);
      }, 100);
    } else {
      // 일반 크기인 경우 바로 diff 계산
      const newDiffResult = compareTextsForEditor(originalText, tempModifiedText, 'line');
      setCurrentDiffResult(newDiffResult);
    }
  }, [originalText, tempModifiedText]);

  // 텍스트 변경 시 변경사항 감지
  const handleTextChange = useCallback((newText: string) => {
    setTempModifiedText(newText);
    setHasChanges(newText !== modifiedText);
  }, [modifiedText]);

  // 저장 함수
  const handleSave = () => {
    onModifiedTextChange(tempModifiedText);
    onClose();
  };

  // 초기화 함수 (모달 진입 시점 값으로)
  const handleReset = () => {
    setTempModifiedText(modifiedText);
    setCurrentDiffResult(diffResult);
    setHasChanges(false);
  };

  // 스크롤 동기화 설정
  useEffect(() => {
    if (!isAlignmentMode || !leftPanelRef.current || !rightPanelRef.current) return;

    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;

    const syncScroll = (sourcePanel: HTMLDivElement, targetPanel: HTMLDivElement) => {
      return () => {
        targetPanel.scrollTop = sourcePanel.scrollTop;
        targetPanel.scrollLeft = sourcePanel.scrollLeft;
      };
    };

    const leftScrollHandler = syncScroll(leftPanel, rightPanel);
    const rightScrollHandler = syncScroll(rightPanel, leftPanel);

    leftPanel.addEventListener('scroll', leftScrollHandler);
    rightPanel.addEventListener('scroll', rightScrollHandler);

    return () => {
      leftPanel.removeEventListener('scroll', leftScrollHandler);
      rightPanel.removeEventListener('scroll', rightScrollHandler);
    };
  }, [isAlignmentMode, alignedLines]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[85vh] min-h-[600px] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            {isPreviewMode ? '비교 결과 미리보기' : `차이점 비교 및 수정 (${diffMode === 'inline' ? '인라인 방식' : '라인 방식'})`}
            {textAnalysis && (
              <span className={`text-xs px-2 py-1 rounded ${
                textAnalysis.processingMode === 'small' ? 'bg-green-100 text-green-700' :
                textAnalysis.processingMode === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                textAnalysis.processingMode === 'large' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {textAnalysis.processingMode === 'small' ? '소용량' :
                 textAnalysis.processingMode === 'medium' ? '중용량' :
                 textAnalysis.processingMode === 'large' ? '대용량' : '초대용량'}
                ({textAnalysis.totalLines.toLocaleString()}줄)
              </span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {!isPreviewMode && (
              <>
                {isAlignmentMode ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={updateVisibleAreaDiff}
                    disabled={isCalculatingAlignment}
                    className="flex items-center gap-1"
                  >
                    <Eye size={16} />
                    가시영역 비교
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={updateDiff}
                    className={`flex items-center gap-1 ${hasChanges ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
                  >
                    <RefreshCw size={16} />
                    비교 갱신
                    {hasChanges && <span className="text-xs bg-blue-500 text-white px-1 rounded">변경</span>}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-1"
                >
                  <RotateCcw size={16} />
                  초기값
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleSave}
                  className="flex items-center gap-1"
                >
                  <Save size={16} />
                  저장
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              ESC
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          {isPreviewMode ? (
            /* 미리보기 모드: 2번 사진과 같은 중앙 정렬 레이아웃 */
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-md">
              <div className="text-center space-y-6 max-w-md">
                <h2 className="text-xl font-semibold text-gray-800">
                  비교 결과 (라인별 모드)
                </h2>
                
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">대용량 텍스트가 감지되었습니다.</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    총 {textAnalysis?.totalLines.toLocaleString() || 0}줄 • 수정으로 시작하세요
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={switchToInlineMode}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2"
                  >
                    인라인으로 보기
                  </Button>
                  <Button 
                    onClick={switchToLineMode}
                    variant="outline"
                    className="px-6 py-2"
                  >
                    라인으로 보기
                  </Button>
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  <p>• 인라인: 수정된 부분만 강조 표시</p>
                  <p>• 라인: 변경된 줄 전체를 표시</p>
                </div>
              </div>
            </div>
          ) : isAlignmentMode ? (
            /* 대용량 모드: 노트패드++ 스타일 정렬 */
            <>
              {/* 왼쪽: 원본 텍스트 (동기화된 스크롤) */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  원본 내용
                  {isCalculatingAlignment && (
                    <span className="text-xs text-gray-500">정렬 계산 중...</span>
                  )}
                </h3>
                <div 
                  ref={leftPanelRef}
                  className="flex-1 overflow-auto bg-gray-50 p-4 rounded-md border font-mono text-sm"
                  style={{
                    whiteSpace: 'pre-wrap',
                    tabSize: 2,
                    lineHeight: '1.5em'
                  }}
                >
                  {isCalculatingAlignment ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <Zap className="animate-spin mr-2" size={20} />
                      정렬 중...
                    </div>
                  ) : (
                    alignedLines.map((line, index) => (
                      <div 
                        key={index} 
                        className={`diff-line ${
                          line.lineType === 'removed' ? 'bg-red-50' :
                          line.lineType === 'modified' ? 'bg-yellow-50' : ''
                        }`}
                        style={{ minHeight: '1.5em' }}
                      >
                        <span className="text-gray-400 mr-4 select-none">
                          {line.originalLineNumber || ''}
                        </span>
                        {line.originalContent || ' '}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* 구분선 */}
              <div className="w-px bg-gray-300"></div>
              
              {/* 오른쪽: 수정본 텍스트 (동기화된 스크롤) */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-gray-700 mb-2">수정된 내용</h3>
                <div 
                  ref={rightPanelRef}
                  className="flex-1 overflow-auto bg-white p-4 rounded-md border font-mono text-sm"
                  style={{
                    whiteSpace: 'pre-wrap',
                    tabSize: 2,
                    lineHeight: '1.5em'
                  }}
                >
                  {alignedLines.map((line, index) => (
                    <div 
                      key={index} 
                      className={`diff-line ${
                        line.lineType === 'added' ? 'bg-green-50' :
                        line.lineType === 'modified' ? 'bg-blue-50' : ''
                      }`}
                      style={{ minHeight: '1.5em' }}
                    >
                      <span className="text-gray-400 mr-4 select-none">
                        {line.modifiedLineNumber || ''}
                      </span>
                      {line.modifiedContent || ' '}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* 일반 모드: 기존 차이점 비교 방식 */
            <>
              {/* 왼쪽: 차이점 비교 결과 */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-gray-700 mb-2">차이점 비교 결과</h3>
                <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded-md border">
                  <div 
                    className="diff-result-content font-mono text-sm"
                    dangerouslySetInnerHTML={{ __html: currentDiffResult }}
                    style={{
                      whiteSpace: 'pre-wrap',
                      tabSize: 2,
                      wordBreak: 'break-word'
                    }}
                  />
                </div>
              </div>
              
              {/* 구분선 */}
              <div className="w-px bg-gray-300"></div>
              
              {/* 오른쪽: 수정 가능한 에디터 */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-gray-700 mb-2">수정된 내용</h3>
                <textarea
                  value={tempModifiedText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="flex-1 p-4 border border-gray-300 rounded-md resize-none font-mono text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="수정된 내용을 입력하세요..."
                  style={{
                    whiteSpace: 'pre-wrap',
                    tabSize: 2
                  }}
                />
              </div>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}