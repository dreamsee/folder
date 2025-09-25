// 텍스트 오버레이 테스트 페이지 - 9:1 레이아웃 및 탭 기반 설정 시스템
// 기존 기능은 동일하나 UI/UX 배치를 공간 효율적으로 개선한 테스트 버전

import React, { useState, useRef, useEffect } from 'react';
import YouTubePlayer from '../components/YouTubePlayer';
import { OverlayData } from '../components/TextOverlay';
import TextOverlay from '../components/TextOverlay';
import TabLayoutSettings from '../components/TabLayoutSettings';
import { formatTime } from '../lib/youtubeUtils';
import { Type, Palette, Clock, Sliders, Settings, Maximize, Minimize } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // 오버레이 상태
  const [overlays, setOverlays] = useState<OverlayData[]>([]);

  // 오버레이 localStorage 키 (현재 비디오 ID 기반)
  const getOverlayStorageKey = () => `overlays_${testVideoId}`;

  // 오버레이 저장 함수
  const saveOverlaysToStorage = (overlayList: OverlayData[]) => {
    try {
      localStorage.setItem(getOverlayStorageKey(), JSON.stringify(overlayList));
      console.log('오버레이 저장 완료:', overlayList.length, '개');
    } catch (error) {
      console.error('오버레이 저장 실패:', error);
    }
  };

  // 오버레이 로드 함수
  const loadOverlaysFromStorage = () => {
    try {
      const saved = localStorage.getItem(getOverlayStorageKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        setOverlays(parsed);
        console.log('오버레이 로드 완료:', parsed.length, '개');
      }
    } catch (error) {
      console.error('오버레이 로드 실패:', error);
    }
  };
  const [editingId, setEditingId] = useState<string | null>(null);

  // 탭 설정 및 상태 (설정 탭 제외)
  const [tabConfig, setTabConfig] = useState([
    {
      id: 'note',
      name: '노트',
      icon: Type,
      visible: true,
      features: ['overlayText', 'positionGrid', 'coordinateInput', 'textAlign', 'addButton']
    },
    {
      id: 'size',
      name: '크기',
      icon: Sliders,
      visible: true,
      features: ['fontSize', 'padding', 'rotation']
    },
    {
      id: 'color',
      name: '색상',
      icon: Palette,
      visible: true,
      features: ['textColor', 'bgColor', 'bgOpacity']
    },
    {
      id: 'time',
      name: '시간',
      icon: Clock,
      visible: true,
      features: ['duration', 'overlayList']
    }
  ]);
  const [activeTab, setActiveTab] = useState('settings');
  const [showSettings, setShowSettings] = useState(false);

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

  // 시작/종료 시간 상태 (4자리 숫자로 관리)
  const [startTime, setStartTime] = useState({
    tens: 0, // 10초 단위 (0-9)
    ones: 0, // 1초 단위 (0-9)
    tenths: 0, // 0.1초 단위 (0-9)
    hundredths: 0 // 0.01초 단위 (0-9)
  });
  const [endTime, setEndTime] = useState({
    tens: 0,
    ones: 5,
    tenths: 0,
    hundredths: 0
  });

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
  // 실시간 오버레이 업데이트 (편집 중일 때)
  const updateEditingOverlay = () => {
    if (!editingId) return;

    setOverlays(prev => {
      const newList = prev.map(overlay => {
        if (overlay.id === editingId) {
          const startSeconds = getTimeInSeconds(startTime);
          const endSeconds = getTimeInSeconds(endTime);
          const calculatedDuration = endSeconds - startSeconds;

          return {
            ...overlay,
            text: overlayText,
            coordinates,
            startTime: startSeconds,
            duration: calculatedDuration > 0 ? calculatedDuration : 1,
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
      });

      // 실시간 업데이트는 너무 자주 저장하지 않기 위해 디바운싱 적용
      setTimeout(() => saveOverlaysToStorage(newList), 500);
      return newList;
    });
  };

  useEffect(() => {
    updateEditingOverlay();
  }, [editingId, overlayText, coordinates, overlayDuration, rotation, fontSize, textColor, bgColor, bgOpacity, padding, textAlign]);

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

  // 전체화면 토글 함수
  const toggleFullscreen = async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // 전체화면 진입
        await playerContainerRef.current.requestFullscreen();
        console.log('전체화면 진입 요청');
      } else {
        // 전체화면 종료
        await document.exitFullscreen();
        console.log('전체화면 종료 요청');
      }
    } catch (error) {
      console.error('전체화면 전환 실패:', error);
    }
  };

  // 전체화면 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      console.log('전체화면 상태 변경:', isNowFullscreen ? '전체화면' : '일반화면');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 시간 값 계산 헬퍼 함수 (전역)
  const getTimeInSeconds = (time: typeof startTime) => {
    return time.tens * 10 + time.ones + time.tenths * 0.1 + time.hundredths * 0.01;
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

    const overlayStartTime = getTimeInSeconds(startTime);
    const overlayEndTime = getTimeInSeconds(endTime);
    const calculatedDuration = overlayEndTime - overlayStartTime;

    console.log('overlayStartTime:', overlayStartTime);
    console.log('overlayEndTime:', overlayEndTime);
    console.log('duration:', calculatedDuration);

    const newOverlay: OverlayData = {
      id: editingId || Date.now().toString(),
      text: overlayText,
      positionMode: "coordinate",
      coordinates,
      startTime: overlayStartTime,
      duration: calculatedDuration > 0 ? calculatedDuration : 5, // 최소 5초
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

    // 시작/종료 시간 설정
    const start = overlay.startTime;
    const end = overlay.startTime + overlay.duration;

    // 시작 시간 분해
    setStartTime({
      tens: Math.floor(start / 10) % 10,
      ones: Math.floor(start) % 10,
      tenths: Math.floor((start % 1) * 10),
      hundredths: Math.floor(((start % 1) * 100) % 10)
    });

    // 종료 시간 분해
    setEndTime({
      tens: Math.floor(end / 10) % 10,
      ones: Math.floor(end) % 10,
      tenths: Math.floor((end % 1) * 10),
      hundredths: Math.floor(((end % 1) * 100) % 10)
    });

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

    // setActiveTab('note'); // 편집 시 탭 이동하지 않음
  };

  // 오버레이 삭제
  const deleteOverlay = (id: string) => {
    setOverlays(prev => {
      const newList = prev.filter(o => o.id !== id);
      saveOverlaysToStorage(newList); // 저장
      return newList;
    });
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

  // localStorage에서 탭 설정 로드
  useEffect(() => {
    const savedConfig = localStorage.getItem('overlayTabConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // 아이콘 정보 복원
        const iconMap = {
          'settings': Settings,
          'note': Type,
          'size': Sliders,
          'color': Palette,
          'time': Clock
        };
        const restoredConfig = parsed
          .filter((tab: any) => tab.id !== 'settings') // 설정 탭 제외
          .map((tab: any) => ({
            ...tab,
            icon: iconMap[tab.id as keyof typeof iconMap] || Type
          }));
        setTabConfig(restoredConfig);
        // 첫 번째 보이는 탭으로 activeTab 설정
        const firstVisibleTab = restoredConfig.find((tab: any) => tab.visible);
        if (firstVisibleTab) {
          setActiveTab(firstVisibleTab.id);
        }
      } catch (error) {
        console.error('탭 설정 로드 실패:', error);
      }
    }

    // 오버레이 로드
    loadOverlaysFromStorage();
  }, [testVideoId]); // testVideoId 변경 시에도 재로드

  // 탭 설정 저장 핸들러
  const handleTabConfigSave = (newConfig: any) => {
    setTabConfig(newConfig);
    localStorage.setItem('overlayTabConfig', JSON.stringify(newConfig));
  };

  // 개별 기능 컴포넌트 렌더링 함수
  const renderFeature = (featureId: string) => {
    switch (featureId) {
      case 'overlayText':
        return (
          <div key={featureId} className="space-y-3">
            {/* 텍스트 영역을 맨 위로 */}
            <textarea
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="💡 팁: 노트 영역을 화면 중앙에 위치시킨 후 클릭하면 영상이 덜 밀려남"
              className="w-full h-32 p-3 border rounded-lg resize-none"
              rows={4}
            />
            {/* 노트 적용 버튼 */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!overlayText.trim()) {
                    alert('텍스트를 입력해주세요.');
                    return;
                  }

                  if (!player || !isPlayerReady) {
                    alert('플레이어가 준비되지 않았습니다.');
                    return;
                  }

                  // 현재 영상 시간 가져오기
                  const currentVideoTime = player.getCurrentTime();
                  const endVideoTime = currentVideoTime + 1; // 1초 추가

                  // 시작 시간 분해 (현재 시간)
                  const startTens = Math.floor(currentVideoTime / 10) % 10;
                  const startOnes = Math.floor(currentVideoTime) % 10;
                  const startDecimal = currentVideoTime % 1;
                  const startTenths = Math.floor(startDecimal * 10);
                  const startHundredths = Math.floor((startDecimal * 100) % 10);

                  setStartTime({
                    tens: startTens,
                    ones: startOnes,
                    tenths: startTenths,
                    hundredths: startHundredths
                  });

                  // 종료 시간 분해 (현재 시간 + 1초)
                  const endTens = Math.floor(endVideoTime / 10) % 10;
                  const endOnes = Math.floor(endVideoTime) % 10;
                  const endDecimal = endVideoTime % 1;
                  const endTenths = Math.floor(endDecimal * 10);
                  const endHundredths = Math.floor((endDecimal * 100) % 10);

                  setEndTime({
                    tens: endTens,
                    ones: endOnes,
                    tenths: endTenths,
                    hundredths: endHundredths
                  });

                  // 새 오버레이 생성
                  const newOverlay: OverlayData = {
                    id: Date.now().toString(),
                    text: overlayText,
                    positionMode: "coordinate",
                    coordinates,
                    startTime: currentVideoTime,
                    duration: 1, // 1초
                    rotation,
                    style: {
                      fontSize,
                      color: textColor,
                      backgroundColor: getFinalBgColor(),
                      padding,
                      textAlign,
                    },
                  };

                  // 오버레이 추가하고 편집 모드로 진입
                  setOverlays(prev => {
                    const newList = [...prev, newOverlay];
                    saveOverlaysToStorage(newList); // 저장
                    return newList;
                  });
                  setEditingId(newOverlay.id);

                  console.log('✅ 노트 적용 완료 - 편집 모드 진입:', newOverlay);
                }}
                disabled={!overlayText.trim() || !isPlayerReady}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-300"
              >
                노트 적용
              </button>
            </div>
          </div>
        );

      case 'positionGrid':
        return (
          <div key={featureId} className="space-y-3">
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
        );

      case 'coordinateInput':
        return (
          <div key={featureId} className="space-y-3">
            <h4 className="font-medium">좌표 직접 입력</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  X 좌표 (0-100%)
                </label>
                <input
                  type="number"
                  value={coordinates.x}
                  onChange={(e) => setCoordinates({ ...coordinates, x: Number(e.target.value) })}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Y 좌표 (0-100%)
                </label>
                <input
                  type="number"
                  value={coordinates.y}
                  onChange={(e) => setCoordinates({ ...coordinates, y: Number(e.target.value) })}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="90"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              현재 위치: ({coordinates.x}%, {coordinates.y}%)
            </div>
          </div>
        );

      case 'textAlign':
        return (
          <div key={featureId} className="space-y-3">
            <h4 className="font-medium">텍스트 정렬</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "좌측", value: 'left' as const, icon: "⬅️" },
                { name: "중앙", value: 'center' as const, icon: "↔️" },
                { name: "우측", value: 'right' as const, icon: "➡️" },
              ].map((align) => (
                <button
                  key={align.value}
                  type="button"
                  onClick={() => setTextAlign(align.value)}
                  className={`px-3 py-2 rounded text-sm border transition-colors ${
                    textAlign === align.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs">{align.icon}</span>
                    <span className="text-xs">{align.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-center">
              현재 정렬: {textAlign === 'left' ? '좌측' : textAlign === 'center' ? '중앙' : '우측'}
            </div>
          </div>
        );

      case 'addButton':
        return (
          <div key={featureId} className="space-y-3">
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

      case 'fontSize':
        return (
          <div key={featureId} className="space-y-3">
            <label className="block text-sm font-medium mb-2">
              글자 크기: {fontSize}px
            </label>
            <input
              type="range"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min={6}
              max={96}
              step={1}
              className="w-full"
            />
          </div>
        );

      case 'padding':
        return (
          <div key={featureId} className="space-y-3">
            <label className="block text-sm font-medium mb-2">
              여백: {padding}px
            </label>
            <input
              type="range"
              value={padding}
              onChange={(e) => setPadding(Number(e.target.value))}
              min={4}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
        );

      case 'rotation':
        return (
          <div key={featureId} className="space-y-3">
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
        );

      case 'textColor':
        return (
          <div key={featureId} className="space-y-3">
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
        );

      case 'bgColor':
        return (
          <div key={featureId} className="space-y-3">
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
        );

      case 'bgOpacity':
        return (
          <div key={featureId} className="space-y-3">
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
        );

      case 'duration':

        // 시간 입력 컴포넌트
        const TimeInput = ({
          label,
          time,
          setTime
        }: {
          label: string;
          time: typeof startTime;
          setTime: React.Dispatch<React.SetStateAction<typeof startTime>>;
        }) => {
          const handleChange = (field: keyof typeof time, value: number) => {
            setTime(prev => ({ ...prev, [field]: value }));

            // 시간 변경시 영상 이동
            const newTime = { ...time, [field]: value };
            const seconds = getTimeInSeconds(newTime);
            if (player && isPlayerReady) {
              player.seekTo(seconds);
            }
          };

          const handleIncrement = (field: keyof typeof time, max: number) => {
            const current = time[field];
            const newValue = current >= max ? 0 : current + 1;
            handleChange(field, newValue);
          };

          const handleDecrement = (field: keyof typeof time, max: number) => {
            const current = time[field];
            const newValue = current <= 0 ? max : current - 1;
            handleChange(field, newValue);
          };

          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <button
                  onClick={() => {
                    if (player && isPlayerReady) {
                      const current = player.getCurrentTime();
                      const tens = Math.floor(current / 10) % 10;
                      const ones = Math.floor(current) % 10;
                      const decimal = current % 1;
                      const tenths = Math.floor(decimal * 10);
                      const hundredths = Math.floor((decimal * 100) % 10);
                      setTime({ tens, ones, tenths, hundredths });
                    }
                  }}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  현재 시간
                </button>
              </div>
              <div className="flex items-center gap-1">
                {/* 10초 단위 */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleIncrement('tens', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▲
                  </button>
                  <input
                    type="number"
                    value={time.tens}
                    onChange={(e) => handleChange('tens', Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-8 h-8 text-center border rounded"
                    min="0"
                    max="9"
                  />
                  <button
                    onClick={() => handleDecrement('tens', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▼
                  </button>
                </div>

                {/* 1초 단위 */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleIncrement('ones', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▲
                  </button>
                  <input
                    type="number"
                    value={time.ones}
                    onChange={(e) => handleChange('ones', Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-8 h-8 text-center border rounded"
                    min="0"
                    max="9"
                  />
                  <button
                    onClick={() => handleDecrement('ones', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▼
                  </button>
                </div>

                <span className="font-bold">.</span>

                {/* 0.1초 단위 */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleIncrement('tenths', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▲
                  </button>
                  <input
                    type="number"
                    value={time.tenths}
                    onChange={(e) => handleChange('tenths', Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-8 h-8 text-center border rounded"
                    min="0"
                    max="9"
                  />
                  <button
                    onClick={() => handleDecrement('tenths', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▼
                  </button>
                </div>

                {/* 0.01초 단위 */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleIncrement('hundredths', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▲
                  </button>
                  <input
                    type="number"
                    value={time.hundredths}
                    onChange={(e) => handleChange('hundredths', Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-8 h-8 text-center border rounded"
                    min="0"
                    max="9"
                  />
                  <button
                    onClick={() => handleDecrement('hundredths', 9)}
                    className="w-8 h-6 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    ▼
                  </button>
                </div>

                <span className="text-sm ml-2">초 = {getTimeInSeconds(time).toFixed(2)}초</span>
              </div>
            </div>
          );
        };

        return (
          <div key={featureId} className="space-y-4">
            <TimeInput label="시작 시간" time={startTime} setTime={setStartTime} />
            <TimeInput label="종료 시간" time={endTime} setTime={setEndTime} />

            <div className="text-sm text-gray-600">
              <p>현재 시간: {formatTime(currentTime)}</p>
              <p>재생 상태: {isPlaying ? "재생 중" : "정지됨"}</p>
              <p>오버레이 길이: {(getTimeInSeconds(endTime) - getTimeInSeconds(startTime)).toFixed(2)}초</p>
            </div>
          </div>
        );

      case 'overlayList':
        return (
          <div key={featureId} className="space-y-3">
            <h4 className="font-medium">등록된 오버레이</h4>
            {overlays.length === 0 ? (
              <p className="text-gray-500 text-sm">등록된 오버레이가 없습니다.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-2">
                {overlays.map((overlay) => (
                  <div key={overlay.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium truncate">{overlay.text}</div>
                    <div className="text-xs text-gray-500">
                      {overlay.startTime.toFixed(2)}초 → {(overlay.startTime + overlay.duration).toFixed(2)}초 | <span className="bg-gray-200 px-1 rounded text-gray-800">좌표값 ({(overlay.coordinates?.x || 50).toFixed(2)}%, {(overlay.coordinates?.y || 90).toFixed(2)}%)</span> | {overlay.style?.textAlign || 'left'}_정렬 | 불투명도({(() => {
                        const bgColor = overlay.style?.backgroundColor || '#00000080';
                        if (bgColor.length === 9) {
                          const alpha = parseInt(bgColor.slice(7, 9), 16);
                          return Math.round((alpha / 255) * 100);
                        }
                        return 0;
                      })()}%)
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
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 탭별 컨텐츠 렌더링 (동적 기능 순서 적용)
  const renderTabContent = () => {
    // 현재 활성 탭 찾기
    const currentTab = tabConfig.find(tab => tab.id === activeTab);
    if (!currentTab) {
      return <div>탭을 선택해주세요.</div>;
    }

    return (
      <div className="space-y-4">
        {/* 탭에 설정된 기능들을 순서대로 렌더링 */}
        {currentTab.features.map((featureId) => renderFeature(featureId))}
      </div>
    );
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
              제목 아래 가로 탭, 비디오 플레이어, 설정 영역 순서 배치
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

      {/* 가로 탭 네비게이션 - 제목 아래 배치 */}
      {!isFullscreen && (
        <div className="bg-white border-b">
          <div className="flex items-center overflow-x-auto">
            {/* 설정 탭 (별도) */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex flex-col items-center justify-center px-4 py-4 text-xs transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap min-w-[80px]"
            >
              <Settings className="w-6 h-6 mb-2" />
              <span>설정</span>
            </button>

            {/* 일반 탭들 */}
            {tabConfig.filter(tab => tab.visible).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center px-4 py-4 text-xs transition-colors border-b-2 whitespace-nowrap min-w-[80px] ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 border-transparent hover:border-gray-300'
                }`}
              >
                {tab.id === 'note' && <Type className="w-6 h-6 mb-2" />}
                {tab.id === 'size' && <Sliders className="w-6 h-6 mb-2" />}
                {tab.id === 'color' && <Palette className="w-6 h-6 mb-2" />}
                {tab.id === 'time' && <Clock className="w-6 h-6 mb-2" />}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 영상 검색 및 YouTube 플레이어 영역 */}
      <div className="relative bg-black flex justify-center">
        <div
          ref={playerContainerRef}
          className="relative bg-black transition-all duration-300"
          style={{
            width: isFullscreen ? '100vw' : `${screenScale}%`,
            height: isFullscreen ? '100vh' : 'auto',
            display: isFullscreen ? 'flex' : 'block',
            alignItems: isFullscreen ? 'center' : undefined,
            justifyContent: isFullscreen ? 'center' : undefined
          }}
        >
          <div
            className="bg-gray-900 relative"
            style={{
              width: isFullscreen ? '100%' : '100%',
              maxWidth: isFullscreen ? '177.77vh' : '100%', // 16:9 비율 유지
              aspectRatio: '16/9',
              height: isFullscreen ? undefined : undefined
            }}>
            <YouTubePlayer
              player={player}
              setPlayer={setPlayer}
              isPlayerReady={isPlayerReady}
              setIsPlayerReady={setIsPlayerReady}
              currentVideoId={testVideoId}
              setPlayerState={() => {}}
              showNotification={(message) => console.log(message)}
              바설정={{ 커스텀바: false, 챕터바: false }}
              className="w-full h-full absolute inset-0"
            />
            <div className="absolute inset-0 pointer-events-none z-10">
              <TextOverlay
                overlays={overlays}
                currentTime={currentTime}
                isPlaying={isPlaying}
                editingId={editingId}
                screenScale={screenScale}
                isFullscreen={isFullscreen}
              />
              {/* 디버깅용 테스트 텍스트 */}
              <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 text-sm z-20">
                DEBUG: 오버레이 영역 테스트 (오버레이 개수: {overlays.length})
              </div>
            </div>

            {/* 전체화면 버튼 - 전체화면일 때는 더 크게 표시 */}
            <button
              onClick={toggleFullscreen}
              className={`absolute bg-black/50 hover:bg-black/70
                       text-white rounded transition-all duration-200 z-30 pointer-events-auto
                       ${isFullscreen
                         ? 'bottom-2 right-4 p-1.6' // 전체화면: 더 크게
                         : 'bottom-1.5 right-4 p-1.5' // 일반화면: 기존 크기
                       }`}
              title={isFullscreen ? '전체화면 나가기' : '전체화면'}
            >
              {isFullscreen ? (
                <Minimize className={isFullscreen ? "w-7 h-7" : "w-5 h-5"} />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>

            {/* 커스텀 진행바 */}
            {isPlayerReady && duration > 0 && (
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/30 z-30 cursor-pointer"
                onClick={(e) => {
                  if (!player || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  player.seekTo(duration * percentage);
                }}
              >
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            )}
        </div>

      </div>

      {/* 하단 노트/설정 영역 - 전체화면에서는 숨김 */}
      {!isFullscreen && (
        <div className="flex-1 p-4 bg-white overflow-y-auto">
          {renderTabContent()}
        </div>
      )}

      {/* 탭 설정 모달 */}
      <TabLayoutSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleTabConfigSave}
        currentConfig={tabConfig}
      />
    </div>
  );
};

export default TestOverlayPage;