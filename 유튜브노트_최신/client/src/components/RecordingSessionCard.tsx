import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Hash, 
  Edit2, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  Film,
  BarChart3,
  FileText,
  Calendar,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordingSession } from "./RecordingMode";

interface RecordingSessionCardProps {
  session: RecordingSession;
  onEdit: (session: RecordingSession) => void;
  onDelete: (sessionId: string) => void;
  onCopy: (session: RecordingSession) => void;
  onApplyToNote: (session: RecordingSession) => void;
  currentPlayTime?: number; // 현재 재생 시간 (초)
  isCurrentVideo?: boolean; // 현재 재생 중인 비디오인지
}

const RecordingSessionCard = ({
  session,
  onEdit,
  onDelete,
  onCopy,
  onApplyToNote,
  currentPlayTime = 0,
  isCurrentVideo = false
}: RecordingSessionCardProps) => {
  const [펼쳐짐, set펼쳐짐] = useState(false);
  const [편집모드, set편집모드] = useState(false);
  const [임시제목, set임시제목] = useState(session.title);
  
  // 현재 재생 중인 타임스탬프 인덱스 찾기
  const 현재타임스탬프인덱스 = isCurrentVideo && currentPlayTime > 0 
    ? session.rawTimestamps.findIndex((ts, index) => {
        const 다음타임스탬프 = session.rawTimestamps[index + 1];
        return ts.time <= currentPlayTime && (!다음타임스탬프 || currentPlayTime < 다음타임스탬프.time);
      })
    : -1;

  const 시간포맷 = (초: number) => {
    const 분 = Math.floor(초 / 60);
    const 남은초 = Math.floor(초 % 60);
    const 밀리초 = Math.floor((초 % 1) * 1000);
    return `${분}:${남은초.toString().padStart(2, '0')}.${밀리초.toString().padStart(3, '0')}`;
  };


  const 액션아이콘 = (action: string) => {
    const icons: { [key: string]: string } = {
      'speed': '⚡',
      'volume': '🔊',
      'seek': '⏩',
      'pause': '⏸️',
      'manual': '📌'
    };
    return icons[action] || '•';
  };

  const 액션이름 = (action: string) => {
    const names: { [key: string]: string } = {
      'speed': '속도 변경',
      'volume': '볼륨 변경',
      'seek': '시간 이동',
      'pause': '일시정지',
      'manual': '수동 추가'
    };
    return names[action] || action;
  };

  // 제목 편집 저장
  const 제목저장하기 = () => {
    if (임시제목.trim() && 임시제목 !== session.title) {
      onEdit({
        ...session,
        title: 임시제목.trim()
      });
    }
    set편집모드(false);
  };

  // 제목 편집 취소
  const 제목편집취소 = () => {
    set임시제목(session.title);
    set편집모드(false);
  };

  // Enter 키 처리
  const 키보드처리 = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      제목저장하기();
    } else if (e.key === 'Escape') {
      제목편집취소();
    }
  };

  // 타임스탬프 통계
  const 통계 = {
    speed: session.rawTimestamps.filter(ts => ts.action === 'speed').length,
    volume: session.rawTimestamps.filter(ts => ts.action === 'volume').length,
    seek: session.rawTimestamps.filter(ts => ts.action === 'seek').length,
    pause: session.rawTimestamps.filter(ts => ts.action === 'pause').length,
    manual: session.rawTimestamps.filter(ts => ts.action === 'manual').length
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {편집모드 ? (
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-primary" />
                <Input
                  value={임시제목}
                  onChange={(e) => set임시제목(e.target.value)}
                  onKeyDown={키보드처리}
                  onBlur={제목저장하기}
                  className="font-semibold text-base"
                  autoFocus
                />
              </div>
            ) : (
              <h4 
                className="font-semibold text-base flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                onClick={() => set편집모드(true)}
                title="클릭하여 제목 편집"
              >
                <Film className="w-4 h-4 text-primary" />
                {session.title}
                <Edit2 className="w-3 h-3 opacity-0 hover:opacity-100 transition-opacity" />
              </h4>
            )}
            
            {/* 생성 시간 */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{new Date(session.createdAt).toLocaleDateString('ko-KR')}</span>
              <Clock className="w-3 h-3 ml-1" />
              <span>{new Date(session.createdAt).toLocaleTimeString('ko-KR')}</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => set펼쳐짐(!펼쳐짐)}
          >
            {펼쳐짐 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* 통계 정보 */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            총 {session.totalTimestamps}개
          </Badge>
          <Badge variant="outline" className="text-xs">
            ⏱️ {시간포맷(session.duration)}
          </Badge>
          {통계.speed > 0 && (
            <Badge variant="outline" className="text-xs">
              ⚡ {통계.speed}
            </Badge>
          )}
          {통계.seek > 0 && (
            <Badge variant="outline" className="text-xs">
              ⏩ {통계.seek}
            </Badge>
          )}
        </div>

        {/* 미리보기 텍스트 */}
        {!펼쳐짐 && session.rawTimestamps.length > 0 && (
          <div className={cn(
            "mb-3 p-2 rounded text-xs",
            isCurrentVideo && 현재타임스탬프인덱스 >= 0 
              ? "bg-blue-100 border border-blue-300" 
              : "bg-gray-50"
          )}>
            <div className="flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" />
              <span className="font-medium">
                {isCurrentVideo && 현재타임스탬프인덱스 >= 0 
                  ? "🎵 현재 재생 중" 
                  : "미리보기"}
              </span>
            </div>
            <div className="line-clamp-2">
              {(() => {
                // 현재 재생 중이면 현재 타임스탬프 중심으로 표시
                if (isCurrentVideo && 현재타임스탬프인덱스 >= 0) {
                  const 시작인덱스 = Math.max(0, 현재타임스탬프인덱스 - 1);
                  const 끝인덱스 = Math.min(session.rawTimestamps.length, 현재타임스탬프인덱스 + 2);
                  
                  return session.rawTimestamps.slice(시작인덱스, 끝인덱스).map((ts, idx) => {
                    const 실제인덱스 = 시작인덱스 + idx;
                    const 현재항목인가 = 실제인덱스 === 현재타임스탬프인덱스;
                    
                    return (
                      <span 
                        key={ts.id}
                        className={cn(
                          현재항목인가 && "font-bold text-blue-700 animate-pulse"
                        )}
                      >
                        {현재항목인가 && "▶ "}
                        {액션아이콘(ts.action)} {시간포맷(ts.time)} {액션이름(ts.action)}
                        {idx < 끝인덱스 - 시작인덱스 - 1 && " • "}
                      </span>
                    );
                  });
                } else {
                  // 기본 미리보기
                  return session.rawTimestamps.slice(0, 3).map((ts, idx) => (
                    <span key={ts.id}>
                      {액션아이콘(ts.action)} {시간포맷(ts.time)} {액션이름(ts.action)}
                      {idx < Math.min(2, session.rawTimestamps.length - 1) && " • "}
                    </span>
                  ));
                }
              })()}
              {!isCurrentVideo && session.rawTimestamps.length > 3 && " ..."}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onApplyToNote(session)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-3 h-3 mr-1" />
            노트에 적용
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(session)}
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(session.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* 펼쳐진 상태 - 타임스탬프 목록 */}
      {펼쳐짐 && (
        <div className="border-t bg-secondary/30">
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">타임스탬프 상세</span>
            </div>
            
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {session.rawTimestamps.map((timestamp, index) => (
                <div
                  key={timestamp.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md text-sm transition-all",
                    isCurrentVideo && index === 현재타임스탬프인덱스
                      ? "bg-blue-100 border border-blue-300 font-semibold"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <span className="text-muted-foreground w-8 text-right">
                    {isCurrentVideo && index === 현재타임스탬프인덱스 ? "▶" : index + 1}
                  </span>
                  <span className="font-mono">
                    {시간포맷(timestamp.time)}
                  </span>
                  <span className="text-lg">
                    {액션아이콘(timestamp.action)}
                  </span>
                  <span className="flex-1">
                    {액션이름(timestamp.action)}
                  </span>
                  {timestamp.action === 'speed' && (
                    <Badge variant="secondary" className="text-xs">
                      {timestamp.previousValue}x → {timestamp.value}x
                    </Badge>
                  )}
                  {timestamp.action === 'volume' && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(timestamp.previousValue)}% → {Math.round(timestamp.value)}%
                    </Badge>
                  )}
                  {timestamp.action === 'seek' && (
                    <Badge variant="secondary" className="text-xs">
                      {시간포맷(timestamp.previousValue)} → {시간포맷(timestamp.value)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RecordingSessionCard;