import { useState, useRef, useCallback, useEffect } from "react";

interface UseTimestampTrackingProps {
  player: any;
  isPlayerReady: boolean;
  playerState: number;
  noteText: string;
  currentVolume: number;
  currentPlaybackRate: number;
  currentVideoId: string;
  uiSettings: any;
  parseTimestamps: (text: string) => any[];
  formatTime: (seconds: number) => string;
  setCurrentTime: (time: number) => void;
  setCurrentVolume: (volume: number) => void;
  setCurrentPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setCurrentRate: (rate: number) => void;
  setTimestamps: (timestamps: any[]) => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

export const useTimestampTracking = ({
  player,
  isPlayerReady,
  playerState,
  noteText,
  currentVolume,
  currentPlaybackRate,
  currentVideoId,
  uiSettings,
  parseTimestamps,
  formatTime,
  setCurrentTime,
  setCurrentVolume,
  setCurrentPlaybackRate,
  setVolume,
  setPlaybackRate,
  setCurrentRate,
  setTimestamps,
  showNotification,
}: UseTimestampTrackingProps) => {
  // 활성 타임스탬프 및 설정 상태
  const [activeTimestamp, setActiveTimestamp] = useState<any>(null);
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  const [userSettings, setUserSettings] = useState({ volume: 100, speed: 1.0 });
  const [lastActiveIndex, setLastActiveIndex] = useState(-1);

  // 추적 및 제어용 ref
  const trackingRef = useRef<number | null>(null);
  const processingEntryRef = useRef(false);
  const processingExitRef = useRef(false);
  const autoJumpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalUserSettingsRef = useRef<any>(null);
  const ignoreManualMoveRef = useRef(false);
  const lastTimeRef = useRef<number>(0);

  // 파싱된 타임스탬프 캐시
  const parsedTimestampsRef = useRef<any[] | null>(null);
  const lastNoteTextRef = useRef<string>('');

  // 수동 이동 감지
  const detectManualMove = useCallback((currentTime: number) => {
    if (ignoreManualMoveRef.current) return;

    const timeDiff = Math.abs(currentTime - lastTimeRef.current);
    if (timeDiff > 1.5) {
      setLastActiveIndex(-1);
    }
    lastTimeRef.current = currentTime;
  }, []);

  // 통합 타임스탬프 처리 함수
  const processTimestamps = useCallback((currentTime: number) => {
    try {
      detectManualMove(currentTime);
      setCurrentTime(currentTime);

      // 타임스탬프 캐싱
      let timestamps;
      if (lastNoteTextRef.current !== noteText) {
        timestamps = parseTimestamps(noteText);
        parsedTimestampsRef.current = timestamps;
        lastNoteTextRef.current = noteText;
      } else {
        timestamps = parsedTimestampsRef.current || [];
      }

      if (timestamps.length === 0) return;

      // 타임스탬프 찾기
      let currentStamp = null;
      let candidateIndex = -1;
      const timeMargin = 0.01;

      if (activeTimestamp) {
        for (let i = 0; i < timestamps.length; i++) {
          const stamp = timestamps[i];
          if (currentTime >= stamp.startTime - timeMargin && currentTime <= stamp.endTime + timeMargin) {
            currentStamp = stamp;
            candidateIndex = i;
            break;
          }
        }
      } else {
        for (let i = 0; i < timestamps.length; i++) {
          const stamp = timestamps[i];
          if (currentTime >= stamp.startTime - timeMargin && currentTime <= stamp.endTime + timeMargin) {
            if (i > lastActiveIndex) {
              currentStamp = stamp;
              candidateIndex = i;
              break;
            }
          }
        }
      }

      // 타임스탬프 진입 처리
      const isDifferentTimestamp = !activeTimestamp ||
        (Math.abs(activeTimestamp.startTime - (currentStamp?.startTime || 0)) > 0.01 ||
         Math.abs(activeTimestamp.endTime - (currentStamp?.endTime || 0)) > 0.01 ||
         activeTimestamp.volume !== currentStamp?.volume ||
         Math.abs(activeTimestamp.speed - (currentStamp?.speed || 0)) > 0.01 ||
         activeTimestamp.action !== currentStamp?.action);

      if (currentStamp && isDifferentTimestamp && !processingEntryRef.current) {
        processingEntryRef.current = true;

        setLastActiveIndex(candidateIndex);

        // 원래 사용자 설정 저장
        if (!originalUserSettingsRef.current) {
          const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
          const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;

          originalUserSettingsRef.current = {
            volume: currentPlayerVolume,
            speed: currentPlayerSpeed
          };
        }

        // 현재 플레이어의 실제 값을 백업
        const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
        const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;

        setOriginalSettings({
          volume: currentPlayerVolume,
          speed: currentPlayerSpeed
        });

        // 타임스탬프 설정 적용
        if (player.setVolume) player.setVolume(currentStamp.volume);
        if (player.setPlaybackRate) player.setPlaybackRate(currentStamp.speed);

        setActiveTimestamp({ ...currentStamp, currentIndex: candidateIndex });

        // UI 상태 동기화
        setCurrentVolume(currentStamp.volume);
        setCurrentPlaybackRate(currentStamp.speed);
        setVolume(currentStamp.volume);
        setPlaybackRate(currentStamp.speed);
        setCurrentRate(currentStamp.speed);

        showNotification(`타임스탬프 적용: 볼륨 ${currentStamp.volume}%, 속도 ${currentStamp.speed}x`, 'info');

        // 타임스탬프 액션 처리
        if (currentStamp.action) {
          if (currentStamp.action.startsWith('|')) {
            // 정지 기능
            const pauseSeconds = parseInt(currentStamp.action.substring(1));
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

          } else if (currentStamp.action === '->') {
            // 자동 점프 설정
            const timeToEnd = currentStamp.endTime - currentTime;
            const realTimeToEnd = Math.max(100, (timeToEnd / currentStamp.speed) * 1000);

            if (autoJumpTimeoutRef.current) {
              clearTimeout(autoJumpTimeoutRef.current);
              autoJumpTimeoutRef.current = null;
            }

            autoJumpTimeoutRef.current = setTimeout(() => {
              try {
                const timestamps = parseTimestamps(noteText);
                const nextStamp = timestamps[candidateIndex + 1];

                if (nextStamp) {
                  setActiveTimestamp(null);
                  setOriginalSettings(null);
                  processingEntryRef.current = false;
                  processingExitRef.current = false;

                  const jumpCurrentTime = player.getCurrentTime();
                  const distance = Math.abs(nextStamp.startTime - jumpCurrentTime);
                  const allowSeekAhead = distance > 10;
                  const useBuffer = distance <= 3 ? false : allowSeekAhead;

                  player.seekTo(nextStamp.startTime, useBuffer);
                  showNotification(`자동 점프: ${formatTime(nextStamp.startTime)}로 이동 (거리: ${distance.toFixed(1)}초)`, 'success');

                  setLastActiveIndex(candidateIndex);

                  // 원래 설정 복원
                  setTimeout(() => {
                    const restoreSettings = originalUserSettingsRef.current || userSettings;
                    if (player.setVolume) player.setVolume(restoreSettings.volume);
                    if (player.setPlaybackRate) player.setPlaybackRate(restoreSettings.speed);

                    setCurrentVolume(restoreSettings.volume);
                    setCurrentPlaybackRate(restoreSettings.speed);
                    setVolume(restoreSettings.volume);
                    setPlaybackRate(restoreSettings.speed);
                    setCurrentRate(restoreSettings.speed);
                    setUserSettings(restoreSettings);

                    showNotification(`설정 복원: 볼륨 ${restoreSettings.volume}%, 속도 ${restoreSettings.speed}x`, 'success');
                  }, 100);
                } else {
                  // 마지막 타임스탬프
                  if (player.setVolume) player.setVolume(userSettings.volume);
                  if (player.setPlaybackRate) player.setPlaybackRate(userSettings.speed);

                  setCurrentVolume(userSettings.volume);
                  setCurrentPlaybackRate(userSettings.speed);
                  setVolume(userSettings.volume);
                  setPlaybackRate(userSettings.speed);
                  setCurrentRate(userSettings.speed);

                  showNotification(`설정 복원: 볼륨 ${userSettings.volume}%, 속도 ${userSettings.speed}x`, 'info');
                }
              } catch (error) {
                setActiveTimestamp(null);
                setOriginalSettings(null);
                processingEntryRef.current = false;
                processingExitRef.current = false;
              }

              autoJumpTimeoutRef.current = null;
            }, realTimeToEnd);
          }
        }

        setTimeout(() => {
          processingEntryRef.current = false;
        }, 100);

      } else if (!currentStamp && activeTimestamp && !processingExitRef.current) {
        // 타임스탬프 구간 이탈
        processingExitRef.current = true;

        // 재생 기본값으로 복원
        const defaultVolume = uiSettings?.재생기본값?.defaultVolume ?? 100;
        const defaultSpeed = uiSettings?.재생기본값?.defaultPlaybackRate ?? 1.0;

        if (player.setVolume) player.setVolume(defaultVolume);
        if (player.setPlaybackRate) player.setPlaybackRate(defaultSpeed);

        setCurrentVolume(defaultVolume);
        setCurrentPlaybackRate(defaultSpeed);
        setVolume(defaultVolume);
        setPlaybackRate(defaultSpeed);
        setCurrentRate(defaultSpeed);

        setUserSettings({
          volume: defaultVolume,
          speed: defaultSpeed
        });

        showNotification(`재생 기본값으로 복원: 볼륨 ${defaultVolume}%, 속도 ${defaultSpeed}x`, 'info');

        setActiveTimestamp(null);
        setOriginalSettings(null);

        setTimeout(() => {
          processingExitRef.current = false;
        }, 100);
      }
    } catch (error) {
      // 타임스탬프 감지 오류 발생시 조용히 무시
    }
  }, [isPlayerReady, player, playerState, noteText, activeTimestamp, originalSettings, userSettings, detectManualMove]);

  // requestAnimationFrame 기반 고정밀 추적 시스템
  useEffect(() => {
    if (!isPlayerReady || !player || playerState !== 1) {
      if (trackingRef.current) {
        cancelAnimationFrame(trackingRef.current);
        trackingRef.current = null;
      }
      return;
    }

    const startTracking = () => {
      try {
        const currentTime = player.getCurrentTime();
        if (currentTime !== undefined && currentTime !== null) {
          processTimestamps(currentTime);
        }
      } catch (error) {
        // 추적 오류 발생시 조용히 무시
      }

      if (player && playerState === 1) {
        trackingRef.current = requestAnimationFrame(startTracking);
      }
    };

    trackingRef.current = requestAnimationFrame(startTracking);

    return () => {
      if (trackingRef.current) {
        cancelAnimationFrame(trackingRef.current);
        trackingRef.current = null;
      }
    };
  }, [isPlayerReady, player, playerState, processTimestamps]);

  // 노트 텍스트 변경 시 타임스탬프 파싱 및 커스텀바용 데이터 변환
  useEffect(() => {
    const timestamps = parseTimestamps(noteText);

    const convertedTimestamps = timestamps.map(stamp => ({
      timeInSeconds: stamp.startTime,
      duration: stamp.endTime - stamp.startTime,
      volume: stamp.volume,
      playbackRate: stamp.speed,
      timeFormatted: formatTime(stamp.startTime)
    }));

    setTimestamps(convertedTimestamps);
  }, [noteText, setTimestamps]);

  // 영상 변경시 타임스탬프 상태 초기화
  useEffect(() => {
    if (currentVideoId) {
      setLastActiveIndex(-1);
      setActiveTimestamp(null);
      setOriginalSettings(null);
      processingEntryRef.current = false;
      processingExitRef.current = false;

      if (autoJumpTimeoutRef.current) {
        clearTimeout(autoJumpTimeoutRef.current);
        autoJumpTimeoutRef.current = null;
      }

      lastTimeRef.current = 0;
      ignoreManualMoveRef.current = false;
      originalUserSettingsRef.current = null;
    }
  }, [currentVideoId]);

  return {
    activeTimestamp,
    setActiveTimestamp,
    originalSettings,
    setOriginalSettings,
    userSettings,
    setUserSettings,
    lastActiveIndex,
    setLastActiveIndex,
    processingEntryRef,
    processingExitRef,
    ignoreManualMoveRef,
    originalUserSettingsRef,
  };
};
