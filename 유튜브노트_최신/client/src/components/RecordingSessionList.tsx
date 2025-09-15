import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Film, 
  Search, 
  Filter,
  SortDesc,
  FileText,
  Trash2
} from "lucide-react";
import RecordingSessionCard from "./RecordingSessionCard";
import { RecordingSession } from "./RecordingMode";

interface RecordingSessionListProps {
  sessions: RecordingSession[];
  onEditSession: (session: RecordingSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onCopySession: (session: RecordingSession) => void;
  onApplyToNote: (session: RecordingSession) => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  currentVideoId?: string; // 현재 재생 중인 비디오 ID
  currentPlayTime?: number; // 현재 재생 시간
}

const RecordingSessionList = ({
  sessions,
  onEditSession,
  onDeleteSession,
  onCopySession,
  onApplyToNote,
  showNotification,
  currentVideoId,
  currentPlayTime = 0
}: RecordingSessionListProps) => {
  const [검색어, set검색어] = useState("");
  const [정렬기준, set정렬기준] = useState<"date" | "count">("date");
  const [필터된세션, set필터된세션] = useState<RecordingSession[]>(sessions);
  const [그룹화모드, set그룹화모드] = useState<"video" | "flat">("video");

  // 세션 필터링 및 정렬
  useEffect(() => {
    let 결과 = [...sessions];

    // 검색어 필터링
    if (검색어) {
      결과 = 결과.filter(session => 
        session.title.toLowerCase().includes(검색어.toLowerCase()) ||
        session.videoId.includes(검색어)
      );
    }

    // 정렬
    결과.sort((a, b) => {
      if (정렬기준 === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return b.totalTimestamps - a.totalTimestamps;
      }
    });

    set필터된세션(결과);
  }, [sessions, 검색어, 정렬기준]);

  // 영상별로 세션 그룹화
  const 영상별그룹화 = (sessions: RecordingSession[]) => {
    const 그룹 = sessions.reduce((acc, session) => {
      if (!acc[session.videoId]) {
        acc[session.videoId] = [];
      }
      acc[session.videoId].push(session);
      return acc;
    }, {} as Record<string, RecordingSession[]>);

    // 각 그룹 내에서 날짜순으로 정렬
    Object.keys(그룹).forEach(videoId => {
      그룹[videoId].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });

    return 그룹;
  };

  // 세션 내보내기
  const 세션내보내기 = () => {
    const 데이터 = JSON.stringify(sessions, null, 2);
    const blob = new Blob([데이터], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-sessions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("녹화 세션을 내보냈습니다.", "success");
  };

  // 모든 세션 삭제
  const 모든세션삭제 = () => {
    if (sessions.length === 0) {
      showNotification("삭제할 세션이 없습니다.", "warning");
      return;
    }

    if (window.confirm(`정말로 ${sessions.length}개의 모든 세션을 삭제하시겠습니까?`)) {
      sessions.forEach(session => onDeleteSession(session.id));
      showNotification("모든 세션이 삭제되었습니다.", "info");
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Film className="w-5 h-5" />
            녹화 세션 목록
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={세션내보내기}
              disabled={sessions.length === 0}
            >
              <FileText className="w-4 h-4 mr-1" />
              내보내기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={모든세션삭제}
              disabled={sessions.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              모두 삭제
            </Button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="세션 제목 또는 비디오 ID로 검색..."
              value={검색어}
              onChange={(e) => set검색어(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={그룹화모드 === "video" ? "default" : "outline"}
            size="sm"
            onClick={() => set그룹화모드("video")}
          >
            📹 영상별
          </Button>
          <Button
            variant={그룹화모드 === "flat" ? "default" : "outline"}
            size="sm"
            onClick={() => set그룹화모드("flat")}
          >
            📋 목록
          </Button>
          <Button
            variant={정렬기준 === "date" ? "default" : "outline"}
            size="sm"
            onClick={() => set정렬기준("date")}
          >
            <SortDesc className="w-4 h-4 mr-1" />
            최신순
          </Button>
          <Button
            variant={정렬기준 === "count" ? "default" : "outline"}
            size="sm"
            onClick={() => set정렬기준("count")}
          >
            <Filter className="w-4 h-4 mr-1" />
            타임스탬프순
          </Button>
        </div>

        {/* 세션 목록 */}
        <div className="space-y-3">
          {필터된세션.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {sessions.length === 0 
                ? "아직 녹화된 세션이 없습니다." 
                : "검색 결과가 없습니다."
              }
            </div>
          ) : 그룹화모드 === "video" ? (
            // 영상별 그룹화 표시
            (() => {
              const 그룹화된세션 = 영상별그룹화(필터된세션);
              return Object.entries(그룹화된세션).map(([videoId, videoSessions]) => (
                <div key={videoId} className="border rounded-lg p-3 bg-gray-50">
                  <div className="mb-3 pb-2 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      🎬 {videoSessions[0]?.title?.split(' 녹화')[0] || `영상 ${videoId.substring(0, 8)}...`}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      총 {videoSessions.length}개 녹화 세션 | 
                      타임스탬프 {videoSessions.reduce((sum, s) => sum + s.totalTimestamps, 0)}개
                    </p>
                  </div>
                  <div className="space-y-2">
                    {videoSessions.map((session, index) => (
                      <div key={session.id} className="bg-white rounded border">
                        <RecordingSessionCard
                          session={{
                            ...session,
                            title: `세션 ${index + 1} (${new Date(session.createdAt).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })})`
                          }}
                          onEdit={onEditSession}
                          onDelete={onDeleteSession}
                          onCopy={onCopySession}
                          onApplyToNote={onApplyToNote}
                          currentPlayTime={currentPlayTime}
                          isCurrentVideo={currentVideoId === session.videoId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()
          ) : (
            // 평면 목록 표시
            필터된세션.map(session => (
              <RecordingSessionCard
                key={session.id}
                session={session}
                onEdit={onEditSession}
                onDelete={onDeleteSession}
                onCopy={onCopySession}
                onApplyToNote={onApplyToNote}
                currentPlayTime={currentPlayTime}
                isCurrentVideo={currentVideoId === session.videoId}
              />
            ))
          )}
        </div>

        {/* 통계 정보 */}
        {sessions.length > 0 && (
          <div className="pt-3 border-t text-sm text-muted-foreground">
            총 {sessions.length}개 세션 | 
            전체 타임스탬프: {sessions.reduce((sum, s) => sum + s.totalTimestamps, 0)}개
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecordingSessionList;