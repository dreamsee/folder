import { useState, useEffect } from "react";
import YouTubePlayer from "@/components/YouTubePlayer";
import { Coordinates } from "@/components/TextOverlay";
import NoteArea from "@/components/NoteArea";
import SimpleNoteArea from "@/components/SimpleNoteArea";
import VideoLoader from "@/components/VideoLoader";
import Notification from "@/components/Notification";
import { RecordingSession } from "@/components/RecordingMode";
import SettingsPanel, { UISettings } from "@/components/SettingsPanel";
import ScreenLock from "@/components/ScreenLock";
import FavoriteManager from "@/components/FavoriteManager";
import DebugLogPanel from "@/components/DebugLogPanel";
import CommentSidePanel from "@/components/CommentSidePanel";
// import { useToast } from "@/hooks/use-toast"; // 토스트 비활성화
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { OverlayData, OverlayPosition } from "@/components/TextOverlay";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { NotePageState, NotePage, PAGE_COLORS, DEFAULT_EMOJIS, SPECIAL_PAGES } from "@/types/NotePage";

const HomePage = () => {
  const [player, setPlayer] = useState<any | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState("");
  const [currentVideoInfo, setCurrentVideoInfo] = useState<{
    title: string;
    channelName: string;
    thumbnailUrl: string;
  } | undefined>(undefined);
  const [playerState, setPlayerState] = useState(-1);
  const [availableRates] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  const [currentRate, setCurrentRate] = useState(1);
  const [timestamps, setTimestamps] = useState<any[]>([]); // 타임스탬프 공유 상태
  const [overlays, setOverlays] = useState<OverlayData[]>([]); // 오버레이 공유 상태
  const [recordingSessions, setRecordingSessions] = useState<RecordingSession[]>([]); // 녹화 세션 목록
  const [sessionToApply, setSessionToApply] = useState<RecordingSession | null>(null); // 노트에 적용할 세션
  const [currentPlayTime, setCurrentPlayTime] = useState(0); // 현재 재생 시간

  // 다중 페이지 시스템 상태
  const [pageState, setPageState] = useState<NotePageState>(() => {
    // 초기 페이지 설정: 기본 페이지 + 통합 타임스탬프 페이지
    const defaultPage: NotePage = {
      id: 'page-default',
      name: '메인',
      emoji: '📝',
      content: '',
      color: PAGE_COLORS[0],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const unifiedPage: NotePage = {
      ...SPECIAL_PAGES.UNIFIED_TIMESTAMPS,
      content: '', // 동적으로 생성됨
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return {
      pages: [unifiedPage, defaultPage], // 전체 페이지를 맨 앞으로 이동
      activePageIndex: 0 // 전체 페이지가 기본 활성 페이지
    };
  });

  // const { toast } = useToast(); // 토스트 비활성화
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  // 설정 관련 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [magnifierSettings, setMagnifierSettings] = useState({
    enabled: true,
    zoom: 2.0,
    size: 2, // 1: 소, 2: 중, 3: 대
    mode: 'hold' as 'hold' | 'toggle', // hold: 홀드시 확대, toggle: 클릭시 확대/축소
  });
  const [uiSettings, setUiSettings] = useState<UISettings>({
    상단부: { 제목표시: true, 부제목표시: true, 부제목내용: "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
    검색창: { 유지: true, 목록유지: false },
    바설정: { 커스텀바: true, 챕터바: true },
    재생컨트롤: { 전체표시: true, 볼륨: true, 속도: true, 도장: true, 녹화: true },
    왼쪽탭레이아웃: { 사용: false },
    노트영역: { 표시: true },
    화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙" },
    프리셋: { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
    재생기본값: { defaultVolume: 100, defaultPlaybackRate: 1.0 },
  });

  // 즐겨찾기 관련 상태
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  
  // 검색 팝업 상태
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);

  // 디버그 로그 패널 상태
  const [isDebugLogOpen, setIsDebugLogOpen] = useState(false);

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchPopupOpen) {
        setIsSearchPopupOpen(false);
      }
    };

    if (isSearchPopupOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchPopupOpen]);


  // YouTubeIframeAPI 준비되면 호출되는 콜백
  useEffect(() => {
    // @ts-ignore - YouTube API는 전역 객체에 함수를 추가함
    window.onYouTubeIframeAPIReady = () => {
    };
  }, []);

  // 알림 표시 함수 (토스트 비활성화)
  const showNotification = (message: string, type: "info" | "success" | "warning" | "error") => {
  };

  // 드래그로 오버레이 위치 변경 처리
  const handleOverlayPositionChange = (id: string, newCoordinates: Coordinates) => {
    setOverlays(prev => prev.map(overlay => 
      overlay.id === id 
        ? { ...overlay, coordinates: newCoordinates }
        : overlay
    ));
  };

  // 오버레이 저장/로드 함수들
  const saveOverlaysForVideo = (videoId: string, overlays: OverlayData[]) => {
    if (!videoId) return;
    const storageKey = `overlays_${videoId}`;
    localStorage.setItem(storageKey, JSON.stringify(overlays));
  };

  const loadOverlaysForVideo = (videoId: string): OverlayData[] => {
    if (!videoId) return [];
    const storageKey = `overlays_${videoId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('오버레이 로드 실패:', error);
      return [];
    }
  };

  // 녹화 세션 관련 함수들
  const handleRecordingComplete = (session: RecordingSession) => {
    setRecordingSessions(prev => [session, ...prev]);
    // localStorage에 저장
    localStorage.setItem('recordingSessions', JSON.stringify([session, ...recordingSessions]));
  };

  const handleEditSession = (_session: RecordingSession) => {
    // 편집 모달 열기 (향후 구현)
    showNotification("편집 기능은 곧 추가될 예정입니다.", "info");
  };

  const handleDeleteSession = (sessionId: string) => {
    setRecordingSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      localStorage.setItem('recordingSessions', JSON.stringify(updated));
      return updated;
    });
    showNotification("녹화 세션이 삭제되었습니다.", "info");
  };

  const handleCopySession = (session: RecordingSession) => {
    const copiedSession: RecordingSession = {
      ...session,
      id: `rec-${Date.now()}`,
      title: `${session.title} (복사본)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setRecordingSessions(prev => [copiedSession, ...prev]);
    localStorage.setItem('recordingSessions', JSON.stringify([copiedSession, ...recordingSessions]));
    showNotification("녹화 세션이 복사되었습니다.", "success");
  };

  const handleApplyToNote = (session: RecordingSession) => {
    setSessionToApply(session);
    showNotification("녹화 세션을 노트에 적용했습니다.", "success");
    
    // 세션 적용 후 상태 초기화 (1초 후)
    setTimeout(() => {
      setSessionToApply(null);
    }, 1000);
  };

  // localStorage에서 녹화 세션 및 UI 설정 불러오기
  useEffect(() => {
    const savedSessions = localStorage.getItem('recordingSessions');
    if (savedSessions) {
      try {
        const sessions = JSON.parse(savedSessions);
        setRecordingSessions(sessions);
      } catch (error) {
        console.error('녹화 세션 로드 실패:', error);
      }
    }

    const savedSettings = localStorage.getItem('uiSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setUiSettings(settings);
      } catch (error) {
        console.error('UI 설정 로드 실패:', error);
      }
    }
  }, []);

  // UI 설정 변경 시 localStorage에 저장
  const handleSettingsChange = (newSettings: UISettings) => {
    setUiSettings(newSettings);
    localStorage.setItem('uiSettings', JSON.stringify(newSettings));
  };

  // 영상 변경 시 오버레이 저장/로드
  useEffect(() => {
    if (currentVideoId) {
      // 이전 영상의 오버레이를 저장
      const prevVideoId = localStorage.getItem('lastVideoId');
      if (prevVideoId && prevVideoId !== currentVideoId) {
        saveOverlaysForVideo(prevVideoId, overlays);
      }
      
      // 새 영상의 오버레이를 로드
      const videoOverlays = loadOverlaysForVideo(currentVideoId);
      setOverlays(videoOverlays);
      
      // 현재 영상 ID 저장
      localStorage.setItem('lastVideoId', currentVideoId);
    }
  }, [currentVideoId]);

  // 오버레이 업데이트 시 자동 저장
  useEffect(() => {
    if (currentVideoId && overlays.length >= 0) {
      saveOverlaysForVideo(currentVideoId, overlays);
    }
  }, [overlays, currentVideoId]);

  // 재생 시간 추적
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    const interval = setInterval(() => {
      try {
        const time = player.getCurrentTime();
        setCurrentPlayTime(time);
      } catch (error) {
        // 플레이어가 준비되지 않은 경우 무시
      }
    }, 500); // 0.5초마다 업데이트

    return () => clearInterval(interval);
  }, [player, isPlayerReady]);

  return (
    <>
      {/* 화면 잠금 컨트롤 */}
      <ScreenLock
        isLocked={isScreenLocked}
        onLockToggle={() => setIsScreenLocked(!isScreenLocked)}
        magnifierSettings={magnifierSettings}
        onMagnifierSettingsChange={setMagnifierSettings}
        onFavoritesOpen={() => setIsFavoritesOpen(true)}
        onSearchOpen={() => setIsSearchPopupOpen(true)}
        showSearchIcon={!uiSettings.검색창.유지}
      />
      
      <div 
        className={`container mx-auto px-4 py-4 max-w-none md:max-w-4xl min-h-screen bg-secondary transition-all duration-300 pt-16 ${isScreenLocked ? 'screen-locked' : 'screen-unlocked'}`}
        style={{
          minHeight: isKeyboardVisible ? `calc(100vh - ${keyboardHeight}px)` : '100vh',
        }}
      >
      {(uiSettings.상단부.제목표시 || uiSettings.상단부.부제목표시) && (
        <header className="mb-4">
          {uiSettings.상단부.제목표시 && (
            <h1 className="text-2xl font-bold text-gray-800 mb-2">유튜브 노트</h1>
          )}
          {uiSettings.상단부.부제목표시 && (
            <p className="text-sm text-gray-600">
              {uiSettings.상단부.부제목내용}
            </p>
          )}
        </header>
      )}

      {/* 검색창 (유지 설정에 따라 표시) */}
      {uiSettings.검색창.유지 && (
        <VideoLoader
          player={player}
          isPlayerReady={isPlayerReady}
          setCurrentVideoId={setCurrentVideoId}
          setCurrentVideoInfo={setCurrentVideoInfo}
          showNotification={showNotification}
          autoHide={false}
          keepSearchResults={uiSettings.검색창.목록유지 ?? false}  // 목록유지 설정에 따라 동작
        />
      )}
      
      {/* 검색 팝업 (유지 OFF일 때) */}
      {!uiSettings.검색창.유지 && isSearchPopupOpen && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSearchPopupOpen(false)}
          />
          {/* 팝업 검색창 */}
          <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
            <VideoLoader
              player={player}
              isPlayerReady={isPlayerReady}
              setCurrentVideoId={setCurrentVideoId}
              setCurrentVideoInfo={setCurrentVideoInfo}
              showNotification={showNotification}
              autoHide={false}
              isPopup={true}
              onClose={() => setIsSearchPopupOpen(false)}
            />
          </div>
        </>
      )}

      <div className="transition-all duration-300">
        <YouTubePlayer
          player={player}
          setPlayer={setPlayer}
          isPlayerReady={isPlayerReady}
          setIsPlayerReady={setIsPlayerReady}
          currentVideoId={currentVideoId}
          setPlayerState={setPlayerState}
          showNotification={showNotification}
          timestamps={timestamps}
          overlays={overlays}
          onOverlayPositionChange={handleOverlayPositionChange}
          isLocked={isScreenLocked}
          magnifierSettings={magnifierSettings}
          setCurrentRate={setCurrentRate}
          바설정={uiSettings.바설정}
          currentTime={currentPlayTime}
          uiSettings={uiSettings}
        />
      </div>

      {/* SimpleNoteArea - 참고용으로 보관 (주석 처리)
      <SimpleNoteArea
          player={player}
          isPlayerReady={isPlayerReady}
          showNotification={showNotification}
      />
      */}
      
      {/* 원래 NoteArea - 수정 완료하여 활성화 */}
      <NoteArea
          player={player}
          isPlayerReady={isPlayerReady}
          playerState={playerState}
          availableRates={availableRates}
          currentRate={currentRate}
          setCurrentRate={setCurrentRate}
          showNotification={showNotification}
          isKeyboardVisible={isKeyboardVisible}
          keyboardHeight={keyboardHeight}
          currentVideoId={currentVideoId}
          currentVideoInfo={currentVideoInfo}
          timestamps={timestamps}
          setTimestamps={setTimestamps}
          overlays={overlays}
          setOverlays={setOverlays}
          onRecordingComplete={handleRecordingComplete}
          sessionToApply={sessionToApply}
          recordingSessions={recordingSessions}
          onEditRecordingSession={handleEditSession}
          onDeleteRecordingSession={handleDeleteSession}
          onCopyRecordingSession={handleCopySession}
          onApplyRecordingToNote={handleApplyToNote}
          uiSettings={uiSettings}
          onSettingsChange={handleSettingsChange}
          pageState={pageState}
          onPageStateChange={setPageState}
        />

      <Notification />

      {/* 설정 FAB 버튼 */}
      <Button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-40"
        size="icon"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {/* 설정 패널 */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={uiSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* 즐겨찾기 관리자 */}
      <FavoriteManager
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        currentVideoId={currentVideoId}
        showNotification={showNotification}
        onVideoSelect={(videoId: string) => {
          // 즐겨찾기에서 영상 정보 가져오기
          const favoritesData = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
          const videoInfo = favoritesData[videoId];
          
          if (videoInfo) {
            // 비디오 ID와 정보 설정
            setCurrentVideoId(videoId);
            setCurrentVideoInfo({
              title: videoInfo.title,
              channelName: videoInfo.channelTitle,
              thumbnailUrl: videoInfo.thumbnail,
            });
            
            // 플레이어가 준비된 경우 바로 로드
            if (isPlayerReady && player) {
              player.loadVideoById(videoId);
              showNotification(`"${videoInfo.title}" 영상을 로드했습니다.`, "success");
            } else {
              showNotification(`"${videoInfo.title}" 영상을 준비하고 있습니다.`, "info");
            }
          } else {
            // 즐겨찾기에서 정보를 찾을 수 없는 경우
            setCurrentVideoId(videoId);
            showNotification("영상을 로드했습니다.", "info");
          }
        }}
      />

      {/* 디버그 로그 패널 */}
      <DebugLogPanel
        isOpen={isDebugLogOpen}
        onToggle={() => setIsDebugLogOpen(!isDebugLogOpen)}
      />

    </div>
    </>
  );
};

export default HomePage;
