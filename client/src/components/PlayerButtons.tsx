import React from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Settings2, MessageCircle } from "lucide-react";

interface PlayerButtonsProps {
  // UI 설정
  uiSettings: any;
  재생기본값?: {
    fullscreenButtonVisible?: boolean;
    fullscreenButtonPosition?: { bottom: number; right: number };
    fullscreenButtonPositionFullscreen?: { bottom: number; right: number };
    commentButtonVisible?: boolean;
    commentButtonPosition?: { bottom: number; right: number };
    playerControlButtonVisible?: boolean;
    playerControlButtonPosition?: { bottom: number; left: number };
    playerControlButtonPositionFullscreen?: { bottom: number; left: number };
  };

  // 상태
  isFullscreen: boolean;
  isControlsModalOpen: boolean;
  isPlayerReady: boolean;
  player: any;

  // 콜백
  toggleFullscreen: () => void;
  onControlsModalOpen: () => void;
  setCurrentVolume: (volume: number) => void;
  setCurrentSpeed: (speed: number) => void;
}

const PlayerButtons: React.FC<PlayerButtonsProps> = ({
  uiSettings,
  재생기본값,
  isFullscreen,
  isControlsModalOpen,
  isPlayerReady,
  player,
  toggleFullscreen,
  onControlsModalOpen,
  setCurrentVolume,
  setCurrentSpeed,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* 재생 컨트롤 버튼 (플레이어 내장) */}
      {uiSettings && !uiSettings.재생컨트롤?.전체표시 && !isControlsModalOpen && (재생기본값?.playerControlButtonVisible ?? true) && (
        <Button
          data-player-button="control"
          onClick={() => {
            if (player && isPlayerReady) {
              setCurrentVolume(player.getVolume());
              setCurrentSpeed(player.getPlaybackRate());
            }
            onControlsModalOpen();
          }}
          className="absolute p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all pointer-events-auto"
          style={{
            bottom: isFullscreen
              ? `${재생기본값?.playerControlButtonPositionFullscreen?.bottom ?? 8}px`
              : `${재생기본값?.playerControlButtonPosition?.bottom ?? 3}px`,
            left: isFullscreen
              ? `${재생기본값?.playerControlButtonPositionFullscreen?.left ?? 41}px`
              : `${재생기본값?.playerControlButtonPosition?.left ?? 18}px`
          }}
          size="sm"
          variant="ghost"
          title="재생 컨트롤"
        >
          <Settings2 className="w-5 h-5" />
        </Button>
      )}

      {/* 전체화면 버튼 */}
      {(재생기본값?.fullscreenButtonVisible ?? true) && (
        <Button
          data-player-button="fullscreen"
          onClick={toggleFullscreen}
          className="absolute p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all pointer-events-auto"
          style={{
            bottom: isFullscreen
              ? `${재생기본값?.fullscreenButtonPositionFullscreen?.bottom ?? 8}px`
              : `${재생기본값?.fullscreenButtonPosition?.bottom ?? 3}px`,
            right: isFullscreen
              ? `${재생기본값?.fullscreenButtonPositionFullscreen?.right ?? 35}px`
              : `${재생기본값?.fullscreenButtonPosition?.right ?? 17}px`
          }}
          size="sm"
          variant="ghost"
          title={isFullscreen ? "전체화면 종료" : "전체화면"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </Button>
      )}

      {/* 댓글창 열기 버튼 (전체화면일 때만 표시) */}
      {isFullscreen && (재생기본값?.commentButtonVisible ?? true) && (
        <Button
          data-player-button="comment"
          onClick={() => {
            const event = new CustomEvent('openCommentPanel');
            window.dispatchEvent(event);
          }}
          className="absolute p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-all pointer-events-auto"
          style={{
            bottom: `${재생기본값?.commentButtonPosition?.bottom ?? 8}px`,
            right: `${재생기본값?.commentButtonPosition?.right ?? 80}px`
          }}
          size="sm"
          variant="ghost"
          title="댓글 열기"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default PlayerButtons;
