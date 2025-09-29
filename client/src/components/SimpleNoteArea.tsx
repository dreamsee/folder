/*
 * SimpleNoteArea.tsx - 기본 타임스탬프 로직 참고용 컴포넌트
 * 
 * 이 파일은 타임스탬프 기능의 기본 로직을 담고 있는 참고용 컴포넌트입니다.
 * 원본 NoteArea 컴포넌트 수정 시 이 파일의 로직을 참고하여 적용하세요.
 * 
 * 주요 기능:
 * - 일반 타임스탬프: [시작-종료, 볼륨%, 속도x] - 해당 시간으로 이동 후 계속 재생
 * - 정지 타임스탬프: [시작-종료, 볼륨%, 속도x, |초] - 즉시 정지 후 지정 시간 대기 후 재생
 * - 자동점프 타임스탬프: [시작-종료, 볼륨%, 속도x, ->] - 구간 끝에서 다음 타임스탬프로 이동
 */

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock, Zap } from "lucide-react";
import { useTimestampSystem } from "@/hooks/useTimestampSystem";

interface SimpleNoteAreaProps {
  player: any;
  isPlayerReady: boolean;
  playerState?: number; // YouTube 플레이어 상태 (1: 재생중)
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  overlayMode?: boolean;
  onOverlayOpen?: () => void;
  noteText?: string;
  onNoteTextChange?: (text: string) => void;
}

const SimpleNoteArea: React.FC<SimpleNoteAreaProps> = ({
  player,
  isPlayerReady,
  playerState = -1,
  showNotification,
  overlayMode = false,
  onOverlayOpen,
  noteText: externalNoteText,
  onNoteTextChange
}) => {
  // 외부에서 노트 텍스트를 관리하면 외부 상태 사용, 아니면 내부 상태 사용
  const [internalNoteText, setInternalNoteText] = useState("");
  const noteText = externalNoteText !== undefined ? externalNoteText : internalNoteText;
  const setNoteText = onNoteTextChange || setInternalNoteText;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 새로운 타임스탬프 자동 실행 시스템
  const timestampSystem = useTimestampSystem({
    player,
    isPlayerReady,
    playerState,
    showNotification,
    intervalMs: 500 // 0.5초마다 감지
  });

  // 노트 텍스트 변경시 타임스탬프 시스템에 업데이트
  useEffect(() => {
    timestampSystem.updateNoteText(noteText);
  }, [noteText, timestampSystem.updateNoteText]);

  // 타임스탬프 추가
  const addTimestamp = () => {
    if (!isPlayerReady || !player) {
      showNotification("플레이어가 준비되지 않았습니다", "error");
      return;
    }

    const currentTime = player.getCurrentTime();
    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    const timeFormatted = formatTime(currentTime);
    const endTime = formatTime(currentTime + 5);
    const timestamp = `[${timeFormatted}-${endTime}, 100%, 1.00x]`;
    
    const newText = noteText + (noteText ? '\n' : '') + timestamp + ' ';
    setNoteText(newText);
    showNotification(`타임스탬프 추가: ${timeFormatted}`, "success");
  };

  // 타임스탬프 더블클릭 처리 (새 시스템 연결)
  const handleTimestampClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!isPlayerReady || !player || e.detail !== 2) return; // 더블클릭만 처리

    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;

    // 새로운 타임스탬프 시스템에 더블클릭 처리 위임
    timestampSystem.handleDoubleClick(clickPosition, noteText);
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <h3 className="text-lg font-semibold">노트</h3>

            {/* 자동 실행 상태 표시 */}
            {timestampSystem.activeTimestamp && (
              <div className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                <Zap className="w-3 h-3" />
                <span>실행중 #{timestampSystem.activeTimestamp.index}</span>

                {/* 자동점프 대기 상태 표시 */}
                {timestampSystem.autoJumpInfo?.isWaiting && (
                  <span className="ml-1 bg-orange-100 text-orange-800 px-1 rounded text-xs">
                    → #{timestampSystem.autoJumpInfo.targetIndex || '?'}
                  </span>
                )}
              </div>
            )}

            {timestampSystem.timestamps.length > 0 && (
              <div className="text-xs text-gray-500">
                {timestampSystem.timestamps.length}개 타임스탬프
              </div>
            )}
          </div>

          <Button
            onClick={addTimestamp}
            disabled={!isPlayerReady}
            size="sm"
          >
            <Clock className="w-4 h-4 mr-1" />
            타임스탬프
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onDoubleClick={handleTimestampClick}
          onClick={() => {
            // 오버레이 모드일 때 클릭하면 오버레이 패널 열기
            if (overlayMode && onOverlayOpen) {
              onOverlayOpen();
            }
          }}
          readOnly={overlayMode} // 오버레이 모드에서는 직접 편집 불가
          placeholder="타임스탬프 테스트:
[00:00:10-00:00:15, 100%, 1.00x, |3] - 3초 정지 테스트
[00:00:20-00:00:25, 100%, 1.00x] - 일반 구간 재생

더블클릭으로 타임스탬프 실행"
          className="flex-1 resize-none"
          style={overlayMode ? { cursor: 'pointer' } : {}}
        />
      </CardContent>
    </Card>
  );
};

export default SimpleNoteArea;