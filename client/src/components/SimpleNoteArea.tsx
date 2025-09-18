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

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock } from "lucide-react";

interface SimpleNoteAreaProps {
  player: any;
  isPlayerReady: boolean;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  overlayMode?: boolean;
  onOverlayOpen?: () => void;
  noteText?: string;
  onNoteTextChange?: (text: string) => void;
}

const SimpleNoteArea: React.FC<SimpleNoteAreaProps> = ({
  player,
  isPlayerReady,
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

  // 타임스탬프 클릭 처리
  const handleTimestampClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!isPlayerReady || !player || e.detail !== 2) return; // 더블클릭만 처리

    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    
    // 타임스탬프 정규식 - 쉼표 뒤 공백 없이 바로 기능 표시도 인식 (,-> 또는 ,|3 형식)
    const timestampRegex = /\[(\d{2}):(\d{2}):(\d{2})-(\d{2}):(\d{2}):(\d{2}),\s*(\d+)%,\s*([\d.]+)x(?:,(->|\|\d+))?\]/g;
    let match;
    let clickedTimestamp = null;

    while ((match = timestampRegex.exec(noteText)) !== null) {
      if (clickPosition >= match.index && clickPosition <= match.index + match[0].length) {
        clickedTimestamp = match;
        break;
      }
    }

    if (clickedTimestamp) {
      const startHours = parseInt(clickedTimestamp[1]);
      const startMinutes = parseInt(clickedTimestamp[2]);
      const startSeconds = parseInt(clickedTimestamp[3]);
      const startTime = startHours * 3600 + startMinutes * 60 + startSeconds;
      
      const endHours = parseInt(clickedTimestamp[4]);
      const endMinutes = parseInt(clickedTimestamp[5]);
      const endSeconds = parseInt(clickedTimestamp[6]);
      const endTime = endHours * 3600 + endMinutes * 60 + endSeconds;
      
      const volume = parseInt(clickedTimestamp[7]);
      const speed = parseFloat(clickedTimestamp[8]);
      const pauseInfo = clickedTimestamp[9]; // |3 형식
      
      // 설정 적용
      if (player.setVolume) player.setVolume(volume);
      if (player.setPlaybackRate) player.setPlaybackRate(speed);
      player.seekTo(startTime, true);
      player.playVideo();

      // 타임스탬프 액션 처리
      if (pauseInfo && pauseInfo.startsWith('|')) {
        // 정지 기능: |3 = 3초간 정지 후 계속 재생
        const pauseSeconds = parseInt(pauseInfo.substring(1));
        
        // 즉시 정지
        player.pauseVideo();
        showNotification(`${pauseSeconds}초간 정지 - 이후 자동 재생`, "warning");
        
        // 지정된 시간 후 재생 재개
        setTimeout(() => {
          player.playVideo();
          showNotification(`${pauseSeconds}초 정지 후 재생 재개`, "success");
        }, pauseSeconds * 1000);
        
      } else if (pauseInfo === '->') {
        // 자동 점프: 구간 끝(endTime)에서 다음 타임스탬프로 이동
        const duration = endTime - startTime;
        showNotification(`자동 점프 모드: ${duration.toFixed(1)}초 후 다음 타임스탬프로 이동`, "info");
        
        setTimeout(() => {
          if (player.getPlayerState && player.getPlayerState() === 1) {
            // 현재 타임스탬프의 위치 찾기
            const currentTimestampText = clickedTimestamp[0];
            const currentIndex = noteText.indexOf(currentTimestampText);
            
            // 현재 타임스탬프 이후의 텍스트에서 다음 타임스탬프 찾기
            const afterCurrent = noteText.substring(currentIndex + currentTimestampText.length);
            
            // 새로운 정규식으로 다음 타임스탬프 찾기 (쉼표 뒤 공백 없이도 인식)
            const nextRegex = /\[(\d{2}):(\d{2}):(\d{2})-(\d{2}):(\d{2}):(\d{2}),\s*(\d+)%,\s*([\d.]+)x(?:,(->|\|\d+))?\]/;
            const nextMatch = nextRegex.exec(afterCurrent);
            
            if (nextMatch) {
              // 다음 타임스탬프의 시작 시간 계산
              const nextStartHours = parseInt(nextMatch[1]);
              const nextStartMinutes = parseInt(nextMatch[2]);
              const nextStartSeconds = parseInt(nextMatch[3]);
              const nextStartTime = nextStartHours * 3600 + nextStartMinutes * 60 + nextStartSeconds;
              
              // 다음 타임스탬프의 볼륨과 속도 적용
              const nextVolume = parseInt(nextMatch[7]);
              const nextSpeed = parseFloat(nextMatch[8]);
              
              if (player.setVolume) player.setVolume(nextVolume);
              if (player.setPlaybackRate) player.setPlaybackRate(nextSpeed);
              player.seekTo(nextStartTime, true);
              
              showNotification(`다음 타임스탬프로 이동: ${nextStartHours}:${nextStartMinutes}:${nextStartSeconds}`, "success");
              
              // 다음 타임스탬프에도 액션이 있으면 처리
              const nextAction = nextMatch[9];
              if (nextAction === '->') {
                // 재귀적으로 다음 점프 설정
                const nextEndHours = parseInt(nextMatch[4]);
                const nextEndMinutes = parseInt(nextMatch[5]);
                const nextEndSeconds = parseInt(nextMatch[6]);
                const nextEndTime = nextEndHours * 3600 + nextEndMinutes * 60 + nextEndSeconds;
                const nextDuration = nextEndTime - nextStartTime;
                
                setTimeout(() => {
                  // 다음 다음 타임스탬프 찾기 (재귀)
                  const afterNext = noteText.substring(currentIndex + currentTimestampText.length + nextMatch.index + nextMatch[0].length);
                  const nextNextMatch = nextRegex.exec(afterNext);
                  if (nextNextMatch) {
                    // 다음의 다음 타임스탬프로 이동...
                    const nnStartTime = parseInt(nextNextMatch[1]) * 3600 + parseInt(nextNextMatch[2]) * 60 + parseInt(nextNextMatch[3]);
                    player.seekTo(nnStartTime, true);
                    showNotification(`연속 점프: ${nextNextMatch[1]}:${nextNextMatch[2]}:${nextNextMatch[3]}`, "success");
                  }
                }, nextDuration * 1000);
              }
            } else {
              player.pauseVideo();
              showNotification("다음 타임스탬프가 없어 정지", "info");
            }
          }
        }, duration * 1000);
        
      } else {
        // 일반 재생: 그냥 해당 시간으로 이동 후 계속 재생 (정지 없음)
        showNotification(`${startTime.toFixed(0)}초로 이동 - 계속 재생`, "info");
      }
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <h3 className="text-lg font-semibold">노트</h3>
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