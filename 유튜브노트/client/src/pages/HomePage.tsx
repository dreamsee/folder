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
// import { useToast } from "@/hooks/use-toast"; // 토스트 비활성화
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { OverlayData, OverlayPosition } from "@/components/TextOverlay";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

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
  // const { toast } = useToast(); // 토스트 비활성화
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  // 설정 관련 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [magnifierSettings, setMagnifierSettings] = useState({
    enabled: true,
    zoom: 2.0,
    size: 2, // 1: 소, 2: 중, 3: 대
  });
  const [uiSettings, setUiSettings] = useState<UISettings>({
    상단부: { 제목표시: true, 부제목표시: true, 부제목내용: "동영상을 보면서 타임스탬프와 함께 노트를 작성하세요" },
    검색창: { 유지: true },
    재생컨트롤: { 전체표시: true, 볼륨: true, 속도: true, 도장: true, 녹화: true },
    노트영역: { 표시: true },
    화면텍스트: { 패널표시: true, 좌표설정: true, 스타일설정: true, 빠른설정: true, 빠른설정위치: "정중앙" },
    프리셋: { 최소모드명: "최소 모드", 노트모드명: "노트 모드" },
  });

  // 즐겨찾기 관련 상태
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);


  // YouTubeIframeAPI 준비되면 호출되는 콜백
  useEffect(() => {
    // @ts-ignore - YouTube API는 전역 객체에 함수를 추가함
    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube 플레이어가 초기화되었습니다. 동영상을 로드하세요.");
    };
  }, []);

  // 알림 표시 함수 (토스트 비활성화)
  const showNotification = (message: string, type: "info" | "success" | "warning" | "error") => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // 드래그로 오버레이 위치 변경 처리
  const handleOverlayPositionChange = (id: string, newCoordinates: Coordinates) => {
    setOverlays(prev => prev.map(overlay => 
      overlay.id === id 
        ? { ...overlay, coordinates: newCoordinates }
        : overlay
    ));
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

      <VideoLoader
        player={player}
        isPlayerReady={isPlayerReady}
        setCurrentVideoId={setCurrentVideoId}
        setCurrentVideoInfo={setCurrentVideoInfo}
        showNotification={showNotification}
        autoHide={!uiSettings.검색창.유지}
      />

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
        onVideoSelect={(videoId: string) => {
          setCurrentVideoId(videoId);
        }}
      />

    </div>
    </>
  );
};

export default HomePage;
