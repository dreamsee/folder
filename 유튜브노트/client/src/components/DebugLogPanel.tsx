import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ChevronDown, ChevronUp, Filter, Copy } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  category?: string;
}

interface DebugLogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const DebugLogPanel: React.FC<DebugLogPanelProps> = ({ isOpen, onToggle }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 로그 추가 함수
  const addLog = (level: 'log' | 'warn' | 'error' | 'info', message: string, category?: string) => {
    const logEntry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date().toLocaleTimeString('ko-KR', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3 
      }),
      level,
      message,
      category
    };

    setLogs(prev => {
      const newLogs = [...prev, logEntry];
      // 최대 1000개까지만 유지
      return newLogs.length > 1000 ? newLogs.slice(-1000) : newLogs;
    });
  };

  // console 오버라이드
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    // console.log 오버라이드
    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      // 카테고리 감지
      let category = 'general';
      if (message.includes('[타임스탬프]') || message.includes('[자동점프]') || message.includes('[이탈]')) {
        category = 'timestamp';
      } else if (message.includes('[사용자변경]') || message.includes('[자동업데이트]')) {
        category = 'userSettings';
      } else if (message.includes('[수동이동]')) {
        category = 'manual';
      } else if (message.includes('동기화') || message.includes('복원')) {
        category = 'sync';
      }
      
      addLog('log', message, category);
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('warn', message);
    };

    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('error', message);
    };

    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog('info', message);
    };

    // 정리
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  // 자동 스크롤
  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScroll]);

  // 로그 필터링
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'timestamp') return log.category === 'timestamp';
    if (filter === 'userSettings') return log.category === 'userSettings';
    if (filter === 'sync') return log.category === 'sync';
    if (filter === 'manual') return log.category === 'manual';
    return log.level === filter;
  });

  // 로그 레벨별 색상
  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  // 카테고리별 색상
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'timestamp': return 'border-l-4 border-l-green-500';
      case 'userSettings': return 'border-l-4 border-l-blue-500';
      case 'sync': return 'border-l-4 border-l-purple-500';
      case 'manual': return 'border-l-4 border-l-orange-500';
      default: return 'border-l-4 border-l-gray-300';
    }
  };

  // 로그 복사
  const copyLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      addLog('info', '로그가 클립보드에 복사되었습니다');
    });
  };

  // 로그 지우기
  const clearLogs = () => {
    setLogs([]);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg z-40 bg-gray-600 hover:bg-gray-700"
        size="icon"
        title="디버그 로그 열기"
      >
        <Filter className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-4 top-20 z-50">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">디버그 로그 ({filteredLogs.length})</CardTitle>
            <div className="flex gap-2">
              <Button onClick={copyLogs} size="sm" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={clearLogs} size="sm" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={onToggle} size="sm" variant="outline">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 필터 버튼들 */}
          <div className="flex flex-wrap gap-1 mt-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'timestamp', label: '타임스탬프' },
              { key: 'userSettings', label: '사용자설정' },
              { key: 'sync', label: '동기화' },
              { key: 'manual', label: '수동이동' },
              { key: 'error', label: '에러' },
              { key: 'warn', label: '경고' }
            ].map(({ key, label }) => (
              <Button
                key={key}
                onClick={() => setFilter(key)}
                size="sm"
                variant={filter === key ? "default" : "outline"}
                className="text-xs px-2 py-1 h-6"
              >
                {label}
              </Button>
            ))}
          </div>
          
          {/* 자동 스크롤 토글 */}
          <div className="flex items-center gap-2 mt-2">
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={isAutoScroll}
                onChange={(e) => setIsAutoScroll(e.target.checked)}
                className="w-3 h-3"
              />
              자동 스크롤
            </label>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden p-2">
          <div 
            ref={logContainerRef}
            className="h-full overflow-y-auto font-mono text-xs space-y-1"
          >
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded text-xs ${getLogColor(log.level)} ${getCategoryColor(log.category)}`}
              >
                <div className="flex gap-2">
                  <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                  <span className="font-medium shrink-0">[{log.level.toUpperCase()}]</span>
                  {log.category && (
                    <span className="text-xs bg-gray-200 px-1 rounded shrink-0">
                      {log.category}
                    </span>
                  )}
                </div>
                <div className="mt-1 break-words">{log.message}</div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugLogPanel;