import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatTime } from "@/lib/youtubeUtils";
import { Clock } from "lucide-react";
import { OverlayData } from "./TextOverlay";
import OverlayInput from "./OverlayInput";
import TimestampEditModal from "./TimestampEditModal";
import { UISettings } from "./SettingsPanel";
import { NoteTabs } from "./NoteTabs";
import { NotePageState, PAGE_COLORS, DEFAULT_EMOJIS } from "../types/NotePage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageManagement } from "@/hooks/usePageManagement";
import { useTimestampTracking } from "@/hooks/useTimestampTracking";
import { useTimestampClick } from "@/hooks/useTimestampClick";
import { useTimestampEditor } from "@/hooks/useTimestampEditor";
import { useFavorites } from "@/hooks/useFavorites";
import PlaybackControlBar from "./playback/PlaybackControlBar";
import LeftTabLayout from "./layout/LeftTabLayout";

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
  currentRate,
  setCurrentRate,
  showNotification,
  currentVideoId,
  setTimestamps,
  overlays,
  setOverlays,
  uiSettings,
  onSettingsChange,
  pageState,
  onPageStateChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 현재 플레이어 상태 추적 (props에 없어서 직접 추적)
  const [currentVolume, setCurrentVolume] = useState(100);

  // 실시간 미리보기 오버레이 상태
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);

  // 무한루프 방지를 위한 업데이트 상태 추적
  const isUpdatingContentRef = useRef(false);

  // 노트 텍스트 상태 (localStorage 연동)
  const [noteText, setNoteText] = useState("");

  // 볼륨 및 재생 속도 상태 (hooks보다 먼저 선언)
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // usePageManagement 훅 호출
  const pageManagement = usePageManagement({
    pageState,
    onPageStateChange,
    noteText,
    setNoteText,
    parseTimestamps,
    showNotification,
  });

  // useTimestampTracking 훅 호출
  const timestampTracking = useTimestampTracking({
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
  });


  // useTimestampClick 훅 호출
  const { handleTimestampClick } = useTimestampClick({
    player,
    isPlayerReady,
    noteText,
    currentVolume,
    currentPlaybackRate,
    parseTimestamps,
    formatTime,
    setActiveTimestamp: timestampTracking.setActiveTimestamp,
    setOriginalSettings: timestampTracking.setOriginalSettings,
    setLastActiveIndex: timestampTracking.setLastActiveIndex,
    setCurrentVolume,
    setCurrentPlaybackRate,
    setVolume,
    setPlaybackRate,
    setCurrentRate,
    processingEntryRef: timestampTracking.processingEntryRef,
    processingExitRef: timestampTracking.processingExitRef,
    ignoreManualMoveRef: timestampTracking.ignoreManualMoveRef,
    originalUserSettingsRef: timestampTracking.originalUserSettingsRef,
    showNotification,
  });

  // 사용자 볼륨 변경 핸들러
  const handleVolumeChange = (newVolume: number) => {
    timestampTracking.setUserSettings(prev => ({ ...prev, volume: newVolume }));
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
    timestampTracking.setUserSettings(prev => ({ ...prev, speed: roundedSpeed }));

    // YouTube API에 반올림된 값 설정
    if (player && player.setPlaybackRate) {
      player.setPlaybackRate(roundedSpeed);
    }
  };

  // useTimestampEditor 훅 호출
  const timestampEditor = useTimestampEditor({
    player,
    isPlayerReady,
    noteText,
    setNoteText,
    textareaRef,
    formatTime,
    showNotification,
  });

  // 현재 활성 페이지와 noteText 동기화 (모든 페이지 포함)
  useEffect(() => {
    if (isUpdatingContentRef.current) return; // 업데이트 중이면 스킵

    const currentPage = pageManagement.getCurrentPage();
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

    const currentPage = pageManagement.getCurrentPage();
    if (currentPage) {
      // 내용이 실제로 다를 때만 업데이트 (무한루프 방지)
      if (currentPage.content !== noteText) {
        // 일반 페이지와 특수 페이지 모두 저장
        pageManagement.handlePageUpdate(currentPage.id, { content: noteText });
      }
    }
  }, [noteText]); // noteText만 의존성으로 설정

  // 즐겨찾기 관리 hook
  const favorites = useFavorites({
    currentVideoId,
    showNotification,
  });

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
      timestampTracking.setUserSettings({
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


  return (
    <Card className="h-full" onClick={pageManagement.handleOutsideClick}>
      <CardContent className="p-4 h-full flex flex-col">
        {/* 재생 컨트롤 섹션 (uiSettings에 따라 표시) */}
        <PlaybackControlBar
          player={player}
          isPlayerReady={isPlayerReady}
          currentRate={currentRate}
          volume={volume}
          playbackRate={playbackRate}
          setCurrentRate={setCurrentRate}
          setVolume={setVolume}
          setPlaybackRate={setPlaybackRate}
          handleVolumeChange={handleVolumeChange}
          handleSpeedChange={handleSpeedChange}
          timestampEditor={timestampEditor}
          uiSettings={uiSettings}
          showNotification={showNotification}
        />

        <div className="flex-1 flex flex-col space-y-4">
          {/* 왼쪽탭 레이아웃이 활성화된 경우 */}
          {uiSettings?.왼쪽탭레이아웃?.사용 === true ? (
            <LeftTabLayout
              uiSettings={uiSettings}
              noteText={noteText}
              setNoteText={setNoteText}
              textareaRef={textareaRef}
              handleTimestampClick={handleTimestampClick}
              pageState={pageState}
              pageManagement={pageManagement}
              overlays={overlays}
              setOverlays={setOverlays}
              isPlayerReady={isPlayerReady}
              player={player}
              showNotification={showNotification}
              onSettingsChange={onSettingsChange}
              currentVideoId={currentVideoId}
              currentTime={currentTime}
            />
          ) : (
            /* 기존 레이아웃 (왼쪽탭 비활성화시) */
            <>
              {/* 노트 영역 - UI 설정에 따라 조건부 렌더링 */}
              {uiSettings?.노트영역?.표시 !== false && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1">
                    {/* 전체 페이지 전용: 타임스탬프 가져오기 버튼 */}
                    {pageManagement.getCurrentPage()?.isSpecial && (
                      <div className="mb-2 flex justify-end gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            pageManagement.setShowTimestampImporter(!pageManagement.showTimestampImporter);
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
                    <div ref={pageManagement.noteTabsRef} style={{ marginTop: '4px' }}>
                      <NoteTabs
                        pageState={pageState}
                        onPageChange={pageManagement.handlePageChange}
                        onPageUpdate={pageManagement.handlePageUpdate}
                        onPageAdd={pageManagement.handlePageAdd}
                        onPageDelete={pageManagement.handlePageDelete}
                        onPageReorder={pageManagement.handlePageReorder}
                        onEmojiClick={pageManagement.handleEmojiClick}
                        onColorClick={pageManagement.handleColorClick}
                      />
                    </div>

                    {/* 이모지 선택기 - 탭 근처에 위치 */}
                    {pageManagement.showEmojiPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          ...pageManagement.getSelectionUIPosition(),
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
                            onClick={() => pageManagement.handleEmojiSelect(pageManagement.showEmojiPicker!, emoji)}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 색상 선택기 - 탭 근처 우측에 위치 */}
                    {pageManagement.showColorPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          ...pageManagement.getSelectionUIPosition(true),
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
                            onClick={() => pageManagement.handleColorSelect(pageManagement.showColorPicker!, color)}
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
                    {pageManagement.showTimestampImporter && (
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
                                checked={pageManagement.selectedPages.includes(page.id)}
                                onChange={() => pageManagement.togglePageSelection(page.id)}
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
                              const isAllSelected = allPageIds.length > 0 && allPageIds.every(id => pageManagement.selectedPages.includes(id));
                              pageManagement.togglePageSelection(isAllSelected ? '' : allPageIds.join(','));
                            }}
                            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            {(() => {
                              const allPageIds = pageState.pages.filter(p => !p.isSpecial).map(p => p.id);
                              const isAllSelected = allPageIds.length > 0 && allPageIds.every(id => pageManagement.selectedPages.includes(id));
                              return isAllSelected ? '전체 해제' : '전체 선택';
                            })()}
                          </button>
                          <button
                            onClick={() => {
                              pageManagement.handleImportTimestamps();
                            }}
                            disabled={pageManagement.selectedPages.length === 0}
                            className={`text-xs px-3 py-1 rounded ${
                              pageManagement.selectedPages.length === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            가져오기 ({pageManagement.selectedPages.length}개)
                          </button>
                        </div>
                      </div>
                    )}
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
            </>
          )}
        </div>

        {/* 타임스탬프 편집 모달 */}
        <TimestampEditModal
          isOpen={timestampEditor.isModalOpen}
          onClose={() => timestampEditor.setIsModalOpen(false)}
          player={player}
          isPlayerReady={isPlayerReady}
          currentTime={currentTime}
          duration={0} // duration은 player에서 직접 가져옴
          volume={currentVolume}
          playbackRate={currentPlaybackRate}
          onSave={timestampEditor.addTimestampFromModal}
          showNotification={showNotification}
        />
      </CardContent>
    </Card>
  );
};

export default NoteArea;