import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTime } from "@/lib/youtubeUtils";
import { Clock, InfoIcon, Type, FileText, Circle, Square } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OverlayData } from "./TextOverlay";
import OverlayInput from "./OverlayInput";
import RecordingSessionList from "./RecordingSessionList";
import TimestampEditModal from "./TimestampEditModal";
import { UISettings } from "./SettingsPanel";

// 녹화 관련 인터페이스
export interface RawTimestamp {
  id: string;
  time: number;          // 초.밀리초
  action: 'speed' | 'volume' | 'seek' | 'pause' | 'manual';
  value: number;         // 변경된 값
  previousValue: number; // 이전 값
  isImportant: boolean;  // 중요도
}

interface RecordingSession {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  videoId: string;
  rawTimestamps: RawTimestamp[];
  isActive: boolean;
}

export interface NoteAreaProps {
  videoId: string | null;
  noteText: string;
  setNoteText: (text: string) => void;
  isPlayerReady: boolean;
  player: any;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  overlayData: OverlayData;
  setOverlayData: React.Dispatch<React.SetStateAction<OverlayData>>;
  saveNote?: (noteText: string) => void;
  uiSettings: UISettings;
}

const NoteArea: React.FC<NoteAreaProps> = ({
  videoId,
  noteText,
  setNoteText,
  isPlayerReady,
  player,
  currentTime,
  duration,
  volume,
  playbackRate,
  showNotification,
  overlayData,
  setOverlayData,
  saveNote,
  uiSettings
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // 녹화 상태
  const [녹화중, set녹화중] = useState(false);
  const [현재세션, set현재세션] = useState<string | null>(null);
  const [이전볼륨, set이전볼륨] = useState(volume);
  const [이전속도, set이전속도] = useState(playbackRate);
  const [이전시간, set이전시간] = useState(currentTime);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 녹화 세션 목록 조회
  const { data: 세션목록 = [] } = useQuery({
    queryKey: ['recording-sessions', videoId],
    queryFn: async () => {
      if (!videoId) return [];
      const response = await fetch(`http://localhost:3001/api/recording-sessions/${videoId}`);
      if (!response.ok) throw new Error('세션 조회 실패');
      return response.json();
    },
    enabled: !!videoId
  });

  // 녹화 세션 생성
  const 세션생성 = useMutation({
    mutationFn: async (data: { videoId: string; title: string }) => {
      const response = await fetch('http://localhost:3001/api/recording-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('세션 생성 실패');
      return response.json();
    },
    onSuccess: (data) => {
      set현재세션(data.id);
      queryClient.invalidateQueries({ queryKey: ['recording-sessions', videoId] });
      showNotification('녹화 세션이 시작되었습니다', 'success');
    }
  });

  // 녹화 데이터 저장
  const 데이터저장 = useMutation({
    mutationFn: async (data: { sessionId: string; timestamp: RawTimestamp }) => {
      const response = await fetch(`http://localhost:3001/api/recording-sessions/${data.sessionId}/timestamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.timestamp)
      });
      if (!response.ok) throw new Error('타임스탬프 저장 실패');
      return response.json();
    }
  });

  // 녹화 세션 종료
  const 세션종료 = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`http://localhost:3001/api/recording-sessions/${sessionId}/end`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('세션 종료 실패');
      return response.json();
    },
    onSuccess: () => {
      set녹화중(false);
      set현재세션(null);
      queryClient.invalidateQueries({ queryKey: ['recording-sessions', videoId] });
      showNotification('녹화가 종료되었습니다', 'info');
    }
  });

  // 변경사항 감지 및 기록
  useEffect(() => {
    if (!녹화중 || !현재세션 || !isPlayerReady) return;

    let 변경발생 = false;
    const 변경목록: RawTimestamp[] = [];

    // 볼륨 변경 감지
    if (Math.abs(volume - 이전볼륨) > 1) {
      변경목록.push({
        id: Date.now().toString() + '-volume',
        time: currentTime,
        action: 'volume',
        value: volume,
        previousValue: 이전볼륨,
        isImportant: Math.abs(volume - 이전볼륨) > 10
      });
      set이전볼륨(volume);
      변경발생 = true;
    }

    // 속도 변경 감지
    if (Math.abs(playbackRate - 이전속도) > 0.05) {
      변경목록.push({
        id: Date.now().toString() + '-speed',
        time: currentTime,
        action: 'speed',
        value: playbackRate,
        previousValue: 이전속도,
        isImportant: Math.abs(playbackRate - 이전속도) > 0.25
      });
      set이전속도(playbackRate);
      변경발생 = true;
    }

    // 시간 점프 감지 (10초 이상)
    const 시간차이 = Math.abs(currentTime - 이전시간);
    if (시간차이 > 10) {
      변경목록.push({
        id: Date.now().toString() + '-seek',
        time: currentTime,
        action: 'seek',
        value: currentTime,
        previousValue: 이전시간,
        isImportant: 시간차이 > 60
      });
      변경발생 = true;
    }
    set이전시간(currentTime);

    // 변경사항 저장
    if (변경발생) {
      변경목록.forEach(timestamp => {
        데이터저장.mutate({ sessionId: 현재세션, timestamp });
      });
    }
  }, [volume, playbackRate, currentTime, 녹화중, 현재세션, isPlayerReady]);

  // 녹화 시작/중지
  const 녹화토글 = async () => {
    if (!videoId) {
      showNotification('비디오 ID가 없습니다', 'error');
      return;
    }

    if (녹화중) {
      // 녹화 중지
      if (현재세션) {
        세션종료.mutate(현재세션);
      }
    } else {
      // 녹화 시작
      const 제목 = `세션 ${new Date().toLocaleString('ko-KR')}`;
      세션생성.mutate({ videoId, title: 제목 });
      set녹화중(true);
      set이전볼륨(volume);
      set이전속도(playbackRate);
      set이전시간(currentTime);
    }
  };

  // 수동 타임스탬프 추가
  const 수동타임스탬프추가 = () => {
    if (!녹화중 || !현재세션) return;

    const timestamp: RawTimestamp = {
      id: Date.now().toString() + '-manual',
      time: currentTime,
      action: 'manual',
      value: currentTime,
      previousValue: currentTime,
      isImportant: true
    };

    데이터저장.mutate({ sessionId: 현재세션, timestamp });
    showNotification('수동 타임스탬프가 추가되었습니다', 'success');
  };

  // 세션 데이터를 노트 텍스트로 변환
  const 세션을노트로변환 = (session: RecordingSession) => {
    if (!session.rawTimestamps.length) {
      showNotification('변환할 데이터가 없습니다', 'warning');
      return;
    }

    let 변환텍스트 = `\n\n=== ${session.title} ===\n`;
    
    // 중요한 타임스탬프만 필터링하고 시간순 정렬
    const 중요타임스탬프 = session.rawTimestamps
      .filter(t => t.isImportant)
      .sort((a, b) => a.time - b.time);

    중요타임스탬프.forEach(t => {
      const 시간표시 = formatTime(t.time);
      switch (t.action) {
        case 'volume':
          변환텍스트 += `[${시간표시}] 볼륨: ${t.previousValue}% → ${t.value}%\n`;
          break;
        case 'speed':
          변환텍스트 += `[${시간표시}] 속도: ${t.previousValue}x → ${t.value}x\n`;
          break;
        case 'seek':
          변환텍스트 += `[${시간표시}] 이동: ${formatTime(t.previousValue)} → ${formatTime(t.value)}\n`;
          break;
        case 'manual':
          변환텍스트 += `[${시간표시}] 수동 마크\n`;
          break;
      }
    });

    const 새텍스트 = noteText + 변환텍스트;
    setNoteText(새텍스트);
    
    if (saveNote) {
      saveNote(새텍스트);
    }
    
    showNotification('세션 데이터가 노트에 추가되었습니다', 'success');
  };

  // 기존 타임스탬프 추가 함수 (기존 로직 유지)
  const addTimestamp = () => {
    if (!isPlayerReady || !player) {
      showNotification("플레이어가 준비되지 않았습니다", "error");
      return;
    }

    try {
      const 현재시간 = player.getCurrentTime();
      const timeFormatted = formatTime(현재시간);
      
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // 현재 텍스트의 시작부터 커서 위치까지의 부분에서 마지막 타임스탬프 찾기
        const 텍스트앞부분 = noteText.substring(0, start);
        const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
        let match;
        let 마지막타임스탬프 = null;
        
        // 커서 앞의 모든 타임스탬프를 찾아서 가장 마지막 것을 저장
        while ((match = timestampRegex.exec(텍스트앞부분)) !== null) {
          마지막타임스탬프 = match;
        }
        
        let 최종텍스트 = noteText;
        
        if (마지막타임스탬프) {
          // 마지막 타임스탬프의 종료시간 계산
          const 종료시 = parseInt(마지막타임스탬프[4]);
          const 종료분 = parseInt(마지막타임스탬프[5]);
          const 종료초 = parseFloat(마지막타임스탬프[6]);
          const 종료시간초 = 종료시 * 3600 + 종료분 * 60 + 종료초;
          
          // 현재 시간이 마지막 타임스탬프 종료시간보다 이전이면 -> 추가
          if (현재시간 < 종료시간초) {
            const 기존타임스탬프 = 마지막타임스탬프[0];
            // 이미 ->나 |가 있는지 확인
            if (!기존타임스탬프.includes('->') && !기존타임스탬프.includes('|')) {
              const 새로운타임스탬프 = 기존타임스탬프.replace(/\]$/, ', ->]');
              최종텍스트 = 최종텍스트.replace(기존타임스탬프, 새로운타임스탬프);
            }
          }
        }
        
        // 새 타임스탬프 생성 - 기본값: 5초 구간, 100% 볼륨, 1.00배속
        const 종료시간 = Math.min(현재시간 + 5, duration || 현재시간 + 5);
        const 종료시간포맷 = formatTime(종료시간);
        const timestamp = `[${timeFormatted}-${종료시간포맷}, 100%, 1.00x]`;
        
        // 현재 커서 위치에 타임스탬프 삽입
        const newText = 최종텍스트.substring(0, start) + timestamp + " " + 최종텍스트.substring(end);
        setNoteText(newText);
        
        // 타임스탬프 삽입 후 커서 위치 조정
        setTimeout(() => {
          const newCursorPos = start + timestamp.length + 1;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        // 즉시 저장
        setTimeout(() => {
          if (saveNote) {
            saveNote(newText);
          }
        }, 100);

        // 최종텍스트가 변경되었다면 이전 시간대 알림
        if (최종텍스트 !== noteText) {
          setTimeout(() => {
            saveNote(최종텍스트);
          }, 100);
          
          showNotification(`이전 시간대 타임스탬프 추가 - 직전 타임스탬프에 -> 표시됨`, "info");
        } else {
          showNotification(`타임스탬프 추가: ${timeFormatted}`, "success");
        }
      }

      // 녹화 중이면 수동 타임스탬프도 추가
      if (녹화중) {
        수동타임스탬프추가();
      }
    } catch (error) {
      console.error("타임스탬프 추가 중 오류:", error);
      showNotification("타임스탬프 추가 중 오류가 발생했습니다.", "error");
    }
  };

  // 모달 열기 함수
  const openTimestampModal = () => {
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
  };
  // 커서 위치 기준으로 바로 이전 타임스탬프 1개만 찾는 함수
  const findPreviousTimestamp = (text: string, cursorPosition: number) => {
    const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
    let match;
    let previousTimestamp = null;

    // 커서 위치보다 앞에 있는 타임스탬프들만 검색
    while ((match = timestampRegex.exec(text)) !== null) {
      if (match.index >= cursorPosition) {
        break; // 커서 위치보다 뒤에 있으면 중단
      }
      
      // 바로 이전 타임스탬프 정보 저장 (가장 가까운 것으로 계속 업데이트)
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
  };

  // 모달에서 타임스탬프 저장 함수
  const addTimestampFromModal = useCallback((timestampData: {
    startTime: number;
    endTime: number;
    volume: number;
    playbackRate: number;
    pauseDuration?: number;
    autoJump: boolean;
  }) => {
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
        
        // 커서 위치 기준으로 바로 이전 타임스탬프 1개 찾기
        const previousTimestamp = findPreviousTimestamp(noteText, cursorPosition);
        
        if (previousTimestamp && !previousTimestamp.hasAutoJump) {
          let shouldAddArrow = false;
          
          if (timestampData.autoJump) {
            // 자동 점프 체크된 경우: 무조건 추가
            shouldAddArrow = true;
          } else {
            // 자동 점프 체크 안된 경우: 새 타임스탬프 시작시간이 이전 타임스탬프 종료시간보다 더 이전이면 추가
            if (startTime < previousTimestamp.endTime) {
              shouldAddArrow = true;
            }
          }
          
          if (shouldAddArrow) {
            // 이전 타임스탬프에 `, ->` 추가
            const oldTimestamp = previousTimestamp.match;
            const newTimestamp = oldTimestamp.replace(/\]$/, ', ->]');
            updatedText = updatedText.replace(oldTimestamp, newTimestamp);
            showNotification('이전 타임스탬프에 자동 이동 화살표가 추가되었습니다', 'info');
          }
        }
        
        // 타임스탬프 형식 생성
        let timestamp = `[${timeFormatted}-${endTimeFormatted}, ${timestampData.volume}%, ${timestampData.playbackRate.toFixed(2)}x`;
        
        if (timestampData.pauseDuration && timestampData.pauseDuration > 0) {
          timestamp += `, |${timestampData.pauseDuration}`;
        } else if (timestampData.autoJump) {
          timestamp += `, ->`;
        }
        
        timestamp += `]`;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // 현재 커서 위치에 타임스탬프 삽입
        const newText = updatedText.substring(0, start) + timestamp + " " + "\n" + updatedText.substring(end);
        setNoteText(newText);
        
        showNotification(`타임스탬프 추가됨: ${timestamp}`, 'success');

        // 타임스탬프 삽입 후 커서 위치 조정
        setTimeout(() => {
          const newCursorPos = start + timestamp.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        // 즉시 저장
        setTimeout(() => {
          if (saveNote) {
            saveNote(newText);
          }
        }, 100);

        // 자동 점프가 체크되어 있으면 해당 시간으로 영상 재생
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
    }
  }, [isPlayerReady, player, noteText, formatTime, showNotification, saveNote]);

  // 타임스탬프 클릭 처리 - 더블클릭으로 변경
  const handleTimestampClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!isPlayerReady || !player) return;

    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    
    // 새로운 형식의 타임스탬프 찾기 [HH:MM:SS-HH:MM:SS, volume%, speedx, action] - 소수점 3자리까지 지원
    const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
    let match;
    let clickedTimestamp = null;
    let clickedMatch = null;

    // 모든 타임스탬프 찾기
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
        // 새로운 형식에서 시간과 설정값 추출 - 소수점 3자리까지 지원, 동작모드 포함
        const timeMatch = clickedTimestamp.match(/\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/);
        if (timeMatch) {
          // 시작 시간 계산 - 소수점 3자리 지원
          const startHours = parseInt(timeMatch[1]);
          const startMinutes = parseInt(timeMatch[2]); 
          const startSeconds = parseFloat(timeMatch[3]);
          
          // 종료 시간 계산 - 소수점 3자리 지원
          const endHours = parseInt(timeMatch[4]);
          const endMinutes = parseInt(timeMatch[5]);
          const endSeconds = parseFloat(timeMatch[6]);
          
          // 볼륨과 속도 추출
          const timestampVolume = parseInt(timeMatch[7]);
          const timestampSpeed = parseFloat(timeMatch[8]);
          
          // 동작 모드 추출
          const actionMode = timeMatch[9];
          
          // 초 단위로 변환
          const startTime = startHours * 3600 + startMinutes * 60 + startSeconds;
          const endTime = endHours * 3600 + endMinutes * 60 + endSeconds;
          
          // 볼륨과 재생 속도 설정
          if (player.setVolume) {
            player.setVolume(timestampVolume);
          }
          if (player.setPlaybackRate) {
            player.setPlaybackRate(timestampSpeed);
          }
          
          // 시작 위치로 이동하고 재생
          player.seekTo(startTime, true);
          player.playVideo();
          
          // 동작 모드에 따른 처리
          if (actionMode && actionMode.startsWith('|')) {
            // 정지 모드 - |숫자 형태
            const pauseSeconds = parseInt(actionMode.substring(1));
            if (!isNaN(pauseSeconds)) {
              setTimeout(() => {
                if (player.getPlayerState() === 1) { // 재생 중일 때만
                  player.pauseVideo();
                  showNotification(`${pauseSeconds}초 정지 완료`, "info");
                }
              }, pauseSeconds * 1000);
              showNotification(`재생 시작 - ${pauseSeconds}초 후 자동 정지`, "success");
            }
          } else if (actionMode === '->') {
            // 자동점프 모드 - 종료시간에 다음 타임스탬프로 자동 이동
            const segmentDuration = (endTime - startTime) * 1000;
            setTimeout(() => {
              if (player.getPlayerState() === 1) { // 재생 중일 때만
                // 다음 타임스탬프 찾기
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
                  
                  // 다음 타임스탬프로 자동 이동
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
            // 일반 모드 - 종료시간에 정지
            const segmentDuration = (endTime - startTime) * 1000;
            setTimeout(() => {
              if (player.getPlayerState() === 1) { // 재생 중일 때만
                player.pauseVideo();
                showNotification("구간 재생 완료", "info");
              }
            }, segmentDuration);
            showNotification(`구간 재생 시작: ${formatTime(startTime)} - ${formatTime(endTime)} (${(endTime - startTime).toFixed(1)}초)`, "success");
          }
        }
      } catch (error) {
        console.error("타임스탬프 파싱 오류:", error);
        showNotification("타임스탬프 형식 오류", "error");
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
          
          <div className="flex items-center space-x-2">
            {/* 녹화 관련 버튼들 */}
            <Button
              onClick={녹화토글}
              variant={녹화중 ? "destructive" : "default"}
              size="sm"
              disabled={!videoId}
            >
              {녹화중 ? <Square className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {녹화중 ? '녹화 중지' : '녹화 시작'}
            </Button>

            {녹화중 && (
              <Button
                onClick={수동타임스탬프추가}
                variant="outline"
                size="sm"
              >
                수동 마크
              </Button>
            )}

            <Button
              onClick={addTimestamp}
              disabled={!isPlayerReady}
              size="sm"
            >
              <Clock className="w-4 h-4 mr-1" />
              도장
            </Button>

            <Button
              onClick={openTimestampModal}
              disabled={!isPlayerReady}
              size="sm"
              variant="outline"
            >
              <Clock className="w-4 h-4 mr-1" />
              편집
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-4">
          {/* 오버레이 입력 */}
          <OverlayInput
            overlayData={overlayData}
            setOverlayData={setOverlayData}
            isPlayerReady={isPlayerReady}
            player={player}
            showNotification={showNotification}
          />

          {/* 노트 영역 - UI 설정에 따라 조건부 렌더링 */}
          {(!uiSettings.note || !uiSettings.note.hidden) && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onDoubleClick={handleTimestampClick}
                  placeholder="여기에 노트를 작성하세요.

📌 사용법:
• 도장 버튼: [HH:MM:SS, 100%, 1.00x] 형식으로 타임스탬프 생성
• 더블클릭: 타임스탬프 시간으로 이동
• 자동점프: 다음 스탬프로 자동 이동, 끝에 &quot;, -&gt;&quot; 추가
• 정지재생: 끝에 &quot;, |3&quot; (3초 정지) 추가

예시: [00:01:30-00:01:35, 100%, 1.25x, -&gt;]
     [00:01:30-00:01:35, 100%, 1.25x, |3]"
                  className="w-full resize-y min-h-[130px]"
                />
                
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500 flex items-center">
                    <InfoIcon className="h-3 w-3 mr-1" /> 도장 형식: [HH:MM:SS, 100%, 1.00x]]
                  </p>
                  <div>
                    {녹화중 && (
                      <span className="text-xs text-red-500 animate-pulse">● 녹화 중</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 대체 노트 영역 - 메인 노트가 숨겨진 경우 */}
          {uiSettings.note && uiSettings.note.hidden && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onDoubleClick={handleTimestampClick}
                  placeholder="여기에 노트를 작성하세요.

📌 사용법:
• 도장 버튼: [HH:MM:SS, 100%, 1.00x] 형식으로 타임스탬프 생성
• 더블클릭: 타임스탬프 시간으로 이동
• 자동점프: 다음 스탬프로 자동 이동, 끝에 &quot;, -&gt;&quot; 추가
• 정지재생: 끝에 &quot;, |3&quot; (3초 정지) 추가

예시: [00:01:30-00:01:35, 100%, 1.25x, -&gt;]
     [00:01:30-00:01:35, 100%, 1.25x, |3]"
                  className="w-full resize-y min-h-[200px]"
                />
                
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500 flex items-center">
                    <InfoIcon className="h-3 w-3 mr-1" /> 도장 형식: [HH:MM:SS, 100%, 1.00x]]
                  </p>
                  <div>
                    {녹화중 && (
                      <span className="text-xs text-red-500 animate-pulse">● 녹화 중</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 녹화 세션 목록 */}
          {세션목록.length > 0 && (
            <RecordingSessionList
              sessions={세션목록}
              onConvertToNote={세션을노트로변환}
              formatTime={formatTime}
              showNotification={showNotification}
            />
          )}
        </div>

        {/* 타임스탬프 편집 모달 */}
        <TimestampEditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          player={player}
          isPlayerReady={isPlayerReady}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          playbackRate={playbackRate}
          onSave={addTimestampFromModal}
          showNotification={showNotification}
        />
      </CardContent>
    </Card>
  );
};

export default NoteArea;