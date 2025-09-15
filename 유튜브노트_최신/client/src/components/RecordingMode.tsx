import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, Square, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordingModeProps {
  player: any | null;
  isPlayerReady: boolean;
  currentVideoId: string;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  onRecordingComplete: (session: RecordingSession) => void;
}

export interface RawTimestamp {
  id: string;
  time: number;          // 초.밀리초
  action: 'speed' | 'volume' | 'seek' | 'pause' | 'manual';
  value: number;         // 변경된 값
  previousValue: number; // 이전 값
  timestamp: Date;       // 생성 시각
}

export interface RecordingSession {
  id: string;
  title: string;
  videoId: string;
  duration: number;
  totalTimestamps: number;
  createdAt: Date;
  updatedAt: Date;
  rawTimestamps: RawTimestamp[];
}

const RecordingMode = ({
  player,
  isPlayerReady,
  currentVideoId,
  showNotification,
  onRecordingComplete
}: RecordingModeProps) => {
  const [녹화중, set녹화중] = useState(false);
  const [녹화시작시간, set녹화시작시간] = useState<Date | null>(null);
  const [타임스탬프목록, set타임스탬프목록] = useState<RawTimestamp[]>([]);
  const [경과시간, set경과시간] = useState(0);
  
  // 이전 상태 추적을 위한 ref
  const 이전속도 = useRef(1);
  const 이전볼륨 = useRef(100);
  const 이전시간 = useRef(0);
  const 이전상태 = useRef(-1);
  
  // 타이머 ref
  const 타이머 = useRef<NodeJS.Timeout | null>(null);

  // 녹화 시작
  const 녹화시작하기 = () => {
    if (!player || !isPlayerReady || !currentVideoId) {
      showNotification("먼저 동영상을 로드하세요.", "warning");
      return;
    }

    set녹화중(true);
    set녹화시작시간(new Date());
    set타임스탬프목록([]);
    set경과시간(0);
    
    // 초기 상태 저장
    이전속도.current = player.getPlaybackRate();
    이전볼륨.current = player.getVolume();
    이전시간.current = player.getCurrentTime();
    이전상태.current = player.getPlayerState();
    
    // 경과시간 타이머 시작
    타이머.current = setInterval(() => {
      set경과시간(prev => prev + 0.1);
    }, 100);
    
    showNotification("녹화를 시작했습니다. 영상을 조작하면 자동으로 타임스탬프가 생성됩니다.", "info");
  };

  // 녹화 종료
  const 녹화종료하기 = () => {
    if (!녹화중) return;
    
    set녹화중(false);
    
    if (타이머.current) {
      clearInterval(타이머.current);
      타이머.current = null;
    }
    
    // 녹화 세션 생성
    const 세션: RecordingSession = {
      id: `rec-${Date.now()}`,
      title: `녹화 세션 - ${new Date().toLocaleString('ko-KR')}`,
      videoId: currentVideoId,
      duration: player.getDuration(),
      totalTimestamps: 타임스탬프목록.length,
      createdAt: 녹화시작시간!,
      updatedAt: new Date(),
      rawTimestamps: 타임스탬프목록
    };
    
    onRecordingComplete(세션);
    showNotification(`녹화를 종료했습니다. ${타임스탬프목록.length}개의 타임스탬프가 저장되었습니다.`, "success");
  };

  // 수동 타임스탬프 추가
  const 수동타임스탬프추가 = () => {
    if (!녹화중 || !player) return;
    
    const 현재시간 = player.getCurrentTime();
    const 새타임스탬프: RawTimestamp = {
      id: `ts-${Date.now()}`,
      time: 현재시간,
      action: 'manual',
      value: 현재시간,
      previousValue: 현재시간,
      timestamp: new Date()
    };
    
    set타임스탬프목록(prev => [...prev, 새타임스탬프]);
    showNotification(`타임스탬프 추가: ${현재시간.toFixed(3)}초`, "info");
  };

  // YouTube Player 이벤트 감지
  useEffect(() => {
    if (!player || !녹화중) return;

    // 재생 속도 변경 감지
    const 속도감지인터벌 = setInterval(() => {
      const 현재속도 = player.getPlaybackRate();
      if (현재속도 !== 이전속도.current) {
        const 새타임스탬프: RawTimestamp = {
          id: `ts-${Date.now()}`,
          time: player.getCurrentTime(),
          action: 'speed',
          value: 현재속도,
          previousValue: 이전속도.current,
          timestamp: new Date()
        };
        set타임스탬프목록(prev => [...prev, 새타임스탬프]);
        이전속도.current = 현재속도;
      }
    }, 100);

    // 볼륨 변경 감지
    const 볼륨감지인터벌 = setInterval(() => {
      const 현재볼륨 = player.getVolume();
      if (Math.abs(현재볼륨 - 이전볼륨.current) > 5) { // 5% 이상 변경 시
        const 새타임스탬프: RawTimestamp = {
          id: `ts-${Date.now()}`,
          time: player.getCurrentTime(),
          action: 'volume',
          value: 현재볼륨,
          previousValue: 이전볼륨.current,
          timestamp: new Date()
        };
        set타임스탬프목록(prev => [...prev, 새타임스탬프]);
        이전볼륨.current = 현재볼륨;
      }
    }, 100);

    // 시간 점프 감지
    const 시간감지인터벌 = setInterval(() => {
      const 현재시간 = player.getCurrentTime();
      const 시간차이 = Math.abs(현재시간 - 이전시간.current);
      
      // 1초 이상 차이나면 시간 점프로 간주
      if (시간차이 > 1.5) {
        const 새타임스탬프: RawTimestamp = {
          id: `ts-${Date.now()}`,
          time: 현재시간,
          action: 'seek',
          value: 현재시간,
          previousValue: 이전시간.current,
          timestamp: new Date()
        };
        set타임스탬프목록(prev => [...prev, 새타임스탬프]);
      }
      이전시간.current = 현재시간;
    }, 200);

    // 일시정지/재생 감지
    const 상태감지인터벌 = setInterval(() => {
      const 현재상태 = player.getPlayerState();
      if (현재상태 !== 이전상태.current && (현재상태 === 1 || 현재상태 === 2)) {
        if (현재상태 === 2) { // 일시정지
          const 새타임스탬프: RawTimestamp = {
            id: `ts-${Date.now()}`,
            time: player.getCurrentTime(),
            action: 'pause',
            value: 0,
            previousValue: 1,
            timestamp: new Date()
          };
          set타임스탬프목록(prev => [...prev, 새타임스탬프]);
        }
      }
      이전상태.current = 현재상태;
    }, 100);

    return () => {
      clearInterval(속도감지인터벌);
      clearInterval(볼륨감지인터벌);
      clearInterval(시간감지인터벌);
      clearInterval(상태감지인터벌);
    };
  }, [player, 녹화중]);

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Circle className={cn("w-4 h-4", 녹화중 && "text-red-500 animate-pulse")} />
          녹화 모드
        </h3>
        {녹화중 && (
          <Badge variant="destructive" className="animate-pulse">
            <Clock className="w-3 h-3 mr-1" />
            {경과시간.toFixed(1)}초
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {!녹화중 ? (
          <div>
            <Button
              onClick={녹화시작하기}
              disabled={!isPlayerReady || !currentVideoId}
              className="w-full"
              variant="destructive"
            >
              <Circle className="w-4 h-4 mr-2" />
              녹화 시작
            </Button>
            <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              영상을 재생하면서 속도, 볼륨, 시간 조정 시 자동으로 타임스탬프가 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                onClick={녹화종료하기}
                className="flex-1"
                variant="secondary"
              >
                <Square className="w-4 h-4 mr-2" />
                녹화 종료
              </Button>
              <Button
                onClick={수동타임스탬프추가}
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                수동 추가
              </Button>
            </div>
            
            {타임스탬프목록.length > 0 && (
              <div className="bg-secondary/50 rounded-md p-3 space-y-1">
                <p className="text-sm font-medium">
                  타임스탬프: {타임스탬프목록.length}개
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>• 속도 변경: {타임스탬프목록.filter(ts => ts.action === 'speed').length}개</p>
                  <p>• 볼륨 변경: {타임스탬프목록.filter(ts => ts.action === 'volume').length}개</p>
                  <p>• 시간 점프: {타임스탬프목록.filter(ts => ts.action === 'seek').length}개</p>
                  <p>• 일시정지: {타임스탬프목록.filter(ts => ts.action === 'pause').length}개</p>
                  <p>• 수동 추가: {타임스탬프목록.filter(ts => ts.action === 'manual').length}개</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecordingMode;