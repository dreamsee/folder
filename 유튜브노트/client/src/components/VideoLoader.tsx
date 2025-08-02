import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// import type { YoutubeSearchResponse, YoutubeVideo } from "@shared/schema"; // 현재 미사용

interface VideoLoaderProps {
  player: any | null;
  isPlayerReady: boolean;
  setCurrentVideoId: React.Dispatch<React.SetStateAction<string>>;
  setCurrentVideoInfo: React.Dispatch<React.SetStateAction<{
    title: string;
    channelName: string;
    thumbnailUrl: string;
  } | undefined>>;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

const VideoLoader: React.FC<VideoLoaderProps> = ({
  player,
  isPlayerReady,
  setCurrentVideoId,
  setCurrentVideoInfo,
  showNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);

  // 검색을 통한 영상 찾기
  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      showNotification("검색어를 입력해주세요.", "error");
      return;
    }

    setIsSearching(true);

    try {
      console.log("API 호출 시작:", searchQuery);
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`,
      );
      console.log("API 응답 상태:", response.status);
      
      if (!response.ok) {
        let errorMessage = "검색 중 오류가 발생했습니다.";
        try {
          const responseText = await response.text();
          console.error("서버 응답:", responseText);
          console.error("응답 헤더:", Object.fromEntries(response.headers));
          
          if (responseText.trim()) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
              errorMessage = `서버 에러 (${response.status}): ${responseText}`;
            }
          }
        } catch (textError) {
          console.error("응답 읽기 에러:", textError);
          errorMessage = `서버 에러 (${response.status})`;
        }
        showNotification(errorMessage, "error");
        setSearchResults([]);
        return;
      }
      
      const data: YoutubeSearchResponse = await response.json();

      if (data.videos && data.videos.length > 0) {
        setSearchResults(data.videos);
        showNotification(`${data.videos.length}개의 검색 결과를 찾았습니다.`, "success");
      } else {
        setSearchResults([]);
        showNotification("검색 결과가 없습니다.", "error");
      }
    } catch (error) {
      console.error("검색 에러:", error);
      showNotification("검색 중 오류가 발생했습니다.", "error");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 영상 선택해서 재생
  const handleVideoSelect = (video: YoutubeVideo) => {
    // 비디오 ID 먼저 설정 (플레이어 생성 트리거)
    setCurrentVideoId(video.videoId);
    setCurrentVideoInfo({
      title: video.title,
      channelName: video.channelTitle,
      thumbnailUrl: video.thumbnail,
    });
    
    // 플레이어가 준비된 경우 바로 로드
    if (isPlayerReady && player) {
      player.loadVideoById(video.videoId);
      showNotification(`"${video.title}" 영상을 로드했습니다.`, "success");
    } else {
      showNotification(`"${video.title}" 영상을 준비하고 있습니다.`, "info");
    }
    
    setSearchResults([]); // 선택 후 검색 결과 닫기
  };

  return (
    <div className="mb-4">
      {/* 검색 입력 */}
      <div className="flex gap-2 mb-3">
        <Input
          type="text"
          placeholder="YouTube 영상 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          onClick={handleSearch} 
          disabled={!isPlayerReady || isSearching || !searchQuery.trim()}
          size="default"
          className="hover:bg-primary/90 active:scale-95 transition-transform"
          title="YouTube 영상 검색"
        >
          {isSearching ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 검색 결과 목록 */}
      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2 bg-white">
          {searchResults.map((video) => (
            <div
              key={video.videoId}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => handleVideoSelect(video)}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-16 h-12 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {video.channelTitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoLoader;
