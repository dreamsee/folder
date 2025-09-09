import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Edit3, SkipForward, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSkipControlsProps {
  player: any | null;
  isPlayerReady: boolean;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

interface TimeSkipSettings {
  times: number[]; // 시간 버튼들 (초 단위)
  videoSource: 'related' | 'channel' | 'favorites' | 'disabled'; // 다음영상 소스
}

const defaultSettings: TimeSkipSettings = {
  times: [1, 5, 10, 30, 60],
  videoSource: 'disabled'
};

const TimeSkipControls: React.FC<TimeSkipControlsProps> = ({
  player,
  isPlayerReady,
  showNotification
}) => {
  const [direction, setDirection] = useState<'prev' | 'next'>('next'); // 이전/다음 토글
  const [isEditing, setIsEditing] = useState(false); // 편집 모드
  const [settings, setSettings] = useState<TimeSkipSettings>(defaultSettings);
  const [editTimes, setEditTimes] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false); // 설정 패널 표시
  const [showTooltip, setShowTooltip] = useState(false); // 미리보기 툴팁
  const [previewInfo, setPreviewInfo] = useState<any>(null); // 미리보기 영상 정보
  const [showPreview, setShowPreview] = useState(false); // 미리보기 패널 표시
  const [previewVideos, setPreviewVideos] = useState<any[]>([]); // 미리보기 영상 목록
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0); // 현재 미리보기 인덱스

  // localStorage에서 설정 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('timeSkipSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
      } catch (error) {
        console.error('시간 건너뛰기 설정 로드 실패:', error);
      }
    }
  }, []);

  // 설정 변경 시 localStorage 저장
  useEffect(() => {
    localStorage.setItem('timeSkipSettings', JSON.stringify(settings));
  }, [settings]);

  // 시간 건너뛰기 실행
  const handleTimeSkip = (seconds: number) => {
    if (!player || !isPlayerReady) {
      showNotification("플레이어가 준비되지 않았습니다.", "warning");
      return;
    }

    try {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      
      let newTime: number;
      if (direction === 'next') {
        newTime = Math.min(currentTime + seconds, duration);
      } else {
        newTime = Math.max(currentTime - seconds, 0);
      }
      
      player.seekTo(newTime, true);
      
      const directionText = direction === 'next' ? '앞으로' : '뒤로';
      showNotification(`${seconds}초 ${directionText} 이동`, "info");
    } catch (error) {
      showNotification("시간 이동 중 오류가 발생했습니다.", "error");
    }
  };

  // 영상 이동 (다음/이전 영상)
  const handleVideoSkip = async () => {
    if (settings.videoSource === 'disabled') {
      showNotification("영상 이동이 비활성화되어 있습니다.", "warning");
      return;
    }

    if (!player) {
      showNotification("플레이어가 준비되지 않았습니다.", "warning");
      return;
    }

    try {
      const currentVideoId = player.getVideoData()?.video_id;
      if (!currentVideoId) {
        showNotification("현재 영상 정보를 가져올 수 없습니다.", "error");
        return;
      }

      let nextVideoId = null;
      const directionText = direction === 'next' ? '다음' : '이전';

      // 각 소스별로 다른 방식으로 영상 가져오기
      switch (settings.videoSource) {
        case 'related':
          nextVideoId = await getRelatedVideo(currentVideoId, direction);
          break;
        case 'channel':
          nextVideoId = await getChannelVideo(currentVideoId, direction);
          break;
        case 'favorites':
          nextVideoId = await getFavoriteVideo(currentVideoId, direction);
          break;
      }

      if (nextVideoId) {
        // 새 영상 로드
        player.loadVideoById(nextVideoId);
        showNotification(`${directionText} 영상으로 이동했습니다.`, "success");
      } else {
        showNotification(`${directionText} 영상을 찾을 수 없습니다.`, "warning");
      }
    } catch (error) {
      showNotification("영상 이동 중 오류가 발생했습니다.", "error");
      console.error('영상 이동 오류:', error);
    }
  };

  // 관련 영상 가져오기 (YouTube API)
  const getRelatedVideo = async (currentVideoId: string, direction: 'prev' | 'next'): Promise<string | null> => {
    try {
      // YouTube Data API v3 - Search API 사용
      const response = await fetch(`/api/youtube/related?videoId=${currentVideoId}&direction=${direction}`);
      const data = await response.json();
      return data.videoId || null;
    } catch (error) {
      console.error('관련 영상 가져오기 오류:', error);
      return null;
    }
  };

  // 같은 채널 영상 가져오기
  const getChannelVideo = async (currentVideoId: string, direction: 'prev' | 'next'): Promise<string | null> => {
    try {
      // 현재 영상의 채널 정보로 채널 영상 목록 가져오기
      const response = await fetch(`/api/youtube/channel?videoId=${currentVideoId}&direction=${direction}`);
      const data = await response.json();
      return data.videoId || null;
    } catch (error) {
      console.error('채널 영상 가져오기 오류:', error);
      return null;
    }
  };

  // 즐겨찾기 영상 가져오기
  const getFavoriteVideo = async (currentVideoId: string, direction: 'prev' | 'next'): Promise<string | null> => {
    try {
      // 로컬스토리지나 서버에서 즐겨찾기 목록 가져오기
      const response = await fetch(`/api/favorites?currentVideoId=${currentVideoId}&direction=${direction}`);
      const data = await response.json();
      return data.videoId || null;
    } catch (error) {
      console.error('즐겨찾기 영상 가져오기 오류:', error);
      return null;
    }
  };

  // 미리보기 영상 정보 가져오기
  const getPreviewVideoInfo = async () => {
    if (settings.videoSource === 'disabled' || !player) return null;
    
    try {
      const currentVideoId = player.getVideoData()?.video_id;
      if (!currentVideoId) return null;

      let previewVideoId = null;
      switch (settings.videoSource) {
        case 'related':
          previewVideoId = await getRelatedVideo(currentVideoId, direction);
          break;
        case 'channel':
          previewVideoId = await getChannelVideo(currentVideoId, direction);
          break;
        case 'favorites':
          previewVideoId = await getFavoriteVideo(currentVideoId, direction);
          break;
      }

      if (previewVideoId) {
        // 영상 정보 가져오기
        const response = await fetch(`/api/youtube/video-info?videoId=${previewVideoId}`);
        const videoInfo = await response.json();
        
        return {
          title: videoInfo.title,
          thumbnail: videoInfo.thumbnail,
          source: getVideoSourceText(settings.videoSource),
          direction: direction === 'next' ? '다음' : '이전'
        };
      }
      return null;
    } catch (error) {
      console.error('미리보기 정보 가져오기 오류:', error);
      return null;
    }
  };

  // 미리보기 영상 목록 가져오기 (최대 10개)
  const getPreviewVideoList = async () => {
    if (settings.videoSource === 'disabled' || !player) return [];
    
    try {
      const currentVideoId = player.getVideoData()?.video_id;
      if (!currentVideoId) return [];

      let response;
      switch (settings.videoSource) {
        case 'related':
          response = await fetch(`/api/youtube/related-list?videoId=${currentVideoId}&count=10`);
          break;
        case 'channel':
          response = await fetch(`/api/youtube/channel-list?videoId=${currentVideoId}&count=10`);
          break;
        case 'favorites':
          response = await fetch(`/api/favorites-list?currentVideoId=${currentVideoId}&count=10`);
          break;
        default:
          return [];
      }

      if (response.ok) {
        const data = await response.json();
        return data.videos || [];
      }
      return [];
    } catch (error) {
      console.error('미리보기 목록 가져오기 오류:', error);
      return [];
    }
  };

  // 미리보기 패널 열기
  const handleVideoSkipClick = async () => {
    if (settings.videoSource === 'disabled') {
      showNotification("영상 이동이 비활성화되어 있습니다.", "warning");
      return;
    }

    setShowPreview(true);
    const videos = await getPreviewVideoList();
    setPreviewVideos(videos);
    setCurrentPreviewIndex(0);
  };

  // 미리보기 이전/다음 영상
  const handlePreviewNavigation = (dir: 'prev' | 'next') => {
    if (dir === 'prev' && currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    } else if (dir === 'next' && currentPreviewIndex < previewVideos.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
  };

  // 미리보기 영상 선택
  const handlePreviewSelect = (video: any) => {
    if (player && video.videoId) {
      player.loadVideoById(video.videoId);
      setShowPreview(false);
      showNotification(`'${video.title}'으로 이동했습니다.`, "success");
    }
  };

  // 편집 모드 시작
  const startEditing = () => {
    setEditTimes(settings.times.map(time => formatTime(time)));
    setIsEditing(true);
  };

  // 편집 완료
  const finishEditing = () => {
    try {
      const newTimes = editTimes.map(timeStr => parseTime(timeStr)).filter(time => time > 0);
      if (newTimes.length === 0) {
        showNotification("최소 하나의 시간 버튼이 필요합니다.", "warning");
        return;
      }
      
      setSettings(prev => ({ ...prev, times: newTimes }));
      setIsEditing(false);
      showNotification("시간 설정이 저장되었습니다.", "success");
    } catch (error) {
      showNotification("시간 형식이 잘못되었습니다.", "error");
    }
  };

  // 영상 소스 변경
  const handleVideoSourceChange = (newSource: string) => {
    setSettings(prev => ({ 
      ...prev, 
      videoSource: newSource as 'related' | 'channel' | 'favorites' | 'disabled'
    }));
  };

  // 영상 소스 표시 텍스트
  const getVideoSourceText = (source: string) => {
    switch (source) {
      case 'related': return '⚙️ 관련영상';
      case 'channel': return '📺 같은채널';
      case 'favorites': return '⭐ 즐겨찾기';
      case 'disabled': return '🚫 사용안함';
      default: return '🚫 사용안함';
    }
  };

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
    setEditTimes([]);
  };

  // 시간을 텍스트로 변환 (예: 65 -> "1분 5초")
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}초`;
    } else if (seconds % 60 === 0) {
      return `${Math.floor(seconds / 60)}분`;
    } else {
      return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`;
    }
  };

  // 텍스트를 초로 변환 (예: "1분 5초" -> 65)
  const parseTime = (timeStr: string): number => {
    // "1분 5초", "30초", "2분" 등의 형식을 파싱
    const minuteMatch = timeStr.match(/(\d+)분/);
    const secondMatch = timeStr.match(/(\d+)초/);
    
    const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
    const seconds = secondMatch ? parseInt(secondMatch[1]) : 0;
    
    return minutes * 60 + seconds;
  };

  return (
    <div className="w-full bg-gradient-to-r from-green-50 to-blue-50 border-2 border-gray-200 rounded-lg p-2 relative">
      <div className="h-full flex items-center gap-2">
        {/* 방향 토글 버튼 */}
        <Button
          onClick={() => setDirection(direction === 'next' ? 'prev' : 'next')}
          variant="outline"
          size="sm"
          className="flex-shrink-0 h-8 px-3"
        >
          {direction === 'prev' ? (
            <>
              <ChevronLeft className="w-3 h-3 mr-1" />
              이전
            </>
          ) : (
            <>
              다음
              <ChevronRight className="w-3 h-3 ml-1" />
            </>
          )}
        </Button>

        {/* 시간 버튼들 */}
        <div className="flex gap-1 flex-1 justify-center">
          {!isEditing ? (
            // 일반 모드: 클릭 가능한 시간 버튼들
            settings.times.map((time, index) => (
              <Button
                key={index}
                onClick={() => handleTimeSkip(time)}
                disabled={!isPlayerReady}
                variant="secondary"
                size="sm"
                className="h-8 px-2 text-xs"
              >
                {formatTime(time)}
              </Button>
            ))
          ) : (
            // 편집 모드: 입력 필드들
            editTimes.map((timeStr, index) => (
              <Input
                key={index}
                value={timeStr}
                onChange={(e) => {
                  const newEditTimes = [...editTimes];
                  newEditTimes[index] = e.target.value;
                  setEditTimes(newEditTimes);
                }}
                className="w-16 h-8 text-xs text-center"
                placeholder="1분 5초"
              />
            ))
          )}
        </div>

        {/* 영상 이동 버튼 */}
        <div className="relative">
          <Button
            onClick={handleVideoSkipClick}
            disabled={!isPlayerReady || settings.videoSource === 'disabled'}
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 px-2"
            title="영상 미리보기"
          >
            <SkipForward className="w-3 h-3" />
          </Button>
        </div>

        {/* 설정 및 편집 버튼 */}
        <div className="flex gap-1">
          {/* 설정 버튼 */}
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-8 px-2"
            title="영상 소스 설정"
          >
            <Settings className="w-3 h-3" />
          </Button>

          {/* 편집 버튼 */}
          {!isEditing ? (
            <Button
              onClick={startEditing}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 px-2"
              title="시간 간격 편집"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                onClick={finishEditing}
                variant="default"
                size="sm"
                className="h-8 px-2 text-xs"
              >
                저장
              </Button>
              <Button
                onClick={cancelEditing}
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
              >
                취소
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="mt-2 p-3 bg-white border-2 border-purple-300 rounded-lg shadow-md relative z-50">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">영상 이동 설정</h4>
            
            <div className="space-y-2">
              <Select 
                value={settings.videoSource} 
                onValueChange={handleVideoSourceChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="related">⚙️ 관련영상 - YouTube 추천 기반</SelectItem>
                  <SelectItem value="channel">📺 같은채널 - 업로드 순서대로</SelectItem>
                  <SelectItem value="favorites">⭐ 즐겨찾기 - 목록 순서대로</SelectItem>
                  <SelectItem value="disabled">🚫 사용안함 - 버튼 비활성화</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 패널 */}
      {showPreview && (
        <div className="mt-2 p-4 bg-white border-2 border-indigo-300 rounded-lg shadow-lg relative z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">영상 미리보기</h4>
              <Button
                onClick={() => setShowPreview(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>
            
            {previewVideos.length > 0 && (
              <div className="space-y-3">
                {/* 현재 미리보기 영상 */}
                <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <img 
                      src={previewVideos[currentPreviewIndex]?.thumbnail || '/api/placeholder/120/90'}
                      alt="미리보기"
                      className="w-20 h-15 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/api/placeholder/120/90';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {getVideoSourceText(settings.videoSource)} • {currentPreviewIndex + 1} / {previewVideos.length}
                    </div>
                    <h5 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">
                      {previewVideos[currentPreviewIndex]?.title || '영상 제목'}
                    </h5>
                    <div className="text-xs text-gray-600">
                      {previewVideos[currentPreviewIndex]?.channelTitle || '채널명'}
                    </div>
                  </div>
                </div>

                {/* 네비게이션 버튼들 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePreviewNavigation('prev')}
                      disabled={currentPreviewIndex === 0}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      이전
                    </Button>
                    <Button
                      onClick={() => handlePreviewNavigation('next')}
                      disabled={currentPreviewIndex === previewVideos.length - 1}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      다음
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => handlePreviewSelect(previewVideos[currentPreviewIndex])}
                    variant="default"
                    size="sm"
                    className="h-8 px-4 text-xs bg-indigo-500 hover:bg-indigo-600"
                  >
                    이 영상 재생
                  </Button>
                </div>
              </div>
            )}

            {previewVideos.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                미리보기 영상을 불러오는 중...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSkipControls;