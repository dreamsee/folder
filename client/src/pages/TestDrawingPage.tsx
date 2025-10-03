// 그리기 오버레이 테스트 페이지
// Canvas 기반 그리기 + 타임스탬프 연동 테스트

import React, { useState, useRef, useEffect } from 'react';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Square, Circle, ArrowRight, Eraser, Trash2, Save, Play } from 'lucide-react';

// 개별 스트로크 타입
interface Stroke {
  type: 'pen' | 'arrow' | 'rectangle' | 'circle';
  points: Array<{ x: number; y: number }>;
  color: string;
  thickness: number;
}

// 그리기 데이터 타입 (여러 스트로크를 포함)
interface DrawingData {
  id: string;
  strokes: Stroke[]; // 여러 선/도형을 하나로 묶음
  startTime: number;
  duration: number;
}

const TestDrawingPage: React.FC = () => {
  // YouTube 플레이어 관련
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // 테스트용 비디오 ID

  // Canvas 관련
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Array<{ x: number; y: number }>>([]);
  const [tempStrokes, setTempStrokes] = useState<Stroke[]>([]); // 저장 전 임시 스트로크들 (누적)

  // 그리기 도구 설정
  const [drawingTool, setDrawingTool] = useState<'pen' | 'arrow' | 'rectangle' | 'circle' | 'eraser'>('pen');
  const [drawingColor, setDrawingColor] = useState('#ff0000');
  const [drawingThickness, setDrawingThickness] = useState(3);

  // 저장된 그리기 데이터
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);

  // 타임스탬프 설정
  const [drawingStartTime, setDrawingStartTime] = useState(0);
  const [drawingDuration, setDrawingDuration] = useState(5);

  // 그리기 모드 토글
  const [isDrawingMode, setIsDrawingMode] = useState(true);

  // UI 설정 (재생 컨트롤 및 커스텀바 표시)
  const uiSettings = {
    재생컨트롤: { 전체표시: false }, // false로 설정하면 플레이어 내장 컨트롤 표시
    커스텀바: { 표시: true } // 커스텀 시간바 표시
  };


  // videoId 변경시 영상 로드
  useEffect(() => {
    if (player && isPlayerReady && videoId) {
      player.loadVideoById(videoId);
    }
  }, [videoId, player, isPlayerReady]);

  // 플레이어 시간 업데이트
  useEffect(() => {
    if (!player || !isPlayerReady) return;

    const interval = setInterval(() => {
      const time = player.getCurrentTime();
      const dur = player.getDuration();
      const state = player.getPlayerState();

      setCurrentTime(time);
      setDuration(dur);
      setIsPlaying(state === 1); // 1 = playing
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlayerReady]);

  // Canvas 마우스/터치 이벤트
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      e.preventDefault(); // 스크롤 방지
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setCurrentDrawing([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      e.preventDefault(); // 스크롤 방지
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setCurrentDrawing(prev => [...prev, { x, y }]);
    drawOnCanvas();
  };

  const handleMouseUp = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e && 'touches' in e) {
      e.preventDefault(); // 스크롤 방지
    }

    setIsDrawing(false);

    // 그리기 완료 시 tempStrokes에 스트로크 추가 (누적)
    if (currentDrawing.length > 0 && drawingTool !== 'eraser') {
      const newStroke: Stroke = {
        type: drawingTool as 'pen' | 'arrow' | 'rectangle' | 'circle',
        points: currentDrawing,
        color: drawingColor,
        thickness: drawingThickness
      };
      setTempStrokes(prev => [...prev, newStroke]); // 기존 것에 추가
    }

    setCurrentDrawing([]);
  };

  // Canvas에 그리기
  const drawOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 저장된 그리기들 렌더링 (현재 시간에 맞는 것만)
    drawings.forEach(drawing => {
      const isActive = currentTime >= drawing.startTime &&
                      currentTime <= drawing.startTime + drawing.duration;

      if (isActive || drawing.id === activeDrawingId) {
        // DrawingData의 모든 스트로크 렌더링
        drawing.strokes.forEach(stroke => {
          renderStroke(ctx, stroke);
        });
      }
    });

    // 임시 저장된 스트로크들 렌더링 (저장 전, 모두 표시)
    tempStrokes.forEach(stroke => {
      renderStroke(ctx, stroke);
    });

    // 현재 그리는 중인 것 렌더링
    if (currentDrawing.length > 0) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = drawingThickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (drawingTool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(currentDrawing[0].x, currentDrawing[0].y);
        currentDrawing.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else if (drawingTool === 'rectangle' && currentDrawing.length >= 2) {
        const start = currentDrawing[0];
        const end = currentDrawing[currentDrawing.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (drawingTool === 'circle' && currentDrawing.length >= 2) {
        const start = currentDrawing[0];
        const end = currentDrawing[currentDrawing.length - 1];
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (drawingTool === 'arrow' && currentDrawing.length >= 2) {
        const start = currentDrawing[0];
        const end = currentDrawing[currentDrawing.length - 1];
        drawArrow(ctx, start.x, start.y, end.x, end.y);
      }
    }
  };

  // 화살표 그리기 헬퍼 함수
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // 선
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // 화살표 머리
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  // 스트로크 렌더링
  const renderStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'pen') {
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    } else if (stroke.type === 'rectangle' && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (stroke.type === 'circle' && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.type === 'arrow' && stroke.points.length >= 2) {
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      drawArrow(ctx, start.x, start.y, end.x, end.y);
    }
  };

  // 그리기 저장 (임시 스트로크들을 하나의 DrawingData로 저장)
  const saveDrawing = () => {
    if (tempStrokes.length === 0) return;

    // 모든 임시 스트로크를 하나의 DrawingData로 묶음
    const newDrawing: DrawingData = {
      id: `draw_${Date.now()}`,
      strokes: tempStrokes, // 여러 스트로크를 한 번에
      startTime: drawingStartTime,
      duration: drawingDuration
    };

    setDrawings(prev => [...prev, newDrawing]);

    // localStorage에 저장
    const storageKey = `drawings_${videoId}`;
    const updatedDrawings = [...drawings, newDrawing];
    localStorage.setItem(storageKey, JSON.stringify(updatedDrawings));

    // 저장 후 tempStrokes 초기화
    setTempStrokes([]);
  };

  // localStorage에서 로드
  useEffect(() => {
    const storageKey = `drawings_${videoId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 새 구조인지 확인 (strokes 배열이 있는지)
        if (parsed.length > 0 && parsed[0].strokes) {
          setDrawings(parsed);
        } else {
          // 옛날 구조면 초기화
          console.log('옛날 데이터 구조 감지 - 초기화');
          setDrawings([]);
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('로드 실패:', error);
        setDrawings([]);
      }
    }
  }, [videoId]);

  // Canvas 업데이트
  useEffect(() => {
    drawOnCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, drawings, tempStrokes, currentDrawing, activeDrawingId, drawingColor, drawingThickness, drawingTool]);

  // 그리기 삭제
  const deleteDrawing = (id: string) => {
    const updated = drawings.filter(d => d.id !== id);
    setDrawings(updated);

    const storageKey = `drawings_${videoId}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">그리기 오버레이 테스트</h1>

          {/* 비디오 ID 입력 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Video ID:</label>
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              className="px-3 py-1 border rounded w-48"
              placeholder="YouTube Video ID"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 왼쪽: YouTube 플레이어 + Canvas */}
        <div className="lg:col-span-2">
          {/* 그리기 모드 토글 버튼 */}
          <div className="mb-2">
            <Button
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              variant={isDrawingMode ? 'default' : 'outline'}
              className="w-full"
            >
              {isDrawingMode ? '🎨 그리기 모드 (영상 터치 불가)' : '▶️ 영상 모드 (그리기 불가)'}
            </Button>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <YouTubePlayer
              player={player}
              setPlayer={setPlayer}
              isPlayerReady={isPlayerReady}
              setIsPlayerReady={setIsPlayerReady}
              currentVideoId={videoId}
              setPlayerState={() => {}}
              showNotification={(message) => console.log(message)}
              바설정={{ 커스텀바: false, 챕터바: false }}
              uiSettings={uiSettings}
            />

            {/* Canvas 오버레이 - 그리기 모드일 때만 터치 가능 */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className={`absolute top-0 left-0 w-full h-full ${isDrawingMode ? 'cursor-crosshair' : 'cursor-default'}`}
              onMouseDown={isDrawingMode ? handleMouseDown : undefined}
              onMouseMove={isDrawingMode ? handleMouseMove : undefined}
              onMouseUp={isDrawingMode ? handleMouseUp : undefined}
              onMouseLeave={isDrawingMode ? handleMouseUp : undefined}
              onTouchStart={isDrawingMode ? handleMouseDown : undefined}
              onTouchMove={isDrawingMode ? handleMouseMove : undefined}
              onTouchEnd={isDrawingMode ? handleMouseUp : undefined}
              style={{
                pointerEvents: isDrawingMode ? 'auto' : 'none',
                touchAction: isDrawingMode ? 'none' : 'auto'
              }}
            />
          </div>

          {/* 시간바 컨트롤 */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-16">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  if (player && isPlayerReady) {
                    const newTime = parseFloat(e.target.value);
                    player.seekTo(newTime, true);
                    setCurrentTime(newTime);
                  }
                }}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (duration || 1)) * 100}%, #d1d5db ${(currentTime / (duration || 1)) * 100}%, #d1d5db 100%)`
                }}
              />
              <span className="text-sm text-gray-600 w-16">{formatTime(duration)}</span>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {isPlaying ? '재생 중' : '일시정지'}
            </div>
          </div>
        </div>

        {/* 오른쪽: 컨트롤 패널 */}
        <div className="space-y-4">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tools">도구</TabsTrigger>
              <TabsTrigger value="list">목록</TabsTrigger>
            </TabsList>

            {/* 도구 탭 */}
            <TabsContent value="tools" className="space-y-4">
              {/* 그리기 도구 선택 */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">그리기 도구</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={drawingTool === 'pen' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingTool('pen')}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    펜
                  </Button>
                  <Button
                    variant={drawingTool === 'arrow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingTool('arrow')}
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    화살표
                  </Button>
                  <Button
                    variant={drawingTool === 'rectangle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingTool('rectangle')}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    사각형
                  </Button>
                  <Button
                    variant={drawingTool === 'circle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingTool('circle')}
                  >
                    <Circle className="w-4 h-4 mr-1" />
                    원
                  </Button>
                  <Button
                    variant={drawingTool === 'eraser' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDrawingTool('eraser')}
                  >
                    <Eraser className="w-4 h-4 mr-1" />
                    지우개
                  </Button>
                </div>
              </div>

              {/* 색상 선택 */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">색상</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff', '#ff8800', '#8800ff'].map(color => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded border-2 ${drawingColor === color ? 'border-black' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setDrawingColor(color)}
                    />
                  ))}
                </div>
              </div>

              {/* 굵기 조절 */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">굵기: {drawingThickness}px</h3>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={drawingThickness}
                  onChange={(e) => setDrawingThickness(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 타임스탬프 설정 */}
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">타임스탬프 설정</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm">시작 시간 (초)</label>
                    <input
                      type="number"
                      value={drawingStartTime}
                      onChange={(e) => setDrawingStartTime(Number(e.target.value))}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-sm">지속 시간 (초)</label>
                    <input
                      type="number"
                      value={drawingDuration}
                      onChange={(e) => setDrawingDuration(Number(e.target.value))}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDrawingStartTime(Math.floor(currentTime))}
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    현재 시간으로 설정
                  </Button>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="bg-white p-4 rounded-lg shadow">
                <Button
                  size="lg"
                  onClick={saveDrawing}
                  disabled={tempStrokes.length === 0}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  그리기 저장 {tempStrokes.length > 0 && `(${tempStrokes.length}개 선)`}
                </Button>
                {tempStrokes.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {tempStrokes.length}개의 선/도형이 그려졌습니다. 저장하세요!
                  </p>
                )}
              </div>
            </TabsContent>

            {/* 목록 탭 */}
            <TabsContent value="list" className="space-y-2">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">저장된 그리기 ({drawings.length}개)</h3>
                {drawings.length === 0 ? (
                  <p className="text-sm text-gray-500">저장된 그리기가 없습니다</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {drawings.map(drawing => (
                      <div
                        key={drawing.id}
                        className={`p-2 border rounded flex items-center justify-between ${
                          activeDrawingId === drawing.id ? 'bg-blue-50 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            그리기 ({drawing.strokes.length}개 선/도형)
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(drawing.startTime)} ~ {formatTime(drawing.startTime + drawing.duration)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDrawing(drawing.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TestDrawingPage;
