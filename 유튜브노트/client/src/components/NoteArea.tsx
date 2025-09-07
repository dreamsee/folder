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
  player: any;
  isPlayerReady: boolean;
  playerState: number;
  availableRates: number[];
  currentRate: number;
  setCurrentRate: (rate: number) => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  currentVideoId: string;
  currentVideoInfo: any;
  timestamps: any[];
  setTimestamps: React.Dispatch<React.SetStateAction<any[]>>;
  overlays: OverlayData[];
  setOverlays: React.Dispatch<React.SetStateAction<OverlayData[]>>;
  onRecordingComplete: (session: any) => void;
  sessionToApply: any;
  recordingSessions: any[];
  onEditRecordingSession: (session: any) => void;
  onDeleteRecordingSession: (sessionId: string) => void;
  onCopyRecordingSession: (session: any) => void;
  onApplyRecordingToNote: (session: any) => void;
  uiSettings: UISettings;
  onSettingsChange: (settings: UISettings) => void;
}

const NoteArea: React.FC<NoteAreaProps> = ({
  player,
  isPlayerReady,
  playerState,
  availableRates,
  currentRate,
  setCurrentRate,
  showNotification,
  isKeyboardVisible,
  keyboardHeight,
  currentVideoId,
  currentVideoInfo,
  timestamps,
  setTimestamps,
  overlays,
  setOverlays,
  onRecordingComplete,
  sessionToApply,
  recordingSessions,
  onEditRecordingSession,
  onDeleteRecordingSession,
  onCopyRecordingSession,
  onApplyRecordingToNote,
  uiSettings,
  onSettingsChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // 녹화 상태
  const [녹화중, set녹화중] = useState(false);
  const [현재세션, set현재세션] = useState<string | null>(null);
  
  // 현재 플레이어 상태 추적 (props에 없어서 직접 추적)
  const [currentVolume, setCurrentVolume] = useState(100);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [이전볼륨, set이전볼륨] = useState(currentVolume);
  const [이전속도, set이전속도] = useState(currentPlaybackRate);
  const [이전시간, set이전시간] = useState(currentTime);

  // 드래그 컨트롤 상태
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startRate, setStartRate] = useState(1);
  const [startVolume, setStartVolume] = useState(100);
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [duration, setDuration] = useState(5); // 지속시간 (초)
  const controlRef = useRef<HTMLDivElement>(null);

  // 재생 속도 범위
  const minRate = 0.25;
  const maxRate = 2.0;

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 노트 텍스트 상태 (localStorage 연동)
  const [noteText, setNoteText] = useState("");

  // localStorage에서 노트 불러오기 (YouTube ID 기반)
  useEffect(() => {
    if (currentVideoId) {
      const savedNote = localStorage.getItem(`note_${currentVideoId}`);
      if (savedNote) {
        setNoteText(savedNote);
      } else {
        setNoteText(""); // 새 비디오인 경우 비우기
      }
    }
  }, [currentVideoId]);

  // 노트 텍스트 변경 시 localStorage에 저장
  useEffect(() => {
    if (currentVideoId && noteText) {
      // 디바운스를 위해 타이머 사용
      const saveTimer = setTimeout(() => {
        localStorage.setItem(`note_${currentVideoId}`, noteText);
      }, 1000); // 1초 후 저장
      
      return () => clearTimeout(saveTimer);
    }
  }, [noteText, currentVideoId]);

  // 녹화 세션 목록 조회
  const { data: 세션목록 = [] } = useQuery({
    queryKey: ['recording-sessions', currentVideoId],
    queryFn: async () => {
      if (!currentVideoId) return [];
      const response = await fetch(`http://localhost:3001/api/recording-sessions/${currentVideoId}`);
      if (!response.ok) throw new Error('세션 조회 실패');
      return response.json();
    },
    enabled: !!currentVideoId
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
      queryClient.invalidateQueries({ queryKey: ['recording-sessions', currentVideoId] });
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
      queryClient.invalidateQueries({ queryKey: ['recording-sessions', currentVideoId] });
      showNotification('녹화가 종료되었습니다', 'info');
    }
  });

  // 변경사항 감지 및 기록
  useEffect(() => {
    if (!녹화중 || !현재세션 || !isPlayerReady) return;

    let 변경발생 = false;
    const 변경목록: RawTimestamp[] = [];

    // 볼륨 변경 감지
    if (Math.abs(currentVolume - 이전볼륨) > 1) {
      변경목록.push({
        id: Date.now().toString() + '-volume',
        time: currentTime,
        action: 'volume',
        value: currentVolume,
        previousValue: 이전볼륨,
        isImportant: Math.abs(currentVolume - 이전볼륨) > 10
      });
      set이전볼륨(currentVolume);
      변경발생 = true;
    }

    // 속도 변경 감지
    if (Math.abs(currentPlaybackRate - 이전속도) > 0.05) {
      변경목록.push({
        id: Date.now().toString() + '-speed',
        time: currentTime,
        action: 'speed',
        value: currentPlaybackRate,
        previousValue: 이전속도,
        isImportant: Math.abs(currentPlaybackRate - 이전속도) > 0.25
      });
      set이전속도(currentPlaybackRate);
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
  }, [currentVolume, currentPlaybackRate, currentTime, 녹화중, 현재세션, isPlayerReady]);

  // 녹화 시작/중지
  const 녹화토글 = async () => {
    if (!currentVideoId) {
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
      세션생성.mutate({ videoId: currentVideoId, title: 제목 });
      set녹화중(true);
      set이전볼륨(currentVolume);
      set이전속도(currentPlaybackRate);
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
    
    // localStorage 자동 저장으로 대체됨
    
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
              // 정확한 위치에서만 교체하도록 수정
              const beforePart = 최종텍스트.substring(0, 마지막타임스탬프.index);
              const afterPart = 최종텍스트.substring(마지막타임스탬프.index + 기존타임스탬프.length);
              최종텍스트 = beforePart + 새로운타임스탬프 + afterPart;
            }
          }
        }
        
        // 새 타임스탬프 생성 - 기본값: 5초 구간, 100% 볼륨, 1.00배속
        const 종료시간 = 현재시간 + 5; // duration 정보가 없으니 기본 5초 추가
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

        // localStorage 자동 저장으로 대체됨

        // 최종텍스트가 변경되었다면 이전 시간대 알림
        if (최종텍스트 !== noteText) {
          setTimeout(() => {
            // localStorage 자동 저장으로 대체됨
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
        let cursorOffset = 0; // 커서 위치 조정을 위한 오프셋
        
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
            // 이전 타임스탬프에 `, ->` 추가 - 정확한 위치에서만 교체
            const oldTimestamp = previousTimestamp.match;
            const newTimestamp = oldTimestamp.replace(/\]$/, ', ->]');
            // 특정 위치(index)에서만 교체하도록 수정
            const beforePart = updatedText.substring(0, previousTimestamp.index);
            const afterPart = updatedText.substring(previousTimestamp.index + oldTimestamp.length);
            updatedText = beforePart + newTimestamp + afterPart;
            
            // 커서 위치가 이전 타임스탬프보다 뒤에 있으면 오프셋 조정
            if (cursorPosition > previousTimestamp.index) {
              cursorOffset = newTimestamp.length - oldTimestamp.length; // `, ->` 길이만큼 추가
            }
            
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
        
        const start = cursorPosition + cursorOffset;
        const end = cursorPosition + cursorOffset;
        
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

        // localStorage 자동 저장으로 대체됨

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
  }, [isPlayerReady, player, noteText, formatTime, showNotification]);

  // 타임스탬프 클릭 처리 - 더블클릭으로 변경
  const handleTimestampClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!isPlayerReady || !player || e.detail !== 2) return; // 더블클릭만 처리

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
            // 정지 기능: |3 = 3초간 정지 후 계속 재생 (SimpleNoteArea에서 검증된 로직)
            const pauseSeconds = parseInt(actionMode.substring(1));
            if (!isNaN(pauseSeconds)) {
              // 즉시 정지
              player.pauseVideo();
              showNotification(`${pauseSeconds}초간 정지 - 이후 자동 재생`, "warning");
              
              // 지정된 시간 후 재생 재개
              setTimeout(() => {
                player.playVideo();
                showNotification(`${pauseSeconds}초 정지 후 재생 재개`, "success");
              }, pauseSeconds * 1000);
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
            // 일반 재생: 그냥 해당 시간으로 이동 후 계속 재생 (정지 없음)
            showNotification(`${formatTime(startTime)}로 이동 - 계속 재생`, "info");
          }
        }
      } catch (error) {
        console.error("타임스탬프 파싱 오류:", error);
        showNotification("타임스탬프 형식 오류", "error");
      }
    }
  };

  // 드래그 컨트롤 핸들러들
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlayerReady || !player) return;

    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartRate(currentRate);
    setStartVolume(volume);

    if (controlRef.current) {
      controlRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isPlayerReady || !player) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // 좌우 드래그로 재생 속도 조절
    const sensitivity = 0.005;
    const newRate = Math.max(minRate, Math.min(maxRate, startRate + deltaX * sensitivity));

    if (Math.abs(newRate - currentRate) > 0.01) {
      player.setPlaybackRate(newRate);
      setCurrentRate(newRate);
      setPlaybackRate(newRate);
    }

    // 상하 드래그로 볼륨 조절
    const volumeSensitivity = 0.5;
    const newVolume = Math.max(0, Math.min(100, startVolume - deltaY * volumeSensitivity));

    if (Math.abs(newVolume - volume) > 1) {
      player.setVolume(newVolume);
      setVolume(newVolume);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPlayerReady || !player) return;

    const deltaX = Math.abs(e.clientX - startPos.x);
    const deltaY = Math.abs(e.clientY - startPos.y);

    // 움직임이 거의 없었다면 재생/일시정지 토글
    if (deltaX < 5 && deltaY < 5) {
      const playerState = player.getPlayerState();
      if (playerState === 1) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
    setIsDragging(false);

    if (controlRef.current) {
      controlRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full flex flex-col">

        {/* 재생 컨트롤 섹션 (uiSettings에 따라 표시) */}
        {uiSettings?.재생컨트롤?.전체표시 !== false && (
          <div className="mb-4 space-y-2">
            {/* 메인 드래그 컨트롤 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">재생 컨트롤</p>
                <div className="flex items-center space-x-1 text-sm text-gray-600 font-mono">
                  <span>{Math.round(volume || 100)}%</span>
                  <span>•</span>
                  <span>{(currentRate || 1.0).toFixed(2)}x</span>
                </div>
              </div>

              <div
                ref={controlRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`
                  relative w-full h-16 bg-gradient-to-r from-blue-50 to-red-50 
                  border-2 border-gray-200 rounded-lg cursor-pointer
                  ${isDragging ? 'border-blue-400 bg-blue-100' : 'hover:border-gray-300'}
                  ${!isPlayerReady ? 'opacity-50 cursor-not-allowed' : ''}
                  select-none touch-none
                `}
                style={{
                  background: isDragging 
                    ? 'linear-gradient(to right, #dbeafe 0%, #fef3c7 50%, #fecaca 100%)'
                    : 'linear-gradient(to right, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%)'
                }}
              >
                {/* 시각적 피드백 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      {isDragging ? '조절 중...' : '드래그하여 조절 • 클릭하여 재생/일시정지'}
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
                      <span>← 느리게</span>
                      <span>빠르게 →</span>
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-600 mt-1">
                      <span>↑ 볼륨 크게</span>
                      <span>볼륨 작게 ↓</span>
                    </div>
                  </div>
                </div>

                {/* 현재 값 표시 바 */}
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-200 opacity-30 transition-all duration-150"
                  style={{ width: `${((currentRate || 1.0) - minRate) / (maxRate - minRate) * 100}%` }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-full bg-green-200 opacity-30 transition-all duration-150"
                  style={{ height: `${volume || 100}%` }}
                />
              </div>
            </div>

            {/* 세부 컨트롤 바 */}
            {(uiSettings?.재생컨트롤?.볼륨 !== false || uiSettings?.재생컨트롤?.속도 !== false) && (
              <div className="flex items-center gap-1 overflow-x-auto">
                {uiSettings?.재생컨트롤?.볼륨 !== false && (
                  <>
                    {/* 볼륨 */}
                    <div className="flex flex-col items-center leading-none flex-shrink-0">
                      <span className="text-xs text-gray-500">볼</span>
                      <span className="text-xs text-gray-500">륨</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => {
                        const newVolume = Number(e.target.value);
                        setVolume(newVolume);
                        if (player) {
                          player.setVolume(newVolume);
                        }
                      }}
                      className="flex-1 h-3 min-w-[20px] max-w-[100px]"
                    />
                    <span className="text-xs text-gray-600 w-7 flex-shrink-0 text-right">{Math.round(volume || 100)}%</span>
                  </>
                )}
                
                {uiSettings?.재생컨트롤?.속도 !== false && (
                  <>
                    {/* 속도 */}
                    <div className="flex flex-col items-center leading-none flex-shrink-0 ml-1">
                      <span className="text-xs text-gray-500">속</span>
                      <span className="text-xs text-gray-500">도</span>
                    </div>
                    <input
                      type="range"
                      min="0.25"
                      max="2.0"
                      step="0.01"
                      value={playbackRate}
                      onChange={(e) => {
                        const newRate = Number(e.target.value);
                        setPlaybackRate(newRate);
                        setCurrentRate(newRate);
                        if (player) {
                          player.setPlaybackRate(newRate);
                        }
                      }}
                      className="flex-1 h-2 min-w-[20px] max-w-[100px]"
                    />
                    <span className="text-xs text-gray-600 w-10 flex-shrink-0 text-right">{playbackRate.toFixed(2)}x</span>
                  </>
                )}
                
                {/* 지속시간 입력 - 도장 설정과 연동 */}
                {uiSettings?.재생컨트롤?.도장 !== false && (
                  <>
                    <div className="flex flex-col items-center leading-none flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-500">지</span>
                      <span className="text-xs text-gray-500">속</span>
                    </div>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => {
                        const newDuration = Math.max(1, Math.min(60, Number(e.target.value) || 5));
                        setDuration(newDuration);
                      }}
                      onWheel={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const change = e.deltaY > 0 ? -1 : 1;
                        const newDuration = Math.max(1, Math.min(60, duration + change));
                        setDuration(newDuration);
                      }}
                      className="w-12 h-6 text-xs border rounded px-1 text-center flex-shrink-0"
                    />
                    <span className="text-xs text-gray-500 flex-shrink-0">초</span>
                  </>
                )}
                
                {/* 컨트롤 버튼들 - 개별 설정에 따라 표시 */}
                {uiSettings?.재생컨트롤?.녹화 !== false && (
                  <Button
                    onClick={녹화토글}
                    variant={녹화중 ? "outline" : "default"}
                    size="sm"
                    disabled={!currentVideoId}
                    className={`flex-shrink-0 ml-2 text-xs px-2 py-1 h-7 ${
                      녹화중 ? "border-red-500 text-red-600 bg-red-50" : ""
                    }`}
                  >
                    {녹화중 ? (
                      <>
                        <Square className="w-3 h-3 mr-1 fill-current" />
                        중단
                      </>
                    ) : (
                      <>
                        <Circle className="w-3 h-3 mr-1" />
                        녹화
                      </>
                    )}
                  </Button>
                )}

                {uiSettings?.재생컨트롤?.도장 !== false && (
                  <Button
                    onClick={addTimestamp}
                    disabled={!isPlayerReady}
                    size="sm"
                    variant="destructive"
                    className="flex-shrink-0 ml-1 text-xs px-2 py-1 h-7"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    도장
                  </Button>
                )}

                {uiSettings?.재생컨트롤?.편집 !== false && (
                  <Button
                    onClick={openTimestampModal}
                    disabled={!isPlayerReady}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 ml-1 text-xs px-2 py-1 h-7"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    편집
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col space-y-4">
          {/* 노트 영역 - UI 설정에 따라 조건부 렌더링 */}
          {uiSettings?.노트영역?.표시 !== false && (
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
                    <InfoIcon className="h-3 w-3 mr-1" /> 도장 형식: [HH:MM:SS.sss, 100%, 1.00x]
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

          {/* 오버레이 입력 */}
          {uiSettings?.화면텍스트?.패널표시 !== false && (
            <OverlayInput
              overlays={overlays || []}
              setOverlays={setOverlays}
              isPlayerReady={isPlayerReady}
              player={player}
              showNotification={showNotification}
              uiSettings={uiSettings}
              onSettingsChange={onSettingsChange}
            />
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
          duration={0} // duration은 player에서 직접 가져옴
          volume={currentVolume}
          playbackRate={currentPlaybackRate}
          onSave={addTimestampFromModal}
          showNotification={showNotification}
        />
      </CardContent>
    </Card>
  );
};

export default NoteArea;