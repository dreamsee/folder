// 돋보기(화면 확대) 탭 컨텐츠 컴포넌트
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 확대 설정 데이터 타입
interface ZoomConfig {
  id: string;
  centerPoint: {
    x: number;  // 픽셀 단위
    y: number;  // 픽셀 단위
  };
  scale: number;  // 확대 배율
  startTime: number;  // 초 단위
  endTime: number;    // 초 단위
  border: {
    enabled: boolean;
    width: number;
    color: string;
  };
}

interface ZoomContentProps {
  player: any;
  isPlayerReady: boolean;
  currentTime: number;
  showNotification?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const ZoomContent: React.FC<ZoomContentProps> = ({
  player,
  isPlayerReady,
  currentTime,
  showNotification
}) => {
  // 확대 설정 목록
  const [zoomConfigs, setZoomConfigs] = useState<ZoomConfig[]>([]);
  // 현재 편집 중인 설정
  const [currentConfig, setCurrentConfig] = useState<ZoomConfig>({
    id: Date.now().toString(),
    centerPoint: { x: 400, y: 225 }, // 중앙
    scale: 2,
    startTime: 0,
    endTime: 1,
    border: { enabled: true, width: 2, color: '#ff0000' }
  });

  // 실시간 미리보기 상태
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  // 컴포넌트 마운트시 저장된 설정 로드
  useEffect(() => {
    const saved = localStorage.getItem('zoomConfigs');
    if (saved) {
      try {
        setZoomConfigs(JSON.parse(saved));
      } catch (error) {
        console.error('확대 설정 로드 실패:', error);
      }
    }
  }, []);

  // 설정 저장
  const saveConfigs = (configs: ZoomConfig[]) => {
    setZoomConfigs(configs);
    localStorage.setItem('zoomConfigs', JSON.stringify(configs));
  };

  // 새 설정 추가
  const addZoomConfig = () => {
    const newConfig = {
      ...currentConfig,
      id: Date.now().toString(),
      startTime: currentTime,
      endTime: currentTime + 1
    };
    saveConfigs([...zoomConfigs, newConfig]);
    showNotification?.('확대 설정이 저장되었습니다.', 'success');
  };

  // 설정 삭제
  const deleteZoomConfig = (id: string) => {
    saveConfigs(zoomConfigs.filter(config => config.id !== id));
    showNotification?.('확대 설정이 삭제되었습니다.', 'info');
  };

  // 좌표 변경 핸들러
  const updateCoordinate = (axis: 'x' | 'y', delta: number) => {
    setCurrentConfig(prev => ({
      ...prev,
      centerPoint: {
        ...prev.centerPoint,
        [axis]: Math.max(0, Math.min(axis === 'x' ? 800 : 450, prev.centerPoint[axis] + delta))
      }
    }));
  };

  // 시간 변경 핸들러
  const updateTime = (field: 'startTime' | 'endTime', delta: number) => {
    setCurrentConfig(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  return (
    <div className="zoom-content">
      <Tabs defaultValue="coordinates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="coordinates">좌표입력</TabsTrigger>
          <TabsTrigger value="list">목록관리</TabsTrigger>
        </TabsList>

        <TabsContent value="coordinates" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* 좌표 입력 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">확대 중심점</h4>

                  {/* X 좌표 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-6">X:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('x', -100)}
                    >
                      -100
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('x', -10)}
                    >
                      -10
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('x', -1)}
                    >
                      -1
                    </Button>
                    <span className="text-sm font-mono min-w-[60px] text-center">
                      {currentConfig.centerPoint.x}px
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('x', 1)}
                    >
                      +1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('x', 10)}
                    >
                      +10
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('x', 100)}
                    >
                      +100
                    </Button>
                  </div>

                  {/* Y 좌표 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-6">Y:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('y', -100)}
                    >
                      -100
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('y', -10)}
                    >
                      -10
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('y', -1)}
                    >
                      -1
                    </Button>
                    <span className="text-sm font-mono min-w-[60px] text-center">
                      {currentConfig.centerPoint.y}px
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('y', 1)}
                    >
                      +1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('y', 10)}
                    >
                      +10
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateCoordinate('y', 100)}
                    >
                      +100
                    </Button>
                  </div>
                </div>

                {/* 배율 선택 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">확대 배율</h4>
                  <div className="flex gap-2">
                    {[1.5, 2, 3, 4].map(scale => (
                      <Button
                        key={scale}
                        size="sm"
                        variant={currentConfig.scale === scale ? "default" : "outline"}
                        onClick={() => setCurrentConfig(prev => ({ ...prev, scale }))}
                      >
                        {scale}x
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 시간 설정 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">적용 시간</h4>

                  {/* 시작 시간 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-12">시작:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('startTime', -60)}
                    >
                      -1분
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('startTime', -1)}
                    >
                      -1초
                    </Button>
                    <span className="text-sm font-mono min-w-[80px] text-center">
                      {Math.floor(currentConfig.startTime / 60)}:{(currentConfig.startTime % 60).toFixed(0).padStart(2, '0')}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('startTime', 1)}
                    >
                      +1초
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('startTime', 60)}
                    >
                      +1분
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentConfig(prev => ({ ...prev, startTime: currentTime }))}
                    >
                      현재시간
                    </Button>
                  </div>

                  {/* 종료 시간 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-12">종료:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('endTime', -60)}
                    >
                      -1분
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('endTime', -1)}
                    >
                      -1초
                    </Button>
                    <span className="text-sm font-mono min-w-[80px] text-center">
                      {Math.floor(currentConfig.endTime / 60)}:{(currentConfig.endTime % 60).toFixed(0).padStart(2, '0')}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('endTime', 1)}
                    >
                      +1초
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTime('endTime', 60)}
                    >
                      +1분
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentConfig(prev => ({ ...prev, endTime: currentTime + 1 }))}
                    >
                      현재+1초
                    </Button>
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="pt-4">
                  <Button onClick={addZoomConfig} className="w-full">
                    현재 설정 저장
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">저장된 확대 설정</h4>
                {zoomConfigs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    저장된 확대 설정이 없습니다.
                  </p>
                ) : (
                  zoomConfigs.map((config) => (
                    <div key={config.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {Math.floor(config.startTime / 60)}:{(config.startTime % 60).toFixed(0).padStart(2, '0')} - {Math.floor(config.endTime / 60)}:{(config.endTime % 60).toFixed(0).padStart(2, '0')}
                          </div>
                          <div className="text-xs text-gray-500">
                            위치: ({config.centerPoint.x}, {config.centerPoint.y}) / 배율: {config.scale}x
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteZoomConfig(config.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};