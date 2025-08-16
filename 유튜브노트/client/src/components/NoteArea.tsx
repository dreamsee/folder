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
import { UISettings } from "./SettingsPanel";

// 녹화 관련 인터페이스
export interface RawTimestamp {
  id: string;
  time: number;          // 초.밀리초
  action: 'speed' | 'volume' | 'seek' | 'pause' | 'manual';
  value: number;         // 변경된 값
  previousValue: number; // 이전 값
  timestamp: Date;       // 생성 시각
}

export interface RecordingSession {
  id: string;
  title: string;
  videoId: string;
  duration: number;
  totalTimestamps: number;
  createdAt: Date;
  updatedAt: Date;
  rawTimestamps: RawTimestamp[];
}

// YT 전역 객체에 대한 타입 선언
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface NoteAreaProps {
  player: any | null; // YT.Player 대신 any 사용
  isPlayerReady: boolean;
  playerState: number;
  availableRates: number[];
  currentRate: number;
  setCurrentRate: React.Dispatch<React.SetStateAction<number>>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  isKeyboardVisible?: boolean;
  keyboardHeight?: number;
  currentVideoId: string;
  currentVideoInfo?: {
    title: string;
    channelName: string;
    thumbnailUrl: string;
  };
  timestamps: any[];
  setTimestamps: React.Dispatch<React.SetStateAction<any[]>>;
  overlays: OverlayData[];
  setOverlays: React.Dispatch<React.SetStateAction<OverlayData[]>>;
  onRecordingComplete?: (session: RecordingSession) => void; // 녹화 완료 콜백
  sessionToApply?: RecordingSession | null; // 적용할 세션
  recordingSessions: RecordingSession[];
  onEditRecordingSession: (session: RecordingSession) => void;
  onDeleteRecordingSession: (sessionId: string) => void;
  onCopyRecordingSession: (session: RecordingSession) => void;
  onApplyRecordingToNote: (session: RecordingSession) => void;
  uiSettings: UISettings;
  onSettingsChange?: (settings: UISettings) => void; // UI 설정 변경 콜백
}

const NoteArea: React.FC<NoteAreaProps> = ({
  player,
  isPlayerReady,
  playerState,
  currentRate = 1,
  setCurrentRate,
  showNotification,
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
  onSettingsChange,
}) => {
  const [noteText, setNoteText] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<"overlay" | "recording">("overlay"); // 우측 패널 모드
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [inputMode, setInputMode] = useState<'note' | 'overlay'>('note');
  
  // 녹화 관련 상태
  const [녹화중, set녹화중] = useState(false);
  const [녹화시작시간, set녹화시작시간] = useState<Date | null>(null);
  const [타임스탬프목록, set타임스탬프목록] = useState<RawTimestamp[]>([]);
  const [경과시간, set경과시간] = useState(0);
  
  // 이전 상태 추적을 위한 ref
  const 이전속도 = useRef(1);
  const 이전볼륨 = useRef(100);
  const 이전시간 = useRef(0);
  const 이전상태 = useRef(-1);
  
  // 타이머 ref
  const 타이머 = useRef<NodeJS.Timeout | null>(null);
  const [volume, setVolume] = useState(100); // 볼륨 상태 (0-100)
  const [playbackRate, setPlaybackRate] = useState(1.0); // 재생 속도 (0.25-2.0)
  const [duration, setDuration] = useState(5); // 지속시간 (초)
  const [activeTimestamps, setActiveTimestamps] = useState<any[]>([]); // 현재 활성 타임스탬프들
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startRate, setStartRate] = useState(1);
  const [startVolume, setStartVolume] = useState(100);
  const [defaultVolume, setDefaultVolume] = useState(100); // 기본 볼륨
  const [defaultPlaybackRate, setDefaultPlaybackRate] = useState(1.0); // 기본 속도
  const controlRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const [autoJumpChain, setAutoJumpChain] = useState<number[]>([]); // 자동 점프 체인 추적
  
  // 타임스탬프 독점 실행 관리
  const [activeTimestampId, setActiveTimestampId] = useState<number | null>(null);
  const [timestampStartMode, setTimestampStartMode] = useState<'natural' | 'jump' | null>(null);
  const [nextAllowedTimestampIndex, setNextAllowedTimestampIndex] = useState<number>(0); // 다음에 실행 가능한 타임스탬프 인덱스
  const [userSeekedTime, setUserSeekedTime] = useState<number | null>(null); // 사용자가 임의로 클릭한 시간
  const [executedTimestampIds, setExecutedTimestampIds] = useState<number[]>([]); // 실행된 타임스탬프 ID 순서
  
  
  // 영상 재시작 감지 - playerState 변화 감지
  useEffect(() => {
    if (!player || !isPlayerReady) return;
    
    // 영상이 끝났을 때
    if (playerState === 0) { // YT.PlayerState.ENDED
      // 다시보기를 위해 실행 기록 초기화
      setExecutedTimestampIds([]);
      setActiveTimestampId(null);
      setTimestampStartMode(null);
      setNextAllowedTimestampIndex(0);
      // setUsedTimestamps(new Set()); // 제거됨
      setAutoJumpChain([]);
      console.log("영상 종료: 타임스탬프 실행 기록 초기화");
    }
    
    // 영상이 재생 중이고 시간이 처음으로 돌아간 경우
    if (playerState === 1) { // YT.PlayerState.PLAYING
      try {
        const currentTime = player.getCurrentTime();
        if (currentTime < 2) { // 처음 2초 이내면 재시작으로 간주
          setExecutedTimestampIds([]);
          setActiveTimestampId(null);
          setTimestampStartMode(null);
          setNextAllowedTimestampIndex(0);
          // setUsedTimestamps(new Set()); // 제거됨
          setAutoJumpChain([]);
          console.log("영상 재시작: 타임스탬프 실행 기록 초기화");
        }
      } catch (error) {
        console.error('시간 확인 오류:', error);
      }
    }
  }, [playerState, player, isPlayerReady]);



  // 재생 속도 범위
  const minRate = 0.25;
  const maxRate = 2.0;

  // 녹화 시작
  const 녹화시작하기 = () => {
    if (!player || !isPlayerReady || !currentVideoId) {
      showNotification("먼저 동영상을 로드하세요.", "warning");
      return;
    }

    set녹화중(true);
    set녹화시작시간(new Date());
    set타임스탬프목록([]);
    set경과시간(0);
    
    // 초기 상태 저장
    이전속도.current = player.getPlaybackRate();
    이전볼륨.current = player.getVolume();
    이전시간.current = player.getCurrentTime();
    이전상태.current = player.getPlayerState();
    
    // 경과시간 타이머 시작
    타이머.current = setInterval(() => {
      set경과시간(prev => prev + 0.1);
    }, 100);
    
    showNotification("녹화를 시작했습니다. 영상을 조작하면 자동으로 타임스탬프가 생성됩니다.", "info");
  };

  // 녹화 종료
  const 녹화종료하기 = () => {
    if (!녹화중) return;
    
    set녹화중(false);
    
    if (타이머.current) {
      clearInterval(타이머.current);
      타이머.current = null;
    }
    
    // 녹화 세션 생성
    const 세션: RecordingSession = {
      id: `rec-${Date.now()}`,
      title: `녹화 세션 - ${new Date().toLocaleString('ko-KR')}`,
      videoId: currentVideoId,
      duration: player.getDuration(),
      totalTimestamps: 타임스탬프목록.length,
      createdAt: 녹화시작시간!,
      updatedAt: new Date(),
      rawTimestamps: 타임스탬프목록
    };
    
    // 녹화 세션을 세션 목록에만 저장 (자동 노트 삽입 제거)
    
    if (onRecordingComplete) {
      onRecordingComplete(세션);
    }
    showNotification(`녹화를 종료했습니다. ${타임스탬프목록.length}개의 타임스탬프가 녹화 세션에 저장되었습니다.`, "success");
  };

  // 수동 타임스탬프 추가
  const 수동타임스탬프추가 = () => {
    if (!녹화중 || !player) return;
    
    const 현재시간 = player.getCurrentTime();
    const 새타임스탬프: RawTimestamp = {
      id: `ts-${Date.now()}`,
      time: 현재시간,
      action: 'manual',
      value: 현재시간,
      previousValue: 현재시간,
      timestamp: new Date()
    };
    
    set타임스탬프목록(prev => [...prev, 새타임스탬프]);
    showNotification(`타임스탬프 추가: ${현재시간.toFixed(3)}초`, "info");
  };

  // 시간 포맷팅 함수

  // 정확한 종료시간 계산 (다음 타임스탬프 기준)
  const 정확한종료시간계산 = (현재시간: number, 타임스탬프목록: RawTimestamp[]): number => {
    // 시간순으로 정렬된 타임스탬프에서 현재 시간 이후의 첫 번째 찾기
    const 정렬된목록 = [...타임스탬프목록].sort((a, b) => a.time - b.time);
    const 다음타임스탬프 = 정렬된목록.find(ts => ts.time > 현재시간);
    
    if (다음타임스탬프) {
      // 다음 타임스탬프 시간을 종료시간으로 사용
      return 다음타임스탬프.time;
    }
    
    // 다음 타임스탬프가 없으면 현재시간 + 3초
    return 현재시간 + 3;
  };

  // RawTimestamp를 노트 타임스탬프로 변환 (정확한 종료시간 적용)
  const rawTimestamp를노트로변환 = (raw: RawTimestamp, 타임스탬프목록: RawTimestamp[] = []): string => {
    const timeFormatted = formatTime(raw.time);
    const endTime = 정확한종료시간계산(raw.time, 타임스탬프목록);
    const endTimeFormatted = formatTime(endTime);
    
    switch(raw.action) {
      case 'volume':
        return `[${timeFormatted}-${endTimeFormatted}, ${Math.round(raw.value)}%, 1.00x] 🔊 볼륨 ${Math.round(raw.previousValue)}% ➜ ${Math.round(raw.value)}%`;
      case 'speed':  
        return `[${timeFormatted}-${endTimeFormatted}, 100%, ${raw.value.toFixed(2)}x] ⚡ 속도 ${raw.previousValue.toFixed(2)}x ➜ ${raw.value.toFixed(2)}x`;
      case 'seek':
        return `[${timeFormatted}-${endTimeFormatted}, 100%, 1.00x] 🔄 점프 ${formatTime(raw.previousValue)} ➜ ${formatTime(raw.value)}`;
      case 'pause':
        return `[${timeFormatted}-${endTimeFormatted}, 100%, 1.00x] ⏸️ 일시정지`;
      case 'manual':
        return `[${timeFormatted}-${endTimeFormatted}, 100%, 1.00x] 📍 수동 마킹`;
      default:
        return `[${timeFormatted}-${endTimeFormatted}, 100%, 1.00x] ❓ ${raw.action}`;
    }
  };

  // 녹화 세션을 노트 텍스트로 변환 (접을 수 있는 카드 형태)
  const 녹화세션을노트로변환 = (session: RecordingSession): string => {
    if (!session.rawTimestamps || session.rawTimestamps.length === 0) {
      return `\n## 📹 녹화 세션: ${session.title}\n(타임스탬프 없음)\n\n`;
    }

    // 시간 순으로 정렬
    const 정렬된타임스탬프 = [...session.rawTimestamps].sort((a, b) => a.time - b.time);
    
    // 액션별 개수 계산
    const 액션별개수 = 정렬된타임스탬프.reduce((acc, ts) => {
      acc[ts.action] = (acc[ts.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    
    // 텍스트창 호환 형태로 변경 (제목과 타임스탬프만 포함)
    let 노트텍스트 = `\n━━━ 📹 ${session.title} ━━━\n\n`;
    
    // 타임스탬프들을 그룹화 (시간 간격 기준)
    const 그룹화된타임스탬프 = 타임스탬프그룹화(정렬된타임스탬프);
    
    그룹화된타임스탬프.forEach((그룹, groupIndex) => {
      if (그룹.length > 1) {
        // 그룹이 여러 개면 소제목 추가
        const 시작시간 = formatTime(그룹[0].time);
        const 종료시간 = formatTime(그룹[그룹.length - 1].time);
        노트텍스트 += `🎬 구간 ${groupIndex + 1}: ${시작시간} - ${종료시간}\n`;
      }
      
      그룹.forEach((timestamp, index) => {
        노트텍스트 += `${rawTimestamp를노트로변환(timestamp, session.rawTimestamps)}\n`;
        if (index < 그룹.length - 1) {
          노트텍스트 += '\n';
        }
      });
      
      if (groupIndex < 그룹화된타임스탬프.length - 1) {
        노트텍스트 += '\n---\n\n';
      }
    });
    
    return 노트텍스트;
  };

  // 타임스탬프를 시간 간격으로 그룹화하는 함수
  const 타임스탬프그룹화 = (timestamps: RawTimestamp[]): RawTimestamp[][] => {
    if (timestamps.length === 0) return [];
    
    const 그룹들: RawTimestamp[][] = [];
    let 현재그룹: RawTimestamp[] = [timestamps[0]];
    const 그룹간격 = 30; // 30초 간격으로 그룹화
    
    for (let i = 1; i < timestamps.length; i++) {
      const 이전시간 = timestamps[i - 1].time;
      const 현재시간 = timestamps[i].time;
      
      if (현재시간 - 이전시간 <= 그룹간격) {
        // 같은 그룹에 추가
        현재그룹.push(timestamps[i]);
      } else {
        // 새로운 그룹 시작
        그룹들.push(현재그룹);
        현재그룹 = [timestamps[i]];
      }
    }
    
    // 마지막 그룹 추가
    그룹들.push(현재그룹);
    
    return 그룹들;
  };

  // 외부에서 녹화세션을 노트에 적용하는 함수
  const 외부세션을노트에적용 = (session: RecordingSession) => {
    console.log("외부세션을노트에적용 호출됨:", session);
    
    if (!textareaRef.current) {
      console.error("textareaRef가 없습니다");
      showNotification("노트 영역을 찾을 수 없습니다.", "error");
      return;
    }
    
    if (!session.rawTimestamps || session.rawTimestamps.length === 0) {
      console.warn("녹화 세션에 타임스탬프가 없습니다");
      showNotification("녹화 세션에 타임스탬프가 없습니다.", "warning");
      return;
    }
    
    const 변환된노트텍스트 = 녹화세션을노트로변환(session);
    console.log("변환된 노트 텍스트:", 변환된노트텍스트);
    
    // noteTextRef.current를 사용하여 최신 텍스트 가져오기
    const 현재노트텍스트 = noteTextRef.current || noteText || "";
    console.log("현재 노트 텍스트 길이:", 현재노트텍스트.length);
    
    const 현재커서위치 = textareaRef.current.selectionStart || 0;
    const 새로운텍스트 = 현재노트텍스트.substring(0, 현재커서위치) + 변환된노트텍스트 + 현재노트텍스트.substring(현재커서위치);
    
    console.log("새로운 텍스트 길이:", 새로운텍스트.length);
    setNoteText(새로운텍스트);
    
    // 커서 위치를 삽입된 텍스트 끝으로 이동
    setTimeout(() => {
      if (textareaRef.current) {
        const 새커서위치 = 현재커서위치 + 변환된노트텍스트.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(새커서위치, 새커서위치);
      }
    }, 0);
    
    // 즉시 저장
    setTimeout(() => {
      saveNote(새로운텍스트);
    }, 100);
    
    const 타임스탬프개수 = session.rawTimestamps?.length || 0;
    showNotification(`녹화 세션이 노트에 적용되었습니다. ${타임스탬프개수}개 타임스탬프가 추가되었습니다.`, "success");
  };

  // 텍스트에서 타임스탬프 파싱 함수 (소수점 3자리까지 지원, 동작모드 포함)
  const parseTimestampsFromText = (noteText: string) => {
    // 동작 모드까지 포함한 패턴: [HH:MM:SS.sss-HH:MM:SS.sss, volume%, speedx, action]
    const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
    const parsedTimestamps: any[] = [];
    let match;
    
    while ((match = timestampRegex.exec(noteText)) !== null) {
      const startHour = parseInt(match[1]);
      const startMin = parseInt(match[2]);
      const startSec = parseFloat(match[3]); // 소수점 지원
      const endHour = parseInt(match[4]);
      const endMin = parseInt(match[5]);
      const endSec = parseFloat(match[6]); // 소수점 지원
      const volume = parseInt(match[7]);
      const playbackRate = parseFloat(match[8]);
      const actionMode = match[9]; // 동작 모드: '->', '|숫자', undefined
      
      const startTime = startHour * 3600 + startMin * 60 + startSec;
      const endTime = endHour * 3600 + endMin * 60 + endSec;
      
      // 동작 모드 파싱
      let jumpMode = 'natural'; // 기본값: 자연재생
      let pauseDuration = 0;
      
      if (actionMode === '->') {
        jumpMode = 'jump'; // 자동점프
      } else if (actionMode && actionMode.startsWith('|')) {
        jumpMode = 'pause'; // 정지재생
        pauseDuration = parseInt(actionMode.substring(1)) || 3; // 기본 3초
      }
      
      if (startTime < endTime && volume >= 0 && volume <= 100 && playbackRate >= 0.25 && playbackRate <= 2.0) {
        parsedTimestamps.push({
          startTime,
          endTime,
          volume,
          playbackRate,
          jumpMode, // 동작 모드 추가
          pauseDuration, // 정지 시간 추가
          content: match[0], // 원본 타임스탬프 텍스트
          sessionId: currentSessionId || 0
        });
      }
    }
    
    return parsedTimestamps;
  };

  // 텍스트 순서 기반 타임스탬프 우선순위 파싱
  const parseTimestampPriority = (noteText: string) => {
    // 동작 모드까지 포함한 패턴
    const timestampRegex = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
    const timestampOrder: { 
      startTime: number; 
      endTime: number; 
      priority: number; 
      match: string;
      textIndex: number; // 텍스트에서의 위치
      volume: number;
      playbackRate: number;
      jumpMode: string; // 동작 모드 추가
      pauseDuration: number; // 정지 시간 추가
    }[] = [];
    let match;
    let priority = 0;

    while ((match = timestampRegex.exec(noteText)) !== null) {
      const startHour = parseInt(match[1]);
      const startMin = parseInt(match[2]);
      const startSec = parseFloat(match[3]); // 소수점 지원
      const endHour = parseInt(match[4]);
      const endMin = parseInt(match[5]);
      const endSec = parseFloat(match[6]); // 소수점 지원
      const volume = parseInt(match[7]);
      const playbackRate = parseFloat(match[8]);
      const actionMode = match[9]; // 동작 모드
      
      const startTime = startHour * 3600 + startMin * 60 + startSec;
      const endTime = endHour * 3600 + endMin * 60 + endSec;
      
      // 동작 모드 파싱
      let jumpMode = 'natural';
      let pauseDuration = 0;
      
      if (actionMode === '->') {
        jumpMode = 'jump';
      } else if (actionMode && actionMode.startsWith('|')) {
        jumpMode = 'pause';
        pauseDuration = parseInt(actionMode.substring(1)) || 3;
      }
      
      timestampOrder.push({
        startTime,
        endTime,
        priority,
        match: match[0],
        textIndex: match.index, // 텍스트에서의 위치 저장
        volume,
        playbackRate,
        jumpMode, // 동작 모드 추가
        pauseDuration // 정지 시간 추가
      });
      priority++;
    }
    
    return timestampOrder;
  };

  // 사용자가 더블클릭으로 타임스탬프 활성화
  const activateTimestampByClick = (timestamp: any) => {
    if (!player || !isPlayerReady) return;
    
    // 해당 시간으로 점프
    player.seekTo(timestamp.timeInSeconds, true);
    
    // 독점 모드로 설정
    setActiveTimestampId(timestamp.id);
    setTimestampStartMode('jump');
    
    // 텍스트 순서에서 현재 위치 찾기
    const priorityOrder = parseTimestampPriority(noteText);
    const currentIndex = priorityOrder.findIndex(item => 
      Math.abs(item.startTime - timestamp.timeInSeconds) < 1
    );
    
    if (currentIndex !== -1) {
      setNextAllowedTimestampIndex(currentIndex + 1);
    }
    
    // 진행 상황 표시 (점프 실행)
    const totalTimestamps = priorityOrder.length;
    const currentPosition = currentIndex !== -1 ? currentIndex + 1 : '?';
    showNotification(`타임스탬프 점프 (${currentPosition}/${totalTimestamps}) ${formatTime(timestamp.timeInSeconds)}`, "info");
  };

  // 영상 정보 저장 뮤테이션
  const saveVideoMutation = useMutation({
    mutationFn: async (videoData: any) => {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
      });
      return response.json();
    },
  });

  // 노트 세션 생성 뮤테이션
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch("/api/note-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });
      return response.json();
    },
    onSuccess: async (data) => {
      setCurrentSessionId(data.id);
      // 새 세션의 타임스탬프 가져오기
      try {
        const response = await fetch(`/api/timestamps?sessionId=${data.id}`);
        if (response.ok) {
          const timestampsData = await response.json();
          setTimestamps(timestampsData);
        }
      } catch (error) {
        console.error("타임스탬프 로드 중 오류:", error);
      }
    },
  });

  // 노트 세션 업데이트 뮤테이션
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/note-sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      // setLastSaveTime(new Date()); // 제거됨
      // setIsSaving(false); // 제거됨
    },
  });


  // 현재 세션의 타임스탬프들 조회
  const { data: sessionTimestamps } = useQuery({
    queryKey: ['/api/timestamps', currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return [];
      const response = await fetch(`/api/timestamps?sessionId=${currentSessionId}`);
      return response.json();
    },
    enabled: !!currentSessionId,
  });

  // 타임스탬프 데이터가 로드되면 상위 컴포넌트 상태 업데이트
  useEffect(() => {
    if (sessionTimestamps) {
      setTimestamps(sessionTimestamps);
    }
  }, [sessionTimestamps, setTimestamps]);

  // 텍스트 기반 DB 동기화 - 텍스트가 진실의 원천
  useEffect(() => {
    if (!currentSessionId || !noteText) return;

    const timeoutId = setTimeout(async () => {
      // 텍스트에서 타임스탬프 파싱
      const parsedTimestamps = parseTimestampsFromText(noteText);
      
      // 기존 DB의 모든 타임스탬프 삭제
      if (sessionTimestamps && sessionTimestamps.length > 0) {
        // 모든 삭제 요청을 동시에 처리
        await Promise.all(
          sessionTimestamps.map((ts: any) => 
            fetch(`/api/timestamps/${ts.id}`, { method: 'DELETE' })
          )
        );
      }

      // 텍스트 순서대로 새로운 타임스탬프 생성
      if (parsedTimestamps.length > 0) {
        // 모든 생성 요청을 순서대로 처리
        for (let i = 0; i < parsedTimestamps.length; i++) {
          const parsed = parsedTimestamps[i];
          await fetch('/api/timestamps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentSessionId,
              timeInSeconds: parsed.startTime,
              timeFormatted: formatTime(parsed.startTime),
              duration: parsed.endTime - parsed.startTime,
              volume: parsed.volume,
              playbackRate: parsed.playbackRate,
              memo: parsed.content || ''
            })
          });
        }
      }

      // 쿼리 캐시 무효화로 UI 업데이트
      queryClient.invalidateQueries({ queryKey: ['/api/timestamps'] });
      
      // 로컬 상태도 즉시 업데이트
      const newTimestamps = await fetch(`/api/timestamps?sessionId=${currentSessionId}`)
        .then(res => res.json())
        .catch(err => {
          console.error("타임스탬프 로드 중 오류:", err);
          return [];
        });
      
      setTimestamps(newTimestamps);
      
    }, 1500); // 1.5초 디바운스 - 타이핑이 끝날 때까지 대기

    return () => clearTimeout(timeoutId);
  }, [noteText, currentSessionId]);

  // 노트 텍스트에서 긴 소수점 속도값을 정리하는 함수
  const cleanupSpeedInText = (text: string): string => {
    return text.replace(
      /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g,
      (match, h1, m1, s1, h2, m2, s2, vol, speed, action) => {
        const roundedSpeed = (Math.round(parseFloat(speed) * 100) / 100).toFixed(2);
        const actionPart = action ? `, ${action}` : '';
        return `[${h1}:${m1}:${s1}-${h2}:${m2}:${s2}, ${vol}%, ${roundedSpeed}x${actionPart}]`;
      }
    );
  };

  // 텍스트 기반 동기화로 이 함수도 더 이상 필요 없음
  // 텍스트를 수정하면 자동으로 DB가 업데이트됨

  // 텍스트 기반 동기화로 이 로직은 더 이상 필요 없음
  // 위의 텍스트 기반 DB 동기화 useEffect에서 자동으로 처리됨

  // 사용자의 seek 동작 감지
  useEffect(() => {
    if (!player || !isPlayerReady) return;
    
    let lastTime = 0;
    let isJumpSeek = false; // 타임스탬프 점프인지 구분
    
    const seekCheckInterval = setInterval(() => {
      try {
        const currentTime = player.getCurrentTime();
        // 시간이 1초 이상 점프했을 때 seek로 간주
        if (Math.abs(currentTime - lastTime) > 1.5 || (lastTime > 10 && currentTime < 2)) {
          // 타임스탬프 점프가 아닌 경우에만 인덱스 재설정
          if (!isJumpSeek) {
            setUserSeekedTime(currentTime);
            
            // seek 후 실행 기록 초기화 및 다음 타임스탬프 찾기
            const priorityOrder = parseTimestampPriority(noteText);
            
            // 현재 시간 이전의 타임스탬프들은 실행된 것으로 표시
            const executedIds: number[] = [];
            for (let i = 0; i < priorityOrder.length; i++) {
              if (priorityOrder[i].startTime < currentTime) {
                // 해당 타임스탬프의 ID를 찾아서 실행된 것으로 표시
                const ts = timestamps.find(t => 
                  Math.abs(t.timeInSeconds - priorityOrder[i].startTime) < 1 &&
                  Math.abs((t.volume || 100) - priorityOrder[i].volume) < 1 &&
                  Math.abs((t.playbackRate || 1.0) - priorityOrder[i].playbackRate) < 0.01
                );
                if (ts) {
                  executedIds.push(ts.id);
                }
              }
            }
            
            setExecutedTimestampIds(executedIds);
            setActiveTimestampId(null);
            setTimestampStartMode(null);
            // setUsedTimestamps(new Set()); // 제거됨
            setAutoJumpChain([]);
          }
          isJumpSeek = false; // 리셋
        }
        lastTime = currentTime;
      } catch (error) {
        console.error('Seek 감지 오류:', error);
      }
    }, 500);
    
    // 타임스탬프 점프 시 플래그 설정을 위한 리스너
    const handleJumpSeek = () => { isJumpSeek = true; };
    window.addEventListener('timestampJump', handleJumpSeek);
    
    return () => {
      clearInterval(seekCheckInterval);
      window.removeEventListener('timestampJump', handleJumpSeek);
    };
  }, [player, isPlayerReady, noteText, timestamps]);

  // 실시간 타임스탬프 구간 모니터링
  useEffect(() => {
    if (!player || !isPlayerReady || timestamps.length === 0) return;

    const interval = setInterval(() => {
      try {
        const currentTime = player.getCurrentTime();
        
        // 텍스트 순서 기반 우선순위 시스템
        const priorityOrder = parseTimestampPriority(noteText);
        
        // 예측 실행은 제거 - 짧은 구간에서 문제 발생
        
        // 현재 시간에 해당하는 모든 타임스탬프 찾기
        let candidateTimestamps = timestamps.filter(ts => {
          const startTime = ts.timeInSeconds;
          const endTime = startTime + (ts.duration || 5);
          return currentTime >= startTime && currentTime <= endTime;
        });

        // 텍스트 순서에 따라 우선순위 정렬 (텍스트 위치 기반)
        candidateTimestamps = candidateTimestamps.sort((a, b) => {
          // 각 타임스탬프와 매칭되는 텍스트 위치 찾기
          const aMatch = priorityOrder.find(item => 
            Math.abs(item.startTime - a.timeInSeconds) < 1 &&
            Math.abs(item.volume - (a.volume || 100)) < 1 &&
            Math.abs(item.playbackRate - (a.playbackRate || 1.0)) < 0.01
          );
          const bMatch = priorityOrder.find(item => 
            Math.abs(item.startTime - b.timeInSeconds) < 1 &&
            Math.abs(item.volume - (b.volume || 100)) < 1 &&
            Math.abs(item.playbackRate - (b.playbackRate || 1.0)) < 0.01
          );
          
          const aPriority = aMatch ? aMatch.priority : 999;
          const bPriority = bMatch ? bMatch.priority : 999;
          return aPriority - bPriority;
        });

        // 독점 시스템 및 텍스트 순서 기반 배타성
        let activeNow: any[] = [];
        let shouldCheckNextJump = false;
        let endedTimestamp: any = null;
        
        if (activeTimestampId !== null) {
          const exclusiveTimestamp = timestamps.find(ts => ts.id === activeTimestampId);
          if (exclusiveTimestamp) {
            const startTime = exclusiveTimestamp.timeInSeconds;
            const endTime = startTime + (exclusiveTimestamp.duration || 5);
            
            // 독점 타임스탬프가 여전히 활성 범위 내인 경우
            if (currentTime >= startTime && currentTime <= endTime) {
              activeNow = [exclusiveTimestamp]; // 독점 타임스탬프만 활성화
            } else {
              // 독점 타임스탬프가 종료됨
              endedTimestamp = exclusiveTimestamp;
              shouldCheckNextJump = true;
              
              // 실행된 타임스탬프로 기록 (아직 기록되지 않았다면)
              if (!executedTimestampIds.includes(exclusiveTimestamp.id)) {
                setExecutedTimestampIds(prev => [...prev, exclusiveTimestamp.id]);
              }
              
              setActiveTimestampId(null);
              setTimestampStartMode(null);
              activeNow = []; // 자연 재생으로 전환
            }
          }
        } else {
          // 독점 상태가 아닐 때, 실행되지 않은 타임스탬프 중 텍스트 순서가 가장 빠른 것 찾기
          const unexecutedTimestamps = candidateTimestamps.filter(ts => 
            !executedTimestampIds.includes(ts.id)
          );
          
          if (unexecutedTimestamps.length > 0) {
            // 텍스트 순서에서 가장 앞에 있는 타임스탬프 찾기
            const candidate = unexecutedTimestamps.sort((a, b) => {
              const aMatch = priorityOrder.find(item => 
                Math.abs(item.startTime - a.timeInSeconds) < 1 &&
                Math.abs(item.volume - (a.volume || 100)) < 1 &&
                Math.abs(item.playbackRate - (a.playbackRate || 1.0)) < 0.01
              );
              const bMatch = priorityOrder.find(item => 
                Math.abs(item.startTime - b.timeInSeconds) < 1 &&
                Math.abs(item.volume - (b.volume || 100)) < 1 &&
                Math.abs(item.playbackRate - (b.playbackRate || 1.0)) < 0.01
              );
              
              const aPriority = aMatch ? aMatch.priority : 999;
              const bPriority = bMatch ? bMatch.priority : 999;
              return aPriority - bPriority;
            })[0];
            
            if (candidate && Math.abs(currentTime - candidate.timeInSeconds) < 0.5) {
              // 타임스탬프 활성화
              setActiveTimestampId(candidate.id);
              setTimestampStartMode('natural');
              activeNow = [candidate];
              
              // 텍스트 순서에서 현재 타임스탬프의 위치 찾기
              const candidateIndex = priorityOrder.findIndex(item => 
                Math.abs(item.startTime - candidate.timeInSeconds) < 1 &&
                Math.abs(item.volume - (candidate.volume || 100)) < 1 &&
                Math.abs(item.playbackRate - (candidate.playbackRate || 1.0)) < 0.01
              );
              
              // 진행 상황 표시 (현재/전체)
              const totalTimestamps = priorityOrder.length;
              const currentPosition = candidateIndex + 1;
              showNotification(`타임스탬프 실행 (${currentPosition}/${totalTimestamps}) ${formatTime(candidate.timeInSeconds)}`, "info");
              
              // 이전 타임스탬프들을 모두 실행된 것으로 표시 (배타적 실행 보장)
              if (candidateIndex > 0) {
                const previousIds: number[] = [];
                for (let i = 0; i < candidateIndex; i++) {
                  const ts = timestamps.find(t => 
                    Math.abs(t.timeInSeconds - priorityOrder[i].startTime) < 1 &&
                    Math.abs((t.volume || 100) - priorityOrder[i].volume) < 1 &&
                    Math.abs((t.playbackRate || 1.0) - priorityOrder[i].playbackRate) < 0.01
                  );
                  if (ts && !executedTimestampIds.includes(ts.id)) {
                    previousIds.push(ts.id);
                  }
                }
                setExecutedTimestampIds(prev => [...prev, ...previousIds, candidate.id]);
              } else {
                // 첫 번째 타임스탬프인 경우
                setExecutedTimestampIds(prev => [...prev, candidate.id]);
              }
            }
          }
        }

        // 타임스탬프가 종료되었을 때 다음 점프 확인
        if (shouldCheckNextJump && endedTimestamp) {
          // 짧은 구간(3초 미만)의 타임스탬프는 최소 실행 시간 보장
          const duration = endedTimestamp.duration || 5;
          const elapsedTime = currentTime - endedTimestamp.timeInSeconds;
          
          if (duration < 3 && elapsedTime < 0.8) {
            // 최소 0.8초는 실행되도록 보장
            shouldCheckNextJump = false;
            // 타임스탬프를 다시 활성화 상태로 유지
            setActiveTimestampId(endedTimestamp.id);
            activeNow = [endedTimestamp];
          } else {
            // 텍스트 순서에서 현재 타임스탬프의 위치 찾기
            const currentIndex = priorityOrder.findIndex(item => 
              Math.abs(item.startTime - endedTimestamp.timeInSeconds) < 1 &&
              Math.abs(item.volume - (endedTimestamp.volume || 100)) < 1 &&
              Math.abs(item.playbackRate - (endedTimestamp.playbackRate || 1.0)) < 0.01
            );
          
          if (currentIndex !== -1) {
            const currentTimestamp = priorityOrder[currentIndex];
            
            // 현재 타임스탬프의 동작 모드에 따라 처리
            if (currentTimestamp.jumpMode === 'jump' && currentIndex + 1 < priorityOrder.length) {
              // 자동 점프 모드 (->)
              const nextTimestamp = priorityOrder[currentIndex + 1];
              const nextTarget = timestamps.find(ts => 
                Math.abs(ts.timeInSeconds - nextTimestamp.startTime) < 1 &&
                Math.abs((ts.volume || 100) - nextTimestamp.volume) < 1 &&
                Math.abs((ts.playbackRate || 1.0) - nextTimestamp.playbackRate) < 0.01
              );
              
              if (nextTarget) {
                // 먼저 기본 설정으로 복원 (시간 역행 점프에서도 설정 복원)
                player.setVolume(defaultVolume);
                player.setPlaybackRate(defaultPlaybackRate);
                setCurrentRate(defaultPlaybackRate);
                setVolume(defaultVolume);
                
                // 점프 전에 미리 설정 적용 (버퍼링 대비)
                if (nextTarget.volume !== undefined) {
                  player.setVolume(nextTarget.volume);
                  setVolume(nextTarget.volume);
                }
                if (nextTarget.playbackRate !== undefined) {
                  player.setPlaybackRate(nextTarget.playbackRate);
                  setCurrentRate(nextTarget.playbackRate);
                  setPlaybackRate(nextTarget.playbackRate);
                }
                
                // 타임스탬프 점프 이벤트 발생
                window.dispatchEvent(new Event('timestampJump'));
                
                // 그 다음 점프 실행
                player.seekTo(nextTarget.timeInSeconds, true);
                setActiveTimestampId(nextTarget.id);
                setTimestampStartMode('jump');
                
                // 진행 상황 표시 (-> 자동 점프)
                const totalTimestamps = priorityOrder.length;
                const nextPosition = currentIndex + 2; // 다음 타임스탬프로 점프
                showNotification(`타임스탬프 자동점프 (${nextPosition}/${totalTimestamps}) ${formatTime(nextTarget.timeInSeconds)}`, "info");
                
                // 이전 타임스탬프들을 모두 실행된 것으로 표시
                const nextIndex = priorityOrder.findIndex(item => 
                  Math.abs(item.startTime - nextTarget.timeInSeconds) < 1
                );
                if (nextIndex > 0) {
                  const previousIds: number[] = [];
                  for (let i = 0; i < nextIndex; i++) {
                    const ts = timestamps.find(t => 
                      Math.abs(t.timeInSeconds - priorityOrder[i].startTime) < 1 &&
                      Math.abs((t.volume || 100) - priorityOrder[i].volume) < 1 &&
                      Math.abs((t.playbackRate || 1.0) - priorityOrder[i].playbackRate) < 0.01
                    );
                    if (ts && !executedTimestampIds.includes(ts.id)) {
                      previousIds.push(ts.id);
                    }
                  }
                  if (previousIds.length > 0) {
                    setExecutedTimestampIds(prev => [...prev, ...previousIds]);
                  }
                }
                
                // 점프한 타임스탬프를 실행된 것으로 표시
                if (!executedTimestampIds.includes(nextTarget.id)) {
                  setExecutedTimestampIds(prev => [...prev, nextTarget.id]);
                }
                
                // 점프 후 다음 설정 즉시 적용
                activeNow = [nextTarget];
                
                // 진행 상황 표시 (-> 자동 점프 - 점프 완료)
                const jumpedPosition = currentIndex + 2; // 다음 타임스탬프로 점프 완료
                showNotification(`자동점프 완료 (${jumpedPosition}/${totalTimestamps}) ${formatTime(nextTarget.timeInSeconds)}`, "info");
              } else {
                // 다음 타임스탬프를 찾을 수 없는 경우 - 기본 설정으로 복원
                player.setVolume(defaultVolume);
                player.setPlaybackRate(defaultPlaybackRate);
                setCurrentRate(defaultPlaybackRate);
                setVolume(defaultVolume);
              }
            } else if (currentTimestamp.jumpMode === 'pause') {
              // 정지 재생 모드 (|숫자)
              const pauseSeconds = currentTimestamp.pauseDuration || 3;
              
              // 먼저 기본 설정으로 복원
              player.setVolume(defaultVolume);
              player.setPlaybackRate(defaultPlaybackRate);
              setCurrentRate(defaultPlaybackRate);
              setVolume(defaultVolume);
              
              // 영상을 일시정지
              player.pauseVideo();
              
              // 지정된 시간 후 재생 재개
              setTimeout(() => {
                try {
                  if (player && typeof player.playVideo === 'function') {
                    player.playVideo();
                    showNotification(`${pauseSeconds}초 정지 후 재생 재개`, "info");
                  }
                } catch (error) {
                  console.error('재생 재개 오류:', error);
                }
              }, pauseSeconds * 1000);
              
              showNotification(`${pauseSeconds}초간 정지 후 재생 재개 예정`, "info");
            } else {
              // 자연 재생 모드 (기본) - 기본 설정으로 복원만
              player.setVolume(defaultVolume);
              player.setPlaybackRate(defaultPlaybackRate);
              setCurrentRate(defaultPlaybackRate);
              setVolume(defaultVolume);
            }
          } else {
            // 타임스탬프를 찾을 수 없는 경우 - 기본 설정으로 복원
            player.setVolume(defaultVolume);
            player.setPlaybackRate(defaultPlaybackRate);
            setCurrentRate(defaultPlaybackRate);
            setVolume(defaultVolume);
          }
          }
        }

        // 활성 타임스탬프 설정 적용 (독점 모드일 때만)
        if (activeNow.length > 0) {
          const currentTimestamp = activeNow[0];
          
          // 볼륨과 속도 설정 적용 (현재 값과 다를 때만)
          if (currentTimestamp.volume !== undefined && Math.abs(player.getVolume() - currentTimestamp.volume) > 1) {
            player.setVolume(currentTimestamp.volume);
            setVolume(currentTimestamp.volume);
          }
          
          if (currentTimestamp.playbackRate !== undefined && Math.abs(player.getPlaybackRate() - currentTimestamp.playbackRate) > 0.01) {
            player.setPlaybackRate(currentTimestamp.playbackRate);
            setCurrentRate(currentTimestamp.playbackRate);
            setPlaybackRate(currentTimestamp.playbackRate);
          }
        } else if (activeTimestamps.length > 0 && activeNow.length === 0) {
          // 타임스탬프가 방금 종료됨 - 기본 설정으로 복원
          player.setVolume(defaultVolume);
          player.setPlaybackRate(defaultPlaybackRate);
          setCurrentRate(defaultPlaybackRate);
          setVolume(defaultVolume);
          setPlaybackRate(defaultPlaybackRate);
        }

        setActiveTimestamps(activeNow);
        
        // 드래그 패널 볼륨 값 동기화
        if (activeNow.length > 0) {
          const latestTimestamp = activeNow[activeNow.length - 1];
          if (latestTimestamp?.volume !== undefined) {
            setVolume(latestTimestamp.volume);
          }
        }
      } catch (error) {
        console.error('타임스탬프 모니터링 오류:', error);
      }
    }, 100); // 100ms마다 확인

    return () => clearInterval(interval);
  }, [player, isPlayerReady, timestamps, activeTimestamps, setCurrentRate, activeTimestampId, noteText, defaultVolume, defaultPlaybackRate, autoJumpChain, nextAllowedTimestampIndex, executedTimestampIds, volume, playbackRate]);

  // 녹화 중 YouTube Player 이벤트 감지
  useEffect(() => {
    if (!player || !녹화중) return;

    // 재생 속도 변경 감지 (중복 방지 로직 추가)
    let 마지막속도변경시간 = 0;
    const 속도감지인터벌 = setInterval(() => {
      const 현재속도 = player.getPlaybackRate();
      const 현재시간 = player.getCurrentTime();
      const 지금 = Date.now();
      
      // 속도가 변경되었고, 마지막 변경으로부터 최소 500ms 경과했을 때만 기록
      if (현재속도 !== 이전속도.current && (지금 - 마지막속도변경시간) > 500) {
        // 이미 같은 시간대(±1초)에 속도 변경이 있었는지 확인
        const 중복확인 = 타임스탬프목록.some(ts => 
          ts.action === 'speed' && 
          Math.abs(ts.time - 현재시간) < 1 &&
          ts.value === 현재속도
        );
        
        if (!중복확인) {
          const 새타임스탬프: RawTimestamp = {
            id: `ts-${Date.now()}`,
            time: 현재시간,
            action: 'speed',
            value: 현재속도,
            previousValue: 이전속도.current,
            timestamp: new Date()
          };
          set타임스탬프목록(prev => [...prev, 새타임스탬프]);
          마지막속도변경시간 = 지금;
        }
        이전속도.current = 현재속도;
      }
    }, 100);

    // 볼륨 변경 감지 (중복 방지 로직 추가)
    let 마지막볼륨변경시간 = 0;
    const 볼륨감지인터벌 = setInterval(() => {
      const 현재볼륨 = player.getVolume();
      const 현재시간 = player.getCurrentTime();
      const 지금 = Date.now();
      
      // 볼륨이 10% 이상 변경되었고, 마지막 변경으로부터 최소 500ms 경과했을 때만 기록
      if (Math.abs(현재볼륨 - 이전볼륨.current) > 10 && (지금 - 마지막볼륨변경시간) > 500) {
        // 이미 같은 시간대(±1초)에 볼륨 변경이 있었는지 확인
        const 중복확인 = 타임스탬프목록.some(ts => 
          ts.action === 'volume' && 
          Math.abs(ts.time - 현재시간) < 1 &&
          Math.abs(ts.value - 현재볼륨) < 5
        );
        
        if (!중복확인) {
          const 새타임스탬프: RawTimestamp = {
            id: `ts-${Date.now()}`,
            time: 현재시간,
            action: 'volume',
            value: 현재볼륨,
            previousValue: 이전볼륨.current,
            timestamp: new Date()
          };
          set타임스탬프목록(prev => [...prev, 새타임스탬프]);
          마지막볼륨변경시간 = 지금;
        }
        이전볼륨.current = 현재볼륨;
      }
    }, 100);

    // 시간 점프 감지
    const 시간감지인터벌 = setInterval(() => {
      const 현재시간 = player.getCurrentTime();
      const 시간차이 = Math.abs(현재시간 - 이전시간.current);
      
      // 1초 이상 차이나면 시간 점프로 간주
      if (시간차이 > 1.5) {
        const 새타임스탬프: RawTimestamp = {
          id: `ts-${Date.now()}`,
          time: 현재시간,
          action: 'seek',
          value: 현재시간,
          previousValue: 이전시간.current,
          timestamp: new Date()
        };
        set타임스탬프목록(prev => [...prev, 새타임스탬프]);
      }
      
      이전시간.current = 현재시간;
    }, 200);

    // 일시정지/재생 상태 변경 감지
    const 상태감지인터벌 = setInterval(() => {
      const 현재상태 = player.getPlayerState();
      if (현재상태 !== 이전상태.current && 현재상태 === 2) { // 2 = PAUSED
        const 새타임스탬프: RawTimestamp = {
          id: `ts-${Date.now()}`,
          time: player.getCurrentTime(),
          action: 'pause',
          value: 1,
          previousValue: 0,
          timestamp: new Date()
        };
        set타임스탬프목록(prev => [...prev, 새타임스탬프]);
      }
      이전상태.current = 현재상태;
    }, 300);

    // 컴포넌트 언마운트 시 정리
    return () => {
      clearInterval(속도감지인터벌);
      clearInterval(볼륨감지인터벌);
      clearInterval(시간감지인터벌);
      clearInterval(상태감지인터벌);
    };
  }, [player, 녹화중]);

  // 영상이 변경될 때 새로운 세션 생성
  useEffect(() => {
    if (currentVideoId && currentVideoInfo) {
      // 플레이어에서 현재 볼륨과 속도를 가져와서 기본값으로 설정
      if (player && isPlayerReady) {
        try {
          const currentVol = player.getVolume() || 100;
          const currentRate = player.getPlaybackRate() || 1.0;
          setDefaultVolume(currentVol);
          setDefaultPlaybackRate(currentRate);
          setVolume(currentVol);
          setPlaybackRate(currentRate);
        } catch (error) {
          console.error("플레이어 상태 가져오기 오류:", error);
          setDefaultVolume(100);
          setDefaultPlaybackRate(1.0);
          setVolume(100);
          setPlaybackRate(1.0);
        }
      }

      // 영상 정보 저장
      saveVideoMutation.mutate({
        videoId: currentVideoId,
        title: currentVideoInfo.title,
        channelName: currentVideoInfo.channelName,
        thumbnailUrl: currentVideoInfo.thumbnailUrl,
      });

      // 기존 세션이 있는지 확인 후 불러오기 또는 새로 생성
      checkExistingSession(currentVideoId);
      
      // 타임스탬프 추적 상태 초기화
      // setUsedTimestamps(new Set()); // 제거됨
      setAutoJumpChain([]);
      setActiveTimestampId(null);
      setTimestampStartMode(null);
      setNextAllowedTimestampIndex(0); // 첫 번째 타임스탬프부터 시작
      setExecutedTimestampIds([]); // 실행 기록 초기화
      
      // 오버레이 초기화
      setOverlays([]);
    }
  }, [currentVideoId, currentVideoInfo, player, isPlayerReady]);

  // 사용자 맞춤형 기본값 업데이트: 타임스탬프가 없는 구간에서 조정한 값을 기본값으로 설정
  useEffect(() => {
    if (!player || !isPlayerReady) return;
    
    // 실시간으로 플레이어 설정 변경 감지 (500ms마다 체크)
    const settingsCheckInterval = setInterval(() => {
      try {
        // 타임스탬프가 활성화되지 않은 상태에서만 기본값 업데이트
        if (activeTimestamps.length === 0) {
          const currentVol = player.getVolume();
          const currentRate = player.getPlaybackRate();
          
          // 현재 플레이어 설정과 기본값이 다르면 사용자가 직접 조정한 것으로 간주
          if (Math.abs(currentVol - defaultVolume) > 1) {
            setDefaultVolume(currentVol);
            console.log(`기본 볼륨 업데이트: ${defaultVolume}% → ${currentVol}%`);
          }
          
          if (Math.abs(currentRate - defaultPlaybackRate) > 0.01) {
            setDefaultPlaybackRate(currentRate);
            console.log(`기본 속도 업데이트: ${defaultPlaybackRate}x → ${currentRate}x`);
          }
          
          // UI 상태도 동기화
          if (Math.abs(currentVol - volume) > 1) {
            setVolume(currentVol);
          }
          if (Math.abs(currentRate - playbackRate) > 0.01) {
            setPlaybackRate(currentRate);
          }
        }
      } catch (error) {
        console.error('기본값 업데이트 오류:', error);
      }
    }, 500); // 500ms마다 체크
    
    return () => clearInterval(settingsCheckInterval);
  }, [activeTimestamps, player, isPlayerReady, defaultVolume, defaultPlaybackRate, volume, playbackRate]);

  // 기존 세션 확인 및 불러오기 함수
  const checkExistingSession = async (videoId: string) => {
    try {
      // 해당 영상의 기존 세션 조회
      const response = await fetch(`/api/note-sessions/video/${videoId}`);
      if (response.ok) {
        const sessions = await response.json();
        
        if (sessions && sessions.length > 0) {
          // 세션들을 시간순으로 정렬
          const sortedSessions = sessions.sort((a: any, b: any) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          
          // 사용 가능한 세션 목록 저장
          setAvailableSessions(sortedSessions);
          
          // 가장 최근 세션을 자동으로 로드
          const latestSession = sortedSessions[0];
          await loadSession(latestSession);
          
          // 여러 세션이 있으면 선택기 버튼 표시
          if (sessions.length > 1) {
            console.log(`${sessions.length}개의 기존 세션 발견`);
          }
        } else {
          // 기존 세션이 없으면 새로 생성
          setAvailableSessions([]);
          createNewSession(videoId);
        }
      } else {
        // API 호출 실패 시 새로 생성
        createNewSession(videoId);
      }
    } catch (error) {
      console.error("기존 세션 확인 중 오류:", error);
      createNewSession(videoId);
    }
  };

  // 세션 로드 함수
  const loadSession = async (session: any) => {
    setCurrentSessionId(session.id);
    setNoteText(session.content || "");
    
    // 해당 세션의 타임스탬프도 로드
    try {
      const timestampsResponse = await fetch(`/api/timestamps?sessionId=${session.id}`);
      if (timestampsResponse.ok) {
        const timestampsData = await timestampsResponse.json();
        setTimestamps(timestampsData);
      }
    } catch (error) {
      console.error("타임스탬프 로드 중 오류:", error);
    }
    
    console.log(`세션 로드됨: ${session.title}`);
  };

  // 새로운 세션 생성 함수
  const createNewSession = (videoId: string) => {
    createSessionMutation.mutate({
      userId: 1, // 임시 사용자 ID
      videoId: videoId,
      title: `${currentVideoInfo?.title || 'YouTube 영상'} 노트`,
      content: "",
    });
    
    // 노트 초기화
    setNoteText("");
    console.log("새로운 세션 생성됨");
  };

  // 외부에서 전달된 세션을 노트에 적용
  useEffect(() => {
    if (sessionToApply) {
      console.log("sessionToApply 감지됨:", sessionToApply);
      // 컴포넌트가 완전히 렌더링될 때까지 대기
      const timeoutId = setTimeout(() => {
        외부세션을노트에적용(sessionToApply);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [sessionToApply]);

  // 실시간 저장 로직
  const saveNote = useCallback(async (content: string) => {
    if (!currentSessionId) return;

    // 저장하기 전에 속도값 정리
    const cleanedContent = cleanupSpeedInText(content);
    
    // setIsSaving(true); // 제거됨
    updateSessionMutation.mutate({
      id: currentSessionId,
      data: { content: cleanedContent },
    });

    // 정리된 텍스트로 UI 업데이트
    if (cleanedContent !== content) {
      setNoteText(cleanedContent);
    }
  }, [currentSessionId, updateSessionMutation]);

  // 타이핑 중 자동 저장 (1초 딜레이)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (noteText && currentSessionId) {
      saveTimeoutRef.current = setTimeout(() => {
        saveNote(noteText);
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [noteText, saveNote]);

  // 컴포넌트 언마운트 시 즉시 저장을 위한 ref
  const noteTextRef = useRef(noteText);
  const sessionIdRef = useRef(currentSessionId);
  
  // ref 업데이트
  useEffect(() => {
    noteTextRef.current = noteText;
  }, [noteText]);
  
  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);
  
  // 컴포넌트 언마운트 시 즉시 저장
  useEffect(() => {
    return () => {
      // 현재 대기 중인 저장이 있으면 즉시 실행
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // ref에서 현재 값을 가져와서 저장
      const currentNoteText = noteTextRef.current;
      const currentSession = sessionIdRef.current;
      
      if (currentNoteText && currentSession) {
        // 동기적으로 저장 요청 (fetch API 직접 사용)
        fetch(`/api/note-sessions/${currentSession}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: cleanupSpeedInText(currentNoteText),
          }),
        }).catch(console.error);
      }
    };
  }, []); // 빈 의존성 배열 - 마운트 시 한 번만 설정

  // 스크린샷 캡처 함수
  const captureScreenshot = useCallback((): string | null => {
    if (!player || !isPlayerReady) return null;

    try {
      // YouTube iframe에서 스크린샷을 직접 캡처하는 것은 CORS 제한으로 불가능
      // 대신 canvas를 이용해 플레이어 영역의 스크린샷을 시뮬레이션
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 320;
      canvas.height = 180;
      
      if (ctx) {
        // 임시 스크린샷 대체 (실제로는 영상 프레임을 캡처해야 함)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('스크린샷 준비중...', canvas.width / 2, canvas.height / 2);
        
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    } catch (error) {
      console.error("스크린샷 캡처 오류:", error);
    }
    
    return null;
  }, [player, isPlayerReady]);
  // 마우스/터치 시작
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

  // 마우스/터치 이동
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
      setPlaybackRate(newRate); // 속도 슬라이더와 동기화
    }

    // 상하 드래그로 볼륨 조절
    const volumeSensitivity = 0.5;
    const newVolume = Math.max(0, Math.min(100, startVolume - deltaY * volumeSensitivity));

    if (Math.abs(newVolume - volume) > 1) {
      player.setVolume(newVolume);
      setVolume(newVolume);
    }
  };

  // 마우스/터치 종료
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPlayerReady || !player) return;

    const deltaX = Math.abs(e.clientX - startPos.x);
    const deltaY = Math.abs(e.clientY - startPos.y);

    // 움직임이 거의 없었다면 재생/일시정지 토글
    if (deltaX < 5 && deltaY < 5) {
      const playerState = player.getPlayerState();
      if (playerState === 1) { // 재생 중
        player.pauseVideo();
      } else { // 일시정지 상태
        player.playVideo();
      }
    }
    setIsDragging(false);

    if (controlRef.current) {
      controlRef.current.releasePointerCapture(e.pointerId);
    }
  };
  // 타임스탬프 추가 함수 (영상 일시정지 기능 추가)
  const addTimestamp = () => {
    if (!isPlayerReady || !player || !currentSessionId) return;

    try {
      // 영상 일시정지
      if (playerState === 1) {
        player.pauseVideo();
      }
      
      const currentTime = player.getCurrentTime();
      const newTimestampTime = currentTime; // 새로 추가될 타임스탬프 시간
      const timeFormatted = formatTime(currentTime);
      const endTime = currentTime + duration;
      const endTimeFormatted = formatTime(endTime);
      const timestamp = `[${timeFormatted}-${endTimeFormatted}, ${Math.round(volume || 100)}%, ${(playbackRate || 1.0).toFixed(2)}x]`;
      
      // 이전 시간대 타임스탬프 감지 로직
      // 커서 직전 타임스탬프와 비교하여 시간 순서 역순인지 확인
      let 이전시간대여부 = false;
      
      if (textareaRef.current) {
        const 커서위치 = textareaRef.current.selectionStart;
        const 커서이전텍스트 = noteText.substring(0, 커서위치);
        
        // 커서 이전 텍스트에서 가장 마지막 타임스탬프 찾기
        const 타임스탬프정규식 = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
        let 마지막매치 = null;
        let 매치결과;
        
        while ((매치결과 = 타임스탬프정규식.exec(커서이전텍스트)) !== null) {
          마지막매치 = 매치결과;
        }
        
        if (마지막매치) {
          // 직전 타임스탬프의 시작 시간 계산
          const 직전시간 = parseInt(마지막매치[1]) * 3600 + parseInt(마지막매치[2]) * 60 + parseFloat(마지막매치[3]);
          이전시간대여부 = newTimestampTime < 직전시간;
          
          console.log(`커서 직전 타임스탬프: ${직전시간}초, 새 타임스탬프: ${newTimestampTime}초, 이전시간대여부: ${이전시간대여부}`);
        }
      }
      
      // 스크린샷 캡처
      // 스크린샷 캡처는 나중에 필요시 추가 가능
      // const screenshot = captureScreenshot();
      
      // DB에 직접 저장하지 않고 텍스트에만 추가
      // 텍스트 변경 시 자동으로 DB 동기화됨
      
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // 현재 커서 위치에 타임스탬프 삽입
        const newText = noteText.substring(0, start) + timestamp + " " + "\n" + noteText.substring(end);
        setNoteText(newText);
        
        // 타임스탬프 삽입 후 커서 위치 조정
        setTimeout(() => {
          const newCursorPos = start + timestamp.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);

        // 즉시 저장
        setTimeout(() => {
          saveNote(newText);
        }, 100);
        
        // 이전 시간대 타임스탬프인 경우 직전 타임스탬프에 -> 표시 추가
        if (이전시간대여부) {
          // 직전 타임스탬프에 -> 추가하기 위해 텍스트 수정
          const 커서위치 = textareaRef.current.selectionStart;
          const 커서이전텍스트 = noteText.substring(0, 커서위치);
          const 커서이후텍스트 = noteText.substring(textarea.selectionEnd);
          
          // 직전 타임스탬프 찾아서 -> 추가
          const 타임스탬프정규식 = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;
          let 수정된커서이전텍스트 = 커서이전텍스트;
          let 마지막매치 = null;
          let 마지막매치위치 = -1;
          let 매치결과;
          
          while ((매치결과 = 타임스탬프정규식.exec(커서이전텍스트)) !== null) {
            마지막매치 = 매치결과;
            마지막매치위치 = 매치결과.index;
          }
          
          if (마지막매치 && 마지막매치위치 >= 0) {
            // 기존 타임스탬프를 -> 포함한 형태로 교체 (쉼표 포함)
            const 기존타임스탬프 = 마지막매치[0];
            const 새로운타임스탬프 = 기존타임스탬프.replace(/\]$/, ', ->]');
            
            수정된커서이전텍스트 = 커서이전텍스트.substring(0, 마지막매치위치) + 
                                 새로운타임스탬프 + 
                                 커서이전텍스트.substring(마지막매치위치 + 기존타임스탬프.length);
          }
          
          // 전체 텍스트 재구성 (직전 타임스탬프 수정 + 새 타임스탬프 추가)
          const 최종텍스트 = 수정된커서이전텍스트 + timestamp + " " + "\n" + 커서이후텍스트;
          setNoteText(최종텍스트);
          
          // 저장
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
          const startHour = parseInt(timeMatch[1]);
          const startMin = parseInt(timeMatch[2]);
          const startSec = parseFloat(timeMatch[3]); // 소수점 지원
          const endHour = parseInt(timeMatch[4]);
          const endMin = parseInt(timeMatch[5]);
          const endSec = parseFloat(timeMatch[6]); // 소수점 지원
          const newVolume = parseInt(timeMatch[7]);
          const newSpeed = parseFloat(timeMatch[8]);
          
          const startSeconds = startHour * 3600 + startMin * 60 + startSec;
          const endSeconds = endHour * 3600 + endMin * 60 + endSec;
          
          // 클릭한 위치가 시작 시간 쪽인지 종료 시간 쪽인지 판단
          const timestampText = clickedTimestamp;
          const dashIndex = timestampText.indexOf('-');
          const commaIndex = timestampText.indexOf(',');
          
          let targetTime = startSeconds; // 기본값은 시작 시간
          let isEndTimeClick = false; // 끝나는 시간 클릭 여부
          
          // 클릭 위치 계산 (대략적)
          if (clickedMatch && clickedMatch.index !== undefined) {
            const relativePosition = clickPosition - clickedMatch.index;
            if (relativePosition > dashIndex && relativePosition < commaIndex) {
              // 종료 시간 부분을 클릭한 경우 - 1초 전으로 이동 (해당 타임스탬프 구간 내 유지)
              targetTime = Math.max(startSeconds, endSeconds - 0.3);
              isEndTimeClick = true;
            }
          }
          
          // 사용자 직접 클릭 시 추적 기록 초기화
          // setUsedTimestamps(new Set()); // 제거됨
          setAutoJumpChain([]);
          setExecutedTimestampIds([]); // 실행 기록 초기화
          
          // 먼저 해당 시간으로 이동
          player.seekTo(targetTime, true);
          
          // 클릭한 타임스탬프 찾기 및 활성화
          const clickedTimestampData = timestamps.find(ts => 
            Math.abs(ts.timeInSeconds - startSeconds) < 1
          );
          
          if (clickedTimestampData) {
            // 타임스탬프가 DB에 있으면 활성화
            setActiveTimestampId(clickedTimestampData.id);
            setTimestampStartMode('jump');
            
            // 텍스트 순서에서 현재 위치 찾기
            const priorityOrder = parseTimestampPriority(noteText);
            const currentIndex = priorityOrder.findIndex(item => 
              Math.abs(item.startTime - startSeconds) < 1
            );
            
            if (currentIndex !== -1) {
              setNextAllowedTimestampIndex(currentIndex + 1);
            }
            
            // 진행 상황 표시 (점프 실행)
            const totalTimestamps = priorityOrder.length;
            const currentPosition = currentIndex !== -1 ? currentIndex + 1 : '?';
            showNotification(`타임스탬프 점프 (${currentPosition}/${totalTimestamps}) ${formatTime(startSeconds)}`, "info");
            
            // 끝나는 시간 클릭 + -> 모드인 경우 자동 점프 실행
            if (isEndTimeClick) {
              const currentTimestampFromOrder = priorityOrder.find(ts => 
                Math.abs(ts.startTime - startSeconds) < 1
              );
              
              if (currentTimestampFromOrder && currentTimestampFromOrder.jumpMode === 'jump') {
                const currentIndexInOrder = priorityOrder.findIndex(ts => ts === currentTimestampFromOrder);
                if (currentIndexInOrder !== -1 && currentIndexInOrder + 1 < priorityOrder.length) {
                  const nextTimestamp = priorityOrder[currentIndexInOrder + 1];
                  const nextTarget = timestamps.find(ts => 
                    Math.abs(ts.timeInSeconds - nextTimestamp.startTime) < 1 &&
                    Math.abs((ts.volume || 100) - nextTimestamp.volume) < 1 &&
                    Math.abs((ts.playbackRate || 1.0) - nextTimestamp.playbackRate) < 0.01
                  );
                  
                  if (nextTarget) {
                    // 다음 타임스탬프로 자동 점프
                    player.seekTo(nextTarget.timeInSeconds, true);
                    setActiveTimestampId(nextTarget.id);
                    setTimestampStartMode('jump');
                    
                    // 진행 상황 표시
                    const nextPosition = currentIndexInOrder + 2;
                    showNotification(`자동점프 (${nextPosition}/${totalTimestamps}) ${formatTime(nextTarget.timeInSeconds)}`, "info");
                  }
                }
              }
            }
          } else {
            // DB에 없으면 독점 모드 해제
            setActiveTimestampId(null);
            setTimestampStartMode(null);
            
            // DB에 없는 타임스탬프도 점프 알림 표시
            showNotification(`${formatTime(targetTime)}로 점프`, "info");
          }
          
          // 텍스트 기반 동기화로 DB 업데이트는 자동으로 처리됨
          // 볼륨과 속도는 플레이어에서 직접 설정
          setVolume(newVolume);
          setPlaybackRate(newSpeed);
          setCurrentRate(newSpeed); // 재생 컨트롤 표시 동기화
          if (player) {
            player.setVolume(newVolume);
            player.setPlaybackRate(newSpeed);
          }
        }
      } catch (error) {
        console.error("타임스탬프 이동 중 오류:", error);
        showNotification("타임스탬프 이동 중 오류가 발생했습니다.", "error");
      }
    }
  };

  // 플레이어 상태 메시지
  const getStatusMessage = () => {
    if (!isPlayerReady) return "플레이어 준비 중...";
    
    switch (playerState) {
      case -1:
        return "시작되지 않음";
      case 0:
        return "종료됨";
      case 1:
        return "재생 중";
      case 2:
        return "일시정지";
      case 3:
        return "버퍼링 중";
      case 5:
        return "준비됨";
      default:
        return "알 수 없는 상태";
    }
  };

  // 상태에 따른 CSS 클래스
  const getStatusClass = () => {
    if (!isPlayerReady) return "text-gray-500";
    
    switch (playerState) {
      case 1:
        return "text-green-600";
      case 2:
        return "text-yellow-600";
      case 3:
        return "text-blue-600";
      default:
        return "text-gray-500";
    }
  };

  // 타임스탬프 버튼 활성화 여부
  const isTimestampButtonEnabled = isPlayerReady && (playerState === 1 || playerState === 2);

  return (
    <Card>
      <CardContent className="p-3">
        {/* 녹화 상태 표시 */}
        {녹화중 && (
          <div className="flex items-center justify-between mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-700">녹화 중</span>
              </div>
              <span className="text-xs text-red-600">
                경과시간: {Math.floor(경과시간)}초
              </span>
            </div>
            <div className="text-xs text-red-600">
              타임스탬프: {타임스탬프목록.length}개
            </div>
          </div>
        )}
        
        {/* 모바일용 모드 전환 버튼 (md 미만에서만 표시) */}
        <div className="flex mb-3 bg-gray-100 rounded-lg p-1 md:hidden">
          <Button
            variant={inputMode === 'note' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setInputMode('note')}
            className="flex-1 flex items-center justify-center"
          >
            <FileText className="w-4 h-4 mr-1" />
            노트
          </Button>
          <Button
            variant={inputMode === 'overlay' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setInputMode('overlay')}
            className="flex-1 flex items-center justify-center"
          >
            <Type className="w-4 h-4 mr-1" />
            화면 텍스트
          </Button>
        </div>

        {uiSettings.재생컨트롤.전체표시 && (
          <div className="mt-0">
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

            {/* 1줄 컨트롤 바 - 세로 라벨 + 반응형 */}
            <div className="flex items-center gap-1 mb-1 mt-1 overflow-x-auto">
          {/* 볼륨 */}
          {uiSettings.재생컨트롤.볼륨 && (
            <>
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
            onMouseEnter={() => {
              // 마우스가 슬라이더 위에 있을 때 스크롤 비활성화
              document.documentElement.style.overflow = 'hidden';
            }}
            onMouseLeave={() => {
              // 마우스가 슬라이더를 벗어나면 스크롤 재활성화
              document.documentElement.style.overflow = 'scroll';
            }}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const change = e.deltaY > 0 ? -2 : 2;
              const newVolume = Math.max(0, Math.min(100, volume + change));
              setVolume(newVolume);
              if (player) {
                player.setVolume(newVolume);
              }
            }}
            className="flex-1 h-2 min-w-[20px] max-w-[100px]"
          />
              <span className="text-xs text-gray-600 w-7 flex-shrink-0 text-right">{Math.round(volume || 100)}%</span>
            </>
          )}
          
          {/* 속도 */}
          {uiSettings.재생컨트롤.속도 && (
            <>
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
            onMouseEnter={() => {
              // 마우스가 슬라이더 위에 있을 때 스크롤 비활성화
              document.documentElement.style.overflow = 'hidden';
            }}
            onMouseLeave={() => {
              // 마우스가 슬라이더를 벗어나면 스크롤 재활성화
              document.documentElement.style.overflow = 'scroll';
            }}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const change = e.deltaY > 0 ? -0.05 : 0.05;
              const newRate = Math.max(0.25, Math.min(2.0, playbackRate + change));
              setPlaybackRate(newRate);
              setCurrentRate(newRate);
              if (player) {
                player.setPlaybackRate(newRate);
              }
            }}
            className="flex-1 h-1 min-w-[20px] max-w-[100px]"
          />
              <span className="text-xs text-gray-600 w-9 flex-shrink-0 text-right">{(playbackRate || 1.0).toFixed(2)}x</span>
            </>
          )}
          
          {/* 지속시간 */}
          <div className="flex flex-col items-center leading-none flex-shrink-0 ml-1">
            <span className="text-xs text-gray-500">지</span>
            <span className="text-xs text-gray-500">속</span>
          </div>
          <input
            type="number"
            min="1"
            max="60"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            onMouseEnter={() => {
              // 마우스가 입력 필드 위에 있을 때 스크롤 비활성화
              document.documentElement.style.overflow = 'hidden';
            }}
            onMouseLeave={() => {
              // 마우스가 입력 필드를 벗어나면 스크롤 재활성화
              document.documentElement.style.overflow = 'scroll';
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
          
          {/* 타임스탬프 버튼 */}
          {uiSettings.재생컨트롤.도장 && (
            <Button
              onClick={addTimestamp}
              disabled={!isTimestampButtonEnabled}
              size="sm"
              variant="destructive"
              className="flex-shrink-0 ml-1 text-xs px-2 py-1 h-7"
            >
              <Clock className="w-3 h-3 mr-1" />
              도장
            </Button>
          )}
          
          {/* 녹화 버튼 */}
          {uiSettings.재생컨트롤.녹화 && (
            <Button
              onClick={녹화중 ? 녹화종료하기 : 녹화시작하기}
              disabled={!isPlayerReady}
              size="sm"
              variant={녹화중 ? "outline" : "default"}
              className={`flex-shrink-0 ml-1 text-xs px-2 py-1 h-7 ${
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
                  <Circle className="w-3 h-3 mr-1 fill-current text-red-500" />
                  녹화
                </>
              )}
            </Button>
          )}
            </div>
          </div>
        )}

        {/* 세션 선택 버튼 */}
        {availableSessions.length > 1 && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">
                저장된 노트: {availableSessions.length}개
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSessionSelector(!showSessionSelector)}
                className="text-xs px-2 py-1 h-6"
              >
                {showSessionSelector ? '숨기기' : '선택하기'}
              </Button>
            </div>
            
            {showSessionSelector && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {availableSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs ${
                      session.id === currentSessionId 
                        ? 'bg-blue-100 border border-blue-300' 
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      loadSession(session);
                      setShowSessionSelector(false);
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {index === 0 ? '최신' : `${index + 1}번째`} ({new Date(session.updatedAt).toLocaleDateString()})
                      </div>
                      <div className="text-gray-600 truncate max-w-[200px]">
                        {session.content ? 
                          session.content.substring(0, 50).replace(/\n/g, ' ') + (session.content.length > 50 ? '...' : '')
                          : '빈 노트'
                        }
                      </div>
                    </div>
                    {session.id === currentSessionId && (
                      <span className="text-blue-600 font-bold ml-2">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 모바일용 조건부 렌더링 (md 미만에서만 표시) */}
        <div className="md:hidden">
          {inputMode === 'note' ? (
            <>
              <Textarea
                id="noteArea"
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onDoubleClick={handleTimestampClick}
                placeholder="여기에 노트를 작성하세요.

📌 사용법:
• 도장 버튼: [HH:MM:SS, 100%, 1.00x] 형식으로 타임스탬프 생성
• 더블클릭: 타임스탬프 시간으로 이동
• 자동점프: 끝에 &quot;, -&gt;&quot; 추가
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
                  <span className={`text-xs ${getStatusClass()}`}>{getStatusMessage()}</span>
                </div>
              </div>
            </>
          ) : (
            <OverlayInput
              player={player}
              isPlayerReady={isPlayerReady}
              overlays={overlays}
              setOverlays={setOverlays}
              showNotification={showNotification}
              uiSettings={uiSettings}
              onSettingsChange={onSettingsChange}
            />
          )}
        </div>

        {/* PC용 좌우 분할 레이아웃 (md 이상에서만 표시) */}
        <div className="hidden md:flex gap-6">
          {/* 좌측: 노트 입력 */}
          {uiSettings.노트영역.표시 && (
            <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                노트 작성
              </h3>
              {availableSessions.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSessionSelector(!showSessionSelector)}
                  className="text-xs px-2 py-1 h-6"
                >
                  노트 {availableSessions.length}개 {showSessionSelector ? '↑' : '↓'}
                </Button>
              )}
            </div>
            
            {/* PC용 세션 선택기 */}
            {availableSessions.length > 1 && showSessionSelector && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {availableSessions.map((session, index) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs ${
                        session.id === currentSessionId 
                          ? 'bg-blue-100 border border-blue-300' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        loadSession(session);
                        setShowSessionSelector(false);
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {index === 0 ? '최신' : `${index + 1}번째`} ({new Date(session.updatedAt).toLocaleDateString()})
                        </div>
                        <div className="text-gray-600 truncate max-w-[250px]">
                          {session.content ? 
                            session.content.substring(0, 60).replace(/\n/g, ' ') + (session.content.length > 60 ? '...' : '')
                            : '빈 노트'
                          }
                        </div>
                      </div>
                      {session.id === currentSessionId && (
                        <span className="text-blue-600 font-bold ml-2">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Textarea
              id="noteArea"
              ref={textareaRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onDoubleClick={handleTimestampClick}
              placeholder="여기에 노트를 작성하세요.

📌 사용법:
• 도장 버튼: [HH:MM:SS, 100%, 1.00x] 형식으로 타임스탬프 생성
• 더블클릭: 타임스탬프 시간으로 이동
• 자동점프: 끝에 &quot;, -&gt;&quot; 추가
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
                <span className={`text-xs ${getStatusClass()}`}>{getStatusMessage()}</span>
              </div>
            </div>
            </div>
          )}
          
          {/* 우측: 화면 텍스트 또는 녹화 세션 */}
          {uiSettings.화면텍스트.패널표시 && (
            <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                {rightPanelMode === "overlay" ? (
                  <>
                    <Type className="w-4 h-4 mr-2" />
                    화면 텍스트
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    녹화 세션
                  </>
                )}
              </h3>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={rightPanelMode === "overlay" ? "default" : "outline"}
                  onClick={() => setRightPanelMode("overlay")}
                  className="text-xs px-2 py-1 h-6"
                >
                  화면 텍스트
                </Button>
                <Button
                  size="sm"
                  variant={rightPanelMode === "recording" ? "default" : "outline"}
                  onClick={() => setRightPanelMode("recording")}
                  className="text-xs px-2 py-1 h-6"
                >
                  녹화 세션
                </Button>
              </div>
            </div>
            
            {rightPanelMode === "overlay" ? (
              <OverlayInput
                player={player}
                isPlayerReady={isPlayerReady}
                overlays={overlays}
                setOverlays={setOverlays}
                showNotification={showNotification}
                uiSettings={uiSettings}
                onSettingsChange={onSettingsChange}
              />
            ) : (
              <RecordingSessionList
                sessions={recordingSessions}
                onEditSession={onEditRecordingSession}
                onDeleteSession={onDeleteRecordingSession}
                onCopySession={onCopyRecordingSession}
                onApplyToNote={onApplyRecordingToNote}
                showNotification={showNotification}
                currentVideoId={currentVideoId}
                currentPlayTime={player && isPlayerReady ? (() => {
                  try {
                    return player.getCurrentTime();
                  } catch {
                    return 0;
                  }
                })() : 0}
              />
            )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteArea;