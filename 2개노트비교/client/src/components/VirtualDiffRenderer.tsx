import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronUp, ChevronDown } from "lucide-react";

interface DiffStats {
  added: number;
  deleted: number;
  modified: number;
  unchanged: number;
}

interface VirtualDiffRendererProps {
  diffHtml: string;
  totalLines: number;
  onRefresh: () => void;
}

interface DiffChunk {
  startLine: number;
  endLine: number;
  content: string;
}

export default function VirtualDiffRenderer({
  diffHtml,
  totalLines,
  onRefresh
}: VirtualDiffRendererProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // 청크 크기 동적 계산
  const calculateChunkSize = useMemo(() => {
    if (totalLines <= 100) return 25;        // 작은 텍스트: 25줄씩
    if (totalLines <= 500) return 50;        // 중간 텍스트: 50줄씩  
    if (totalLines <= 2000) return 100;      // 큰 텍스트: 100줄씩
    if (totalLines <= 5000) return 200;      // 아주 큰 텍스트: 200줄씩
    return 500;                              // 초대용량 텍스트: 500줄씩
  }, [totalLines]);
  
  const LINES_PER_CHUNK = calculateChunkSize;
  const totalChunks = Math.ceil(totalLines / LINES_PER_CHUNK);
  
  // diff 통계 분석
  const diffStats = useMemo(() => {
    if (!diffHtml) return { added: 0, deleted: 0, modified: 0, unchanged: 0 };
    
    const stats: DiffStats = { added: 0, deleted: 0, modified: 0, unchanged: 0 };
    
    // HTML에서 diff 클래스를 기반으로 통계 계산
    const addedMatches = diffHtml.match(/class[^>]*added/g);
    const deletedMatches = diffHtml.match(/class[^>]*deleted/g);
    const modifiedMatches = diffHtml.match(/class[^>]*modified/g);
    const unchangedMatches = diffHtml.match(/class[^>]*unchanged/g);
    
    stats.added = addedMatches ? addedMatches.length : 0;
    stats.deleted = deletedMatches ? deletedMatches.length : 0;
    stats.modified = modifiedMatches ? modifiedMatches.length : 0;
    stats.unchanged = unchangedMatches ? unchangedMatches.length : 0;
    
    return stats;
  }, [diffHtml]);
  
  // diff HTML을 청크로 분할
  const diffChunks = useMemo(() => {
    if (!diffHtml) return [];
    
    const lines = diffHtml.split('\n');
    const chunks: DiffChunk[] = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const startLine = i * LINES_PER_CHUNK;
      const endLine = Math.min(startLine + LINES_PER_CHUNK, totalLines);
      const chunkLines = lines.slice(startLine, endLine);
      
      chunks.push({
        startLine: startLine + 1,
        endLine,
        content: chunkLines.join('\n')
      });
    }
    
    return chunks;
  }, [diffHtml, totalLines, totalChunks]);
  
  // 현재 청크의 diff 내용
  const currentDiffContent = diffChunks[currentChunk]?.content || '';
  
  // 청크 네비게이션
  const goToPrevChunk = useCallback(() => {
    setCurrentChunk(prev => Math.max(0, prev - 1));
  }, []);
  
  const goToNextChunk = useCallback(() => {
    setCurrentChunk(prev => Math.min(totalChunks - 1, prev + 1));
  }, [totalChunks]);
  
  // 비교 갱신 처리
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await onRefresh();
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);
  
  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        goToPrevChunk();
      } else if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault();
        goToNextChunk();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevChunk, goToNextChunk]);
  
  return (
    <div className="virtual-diff-renderer">
      {/* 컨트롤 헤더 */}
      <div className="diff-controls">
        <div className="chunk-info">
          <span className="chunk-indicator">
            {diffChunks[currentChunk] ? (
              `${diffChunks[currentChunk].startLine}-${diffChunks[currentChunk].endLine}줄 표시 중 (${LINES_PER_CHUNK}줄 단위)`
            ) : (
              '로딩 중...'
            )}
          </span>
          <span className="chunk-pagination">
            ({currentChunk + 1} / {totalChunks})
          </span>
          <div className="diff-statistics">
            <span className="stat-added">+{diffStats.added}</span>
            <span className="stat-deleted">-{diffStats.deleted}</span>
            <span className="stat-modified">~{diffStats.modified}</span>
            <span className="stat-unchanged">={diffStats.unchanged}</span>
          </div>
        </div>
        
        <div className="control-buttons">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevChunk}
            disabled={currentChunk === 0}
          >
            <ChevronUp className="h-4 w-4" />
            이전
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextChunk}
            disabled={currentChunk === totalChunks - 1}
          >
            <ChevronDown className="h-4 w-4" />
            다음
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            비교 갱신
          </Button>
        </div>
      </div>
      
      {/* diff 내용 표시 영역 */}
      <div className="diff-content-container">
        {isLoading ? (
          <div className="loading-indicator">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <p>비교 결과를 갱신하는 중...</p>
          </div>
        ) : (
          <div 
            className="diff-content"
            dangerouslySetInnerHTML={{ __html: currentDiffContent }}
          />
        )}
      </div>
      
      {/* 하단 네비게이션 */}
      <div className="diff-footer">
        <div className="navigation-hint">
          <small>
            Ctrl + ↑/↓ 로 청크 이동 가능
          </small>
        </div>
        
        <div className="chunk-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${((currentChunk + 1) / totalChunks) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}