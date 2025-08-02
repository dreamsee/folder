import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { performPagedDiff, performStreamingPagedDiff, calculatePageInfo, analyzeFastTextSize } from "@/lib/fastDiffUtils";

interface PagedDiffRendererProps {
  originalText: string;
  modifiedText: string;
  linesPerPage?: number;
  diffMode?: 'line' | 'inline';
}

interface PageCache {
  [key: number]: string;
}

export default function PagedDiffRenderer({
  originalText,
  modifiedText,
  linesPerPage = 15,
  diffMode = 'line'
}: PagedDiffRendererProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [diffHtml, setDiffHtml] = useState('');
  const [pageCache, setPageCache] = useState<PageCache>({});
  const [pageInfo, setPageInfo] = useState<any>(null);
  const [jumpToPage, setJumpToPage] = useState('');
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [linesPerPageState, setLinesPerPageState] = useState(linesPerPage);
  
  // 페이지 정보 계산
  const pageData = calculatePageInfo(originalText, modifiedText, linesPerPageState);
  const totalPages = pageData.totalPages;
  
  // 페이지 로드 (스트리밍 지원)
  const loadPage = useCallback(async (pageNumber: number) => {
    console.log('페이지 로드 요청:', pageNumber, '/', totalPages);
    
    // 캐시 확인
    if (pageCache[pageNumber]) {
      console.log('캐시에서 로드:', pageNumber);
      setDiffHtml(pageCache[pageNumber]);
      setIsStreaming(false);
      setStreamingProgress(0);
      return;
    }
    
    // 대용량 파일 여부 확인
    const sizeAnalysis = analyzeFastTextSize(originalText, modifiedText);
    const isLargeData = sizeAnalysis.isLarge || sizeAnalysis.estimatedLines > 1000;
    
    setIsLoading(true);
    setStreamingProgress(0);
    let finalHtml = '';
    
    try {
      if (isLargeData) {
        // 대용량 파일은 스트리밍 처리
        console.log('스트리밍 모드로 페이지 로드:', pageNumber);
        setIsStreaming(true);
        
        const result = await performStreamingPagedDiff(
          originalText,
          modifiedText,
          pageNumber,
          linesPerPageState,
          diffMode,
          (progress, partialHtml) => {
            setStreamingProgress(progress);
            setDiffHtml(partialHtml);
          }
        );
        
        setDiffHtml(result.html);
        setPageInfo(result.pageInfo);
        setIsStreaming(false);
        finalHtml = result.html;
      } else {
        // 소용량 파일은 일반 처리
        console.log('일반 모드로 페이지 로드:', pageNumber);
        const result = await performPagedDiff(
          originalText,
          modifiedText,
          pageNumber,
          linesPerPageState,
          diffMode
        );
        
        setDiffHtml(result.html);
        setPageInfo(result.pageInfo);
        finalHtml = result.html;
      }
      
      // 캐시에 저장 (최종 결과만)
      setPageCache(prev => ({
        ...prev,
        [pageNumber]: finalHtml
      }));
      
      // 프리로딩 (소용량만)
      if (!isLargeData) {
        if (pageNumber > 0 && !pageCache[pageNumber - 1]) {
          performPagedDiff(originalText, modifiedText, pageNumber - 1, linesPerPageState, diffMode)
            .then(res => {
              setPageCache(prev => ({
                ...prev,
                [pageNumber - 1]: res.html
              }));
            });
        }
        
        if (pageNumber < totalPages - 1 && !pageCache[pageNumber + 1]) {
          performPagedDiff(originalText, modifiedText, pageNumber + 1, linesPerPageState, diffMode)
            .then(res => {
              setPageCache(prev => ({
                ...prev,
                [pageNumber + 1]: res.html
              }));
            });
        }
      }
    } catch (error) {
      console.error('페이지 로드 오류:', error);
      setDiffHtml('<div class="error">페이지 로드 중 오류가 발생했습니다.</div>');
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
      setStreamingProgress(0);
    }
  }, [originalText, modifiedText, linesPerPageState, pageCache, totalPages, diffHtml]);
  
  // 페이지 변경 시 로드
  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage, loadPage]);
  
  // diffMode 변경 시 캐시 초기화
  useEffect(() => {
    setPageCache({});
    setCurrentPage(0);
    setDiffHtml('');
  }, [diffMode]);
  
  // 네비게이션 함수들
  const goToFirstPage = () => setCurrentPage(0);
  const goToLastPage = () => setCurrentPage(totalPages - 1);
  const goToPrevPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
  
  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage) - 1;
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages) {
      setCurrentPage(pageNum);
      setJumpToPage('');
    }
  };
  
  const handleQuickJump = (pages: number) => {
    const newPage = Math.min(Math.max(0, currentPage + pages), totalPages - 1);
    setCurrentPage(newPage);
  };

  // 줄 수 변경 핸들러
  const handleLinesPerPageChange = (newLinesPerPage: number) => {
    setLinesPerPageState(newLinesPerPage);
    setCurrentPage(0); // 첫 페이지로 이동
    setPageCache({}); // 캐시 초기화
    setDiffHtml(''); // 기존 내용 클리어
  };
  
  // 줄 수에 따른 동적 높이 계산
  const calculateDiffHeight = () => {
    // 기본 높이: 헤더(80px) + 패딩 등 고려
    const baseHeight = 120;
    // 줄당 높이: 약 24px (line-height 1.5rem + 여유분)
    const lineHeight = 24;
    // 최소 높이: 200px, 최대 높이: 600px
    const calculatedHeight = baseHeight + (linesPerPageState * lineHeight);
    return Math.min(Math.max(calculatedHeight, 200), 600);
  };
  
  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case 'Home':
          goToFirstPage();
          break;
        case 'End':
          goToLastPage();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);
  
  return (
    <div className="paged-diff-renderer">
      {/* 상단 네비게이션 */}
      <div className="diff-header bg-gray-50 p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={goToFirstPage}
              disabled={currentPage === 0 || isLoading}
              title="처음으로 (Home)"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={goToPrevPage}
              disabled={currentPage === 0 || isLoading}
              title="이전 페이지 (←)"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentPage + 1} / {totalPages} 페이지
              </span>
              {pageInfo && (
                <span className="text-sm text-gray-500">
                  ({pageInfo.startLine}-{pageInfo.endLine}줄)
                </span>
              )}
              
              {/* 줄 수 선택 드롭다운 */}
              <Select 
                value={linesPerPageState.toString()} 
                onValueChange={(value) => handleLinesPerPageChange(parseInt(value))}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10줄</SelectItem>
                  <SelectItem value="15">15줄</SelectItem>
                  <SelectItem value="20">20줄</SelectItem>
                  <SelectItem value="25">25줄</SelectItem>
                  <SelectItem value="50">50줄</SelectItem>
                  <SelectItem value="100">100줄</SelectItem>
                  <SelectItem value="200">200줄</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={goToNextPage}
              disabled={currentPage === totalPages - 1 || isLoading}
              title="다음 페이지 (→)"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={goToLastPage}
              disabled={currentPage === totalPages - 1 || isLoading}
              title="마지막으로 (End)"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 빠른 점프 */}
            <Select onValueChange={(value) => handleQuickJump(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="빠른 이동" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">+10 페이지</SelectItem>
                <SelectItem value="50">+50 페이지</SelectItem>
                <SelectItem value="100">+100 페이지</SelectItem>
                <SelectItem value="-10">-10 페이지</SelectItem>
                <SelectItem value="-50">-50 페이지</SelectItem>
                <SelectItem value="-100">-100 페이지</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 페이지 직접 입력 */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="페이지"
                value={jumpToPage}
                onChange={(e) => setJumpToPage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
                className="w-20"
                min="1"
                max={totalPages}
              />
              <Button
                size="sm"
                onClick={handleJumpToPage}
                disabled={isLoading}
              >
                이동
              </Button>
            </div>
          </div>
        </div>
        
        {/* 진행률 바 */}
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* diff 내용 */}
      <div 
        className="diff-content-container relative"
        style={{ minHeight: `${calculateDiffHeight()}px` }}
      >
        {isLoading && !isStreaming ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">페이지 로딩 중...</p>
            </div>
          </div>
        ) : isStreaming ? (
          <div className="diff-content p-4">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-600">스트리밍 처리 중...</span>
                <span className="text-sm font-mono text-blue-600">{Math.round(streamingProgress)}%</span>
              </div>
              <div className="bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${streamingProgress}%` }}
                />
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: diffHtml || '<div class="text-gray-500">처리 중...</div>' }} />
          </div>
        ) : (
          <div 
            className="diff-content p-4"
            dangerouslySetInnerHTML={{ __html: diffHtml || '<div class="text-gray-500">내용이 없습니다.</div>' }}
          />
        )}
      </div>
      
      {/* 하단 정보 */}
      <div className="diff-footer bg-gray-50 p-2 border-t text-center">
        <small className="text-gray-600">
          ← → 키로 페이지 이동 | Home/End 키로 처음/끝 이동
        </small>
      </div>
    </div>
  );
}