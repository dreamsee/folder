import { useState, useEffect } from "react";
import YouTubePlayer from "@/components/YouTubePlayer";
import { Coordinates } from "@/components/TextOverlay";
import NoteArea from "@/components/NoteArea";
import VideoLoader from "@/components/VideoLoader";
import Notification from "@/components/Notification";
import { RecordingSession } from "@/components/RecordingMode";
import { useToast } from "@/hooks/use-toast";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { OverlayData } from "@/components/TextOverlay";

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
  const { toast } = useToast();
  const { isKeyboardVisible, keyboardHeight } = useVirtualKeyboard();

  // YouTubeIframeAPI 준비되면 호출되는 콜백
  useEffect(() => {
    // @ts-ignore - YouTube API는 전역 객체에 함수를 추가함
    window.onYouTubeIframeAPIReady = () => {
      toast({
        title: "준비 완료",
        description: "YouTube 플레이어가 초기화되었습니다. 동영상을 로드하세요.",
      });
    };
  }, [toast]);

  // 알림 표시 함수
  const showNotification = (message: string, type: "info" | "success" | "warning" | "error") => {
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      variant: type === "error" ? "destructive" : "default",
    });
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

  // localStorage에서 녹화 세션 불러오기
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
  }, []);

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
    <div 
      className="container mx-auto px-4 py-4 max-w-none md:max-w-4xl min-h-screen bg-secondary transition-all duration-300"
      style={{
        minHeight: isKeyboardVisible ? `calc(100vh - ${keyboardHeight}px)` : '100vh',
      }}
    >
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">유튜브 노트</h1>
        <p className="text-sm text-gray-600">
          동영상을 보면서 타임스탬프와 함께 노트를 작성하세요
        </p>
      </header>

      <VideoLoader
        player={player}
        isPlayerReady={isPlayerReady}
        setCurrentVideoId={setCurrentVideoId}
        setCurrentVideoInfo={setCurrentVideoInfo}
        showNotification={showNotification}
      />

      <div className={`transition-all duration-300 ${isKeyboardVisible ? 'mb-2' : 'mb-4'}`}>
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
        />
      </div>

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
      />

      <Notification />
    </div>
  );
};

export default HomePage;
