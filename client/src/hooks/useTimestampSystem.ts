/**
 * useTimestampSystem.ts
 *
 * 타임스탬프 자동 실행 시스템을 React 컴포넌트에서 사용하기 위한 커스텀 Hook
 * TimestampProcessor와 React 상태 관리를 연결
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimestampProcessor, ParsedTimestamp, PlayerInterface } from '@/lib/TimestampProcessor';

// Hook 반환 타입
export interface UseTimestampSystemReturn {
  timestamps: ParsedTimestamp[];
  activeTimestamp: ParsedTimestamp | null;
  lastActiveIndex: number;
  isProcessing: boolean;
  autoJumpInfo: { isWaiting: boolean; targetIndex: number | null; remainingSeconds: number } | null;
  updateNoteText: (noteText: string) => void;
  handleDoubleClick: (clickPosition: number, noteText: string) => void;
  reset: () => void;
}

// Hook 옵션
export interface UseTimestampSystemOptions {
  player: PlayerInterface | null;
  isPlayerReady: boolean;
  playerState: number;
  showNotification?: (message: string, type: "info" | "success" | "warning" | "error") => void;
  intervalMs?: number; // 감지 간격 (기본값: 500ms)
}

export function useTimestampSystem(options: UseTimestampSystemOptions): UseTimestampSystemReturn {
  const {
    player,
    isPlayerReady,
    playerState,
    showNotification,
    intervalMs = 500
  } = options;

  // 상태 관리
  const [timestamps, setTimestamps] = useState<ParsedTimestamp[]>([]);
  const [activeTimestamp, setActiveTimestamp] = useState<ParsedTimestamp | null>(null);
  const [lastActiveIndex, setLastActiveIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [autoJumpInfo, setAutoJumpInfo] = useState<{ isWaiting: boolean; targetIndex: number | null; remainingSeconds: number } | null>(null);

  // TimestampProcessor 인스턴스
  const processorRef = useRef<TimestampProcessor>(new TimestampProcessor());
  const intervalRef = useRef<number | null>(null);
  const lastSeekTimeRef = useRef<number>(0);

  // 초기 설정
  useEffect(() => {
    if (player && isPlayerReady) {
      processorRef.current.setPlayer(player);
      if (showNotification) {
        processorRef.current.setNotificationCallback(showNotification);
      }
    }
  }, [player, isPlayerReady, showNotification]);

  // 노트 텍스트 업데이트 및 파싱
  const updateNoteText = useCallback((noteText: string) => {
    const parsedTimestamps = processorRef.current.parseTimestamps(noteText);
    setTimestamps(parsedTimestamps);

    console.log(`[useTimestampSystem] 파싱 완료: ${parsedTimestamps.length}개 타임스탬프`);
    parsedTimestamps.forEach((ts, idx) => {
      console.log(`  ${idx}: [${formatTime(ts.startTime)}-${formatTime(ts.endTime)}] ${ts.volume}% ${ts.speed}x ${ts.action || ''}`);
    });
  }, []);

  // 타임스탬프 자동 감지 및 처리
  useEffect(() => {
    if (!player || !isPlayerReady || timestamps.length === 0) {
      return;
    }

    // 재생 중일 때만 감지 활성화 (playerState === 1)
    if (playerState === 1) {
      intervalRef.current = window.setInterval(() => {
        try {
          const currentTime = player.getCurrentTime();

          // 수동 이동 감지 (2초 이상 점프)
          const timeDiff = Math.abs(currentTime - lastSeekTimeRef.current);
          if (timeDiff > 2.0) {
            processorRef.current.handleManualSeek(timestamps, currentTime);
            console.log(`[useTimestampSystem] 수동 이동 감지: ${timeDiff.toFixed(2)}초 점프`);
          }
          lastSeekTimeRef.current = currentTime;

          // 메인 처리 실행
          processorRef.current.process(timestamps, currentTime);

          // 상태 동기화
          const newActiveTimestamp = processorRef.current.getActiveTimestamp();
          const newLastActiveIndex = processorRef.current.getLastActiveIndex();
          const newIsProcessing = processorRef.current.isProcessing();
          const newAutoJumpInfo = processorRef.current.getAutoJumpInfo();

          setActiveTimestamp(newActiveTimestamp);
          setLastActiveIndex(newLastActiveIndex);
          setIsProcessing(newIsProcessing);
          setAutoJumpInfo(newAutoJumpInfo);

        } catch (error) {
          console.error('[useTimestampSystem] 처리 중 오류:', error);
        }
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [player, isPlayerReady, playerState, timestamps, intervalMs]);

  // 더블클릭 처리
  const handleDoubleClick = useCallback((clickPosition: number, noteText: string) => {
    if (!player || !isPlayerReady || timestamps.length === 0) {
      return;
    }

    // 클릭된 타임스탬프 찾기
    const clickedTimestamp = findTimestampAtPosition(clickPosition, noteText, timestamps);
    if (!clickedTimestamp) {
      console.log('[useTimestampSystem] 클릭 위치에 타임스탬프 없음');
      return;
    }

    // 시작/종료시간 구분
    const dashPosition = clickedTimestamp.raw.indexOf('-');
    const timestampStart = noteText.indexOf(clickedTimestamp.raw);
    const isEndTimeClick = clickPosition > (timestampStart + dashPosition);

    // TimestampProcessor에 더블클릭 처리 위임
    processorRef.current.handleDoubleClick(clickedTimestamp, isEndTimeClick);

    console.log(`[useTimestampSystem] 더블클릭 처리: ${isEndTimeClick ? '종료' : '시작'}시간`);
  }, [player, isPlayerReady, timestamps]);

  // 시스템 리셋
  const reset = useCallback(() => {
    processorRef.current.reset();
    setActiveTimestamp(null);
    setLastActiveIndex(-1);
    setIsProcessing(false);
    setAutoJumpInfo(null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    timestamps,
    activeTimestamp,
    lastActiveIndex,
    isProcessing,
    autoJumpInfo,
    updateNoteText,
    handleDoubleClick,
    reset
  };
}

/**
 * 클릭 위치에 해당하는 타임스탬프 찾기
 */
function findTimestampAtPosition(
  clickPosition: number,
  noteText: string,
  timestamps: ParsedTimestamp[]
): ParsedTimestamp | null {
  for (const timestamp of timestamps) {
    const start = noteText.indexOf(timestamp.raw);
    const end = start + timestamp.raw.length;

    if (clickPosition >= start && clickPosition <= end) {
      return timestamp;
    }
  }
  return null;
}

/**
 * 시간 포맷팅 유틸리티
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}