import { useState, useCallback, useRef } from "react";

interface UseTimestampEditorProps {
  player: any;
  isPlayerReady: boolean;
  noteText: string;
  setNoteText: (text: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  formatTime: (seconds: number) => string;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

interface TimestampData {
  startTime: number;
  endTime: number;
  volume: number;
  playbackRate: number;
  pauseDuration?: number;
  autoJump: boolean;
}

export const useTimestampEditor = ({
  player,
  isPlayerReady,
  noteText,
  setNoteText,
  textareaRef,
  formatTime,
  showNotification,
}: UseTimestampEditorProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duration, setDuration] = useState(5);

  // 커서 위치 기준으로 바로 이전 타임스탬프 1개만 찾는 함수
  const findPreviousTimestamp = useCallback((text: string, cursorPosition: number) => {
    const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
    let match;
    let previousTimestamp = null;

    while ((match = timestampRegex.exec(text)) !== null) {
      if (match.index >= cursorPosition) {
        break;
      }

      const startHours = parseInt(match[1]);
      const startMinutes = parseInt(match[2]);
      const startSeconds = parseFloat(match[3]);
      const endHours = parseInt(match[4]);
      const endMinutes = parseInt(match[5]);
      const endSeconds = parseFloat(match[6]);

      const startTime = startHours * 3600 + startMinutes * 60 + startSeconds;
      const endTime = endHours * 3600 + endMinutes * 60 + endSeconds;

      previousTimestamp = {
        startTime,
        endTime,
        match: match[0],
        index: match.index,
        hasAutoJump: match[9] === '->'
      };
    }

    return previousTimestamp;
  }, []);

  // 기존 타임스탬프 추가 함수 (도장 버튼)
  const addTimestamp = useCallback(() => {
    if (!isPlayerReady || !player) {
      showNotification("플레이어가 준비되지 않았습니다", "error");
      return;
    }

    try {
      player.pauseVideo();

      const 현재시간 = player.getCurrentTime();
      const timeFormatted = formatTime(현재시간);

      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const 텍스트앞부분 = noteText.substring(0, start);
        const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
        let match;
        let 마지막타임스탬프 = null;

        while ((match = timestampRegex.exec(텍스트앞부분)) !== null) {
          마지막타임스탬프 = match;
        }

        let 최종텍스트 = noteText;

        if (마지막타임스탬프) {
          const 종료시 = parseInt(마지막타임스탬프[4]);
          const 종료분 = parseInt(마지막타임스탬프[5]);
          const 종료초 = parseFloat(마지막타임스탬프[6]);
          const 종료시간초 = 종료시 * 3600 + 종료분 * 60 + 종료초;

          if (현재시간 < 종료시간초) {
            const 기존타임스탬프 = 마지막타임스탬프[0];
            if (!기존타임스탬프.includes('->') && !기존타임스탬프.includes('|')) {
              const 새로운타임스탬프 = 기존타임스탬프.replace(/\]$/, ', ->]');
              const beforePart = 최종텍스트.substring(0, 마지막타임스탬프.index);
              const afterPart = 최종텍스트.substring(마지막타임스탬프.index + 기존타임스탬프.length);
              최종텍스트 = beforePart + 새로운타임스탬프 + afterPart;
            }
          }
        }

        const 종료시간 = 현재시간 + 5;
        const 종료시간포맷 = formatTime(종료시간);
        const timestamp = `[${timeFormatted}-${종료시간포맷}, 100%, 1.00x]`;

        const newText = 최종텍스트.substring(0, start) + timestamp + " " + 최종텍스트.substring(end);
        setNoteText(newText);

        setTimeout(() => {
          const newCursorPos = start + timestamp.length + 1;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        if (최종텍스트 !== noteText) {
          showNotification(`이전 시간대 타임스탬프 추가 - 직전 타임스탬프에 -> 표시됨`, "info");
        } else {
          showNotification(`타임스탬프 추가: ${timeFormatted}`, "success");
        }
      }
    } catch (error) {
      console.error("타임스탬프 추가 중 오류:", error);
      showNotification("타임스탬프 추가 중 오류가 발생했습니다.", "error");
    }
  }, [isPlayerReady, player, noteText, setNoteText, textareaRef, formatTime, showNotification]);

  // 모달 열기 함수
  const openTimestampModal = useCallback(() => {
    if (!isPlayerReady || !player) {
      showNotification('플레이어가 준비되지 않았습니다', 'error');
      return;
    }

    try {
      setIsModalOpen(true);
      showNotification('타임스탬프 편집 모달 열림', 'success');
    } catch (error) {
      showNotification(`에러: ${error}`, 'error');
    }
  }, [isPlayerReady, player, showNotification]);

  // 모달에서 타임스탬프 저장 함수
  const addTimestampFromModal = useCallback((timestampData: TimestampData) => {
    if (!isPlayerReady || !player) {
      showNotification('플레이어가 준비되지 않았습니다', 'error');
      return;
    }

    try {
      const startTime = timestampData.startTime;
      const endTime = timestampData.endTime;
      const timeFormatted = formatTime(startTime);
      const endTimeFormatted = formatTime(endTime);

      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const cursorPosition = textarea.selectionStart;
        let updatedText = noteText;
        let cursorOffset = 0;

        const previousTimestamp = findPreviousTimestamp(noteText, cursorPosition);

        if (previousTimestamp && !previousTimestamp.hasAutoJump) {
          let shouldAddArrow = false;

          if (timestampData.autoJump) {
            shouldAddArrow = true;
          } else {
            if (startTime < previousTimestamp.endTime) {
              shouldAddArrow = true;
            }
          }

          if (shouldAddArrow) {
            const oldTimestamp = previousTimestamp.match;
            const newTimestamp = oldTimestamp.replace(/\]$/, ', ->]');
            const beforePart = updatedText.substring(0, previousTimestamp.index);
            const afterPart = updatedText.substring(previousTimestamp.index + oldTimestamp.length);
            updatedText = beforePart + newTimestamp + afterPart;

            if (cursorPosition > previousTimestamp.index) {
              cursorOffset = newTimestamp.length - oldTimestamp.length;
            }

            showNotification('이전 타임스탬프에 자동 이동 화살표가 추가되었습니다', 'info');
          }
        }

        let timestamp = `[${timeFormatted}-${endTimeFormatted}, ${timestampData.volume}%, ${timestampData.playbackRate.toFixed(2)}x`;

        if (timestampData.pauseDuration && timestampData.pauseDuration > 0) {
          timestamp += `, |${timestampData.pauseDuration}`;
        }

        timestamp += `]`;

        const start = cursorPosition + cursorOffset;
        const end = cursorPosition + cursorOffset;

        const newText = updatedText.substring(0, start) + timestamp + " " + "\n" + updatedText.substring(end);
        setNoteText(newText);

        showNotification(`타임스탬프 추가됨: ${timestamp}`, 'success');

        setTimeout(() => {
          const newCursorPos = start + timestamp.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        if (timestampData.autoJump) {
          player.seekTo(startTime, true);
          player.playVideo();
          showNotification(`자동 점프: ${formatTime(startTime)}에서 재생 시작`, 'info');
        }
      } else {
        showNotification('텍스트 영역을 찾을 수 없습니다', 'error');
      }
    } catch (error) {
      console.error('타임스탬프 추가 오류:', error);
      showNotification('타임스탬프 추가 중 오류가 발생했습니다', 'error');
    } finally {
      setIsModalOpen(false);
    }
  }, [isPlayerReady, player, noteText, setNoteText, textareaRef, formatTime, findPreviousTimestamp, showNotification]);

  return {
    isModalOpen,
    setIsModalOpen,
    duration,
    setDuration,
    addTimestamp,
    openTimestampModal,
    addTimestampFromModal,
  };
};
