// 텍스트 오버레이 테스트 페이지 - 9:1 레이아웃 및 탭 기반 설정 시스템
// 기존 기능은 동일하나 UI/UX 배치를 공간 효율적으로 개선한 테스트 버전

import React, { useState, useRef, useEffect } from 'react';
import YouTubePlayer from '../components/YouTubePlayer';
import { OverlayData } from '../components/TextOverlay';
import TextOverlay from '../components/TextOverlay';
import { formatTime } from '../lib/youtubeUtils';
import { Type, Palette, Clock, Sliders } from 'lucide-react';

interface TestOverlayPageProps {}

const TestOverlayPage: React.FC<TestOverlayPageProps> = () => {
  // 테스트용 비디오 데이터 (TestTimestampPage 방식)
  const [testVideoId, setTestVideoId] = useState('8gDsaqNwUbo');

  // YouTube 플레이어 상태
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  // 오버레이 상태 (테스트용 기본 오버레이 추가)
  const [overlays, setOverlays] = useState<OverlayData[]>([
    {
      id: "test1",
      text: "테스트 오버레이",
      positionMode: "coordinate",
      coordinates: { x: 100, y: 100 },
      startTime: 0,
      duration: 10,
      rotation: 0,
      style: {
        fontSize: 24,
        color: "#FFFFFF",
        backgroundColor: "#000000AA",
        padding: 10,
        textAlign: "left",
      },
    }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'note' | 'size' | 'color' | 'time'>('note');

  // 화면 크기 조절
  const [screenScale, setScreenScale] = useState(100);

  // 오버레이 입력 상태들
  const [overlayText, setOverlayText] = useState("");
  const [coordinates, setCoordinates] = useState({ x: 50, y: 90, unit: "%" });
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [bgColor, setBgColor] = useState("#000000");
  const [bgOpacity, setBgOpacity] = useState(80);
  const [padding, setPadding] = useState(10);
  const [overlayDuration, setOverlayDuration] = useState(5);
  const [rotation, setRotation] = useState(0);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // 플레이어 시간 업데이트 (TestTimestampPage와 동일한 로직)
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    const updateTime = () => {
      try {
        const current = player.getCurrentTime();
        const total = player.getDuration();
        const playing = player.getPlayerState() === 1; // YT.PlayerState.PLAYING

        setCurrentTime(current);
        setDuration(total);
        setIsPlaying(playing);
      } catch (error) {
        console.error('시간 업데이트 오류:', error);
      }
    };

    // 초기 업데이트
    updateTime();

    // 100ms마다 업데이트
    const interval = setInterval(updateTime, 100);

    return () => clearInterval(interval);
  }, [player, isPlayerReady]);

  // 편집 중 실시간 업데이트
  useEffect(() => {
    updateEditingOverlay();
  }, [editingId, overlayText, coordinates, overlayDuration, rotation, fontSize, textColor, bgColor, bgOpacity, padding, textAlign]);

  // 실시간 오버레이 업데이트 (편집 중일 때)
  const updateEditingOverlay = () => {
    if (!editingId) return;

    setOverlays(prev => prev.map(overlay => {
      if (overlay.id === editingId) {
        return {
          ...overlay,
          text: overlayText,
          coordinates,
          duration: overlayDuration,
          rotation,
          style: {
            ...overlay.style,
            fontSize,
            color: textColor,
            backgroundColor: getFinalBgColor(),
            padding,
            textAlign,
          },
        };
      }
      return overlay;
    }));
  };

  // 플레이어 이벤트 핸들러
  const handlePlayerReady = (playerInstance: any) => {
    setPlayer(playerInstance);
    setIsPlayerReady(true);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayerStateChange = (state: number) => {
    setIsPlaying(state === 1); // 1 = playing
  };

  // 투명도를 16진수로 변환
  const opacityToHex = (opacity: number): string => {
    const alpha = Math.round((opacity / 100) * 255);
    return alpha.toString(16).padStart(2, '0').toUpperCase();
  };

  // 배경 색상과 투명도를 합친 최종 색상 반환
  const getFinalBgColor = (): string => {
    return bgColor + opacityToHex(bgOpacity);
  };

  // 오버레이 추가/수정
  const addOverlay = () => {
    console.log('🔍 addOverlay 함수 호출됨');
    console.log('isPlayerReady:', isPlayerReady);
    console.log('player:', player);
    console.log('overlayText:', overlayText);

    if (!isPlayerReady || !player || !overlayText.trim()) {
      console.log('❌ 조건 체크 실패 - 오버레이 추가 중단');
      return;
    }

    const overlayStartTime = player.getCurrentTime();
    console.log('overlayStartTime:', overlayStartTime);

    const newOverlay: OverlayData = {
      id: editingId || Date.now().toString(),
      text: overlayText,
      positionMode: "coordinate",
      coordinates,
      startTime: overlayStartTime,
      duration: overlayDuration,
      rotation,
      style: {
        fontSize,
        color: textColor,
        backgroundColor: getFinalBgColor(),
        padding,
        textAlign,
      },
    };

    console.log('✅ 새 오버레이 생성:', newOverlay);

    if (editingId) {
      setOverlays(prev => prev.map(o => o.id === editingId ? newOverlay : o));
      setEditingId(null);
      console.log('📝 기존 오버레이 수정됨');
    } else {
      setOverlays(prev => {
        const updated = [...prev, newOverlay];
        console.log('➕ 새 오버레이 추가됨, 총 개수:', updated.length);
        return updated;
      });
    }

    // 입력 필드 초기화
    setOverlayText("");
    setActiveTab('note');
  };

  // 오버레이 편집
  const editOverlay = (overlay: OverlayData) => {
    setOverlayText(overlay.text);
    if (overlay.coordinates) setCoordinates(overlay.coordinates);
    setOverlayDuration(overlay.duration);
    setFontSize(overlay.style.fontSize);
    setTextColor(overlay.style.color);
    setTextAlign(overlay.style.textAlign || 'left');
    setRotation(overlay.rotation || 0);

    // 배경 색상과 투명도 분리
    const bgColorValue = overlay.style.backgroundColor.length === 9
      ? overlay.style.backgroundColor.slice(0, 7)
      : overlay.style.backgroundColor;
    setBgColor(bgColorValue);
    setPadding(overlay.style.padding);
    setEditingId(overlay.id);

    // 해당 시간으로 이동
    if (player && isPlayerReady) {
      player.seekTo(overlay.startTime);
    }

    setActiveTab('note');
  };

  // 오버레이 삭제
  const deleteOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setOverlayText("");
    setCoordinates({ x: 50, y: 90, unit: "%" });
    setBgColor("#000000");
    setBgOpacity(80);
    setTextAlign('left');
    setRotation(0);
    setActiveTab('note');
  };

  // 탭별 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'note':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">텍스트 입력</h3>
            <textarea
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="화면에 표시할 텍스트를 입력하세요"
              className="w-full h-32 p-3 border rounded-lg resize-none"
              rows={4}
            />

            {/* 위치 설정 그리드 */}
            <div className="space-y-3">
              <h4 className="font-medium">위치 설정</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "좌상단", x: 10, y: 10, align: 'left' as const },
                  { name: "상단중앙", x: 50, y: 10, align: 'center' as const },
                  { name: "우상단", x: 90, y: 10, align: 'right' as const },
                  { name: "좌측중앙", x: 10, y: 50, align: 'left' as const },
                  { name: "정중앙", x: 50, y: 50, align: 'center' as const },
                  { name: "우측중앙", x: 90, y: 50, align: 'right' as const },
                  { name: "좌하단", x: 10, y: 90, align: 'left' as const },
                  { name: "하단중앙", x: 50, y: 90, align: 'center' as const },
                  { name: "우하단", x: 90, y: 90, align: 'right' as const },
                ].map((position, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCoordinates({ x: position.x, y: position.y, unit: "%" });
                      setTextAlign(position.align);
                    }}
                    className="px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm border border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    {position.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 추가/수정 버튼 */}
            <button
              onClick={addOverlay}
              disabled={!isPlayerReady || !overlayText.trim()}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {editingId ? "수정 완료" : "오버레이 추가"}
            </button>

            {editingId && (
              <button
                onClick={cancelEdit}
                className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                편집 취소
              </button>
            )}
          </div>
        );

      case 'size':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">크기 및 회전</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                글자 크기: {fontSize}px
              </label>
              <input
                type="range"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min={12}
                max={48}
                step={2}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                여백: {padding}px
              </label>
              <input
                type="range"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                min={4}
                max={20}
                step={2}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                회전 각도: {rotation}°
              </label>
              <input
                type="range"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                min={-180}
                max={180}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        );

      case 'color':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">색상 설정</h3>

            <div>
              <label className="block text-sm font-medium mb-2">글자 색상</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-16 h-10 rounded border"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">배경 색상</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-16 h-10 rounded border"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                배경 투명도: {bgOpacity}%
              </label>
              <input
                type="range"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>투명</span>
                <span>불투명</span>
              </div>
            </div>
          </div>
        );

      case 'time':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">시간 설정</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                지속 시간: {overlayDuration}초
              </label>
              <input
                type="range"
                value={overlayDuration}
                onChange={(e) => setOverlayDuration(Number(e.target.value))}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            <div className="text-sm text-gray-600">
              <p>현재 시간: {formatTime(currentTime)}</p>
              <p>재생 상태: {isPlaying ? "재생 중" : "정지됨"}</p>
            </div>

            {/* 등록된 오버레이 목록 */}
            {overlays.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">등록된 오버레이</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {overlays.map((overlay) => (
                    <div
                      key={overlay.id}
                      className="p-2 bg-gray-50 rounded text-sm"
                    >
                      <div className="font-medium truncate">{overlay.text}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(overlay.startTime)} → {formatTime(overlay.startTime + overlay.duration)}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => editOverlay(overlay)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => deleteOverlay(overlay.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>탭을 선택해주세요.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              텍스트 오버레이 테스트 - 테탐 스타일 레이아웃
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              영상 위, 노트/설정 영역 아래 + 우측 탭 구조
            </p>
          </div>

          {/* 화면 크기 조절 슬라이더 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              화면 크기: {screenScale}%
            </label>
            <input
              type="range"
              value={screenScale}
              onChange={(e) => setScreenScale(Number(e.target.value))}
              min={50}
              max={100}
              step={5}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* 영상 검색 및 YouTube 플레이어 영역 */}
      <div className="relative bg-black flex justify-center">
        <div
          className="relative bg-black transition-all duration-300"
          style={{ width: `${screenScale}%` }}
        >
          <div className="aspect-video bg-gray-900 relative">
            <YouTubePlayer
              player={player}
              setPlayer={setPlayer}
              isPlayerReady={isPlayerReady}
              setIsPlayerReady={setIsPlayerReady}
              currentVideoId={testVideoId}
              setPlayerState={() => {}}
              showNotification={(message) => console.log(message)}
              className="w-full h-full absolute inset-0"
            />
            <div className="absolute inset-0 pointer-events-none z-10">
              <TextOverlay
                overlays={overlays}
                currentTime={currentTime}
                isPlaying={isPlaying}
                editingId={editingId}
              />
              {/* 디버깅용 테스트 텍스트 */}
              <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 text-sm z-20">
                DEBUG: 오버레이 영역 테스트 (오버레이 개수: {overlays.length})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 노트/설정 영역 + 탭 */}
      <div className="flex flex-1">
        {/* 노트/설정 작업 영역 (90%) */}
        <div className="flex-1 p-4 bg-white overflow-y-auto">
          {renderTabContent()}
        </div>

        {/* 우측 탭 버튼들 (10%) */}
        <div className="w-20 bg-gray-800 flex flex-col">
          {[
            { id: 'note', icon: Type, label: '노트' },
            { id: 'size', icon: Sliders, label: '크기' },
            { id: 'color', icon: Palette, label: '색상' },
            { id: 'time', icon: Clock, label: '시간' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-4 text-xs transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <tab.icon className="w-6 h-6 mb-1" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestOverlayPage;