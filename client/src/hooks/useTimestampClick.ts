import { useCallback } from "react";

interface UseTimestampClickProps {
  player: any;
  isPlayerReady: boolean;
  noteText: string;
  currentVolume: number;
  currentPlaybackRate: number;
  parseTimestamps: (text: string) => any[];
  formatTime: (seconds: number) => string;
  setActiveTimestamp: (timestamp: any) => void;
  setOriginalSettings: (settings: any) => void;
  setLastActiveIndex: (index: number) => void;
  setCurrentVolume: (volume: number) => void;
  setCurrentPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setCurrentRate: (rate: number) => void;
  processingEntryRef: React.MutableRefObject<boolean>;
  processingExitRef: React.MutableRefObject<boolean>;
  ignoreManualMoveRef: React.MutableRefObject<boolean>;
  originalUserSettingsRef: React.MutableRefObject<any>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

export const useTimestampClick = ({
  player,
  isPlayerReady,
  noteText,
  currentVolume,
  currentPlaybackRate,
  parseTimestamps,
  formatTime,
  setActiveTimestamp,
  setOriginalSettings,
  setLastActiveIndex,
  setCurrentVolume,
  setCurrentPlaybackRate,
  setVolume,
  setPlaybackRate,
  setCurrentRate,
  processingEntryRef,
  processingExitRef,
  ignoreManualMoveRef,
  originalUserSettingsRef,
  showNotification,
}: UseTimestampClickProps) => {

  const handleTimestampClick = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!isPlayerReady || !player || e.detail !== 2) return;

    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;

    const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
    let match;
    let clickedTimestamp = null;
    let clickedMatch = null;

    while ((match = timestampRegex.exec(noteText)) !== null) {
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;

      if (clickPosition >= matchStart && clickPosition <= matchEnd) {
        clickedTimestamp = match[0];
        clickedMatch = match;
        break;
      }
    }

    if (clickedTimestamp) {
      try {
        const timeMatch = clickedTimestamp.match(/\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/);
        if (timeMatch) {
          const startHours = parseInt(timeMatch[1]);
          const startMinutes = parseInt(timeMatch[2]);
          const startSeconds = parseFloat(timeMatch[3]);

          const endHours = parseInt(timeMatch[4]);
          const endMinutes = parseInt(timeMatch[5]);
          const endSeconds = parseFloat(timeMatch[6]);

          const timestampVolume = parseInt(timeMatch[7]);
          const timestampSpeed = parseFloat(timeMatch[8]);
          const actionMode = timeMatch[9];

          const startTime = startHours * 3600 + startMinutes * 60 + startSeconds;
          const endTime = endHours * 3600 + endMinutes * 60 + endSeconds;

          processingEntryRef.current = true;
          processingExitRef.current = true;
          ignoreManualMoveRef.current = true;

          if (!originalUserSettingsRef.current) {
            const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
            const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;

            originalUserSettingsRef.current = {
              volume: currentPlayerVolume,
              speed: currentPlayerSpeed
            };
          }

          const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
          const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;

          setOriginalSettings({
            volume: currentPlayerVolume,
            speed: currentPlayerSpeed
          });

          if (player.setVolume) {
            player.setVolume(timestampVolume);
          }
          if (player.setPlaybackRate) {
            player.setPlaybackRate(timestampSpeed);
          }

          setCurrentVolume(timestampVolume);
          setCurrentPlaybackRate(timestampSpeed);
          setVolume(timestampVolume);
          setPlaybackRate(timestampSpeed);
          setCurrentRate(timestampSpeed);

          const timestampStart = clickedMatch?.index || 0;
          const dashPos = clickedTimestamp.indexOf('-');
          const isEndTimeClick = clickPosition > (timestampStart + dashPos);
          const targetTime = isEndTimeClick ? endTime : startTime;

          player.seekTo(targetTime, true);
          player.playVideo();

          const timestamps = parseTimestamps(noteText);
          let clickedIndex = -1;
          for (let i = 0; i < timestamps.length; i++) {
            if (timestamps[i].raw === clickedTimestamp) {
              clickedIndex = i;
              break;
            }
          }

          setActiveTimestamp({
            startTime,
            endTime,
            volume: timestampVolume,
            speed: timestampSpeed,
            action: actionMode,
            raw: clickedTimestamp,
            index: clickedIndex
          });

          setLastActiveIndex(clickedIndex - 1);

          showNotification(`타임스탬프 적용: 볼륨 ${timestampVolume}%, 속도 ${timestampSpeed}x`, 'success');

          setTimeout(() => {
            processingEntryRef.current = false;
            processingExitRef.current = false;
            ignoreManualMoveRef.current = false;
          }, 1000);

          if (isEndTimeClick) {
            // 종료시간 클릭은 자동 이탈 로직에 의존
          }

          if (actionMode && actionMode.startsWith('|')) {
            const pauseSeconds = parseInt(actionMode.substring(1));
            if (!isNaN(pauseSeconds)) {
              player.pauseVideo();
              showNotification(`${pauseSeconds}초간 정지`, 'warning');

              setTimeout(() => {
                try {
                  player.playVideo();
                  showNotification('재생 재개', 'success');
                } catch (error) {
                  console.error('재생 재개 오류:', error);
                }
              }, pauseSeconds * 1000);
            }
          } else if (actionMode === '->') {
            const segmentDuration = (endTime - startTime) * 1000;
            setTimeout(() => {
              if (player.getPlayerState() === 1) {
                const currentIndex = noteText.indexOf(clickedTimestamp);
                const remainingText = noteText.substring(currentIndex + clickedTimestamp.length);
                const nextTimestampMatch = remainingText.match(/\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/);

                if (nextTimestampMatch) {
                  const nextStartHours = parseInt(nextTimestampMatch[1]);
                  const nextStartMinutes = parseInt(nextTimestampMatch[2]);
                  const nextStartSeconds = parseFloat(nextTimestampMatch[3]);
                  const nextStartTime = nextStartHours * 3600 + nextStartMinutes * 60 + nextStartSeconds;

                  const nextVolume = parseInt(nextTimestampMatch[7]);
                  const nextSpeed = parseFloat(nextTimestampMatch[8]);

                  if (player.setVolume) player.setVolume(nextVolume);
                  if (player.setPlaybackRate) player.setPlaybackRate(nextSpeed);
                  player.seekTo(nextStartTime, true);

                  showNotification(`다음 타임스탬프로 자동 이동: ${formatTime(nextStartTime)}`, "info");
                } else {
                  player.pauseVideo();
                  showNotification("다음 타임스탬프가 없어서 정지됩니다", "info");
                }
              }
            }, segmentDuration);
            showNotification(`재생 시작 - ${(endTime - startTime).toFixed(1)}초 후 다음 스탬프로 자동 이동`, "success");
          } else {
            showNotification(`${formatTime(startTime)}로 이동 - 계속 재생`, "info");
          }
        }
      } catch (error) {
        console.error("타임스탬프 파싱 오류:", error);
        showNotification("타임스탬프 형식 오류", "error");
      }
    }
  }, [
    isPlayerReady,
    player,
    noteText,
    currentVolume,
    currentPlaybackRate,
    parseTimestamps,
    formatTime,
    setActiveTimestamp,
    setOriginalSettings,
    setLastActiveIndex,
    setCurrentVolume,
    setCurrentPlaybackRate,
    setVolume,
    setPlaybackRate,
    setCurrentRate,
    processingEntryRef,
    processingExitRef,
    ignoreManualMoveRef,
    originalUserSettingsRef,
    showNotification,
  ]);

  return { handleTimestampClick };
};
