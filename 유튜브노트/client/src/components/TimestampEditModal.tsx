import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Volume2, Gauge } from "lucide-react";

interface TimestampEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any | null;
  isPlayerReady: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  onSave: (timestamp: {
    startTime: number;
    endTime: number;
    volume: number;
    playbackRate: number;
    pauseDuration?: number;
    autoJump: boolean;
  }) => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

const TimestampEditModal: React.FC<TimestampEditModalProps> = ({
  isOpen,
  onClose,
  player,
  isPlayerReady,
  currentTime,
  duration: defaultDuration,
  volume: defaultVolume,
  playbackRate: defaultPlaybackRate,
  onSave,
  showNotification
}) => {
  // 시간 상태 (초 단위)
  const [startTime, setStartTime] = useState(currentTime);
  const [endTime, setEndTime] = useState(currentTime + 5);
  
  // 시간 입력 필드 상태 (문자열)
  const [startTimeInput, setStartTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  
  // 재생 설정
  const [volume, setVolume] = useState(defaultVolume);
  const [playbackRate, setPlaybackRate] = useState(defaultPlaybackRate);
  
  // 고급 설정
  const [pauseDuration, setPauseDuration] = useState('');
  const [autoJump, setAutoJump] = useState(false);
  
  // 포커스 추적
  const [focusedField, setFocusedField] = useState<'start' | 'end' | null>(null);
  
  // 입력 필드 ref
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  // 시간을 HH:MM:SS.sss 형식으로 포맷
  const formatTimeToString = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secsStr = secs.toFixed(3).padStart(6, '0');
    
    return `${hoursStr}:${minutesStr}:${secsStr}`;
  };

  // HH:MM:SS.sss 형식을 초로 변환
  const parseTimeString = (timeStr: string): number | null => {
    // 다양한 형식 지원: HH:MM:SS.sss, HH:MM:SS, MM:SS.sss, MM:SS
    const fullPattern = /^(\d{1,2}):(\d{2}):(\d{2}(?:\.\d{1,3})?)$/;
    const shortPattern = /^(\d{1,2}):(\d{2}(?:\.\d{1,3})?)$/;
    
    let match = fullPattern.exec(timeStr);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseFloat(match[3]);
      
      if (minutes >= 60 || seconds >= 60) return null;
      
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    match = shortPattern.exec(timeStr);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      
      if (minutes >= 60 || seconds >= 60) return null;
      
      return minutes * 60 + seconds;
    }
    
    // 단순 숫자만 입력된 경우 (초로 간주)
    const seconds = parseFloat(timeStr);
    if (!isNaN(seconds) && seconds >= 0) {
      return seconds;
    }
    
    return null;
  };

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen && player && isPlayerReady) {
      const current = player.getCurrentTime();
      setStartTime(current);
      setEndTime(current + defaultDuration);
      setStartTimeInput(formatTimeToString(current));
      setEndTimeInput(formatTimeToString(current + defaultDuration));
      setVolume(defaultVolume);
      setPlaybackRate(defaultPlaybackRate);
      setPauseDuration('');
      setAutoJump(false);
      setFocusedField(null);
      
      // 영상 일시정지
      if (player.getPlayerState() === 1) {
        player.pauseVideo();
      }
    }
  }, [isOpen, player, isPlayerReady, currentTime, defaultDuration, defaultVolume, defaultPlaybackRate]);

  // 시작 시간 입력 처리
  const handleStartTimeInput = (value: string) => {
    setStartTimeInput(value);
    const time = parseTimeString(value);
    if (time !== null) {
      setStartTime(time);
      // 실시간 영상 이동
      if (player && isPlayerReady) {
        player.seekTo(time, true);
        // 일시정지 상태 유지
        if (player.getPlayerState() === 1) {
          player.pauseVideo();
        }
      }
    }
  };

  // 종료 시간 입력 처리
  const handleEndTimeInput = (value: string) => {
    setEndTimeInput(value);
    const time = parseTimeString(value);
    if (time !== null) {
      setEndTime(time);
      // 실시간 영상 이동
      if (player && isPlayerReady) {
        player.seekTo(time, true);
        // 일시정지 상태 유지
        if (player.getPlayerState() === 1) {
          player.pauseVideo();
        }
      }
    }
  };

  // 포커스 시 영상 시간 이동
  const handleFieldFocus = (field: 'start' | 'end') => {
    setFocusedField(field);
    if (player && isPlayerReady) {
      const targetTime = field === 'start' ? startTime : endTime;
      player.seekTo(targetTime, true);
      
      // 일시정지 상태 유지
      if (player.getPlayerState() === 1) {
        player.pauseVideo();
      }
    }
  };

  // 숫자만 입력 가능하도록 필터링
  const filterNumericInput = (value: string): string => {
    // 숫자, 콜론, 점만 허용
    return value.replace(/[^0-9:.]/g, '');
  };

  // 저장 처리
  const handleSave = () => {
    // 유효성 검사
    if (startTime >= endTime) {
      showNotification('시작 시간은 종료 시간보다 앞서야 합니다', 'error');
      return;
    }
    
    if (startTime < 0 || endTime < 0) {
      showNotification('시간은 0보다 커야 합니다', 'error');
      return;
    }
    
    const pauseDur = pauseDuration ? parseInt(pauseDuration) : undefined;
    if (pauseDur !== undefined && (pauseDur < 0 || pauseDur > 60)) {
      showNotification('정지 시간은 0-60 사이여야 합니다', 'error');
      return;
    }
    
    onSave({
      startTime,
      endTime,
      volume: Math.round(volume),
      playbackRate,
      pauseDuration: pauseDur,
      autoJump
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto" style={{ marginTop: '20vh' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            타임스탬프 편집
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* 시간 설정 섹션 */}
          <div className="space-y-3">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">시작 시간</Label>
                <Input
                  id="startTime"
                  ref={startInputRef}
                  value={startTimeInput}
                  onChange={(e) => handleStartTimeInput(filterNumericInput(e.target.value))}
                  onFocus={() => handleFieldFocus('start')}
                  placeholder="00:00:00.000"
                  className={focusedField === 'start' ? 'ring-2 ring-blue-500' : ''}
                />
                <p className="text-xs text-gray-500">HH:MM:SS.sss 또는 MM:SS</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">종료 시간</Label>
                <Input
                  id="endTime"
                  ref={endInputRef}
                  value={endTimeInput}
                  onChange={(e) => handleEndTimeInput(filterNumericInput(e.target.value))}
                  onFocus={() => handleFieldFocus('end')}
                  placeholder="00:00:05.000"
                  className={focusedField === 'end' ? 'ring-2 ring-blue-500' : ''}
                />
                <p className="text-xs text-gray-500">HH:MM:SS.sss 또는 MM:SS</p>
              </div>
            </div>
            
            {/* 구간 표시 */}
            <div className="text-sm text-center text-gray-600 bg-gray-50 p-2 rounded">
              구간 길이: {(endTime - startTime).toFixed(3)}초
            </div>
          </div>
          
          {/* 재생 설정 섹션 */}
          <div className="space-y-3">
            
            {/* 볼륨 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  볼륨
                </Label>
                <span className="text-sm text-gray-600">{Math.round(volume)}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={([value]) => setVolume(value)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            
            {/* 재생 속도 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  재생 속도
                </Label>
                <span className="text-sm text-gray-600">{playbackRate.toFixed(2)}x</span>
              </div>
              <Slider
                value={[playbackRate]}
                onValueChange={([value]) => setPlaybackRate(value)}
                min={0.25}
                max={2.0}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
          
          {/* 고급 설정 섹션 */}
          <div className="space-y-3">
            
            <div className="space-y-3">
              {/* 정지 시간 */}
              <div className="space-y-2">
                <Label htmlFor="pauseDuration">정지 시간 (선택)</Label>
                <Input
                  id="pauseDuration"
                  type="number"
                  value={pauseDuration}
                  onChange={(e) => setPauseDuration(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="60"
                  className="w-24"
                />
              </div>
              
              {/* 자동 점프 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoJump"
                  checked={autoJump}
                  onCheckedChange={(checked) => setAutoJump(checked as boolean)}
                />
                <Label htmlFor="autoJump" className="text-sm cursor-pointer">
                  자동 점프 (다음 타임스탬프로 자동 이동)
                </Label>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimestampEditModal;