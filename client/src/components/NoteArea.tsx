import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTime } from "@/lib/youtubeUtils";
import { Clock, Circle, Square } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OverlayData } from "./TextOverlay";
import OverlayInput from "./OverlayInput";
import RecordingSessionList from "./RecordingSessionList";
import TimestampEditModal from "./TimestampEditModal";
import TimeSkipControls from "./TimeSkipControls";
import { UISettings } from "./SettingsPanel";
import { NoteTabs } from "./NoteTabs";
import { NotePage, NotePageState, PAGE_COLORS, DEFAULT_EMOJIS } from "../types/NotePage";
import { LeftSidebarTabs } from "./LeftSidebarTabs";
import { ZoomContent } from "./ZoomContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  // 다중 페이지 시스템 props
  pageState: NotePageState;
  onPageStateChange: (pageState: NotePageState) => void;
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
  onSettingsChange,
  pageState,
  onPageStateChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // 녹화 상태
  const [녹화중, set녹화중] = useState(false);
  
  // 재생컨트롤 모드 상태
  const [controlMode, setControlMode] = useState<'normal' | 'timeSkip'>('normal');
  const [현재세션, set현재세션] = useState<string | null>(null);
  
  // 현재 플레이어 상태 추적 (props에 없어서 직접 추적)
  const [currentVolume, setCurrentVolume] = useState(100);

  // 실시간 미리보기 오버레이 상태
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [이전볼륨, set이전볼륨] = useState(currentVolume);
  const [이전속도, set이전속도] = useState(currentPlaybackRate);
  const [이전시간, set이전시간] = useState(currentTime);
  
  // 사용자가 직접 설정한 볼륨/속도 값 추적 (타임스탬프 복원용)
  const [userSettings, setUserSettings] = useState({
    volume: 100,
    speed: 1.0
  });

  // 페이지 탭 선택기 상태 - 선택된 페이지 ID 저장
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  // 탭 컨테이너 위치 참조
  const noteTabsRef = useRef<HTMLDivElement>(null);

  // 무한루프 방지를 위한 업데이트 상태 추적
  const isUpdatingContentRef = useRef(false);

  // 타임스탬프 가져오기 UI 상태
  const [showTimestampImporter, setShowTimestampImporter] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  // 왼쪽탭 레이아웃 상태
  const [activeMainTab, setActiveMainTab] = useState<'note' | 'overlay' | 'zoom'>('note');

  // 상태 변화 추적
  useEffect(() => {
    // 타임스탬프 가져오기 모달 상태 변화 처리
  }, [showTimestampImporter]);
  
  // 원본 사용자 설정을 보존하기 위한 ref (더블클릭 contamination 방지)
  const originalUserSettingsRef = useRef<{volume: number, speed: number} | null>(null);

  // 타임스탬프 자동 실행 관련 상태 변수들
  const [activeTimestamp, setActiveTimestamp] = useState<any>(null);
  const [originalSettings, setOriginalSettings] = useState<{volume: number, speed: number} | null>(null);

  // 타임스탬프 우선순위 관리 (마지막 활성화된 타임스탬프의 인덱스)
  // 중요: -1로 초기화하여 모든 타임스탬프가 처음부터 활성화 가능하도록 함
  const [lastActiveIndex, setLastActiveIndex] = useState<number>(-1);
  
  // 중복 실행 방지 플래그들 (useRef로 지속 상태 유지)
  const processingEntryRef = useRef(false);
  const processingExitRef = useRef(false);
  const autoJumpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(0);
  const ignoreManualMoveRef = useRef(false); // 더블클릭 후 수동이동 감지 무시용

  // 타임스탬프 정규식 상수 (모든 타임스탬프 관련 함수에서 공통 사용)
  const TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;

  // 타임스탬프 파싱 함수 (중앙화된 단일 함수)
  const parseTimestamps = (text: string) => {
    try {
      const stamps: any[] = [];
      const regex = new RegExp(TIMESTAMP_REGEX.source, 'g');
      let match;
      let index = 0;

      while ((match = regex.exec(text)) !== null) {
        const startTime = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
        const endTime = parseInt(match[4]) * 3600 + parseInt(match[5]) * 60 + parseFloat(match[6]);
        const volume = parseInt(match[7]);
        const speed = parseFloat(match[8]);
        const action = match[9] || null;

        stamps.push({
          startTime,
          endTime,
          volume,
          speed,
          action,
          raw: match[0],
          index: index++
        });
      }

      // 중요: 노트 작성 순서 유지 - 시간순 정렬 금지
      // 텍스트에서 나타나는 순서 = 노트 작성 순서 = 우선순위 순서

      // 디버깅: 파싱된 타임스탬프 순서 확인
      if (stamps.length > 0) {
        console.log('[파싱] 타임스탬프 순서 (노트 작성 순서):');
        stamps.forEach((stamp, i) => {
          console.log(`  ${i}: ${stamp.startTime.toFixed(2)}-${stamp.endTime.toFixed(2)} ${stamp.action || ''}`);
        });
      }

      return stamps;
    } catch (error) {
      console.error('parseTimestamps 오류:', error);
      return [];
    }
  };

  // 다중 페이지 시스템 핸들러 함수들
  // 페이지 변경 핸들러
  const handlePageChange = (index: number) => {
    const newPageState = { ...pageState, activePageIndex: index };
    onPageStateChange(newPageState);
  };

  // 페이지 업데이트 핸들러
  const handlePageUpdate = (pageId: string, updates: Partial<NotePage>) => {
    const updatedPages = pageState.pages.map(page =>
      page.id === pageId ? { ...page, ...updates, updatedAt: Date.now() } : page
    );
    onPageStateChange({ ...pageState, pages: updatedPages });
  };

  // 새 페이지 추가 핸들러
  const handlePageAdd = () => {
    const newPage: NotePage = {
      id: `page-${Date.now()}`,
      name: `페이지 ${pageState.pages.filter(p => !p.isSpecial).length + 1}`,
      emoji: DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)],
      content: '',
      color: PAGE_COLORS[Math.floor(Math.random() * PAGE_COLORS.length)],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const newPages = [...pageState.pages, newPage];
    const newActiveIndex = newPages.length - 1;

    onPageStateChange({
      pages: newPages,
      activePageIndex: newActiveIndex
    });
  };

  // 페이지 삭제 핸들러
  const handlePageDelete = (pageId: string) => {
    const pageIndex = pageState.pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;

    const filteredPages = pageState.pages.filter(p => p.id !== pageId);
    let newActiveIndex = pageState.activePageIndex;

    // 삭제된 페이지가 현재 활성 페이지인 경우
    if (pageIndex === pageState.activePageIndex) {
      // 마지막 페이지가 삭제된 경우 이전 페이지로
      if (pageIndex === pageState.pages.length - 1) {
        newActiveIndex = Math.max(0, pageIndex - 1);
      }
      // 그 외의 경우 그대로 유지 (다음 페이지가 올라옴)
    } else if (pageIndex < pageState.activePageIndex) {
      // 활성 페이지보다 앞의 페이지가 삭제된 경우 인덱스 조정
      newActiveIndex = pageState.activePageIndex - 1;
    }

    onPageStateChange({
      pages: filteredPages,
      activePageIndex: newActiveIndex
    });
  };

  // 페이지 순서 변경 핸들러 (드래그앤드롭)
  const handlePageReorder = (fromIndex: number, toIndex: number) => {
    const newPages = [...pageState.pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);

    // 현재 활성 페이지의 새로운 인덱스 계산
    let newActiveIndex = pageState.activePageIndex;
    if (pageState.activePageIndex === fromIndex) {
      newActiveIndex = toIndex;
    } else if (fromIndex < pageState.activePageIndex && toIndex >= pageState.activePageIndex) {
      newActiveIndex = pageState.activePageIndex - 1;
    } else if (fromIndex > pageState.activePageIndex && toIndex <= pageState.activePageIndex) {
      newActiveIndex = pageState.activePageIndex + 1;
    }

    onPageStateChange({
      pages: newPages,
      activePageIndex: newActiveIndex
    });
  };

  // 현재 활성 페이지 가져오기
  const getCurrentPage = () => {
    return pageState.pages[pageState.activePageIndex] || null;
  };

  // 페이지 내용 자동 저장
  const handleContentChange = (content: string) => {
    const currentPage = getCurrentPage();
    if (currentPage && !currentPage.isSpecial) {
      handlePageUpdate(currentPage.id, { content });
    }
  };

  // 통합 타임스탬프 페이지에서 모든 페이지의 타임스탬프 수집
  const getAllTimestamps = () => {
    const allTimestamps: any[] = [];

    pageState.pages.forEach(page => {
      if (!page.isSpecial && page.content) {
        const pageTimestamps = parseTimestamps(page.content);
        pageTimestamps.forEach(timestamp => {
          allTimestamps.push({
            ...timestamp,
            pageId: page.id,
            pageName: page.name,
            pageEmoji: page.emoji
          });
        });
      }
    });

    // 시작시간 순으로 정렬
    return allTimestamps.sort((a, b) => a.startTime - b.startTime);
  };

  // 선택기 핸들러들
  const handleEmojiClick = (pageId: string) => {
    setShowEmojiPicker(showEmojiPicker === pageId ? null : pageId);
    setShowColorPicker(null);
  };

  const handleColorClick = (pageId: string) => {
    setShowColorPicker(showColorPicker === pageId ? null : pageId);
    setShowEmojiPicker(null);
  };

  const handleEmojiSelect = (pageId: string, emoji: string) => {
    handlePageUpdate(pageId, { emoji });
    setShowEmojiPicker(null);
  };

  const handleColorSelect = (pageId: string, color: string) => {
    handlePageUpdate(pageId, { color });
    setShowColorPicker(null);
  };

  // 선택기 외부 클릭시 닫기
  const handleOutsideClick = () => {
    setShowEmojiPicker(null);
    setShowColorPicker(null);
    setShowTimestampImporter(false);
  };

  // 타임스탬프 가져오기 기능
  const handleImportTimestamps = () => {
    if (selectedPages.length === 0) {
      showNotification('가져올 페이지를 선택해주세요', 'warning');
      return;
    }

    const importedTimestamps: any[] = [];

    selectedPages.forEach(pageId => {
      const page = pageState.pages.find(p => p.id === pageId);
      if (page && !page.isSpecial && page.content) {
        const pageTimestamps = parseTimestamps(page.content);
        pageTimestamps.forEach(timestamp => {
          importedTimestamps.push({
            ...timestamp,
            pageId: page.id,
            pageName: page.name,
            pageEmoji: page.emoji
          });
        });
      }
    });

    // 시간순으로 정렬
    importedTimestamps.sort((a, b) => a.startTime - b.startTime);

    // 형식화된 텍스트 생성 - 각 타임스탬프와 연관된 텍스트 찾기
    const formattedContent = importedTimestamps.map(ts => {
      const page = pageState.pages.find(p => p.id === ts.pageId);
      if (!page) return ts.raw;

      // 페이지 내용에서 해당 타임스탬프 다음에 오는 텍스트 찾기
      const content = page.content || '';
      const timestampIndex = content.indexOf(ts.raw);

      if (timestampIndex === -1) return ts.raw;

      // 타임스탬프 이후의 텍스트 추출 - 다음 엔터까지만
      const afterTimestamp = content.slice(timestampIndex + ts.raw.length);
      const nextLineBreakIndex = afterTimestamp.indexOf('\n');
      const endIndex = nextLineBreakIndex !== -1 ? nextLineBreakIndex : afterTimestamp.length;

      let associatedText = afterTimestamp.slice(0, endIndex).trim();

      // 불필요한 문자 제거 및 정리
      associatedText = associatedText
        .replace(/^\s+/, '') // 시작 공백 제거
        .replace(/\s+$/, '') // 끝 공백 제거
        .trim();

      return associatedText ? `${ts.raw}     ${associatedText}` : ts.raw;
    }).join('\n');

    // 현재 전체 페이지 내용에 추가
    const currentContent = noteText || '';
    const newContent = currentContent ? `${currentContent}\n\n${formattedContent}` : formattedContent;

    setNoteText(newContent);
    setShowTimestampImporter(false);
    setSelectedPages([]);

    showNotification(`${importedTimestamps.length}개의 타임스탬프를 가져왔습니다`, 'success');
  };

  // 페이지 선택 토글
  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  // 탭 위치에 따른 선택기 위치 계산
  const getSelectionUIPosition = (isColorPicker: boolean = false) => {
    if (!noteTabsRef.current) return { bottom: '100%', left: '0' };

    const tabsRect = noteTabsRef.current.getBoundingClientRect();
    const containerRect = noteTabsRef.current.offsetParent?.getBoundingClientRect();

    if (!containerRect) return { bottom: '100%', left: '0' };

    // 탭 상단에서 약간 위로 위치시키기
    const bottomOffset = containerRect.bottom - tabsRect.top + 8;

    return {
      bottom: `${bottomOffset}px`,
      left: isColorPicker ? '200px' : '0px', // 색상 선택기도 왼쪽으로, 이모지 옆에 배치
      right: 'auto'
    };
  };

  // 사용자 볼륨 변경 핸들러
  const handleVolumeChange = (newVolume: number) => {
    setUserSettings(prev => ({ ...prev, volume: newVolume }));
    setVolume(newVolume);
    setCurrentVolume(newVolume);
    if (player && player.setVolume) player.setVolume(newVolume);
  };

  // 사용자 속도 변경 핸들러
  // YouTube API는 재생 속도를 0.05 단위로 반올림하므로 미리 반올림 처리
  const handleSpeedChange = (newSpeed: number) => {
    // 0.05 단위로 반올림 (YouTube API 동작과 일치)
    const roundedSpeed = Math.round(newSpeed / 0.05) * 0.05;

    // 즉시 UI 업데이트 (반올림된 값으로)
    setPlaybackRate(roundedSpeed);
    setCurrentPlaybackRate(roundedSpeed);
    setCurrentRate(roundedSpeed);
    setUserSettings(prev => ({ ...prev, speed: roundedSpeed }));

    // YouTube API에 반올림된 값 설정
    if (player && player.setPlaybackRate) {
      player.setPlaybackRate(roundedSpeed);
    }
  };

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

  // 현재 활성 페이지와 noteText 동기화 (모든 페이지 포함)
  useEffect(() => {
    if (isUpdatingContentRef.current) return; // 업데이트 중이면 스킵

    const currentPage = getCurrentPage();
    if (currentPage) {
      // 모든 페이지 타입에 대해 저장된 내용 불러오기
      isUpdatingContentRef.current = true;
      setNoteText(currentPage.content || '');

      // 짧은 지연 후 플래그 해제
      setTimeout(() => {
        isUpdatingContentRef.current = false;
      }, 50);
    }
  }, [pageState.activePageIndex]); // 페이지 전환시에만 동기화

  // noteText 변경 시 현재 페이지에 저장 (모든 페이지 포함)
  useEffect(() => {
    if (isUpdatingContentRef.current) return; // 업데이트 중이면 스킵

    const currentPage = getCurrentPage();
    if (currentPage) {
      // 내용이 실제로 다를 때만 업데이트 (무한루프 방지)
      if (currentPage.content !== noteText) {
        // 일반 페이지와 특수 페이지 모두 저장
        handlePageUpdate(currentPage.id, { content: noteText });
      }
    }
  }, [noteText]); // noteText만 의존성으로 설정

  // 즐겨찾기 상태
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // requestAnimationFrame을 사용한 고정밀 추적 시스템 (500ms -> ~16ms)
  const trackingRef = useRef<number | null>(null);

  // localStorage에서 즐겨찾기 목록 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('youtube-favorites');
    if (savedFavorites) {
      try {
        const favList = JSON.parse(savedFavorites);
        setFavorites(favList);
      } catch (error) {
        console.error('즐겨찾기 목록 로드 실패:', error);
      }
    }
  }, []);

  // 영상 변경시 타임스탬프 상태 초기화
  // 중요: 새 영상 재생시 모든 타임스탬프가 순서대로 활성화될 수 있도록 초기화
  useEffect(() => {
    if (currentVideoId) {
      // 새 영상 로드시 타임스탬프 상태 초기화

      // 타임스탬프 우선순위 초기화
      setLastActiveIndex(-1);

      // 활성 타임스탬프 초기화
      setActiveTimestamp(null);
      setOriginalSettings(null);

      // 처리 플래그 초기화
      processingEntryRef.current = false;
      processingExitRef.current = false;

      // 자동점프 타이머 취소
      if (autoJumpTimeoutRef.current) {
        clearTimeout(autoJumpTimeoutRef.current);
        autoJumpTimeoutRef.current = null;
      }

      // 수동이동 감지 참조 초기화
      lastTimeRef.current = 0;
      ignoreManualMoveRef.current = false;
      originalUserSettingsRef.current = null;
    }
  }, [currentVideoId]);

  // 수동 이동 감지 함수
  const detectManualMove = useCallback((currentTime: number) => {
    // 더블클릭 직후에는 수동이동 감지 무시
    // 중요: 더블클릭 seekTo가 수동이동으로 오인되는 것을 방지
    if (ignoreManualMoveRef.current) {
      return;
    }

    const lastTime = lastTimeRef.current || currentTime;
    const timeDiff = Math.abs(currentTime - lastTime);

    if (timeDiff > 2.0) {
      // 수동이동 감지 및 상태 초기화

      // 수동이동 시 스마트 인덱스 설정 (중첩 상황 고려)
      const timestamps = parseTimestamps(noteText);
      if (timestamps.length > 0) {
        let targetIndex = -1;

        // 현재 시간이 어떤 타임스탬프 구간에 있는지 먼저 확인
        for (let i = 0; i < timestamps.length; i++) {
          const stamp = timestamps[i];
          if (currentTime >= stamp.startTime - 0.01 && currentTime <= stamp.endTime + 0.01) {
            // 현재 구간에 있다면 해당 타임스탬프의 이전 인덱스로 설정
            targetIndex = Math.max(-1, i - 1);
            break;
          }
        }

        // 구간에 없다면 가장 가까운 타임스탬프 찾기
        if (targetIndex === -1) {
          let closestIndex = -1;
          let closestDistance = Infinity;

          for (let i = 0; i < timestamps.length; i++) {
            const stamp = timestamps[i];
            const distance = Math.abs(currentTime - stamp.startTime);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }

          targetIndex = Math.max(-1, closestIndex - 1);
        }

        setLastActiveIndex(targetIndex);
      }

      // 자동점프 타이머 취소
      if (autoJumpTimeoutRef.current) {
        clearTimeout(autoJumpTimeoutRef.current);
        autoJumpTimeoutRef.current = null;
      }

      // 처리 플래그 초기화 (새로운 진입/이탈 처리를 위해)
      processingEntryRef.current = false;
      processingExitRef.current = false;

      // 수동 이동 후 저장된 원래 설정 초기화
      originalUserSettingsRef.current = null;

      // activeTimestamp 초기화 (새로운 타임스탬프 진입 가능하도록)
      setActiveTimestamp(null);
      setOriginalSettings(null);
    }
    lastTimeRef.current = currentTime;
  }, [playerState, noteText]);

  // 파싱된 타임스탬프 캐시
  const parsedTimestampsRef = useRef<any[] | null>(null);
  const lastNoteTextRef = useRef<string>('');

  // 통합 타임스탬프 처리 함수 (고정밀, 최적화됨)
  const processTimestamps = useCallback((currentTime: number) => {
    try {
      // 수동 이동 감지 먼저 실행
      detectManualMove(currentTime);

      // 현재 시간 업데이트
      setCurrentTime(currentTime);

      // 타임스탬프 캐싱으로 성능 최적화
      let timestamps;
      if (lastNoteTextRef.current !== noteText) {
        timestamps = parseTimestamps(noteText);
        parsedTimestampsRef.current = timestamps;
        lastNoteTextRef.current = noteText;
      } else {
        timestamps = parsedTimestampsRef.current || [];
      }

      if (timestamps.length === 0) return;

      // 타임스탬프 찾기 (최적화된 검색)
      let currentStamp = null;
      let candidateIndex = -1;
      const timeMargin = 0.01; // 감지 오차 10ms (소수점 2자리 충분)

      if (activeTimestamp) {
        // 현재 activeTimestamp가 있을 때: 전체 검색 (우선순위 무시)
        for (let i = 0; i < timestamps.length; i++) {
          const stamp = timestamps[i];
          if (currentTime >= stamp.startTime - timeMargin && currentTime <= stamp.endTime + timeMargin) {
            currentStamp = stamp;
            candidateIndex = i;
            break;
          }
        }
      } else {
        // activeTimestamp가 없을 때: 노트 순서 우선순위 (전체 검색)
        // 노트 작성 순서대로 첫 번째 매치되는 타임스탬프 실행
        for (let i = 0; i < timestamps.length; i++) {
          const stamp = timestamps[i];
          if (currentTime >= stamp.startTime - timeMargin && currentTime <= stamp.endTime + timeMargin) {
            // 이미 실행된 타임스탬프는 건너뛰기 (중복 실행 방지)
            if (i > lastActiveIndex) {
              currentStamp = stamp;
              candidateIndex = i;
              break;
            }
          }
        }
      }
        

      // 타임스탬프 진입 처리 (중복 방지, 소수점 비교 개선)
      // 조건: 1) 새 타임스탬프가 있고, 2) 현재 활성 타임스탬프와 완전히 다른 타임스탬프이고, 3) 진입 처리 중이 아님
      const isDifferentTimestamp = !activeTimestamp ||
        (Math.abs(activeTimestamp.startTime - (currentStamp?.startTime || 0)) > 0.01 ||
         Math.abs(activeTimestamp.endTime - (currentStamp?.endTime || 0)) > 0.01 ||
         activeTimestamp.volume !== currentStamp?.volume ||
         Math.abs(activeTimestamp.speed - (currentStamp?.speed || 0)) > 0.01 ||
         activeTimestamp.action !== currentStamp?.action);

        if (currentStamp && isDifferentTimestamp && !processingEntryRef.current) {
          processingEntryRef.current = true;
          console.log(`[진입] 타임스탬프 ${candidateIndex}: ${currentStamp.startTime.toFixed(2)}-${currentStamp.endTime.toFixed(2)}, lastActiveIndex: ${lastActiveIndex}`);
          
          // 활성 타임스탬프 인덱스 업데이트
          setLastActiveIndex(candidateIndex);
          
          // 자동점프에서 원래 사용자 설정 저장
          if (!originalUserSettingsRef.current) {
            const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
            const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;
            
            originalUserSettingsRef.current = {
              volume: currentPlayerVolume,
              speed: currentPlayerSpeed
            };
            // 원래 사용자 설정 저장 완료
          }
          
          // 현재 플레이어의 실제 값을 백업 (타임스탬프 진입 전 상태)
          const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
          const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;
          
          setOriginalSettings({
            volume: currentPlayerVolume,
            speed: currentPlayerSpeed
          });
          
          // 진입 전 상태 백업 완료
          
          // 타임스탬프 설정 적용
          if (player.setVolume) player.setVolume(currentStamp.volume);
          if (player.setPlaybackRate) player.setPlaybackRate(currentStamp.speed);

          // activeTimestamp에 현재 인덱스 정보도 함께 저장 (자동점프시 사용)
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
              // 정지 기능 - 진입 즉시 실행
              const pauseSeconds = parseInt(currentStamp.action.substring(1));
              // 정지 액션 실행
              
              // 기존 방식: 실제 정지
              player.pauseVideo();
              showNotification(`${pauseSeconds}초간 정지`, 'warning');

              // 지정된 시간 후 재생 재개
              setTimeout(() => {
                const resumeTime = player.getCurrentTime ? player.getCurrentTime() : 0;
                // 정지 시간 종료 - 재생 재개
                try {
                  player.playVideo();
                  showNotification('재생 재개', 'success');
                } catch (error) {
                  console.error('재생 재개 오류:', error);
                }
              }, pauseSeconds * 1000);
              
            } else if (currentStamp.action === '->') {
              // 자동 점프 설정 (단순화된 로직)
              const timeToEnd = currentStamp.endTime - currentTime;
              const realTimeToEnd = Math.max(100, (timeToEnd / currentStamp.speed) * 1000); // 최소 100ms 보장

              // 기존 타이머 취소
              if (autoJumpTimeoutRef.current) {
                clearTimeout(autoJumpTimeoutRef.current);
                autoJumpTimeoutRef.current = null;
              }

              autoJumpTimeoutRef.current = setTimeout(() => {
                try {
                  const timestamps = parseTimestamps(noteText);
                  const nextStamp = timestamps[candidateIndex + 1];

                  if (nextStamp) {
                    // 상태 정리
                    setActiveTimestamp(null);
                    setOriginalSettings(null);
                    processingEntryRef.current = false;
                    processingExitRef.current = false;

                    // 스마트 거리 기반 점프 (로딩 최소화)
                    const jumpCurrentTime = player.getCurrentTime();
                    const distance = Math.abs(nextStamp.startTime - jumpCurrentTime);

                    // 3초 이내: allowSeekAhead = false (즉시 점프, 로딩 없음)
                    // 3-10초: allowSeekAhead = false (빠른 점프)
                    // 10초 이상: allowSeekAhead = true (버퍼링 허용)
                    const allowSeekAhead = distance > 10;
                    const useBuffer = distance <= 3 ? false : allowSeekAhead;

                    // 중첩된 타임스탬프도 무조건 점프 (사용자 의도 존중)
                    console.log(`[자동점프] ${candidateIndex} → ${candidateIndex + 1}: ${nextStamp.startTime.toFixed(2)}-${nextStamp.endTime.toFixed(2)}`);
                    player.seekTo(nextStamp.startTime, useBuffer);
                    showNotification(`자동 점프: ${formatTime(nextStamp.startTime)}로 이동 (거리: ${distance.toFixed(1)}초)`, 'success');

                    // lastActiveIndex 업데이트 (다음 타임스탬프가 활성화되도록)
                    setLastActiveIndex(candidateIndex);
                    console.log(`[자동점프] lastActiveIndex 업데이트: ${candidateIndex}`);

                    // 원래 설정 복원 (단순화)
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
                    // 마지막 타임스탬프 - 기본값으로 복원
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
                  // 자동 점프 오류시 조용히 무시하고 상태만 정리
                  setActiveTimestamp(null);
                  setOriginalSettings(null);
                  processingEntryRef.current = false;
                  processingExitRef.current = false;
                }

                // 타이머 정리
                autoJumpTimeoutRef.current = null;
              }, realTimeToEnd);
            }
          }
          
          // 진입 처리 완료 후 플래그 리셋
          setTimeout(() => {
            processingEntryRef.current = false;
          }, 100);
          
        } else if (!currentStamp && activeTimestamp && !processingExitRef.current) {
          // 타임스탬프 구간 이탈 (중복 처리 방지)
          // 이탈 조건: 현재 위치가 타임스탬프 구간 밖이고 activeTimestamp가 있을 때
          // 중요: 이 로직은 더블클릭 종료시간 이동시에도 실행되어 재생 기본값으로 복원함
          processingExitRef.current = true;
          console.log(`[이탈] 타임스탬프 구간 이탈: ${activeTimestamp.startTime.toFixed(2)}-${activeTimestamp.endTime.toFixed(2)}, 현재시간: ${currentTime.toFixed(2)}`);

          // 우측 패널의 재생 기본값으로 복원 (originalSettings 무시)
          // 타임스탬프 이탈 시에는 항상 재생 기본값으로 복원하여 일관성 유지
          // 절대 변경 금지: 이것을 변경하면 타임스탬프 종료시 설정이 남아있게 됨
          // 재생 기본값으로 복원 (originalSettings 무시)

          // 우측 패널 설정에서 재생 기본값 가져오기
          const defaultVolume = uiSettings?.재생기본값?.defaultVolume ?? 100;
          const defaultSpeed = uiSettings?.재생기본값?.defaultPlaybackRate ?? 1.0;

          if (player.setVolume) player.setVolume(defaultVolume);
          if (player.setPlaybackRate) player.setPlaybackRate(defaultSpeed);

          setCurrentVolume(defaultVolume);
          setCurrentPlaybackRate(defaultSpeed);
          setVolume(defaultVolume);
          setPlaybackRate(defaultSpeed);
          setCurrentRate(defaultSpeed);

          // userSettings도 재생 기본값으로 업데이트
          setUserSettings({
            volume: defaultVolume,
            speed: defaultSpeed
          });

          showNotification(`재생 기본값으로 복원: 볼륨 ${defaultVolume}%, 속도 ${defaultSpeed}x`, 'info');
          
          setActiveTimestamp(null);
          setOriginalSettings(null);
          
          // 다음 체크에서는 이탈 처리가 완료되었음을 인식하도록 지연
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
      // 재생 중이 아니면 추적 중단
      if (trackingRef.current) {
        cancelAnimationFrame(trackingRef.current);
        trackingRef.current = null;
      }
      return;
    }

    // requestAnimationFrame으로 고정밀 추적 시작
    const startTracking = () => {
      try {
        const currentTime = player.getCurrentTime();
        if (currentTime !== undefined && currentTime !== null) {
          processTimestamps(currentTime);
        }
      } catch (error) {
        // requestAnimationFrame 추적 오류 발생시 조용히 무시
      }

      // 재생 중이면 계속 추적
      if (player && playerState === 1) {
        trackingRef.current = requestAnimationFrame(startTracking);
      }
    };

    // 추적 시작
    trackingRef.current = requestAnimationFrame(startTracking);

    // cleanup
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
    
    // YouTubePlayer 형식으로 변환: {timeInSeconds, duration, volume, playbackRate, timeFormatted}
    const convertedTimestamps = timestamps.map(stamp => ({
      timeInSeconds: stamp.startTime,
      duration: stamp.endTime - stamp.startTime,
      volume: stamp.volume,
      playbackRate: stamp.speed,
      timeFormatted: formatTime(stamp.startTime)
    }));
    
    setTimestamps(convertedTimestamps);
  }, [noteText, setTimestamps]);

  // 영상 변경 시 재생 기본값 적용
  useEffect(() => {
    if (currentVideoId && player && isPlayerReady) {
      const defaultVolume = uiSettings?.재생기본값?.defaultVolume || 100;
      const defaultSpeed = uiSettings?.재생기본값?.defaultPlaybackRate || 1.0;
      
      // 새 영상 로드시 기본값 적용
      
      // 플레이어에 기본값 적용
      if (player.setVolume) player.setVolume(defaultVolume);
      if (player.setPlaybackRate) player.setPlaybackRate(defaultSpeed);
      
      // userSettings 초기화 (중요: 타임스탬프 복원 시 이 값이 사용됨)
      setUserSettings({
        volume: defaultVolume,
        speed: defaultSpeed
      });
      
      // UI 상태 동기화
      setCurrentVolume(defaultVolume);
      setCurrentPlaybackRate(defaultSpeed);
      setVolume(defaultVolume);
      setPlaybackRate(defaultSpeed);
      setCurrentRate(defaultSpeed);
      
      showNotification(`새 영상 로드: 기본 설정 적용 (볼륨 ${defaultVolume}%, 속도 ${defaultSpeed}x)`, 'info');
    }
  }, [currentVideoId, player, isPlayerReady, uiSettings?.재생기본값]);

  // 현재 영상의 즐겨찾기 상태 확인
  useEffect(() => {
    if (currentVideoId) {
      setIsFavorite(favorites.includes(currentVideoId));
    }
  }, [currentVideoId, favorites]);

  // 즐겨찾기 추가/제거
  const toggleFavorite = () => {
    if (!currentVideoId) {
      showNotification('영상 ID를 찾을 수 없습니다.', 'error');
      return;
    }

    let newFavorites;
    if (isFavorite) {
      // 즐겨찾기에서 제거
      newFavorites = favorites.filter(id => id !== currentVideoId);
      showNotification('즐겨찾기에서 제거되었습니다.', 'info');
    } else {
      // 즐겨찾기에 추가
      newFavorites = [...favorites, currentVideoId];
      showNotification('즐겨찾기에 추가되었습니다.', 'success');
    }

    setFavorites(newFavorites);
    localStorage.setItem('youtube-favorites', JSON.stringify(newFavorites));
  };

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
      // 영상 일시정지
      player.pauseVideo();
      
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
        }
        // 자동점프 플래그가 true여도 새 타임스탬프에는 화살표 추가하지 않음
        // 화살표는 이전 타임스탬프에만 추가됨 (위의 1100-1129줄에서 처리)

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
          
          // 더블클릭시 진입 처리 플래그 설정 (자동 감지와 중복 방지)
          processingEntryRef.current = true;
          processingExitRef.current = true; // 이탈 감지도 일시 차단

          // 더블클릭 후 수동이동 감지 무시 플래그 설정
          // 절대 변경 금지: 이게 없으면 seekTo가 수동이동으로 감지되어 우선순위가 리셋됨
          ignoreManualMoveRef.current = true;

          // 원본 사용자 설정 백업 (더블클릭 이전 상태 보존)
          if (!originalUserSettingsRef.current) {
            const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
            const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;

            originalUserSettingsRef.current = {
              volume: currentPlayerVolume,
              speed: currentPlayerSpeed
            };
            console.log(`[더블클릭] 원본 사용자 설정 백업:`, originalUserSettingsRef.current);
          }

          // originalSettings 백업 (이탈시 복원용)
          const currentPlayerVolume = player.getVolume ? player.getVolume() : currentVolume;
          const currentPlayerSpeed = player.getPlaybackRate ? player.getPlaybackRate() : currentPlaybackRate;

          setOriginalSettings({
            volume: currentPlayerVolume,
            speed: currentPlayerSpeed
          });

          console.log(`[더블클릭] 진입 전 상태 백업 - 볼륨: ${currentPlayerVolume}%, 속도: ${currentPlayerSpeed}x`);

          // 타임스탬프 설정 즉시 적용
          // 중요: 더블클릭시 타임스탬프 설정을 즉시 적용해야 함
          // 절대 변경 금지: 이 부분을 제거하면 더블클릭시 설정이 적용되지 않음
          if (player.setVolume) {
            player.setVolume(timestampVolume);
          }
          if (player.setPlaybackRate) {
            player.setPlaybackRate(timestampSpeed);
          }

          // UI 상태도 즉시 동기화
          // 이것도 중요: UI와 플레이어 상태를 일치시켜야 함
          setCurrentVolume(timestampVolume);
          setCurrentPlaybackRate(timestampSpeed);
          setVolume(timestampVolume);
          setPlaybackRate(timestampSpeed);
          setCurrentRate(timestampSpeed);
          
          // 클릭 위치에 따라 시작시간/종료시간 결정
          const timestampStart = clickedMatch?.index || 0;
          const dashPos = clickedTimestamp.indexOf('-');
          const isEndTimeClick = clickPosition > (timestampStart + dashPos);
          const targetTime = isEndTimeClick ? endTime : startTime;

          console.log(`[더블클릭] ${isEndTimeClick ? '종료' : '시작'}시간 클릭 - ${targetTime.toFixed(3)}초로 이동`);

          // 목표 위치로 이동하고 재생
          player.seekTo(targetTime, true);
          player.playVideo();

          // 더블클릭한 타임스탬프의 인덱스 찾기
          const timestamps = parseTimestamps(noteText);
          let clickedIndex = -1;
          for (let i = 0; i < timestamps.length; i++) {
            if (timestamps[i].raw === clickedTimestamp) {
              clickedIndex = i;
              break;
            }
          }

          // 더블클릭 시 항상 activeTimestamp 설정 (중복 실행 방지)
          setActiveTimestamp({
            startTime,
            endTime,
            volume: timestampVolume,
            speed: timestampSpeed, // 타임스탬프 텍스트의 속도 사용
            action: actionMode,
            raw: clickedTimestamp,
            index: clickedIndex
          });
          console.log(`[더블클릭] activeTimestamp 설정 - ${isEndTimeClick ? '종료' : '시작'}시간 클릭`);

          // 더블클릭한 타임스탬프 인덱스로 우선순위 설정
          // 중요: clickedIndex - 1로 설정해야 자동 감지 로직에서 clickedIndex를 체크함
          // 자동 감지는 lastActiveIndex + 1부터 체크하므로
          // 절대 변경 금지: clickedIndex로 설정하면 자동 감지가 못 찾아서 이탈 로직 실행됨
          setLastActiveIndex(clickedIndex - 1);
          console.log(`[더블클릭] 우선순위 설정: ${clickedIndex - 1} (타임스탬프 인덱스: ${clickedIndex})`);

          // 타임스탬프 설정 안정성 알림
          showNotification(`타임스탬프 적용: 볼륨 ${timestampVolume}%, 속도 ${timestampSpeed}x`, 'success');

          // 처리 플래그 해제 (1초 후 - 자동 감지와의 간섭 방지)
          // 중요: 더블클릭 후 seekTo가 완료되고 영상이 안정화될 때까지 충분한 시간 필요
          // 절대 변경 금지: 500ms도 짧아서 seekTo 버퍼링 중에 이탈 감지가 발생함
          setTimeout(() => {
            processingEntryRef.current = false;
            processingExitRef.current = false; // 이탈 감지 재활성화
            ignoreManualMoveRef.current = false; // 수동이동 감지 재활성화
            console.log(`[더블클릭] 처리 플래그 해제 - 자동 감지, 이탈 감지 및 수동이동 감지 재개`);
          }, 1000);

          // 종료시간 클릭의 경우에만 자동 이탈 처리
          if (isEndTimeClick) {
            console.log(`[더블클릭] 종료시간 클릭 - 자동 이탈 로직 의존`);
            // 종료시간 클릭은 별도 타이머 없이 자동 감지 루프의 이탈 로직에 의존
          }
          
          // 동작 모드에 따른 처리 (더블클릭 즉시 실행)
          if (actionMode && actionMode.startsWith('|')) {
            // 정지 기능: |3 = 3초간 정지 후 계속 재생
            const pauseSeconds = parseInt(actionMode.substring(1));
            if (!isNaN(pauseSeconds)) {
              console.log(`[더블클릭] 정지 액션 실행: ${pauseSeconds}초간 정지`);

              // 기존 방식: 실제 정지
              player.pauseVideo();
              showNotification(`${pauseSeconds}초간 정지`, 'warning');

              // 지정된 시간 후 재생 재개
              setTimeout(() => {
                console.log(`[더블클릭] 정지 시간 종료 - 재생 재개`);
                try {
                  player.playVideo();
                  showNotification('재생 재개', 'success');
                } catch (error) {
                  console.error('재생 재개 오류:', error);
                }
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
    <Card className="h-full" onClick={handleOutsideClick}>
      <CardContent className="p-4 h-full flex flex-col">
        {/* 재생 컨트롤 섹션 (uiSettings에 따라 표시) */}
        {uiSettings?.재생컨트롤?.전체표시 !== false && (
          <div className="mb-4 space-y-2">
            {/* 메인 드래그 컨트롤 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1"></div>
                <button
                  onClick={() => setControlMode(controlMode === 'normal' ? 'timeSkip' : 'normal')}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
                >
                  {controlMode === 'normal' ? '재생 컨트롤' : '영상 건너뛰기'}
                </button>
                <div className="flex-1 flex items-center justify-end space-x-1 text-sm text-gray-600 font-mono">
                  <span>{Math.round(volume || 100)}%</span>
                  <span>•</span>
                  <span>{(currentRate || 1.0).toFixed(2)}x</span>
                </div>
              </div>

              {/* 일반 모드: 드래그 컨트롤 */}
              {controlMode === 'normal' && (
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
              )}

              {/* 시간 건너뛰기 모드 */}
              {controlMode === 'timeSkip' && (
                <TimeSkipControls
                  player={player}
                  isPlayerReady={isPlayerReady}
                  showNotification={showNotification}
                />
              )}
            </div>

            {/* 세부 컨트롤 바 */}
            {(uiSettings?.재생컨트롤?.볼륨 !== false || uiSettings?.재생컨트롤?.속도 !== false || uiSettings?.재생컨트롤?.도장 !== false || uiSettings?.재생컨트롤?.녹화 !== false || uiSettings?.재생컨트롤?.편집 !== false) && (
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
                        handleVolumeChange(newVolume);
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
                      step="0.05"  // 0.05 단위로 변경 (YouTube API와 일치)
                      value={playbackRate}
                      onChange={(e) => {
                        const newRate = Number(e.target.value);
                        handleSpeedChange(newRate);
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
          {/* 왼쪽탭 레이아웃이 활성화된 경우 */}
          {uiSettings?.왼쪽탭레이아웃?.사용 === true ? (
            <div className="flex-1 flex">
              {/* 왼쪽 세로 탭 */}
              <LeftSidebarTabs
                activeTab={activeMainTab}
                onTabChange={setActiveMainTab}
              />

              {/* 우측 컨텐츠 영역 */}
              <div className="flex-1 flex flex-col ml-1">
                {/* 노트 탭 */}
                {activeMainTab === 'note' && uiSettings?.노트영역?.표시 !== false && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1">
                      {/* 전체 페이지 전용: 타임스탬프 가져오기 버튼 */}
                      {getCurrentPage()?.isSpecial && (
                        <div className="mb-2 flex justify-end gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowTimestampImporter(!showTimestampImporter);
                            }}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            📋 타임스탬프 가져오기
                          </Button>
                        </div>
                      )}

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
                        className="w-full resize-y min-h-[130px] overflow-auto scrollbar-hide"
                        style={{
                          WebkitOverflowScrolling: 'touch',
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none'
                        }}
                      />
                    </div>

                    {/* 페이지 탭 시스템 - 우측 영역에만 표시 */}
                    <div ref={noteTabsRef} style={{ marginTop: '4px' }}>
                      <NoteTabs
                        pageState={pageState}
                        onPageChange={handlePageChange}
                        onPageUpdate={handlePageUpdate}
                        onPageAdd={handlePageAdd}
                        onPageDelete={handlePageDelete}
                        onPageReorder={handlePageReorder}
                        onEmojiClick={handleEmojiClick}
                        onColorClick={handleColorClick}
                      />
                    </div>
                  </div>
                )}

                {/* 화면텍스트 탭 */}
                {activeMainTab === 'overlay' && uiSettings?.화면텍스트?.패널표시 !== false && (
                  <div className="flex-1">
                    <OverlayInput
                      overlays={overlays || []}
                      setOverlays={setOverlays}
                      isPlayerReady={isPlayerReady}
                      player={player}
                      showNotification={showNotification}
                      uiSettings={uiSettings}
                      onSettingsChange={onSettingsChange}
                      noteText={noteText}
                      currentVideoId={currentVideoId}
                    />
                  </div>
                )}

                {/* 돋보기 탭 */}
                {activeMainTab === 'zoom' && (
                  <div className="flex-1">
                    <ZoomContent
                      player={player}
                      isPlayerReady={isPlayerReady}
                      currentTime={currentTime}
                      showNotification={showNotification}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 기존 레이아웃 (왼쪽탭 비활성화시) */
            <>
              {/* 노트 영역 - UI 설정에 따라 조건부 렌더링 */}
              {uiSettings?.노트영역?.표시 !== false && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1">
                    {/* 전체 페이지 전용: 타임스탬프 가져오기 버튼 */}
                    {getCurrentPage()?.isSpecial && (
                      <div className="mb-2 flex justify-end gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTimestampImporter(!showTimestampImporter);
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          📋 타임스탬프 가져오기
                        </Button>
                      </div>
                    )}

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
                      className="w-full resize-y min-h-[130px] overflow-auto scrollbar-hide"
                      style={{
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    />

                    {/* 다중 페이지 탭 시스템 - 노트 영역과 연결된 위치 */}
                    <div ref={noteTabsRef} style={{ marginTop: '4px' }}>
                      <NoteTabs
                        pageState={pageState}
                        onPageChange={handlePageChange}
                        onPageUpdate={handlePageUpdate}
                        onPageAdd={handlePageAdd}
                        onPageDelete={handlePageDelete}
                        onPageReorder={handlePageReorder}
                        onEmojiClick={handleEmojiClick}
                        onColorClick={handleColorClick}
                      />
                    </div>

                    {/* 이모지 선택기 - 탭 근처에 위치 */}
                    {showEmojiPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          ...getSelectionUIPosition(),
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          maxWidth: '280px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {DEFAULT_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '16px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              transition: 'background-color 0.2s'
                            }}
                            onClick={() => handleEmojiSelect(showEmojiPicker, emoji)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 색상 선택기 - 탭 근처 우측에 위치 */}
                    {showColorPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          ...getSelectionUIPosition(true),
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          maxWidth: '200px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {PAGE_COLORS.map((color) => (
                          <button
                            key={color}
                            style={{
                              width: '32px',
                              height: '32px',
                              backgroundColor: color,
                              border: '2px solid rgba(0,0,0,0.2)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s'
                            }}
                            onClick={() => handleColorSelect(showColorPicker, color)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.borderColor = '#007acc';
                              e.currentTarget.style.borderWidth = '3px';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                              e.currentTarget.style.borderWidth = '2px';
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* 타임스탬프 가져오기 페이지 선택 UI */}
                    {showTimestampImporter && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '120px',
                          left: '0px',
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '16px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          maxWidth: '400px',
                          width: '100%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="text-sm font-semibold mb-3">페이지 선택</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {pageState.pages.filter(page => !page.isSpecial).map(page => (
                            <label key={page.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedPages.includes(page.id)}
                                onChange={() => togglePageSelection(page.id)}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {page.emoji} {page.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({parseTimestamps(page.content || '').length}개)
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2 justify-between">
                          <button
                            onClick={() => {
                              const allPageIds = pageState.pages.filter(p => !p.isSpecial).map(p => p.id);
                              const isAllSelected = allPageIds.length > 0 && allPageIds.every(id => selectedPages.includes(id));
                              setSelectedPages(isAllSelected ? [] : allPageIds);
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            {(() => {
                              const allPageIds = pageState.pages.filter(p => !p.isSpecial).map(p => p.id);
                              const isAllSelected = allPageIds.length > 0 && allPageIds.every(id => selectedPages.includes(id));
                              return isAllSelected ? '전체 해제' : '전체 선택';
                            })()}
                          </button>
                          <button
                            onClick={() => {
                              handleImportTimestamps();
                            }}
                            disabled={selectedPages.length === 0}
                            className={`text-xs px-3 py-1 rounded ${
                              selectedPages.length === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            가져오기 ({selectedPages.length}개)
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-2">
                      <div>
                        {녹화중 && (
                          <span className="text-xs text-red-500 animate-pulse">● 녹화 중</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 기존 레이아웃에서만 오버레이 입력 표시 */}
              {uiSettings?.화면텍스트?.패널표시 !== false && (
                <OverlayInput
                  overlays={overlays || []}
                  setOverlays={setOverlays}
                  isPlayerReady={isPlayerReady}
                  player={player}
                  showNotification={showNotification}
                  uiSettings={uiSettings}
                  onSettingsChange={onSettingsChange}
                  noteText={noteText}
                  currentVideoId={currentVideoId}
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
            </>
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