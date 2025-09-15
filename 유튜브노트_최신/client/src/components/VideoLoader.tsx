import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { YoutubeSearchResponse, YoutubeVideo } from "@shared/schema";
import FolderSelector from "./FolderSelector";

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
  autoHide?: boolean;
  isPopup?: boolean;
  onClose?: () => void;
}

const VideoLoader: React.FC<VideoLoaderProps> = ({
  player,
  isPlayerReady,
  setCurrentVideoId,
  setCurrentVideoInfo,
  showNotification,
  autoHide = false,
  isPopup = false,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(!autoHide);
  const [isHovering, setIsHovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [filterMode, setFilterMode] = useState<'watched' | 'blacklisted' | 'unwatched'>('unwatched');
  const [filteredResults, setFilteredResults] = useState<YoutubeVideo[]>([]);
  const [watchedSortOrder, setWatchedSortOrder] = useState<'desc' | 'asc'>('desc');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
  const [selectedVideoForFolder, setSelectedVideoForFolder] = useState<YoutubeVideo | null>(null);

  // 검색을 통한 영상 찾기
  const handleSearch = async (pageToken?: string) => {
    if (!pageToken && searchQuery.trim() === "") {
      showNotification("검색어를 입력해주세요.", "error");
      return;
    }

    const isInitialSearch = !pageToken;
    if (isInitialSearch) {
      setIsSearching(true);
      setSearchResults([]);
      setNextPageToken(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      console.log("API 호출 시작:", searchQuery, "pageToken:", pageToken);
      let url = `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }
      
      const response = await fetch(url);
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
        if (isInitialSearch) {
          setSearchResults([]);
        }
        return;
      }
      
      const data: any = await response.json();

      if (data.videos && data.videos.length > 0) {
        const newVideos = isInitialSearch 
          ? data.videos 
          : [...searchResults, ...data.videos];
        
        setSearchResults(newVideos);
        setNextPageToken(data.nextPageToken || null);
        
        // 필터링 적용
        applyFilter(newVideos, filterMode);
        
        if (isInitialSearch) {
          showNotification(`${data.videos.length}개의 검색 결과를 찾았습니다.`, "success");
        }
      } else {
        if (isInitialSearch) {
          setSearchResults([]);
          setFilteredResults([]);
          showNotification("검색 결과가 없습니다.", "error");
        }
      }
    } catch (error) {
      console.error("검색 에러:", error);
      showNotification("검색 중 오류가 발생했습니다.", "error");
      if (isInitialSearch) {
        setSearchResults([]);
      }
    } finally {
      if (isInitialSearch) {
        setIsSearching(false);
      } else {
        setIsLoadingMore(false);
      }
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
    
    // 검색 결과 자동 닫기
    setSearchResults([]);
    setFilteredResults([]);
    
    // 자동 숨김 모드에서는 검색 후 숨김
    if (autoHide) {
      setTimeout(() => setIsVisible(false), 1000);
    }
    
    // 팝업 모드에서는 영상 선택 후 즉시 닫기
    if (isPopup && onClose) {
      onClose();
    }
  };

  // 안본 영상이 15개 미만일 때 자동으로 더 로드
  const autoLoadForUnwatchedVideos = async (videos: YoutubeVideo[]) => {
    if (filterMode !== 'unwatched' || !nextPageToken || isLoadingMore) return;
    
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
    const unwatchedCount = videos.filter(video => 
      !watchHistory[video.videoId] && !blacklist[video.videoId]
    ).length;
    
    if (unwatchedCount < 15) {
      console.log(`안본 영상 ${unwatchedCount}개, 추가 로드 시작`);
      await handleSearch(nextPageToken);
    }
  };

  // 필터링 함수
  const applyFilter = async (videos: YoutubeVideo[], mode: 'watched' | 'blacklisted' | 'unwatched') => {
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
    
    let filtered = videos;
    
    if (mode === 'watched') {
      // 본 영상: 시청 기록이 있는 영상
      filtered = videos.filter(video => watchHistory[video.videoId]);
      
      // 시청 횟수로 정렬
      filtered.sort((a, b) => {
        const aCount = watchHistory[a.videoId]?.watchCount || 0;
        const bCount = watchHistory[b.videoId]?.watchCount || 0;
        return watchedSortOrder === 'desc' ? bCount - aCount : aCount - bCount;
      });
    } else if (mode === 'blacklisted') {
      // 안 볼 영상: 블랙리스트에 있는 영상
      filtered = videos.filter(video => blacklist[video.videoId]);
    } else if (mode === 'unwatched') {
      // 안 본 영상: 시청 기록도 없고 블랙리스트도 아닌 영상
      filtered = videos.filter(video => !watchHistory[video.videoId] && !blacklist[video.videoId]);
      
      // 15개 제한 제거 - 모든 안본 영상 표시
    }
    
    setFilteredResults(filtered);
    
    // 안본 영상 모드일 때 자동 로드 체크
    if (mode === 'unwatched') {
      await autoLoadForUnwatchedVideos(videos);
    }
  };
  
  // 블랙리스트에 추가
  const addToBlacklist = (video: YoutubeVideo) => {
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
    blacklist[video.videoId] = {
      title: video.title,
      channelTitle: video.channelTitle,
      addedAt: new Date().toISOString()
    };
    localStorage.setItem('videoBlacklist', JSON.stringify(blacklist));
    
    // 현재 결과 재필터링
    applyFilter(searchResults, filterMode);
    showNotification(`"${video.title}"을(를) 안 볼 영상으로 이동했습니다.`, "info");
  };
  
  // 블랙리스트에서 제거
  const removeFromBlacklist = (videoId: string) => {
    const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
    delete blacklist[videoId];
    localStorage.setItem('videoBlacklist', JSON.stringify(blacklist));
    
    // 현재 결과 재필터링
    applyFilter(searchResults, filterMode);
    showNotification(`블랙리스트에서 제거했습니다.`, "info");
  };
  
  // 즐겨찾기 추가 시작 (폴더 선택 모달 열기)
  const startAddToFavorites = (video: YoutubeVideo) => {
    const favorites = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    
    if (favorites[video.videoId]) {
      // 이미 즐겨찾기에 있으면 제거
      delete favorites[video.videoId];
      localStorage.setItem('videoFavorites', JSON.stringify(favorites));
      showNotification(`"${video.title}"을(를) 즐겨찾기에서 제거했습니다.`, "info");
      applyFilter(searchResults, filterMode);
    } else {
      // 폴더 선택 모달 열기
      setSelectedVideoForFolder(video);
      setFolderSelectorOpen(true);
    }
  };

  // 폴더 선택 완료 시 즐겨찾기에 추가
  const addToFavoritesWithFolder = (folderId: string | null) => {
    if (!selectedVideoForFolder) return;

    const favorites = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    favorites[selectedVideoForFolder.videoId] = {
      videoId: selectedVideoForFolder.videoId,
      title: selectedVideoForFolder.title,
      channelTitle: selectedVideoForFolder.channelTitle,
      thumbnail: selectedVideoForFolder.thumbnail,
      folderId: folderId,
      addedAt: new Date().toISOString()
    };
    localStorage.setItem('videoFavorites', JSON.stringify(favorites));

    const folderName = folderId ? 
      JSON.parse(localStorage.getItem('favoriteFolders') || '{}')[folderId]?.name || '폴더' : 
      '미분류';
    
    showNotification(`"${selectedVideoForFolder.title}"을(를) ${folderName} 폴더에 추가했습니다.`, "success");
    
    setSelectedVideoForFolder(null);
    applyFilter(searchResults, filterMode);
  };
  
  // 즐겨찾기 여부 확인
  const isFavorite = (videoId: string) => {
    const favorites = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    return !!favorites[videoId];
  };
  
  // 필터 모드 및 정렬 순서 변경 시 재필터링
  useEffect(() => {
    if (searchResults.length > 0) {
      applyFilter(searchResults, filterMode);
    }
  }, [filterMode, searchResults, watchedSortOrder]);
  
  // 자동 숨김 모드에서의 표시/숨김 처리
  const shouldShow = !autoHide || isVisible || isHovering;
  
  // 시청 기록 가져오기
  const getWatchInfo = (videoId: string) => {
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
    return watchHistory[videoId];
  };
  
  // 날짜 포맷팅
  const formatWatchDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffHours < 48) return '어제';
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <>
      {/* 자동 숨김 모드 감지 영역 (최상단) */}
      {autoHide && !shouldShow && (
        <div 
          className="fixed top-0 left-0 w-full h-16 z-30 cursor-pointer"
          onMouseEnter={() => setIsVisible(true)}
          onTouchStart={() => setIsVisible(true)}
        />
      )}
      
      <div 
        className={`transition-all duration-300 ${
          isPopup 
            ? 'bg-white rounded-lg shadow-xl p-3 border max-h-96 overflow-y-auto'
            : autoHide ? (
              shouldShow 
                ? 'mb-4 opacity-100 transform translate-y-0' 
                : 'mb-0 opacity-0 transform -translate-y-4 pointer-events-none absolute top-0 left-0 right-0 z-40'
            ) : 'mb-4'
        }`}
        onMouseEnter={() => autoHide && setIsHovering(true)}
        onMouseLeave={() => autoHide && setIsHovering(false)}
        onTouchStart={() => autoHide && setIsVisible(true)}
      >
      
      {/* 필터 토글 버튼 - 검색 결과가 있을 때만 표시 */}
      {searchResults.length > 0 && (
        <div className="flex gap-1 mb-2">
          <Button
            size="sm"
            variant={filterMode === 'blacklisted' ? 'default' : 'outline'}
            onClick={() => setFilterMode('blacklisted')}
            className="text-xs"
          >
            안 볼 영상 ({searchResults.filter(v => {
              const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
              return blacklist[v.videoId];
            }).length})
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'unwatched' ? 'default' : 'outline'}
            onClick={() => setFilterMode('unwatched')}
            className="text-xs"
          >
            안 본 영상 ({searchResults.filter(v => {
              const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
              const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
              return !watchHistory[v.videoId] && !blacklist[v.videoId];
            }).length})
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'watched' ? 'default' : 'outline'}
            onClick={() => {
              setFilterMode('watched');
              if (filterMode === 'watched') {
                // 정렬 순서 토글
                setWatchedSortOrder(watchedSortOrder === 'desc' ? 'asc' : 'desc');
              }
            }}
            className="text-xs flex items-center gap-1"
          >
            ✓ 본 영상 ({searchResults.filter(v => getWatchInfo(v.videoId)).length})
            {filterMode === 'watched' && (
              <span>{watchedSortOrder === 'desc' ? '↓' : '↑'}</span>
            )}
          </Button>
        </div>
      )}
      
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
      {shouldShow && filteredResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2 bg-white">
          {filteredResults.map((video) => {
            const watchInfo = getWatchInfo(video.videoId);
            return (
              <div
                key={video.videoId}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer relative"
                onClick={() => handleVideoSelect(video)}
              >
                {/* 시청 표시 */}
                {watchInfo && (
                  <div className="absolute top-1 right-1 flex items-center gap-1">
                    <span className="text-xs text-green-600 font-medium">✓</span>
                    <span className="text-xs text-gray-500">{formatWatchDate(watchInfo.lastWatchedAt)}</span>
                    {watchInfo.progress > 0 && (
                      <span className="text-xs text-blue-600">{watchInfo.progress}%</span>
                    )}
                  </div>
                )}
                
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium line-clamp-2 ${
                    watchInfo ? 'text-gray-600' : 'text-gray-900'
                  }`}>
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {video.channelTitle}
                    {/* 시청 횟수 표시 - 1회부터 표시 (이전에 안 뜨는 문제로 >= 1 조건 추가) */}
                    {watchInfo && watchInfo.watchCount >= 1 && (
                      <span className="ml-2 text-blue-500">
                        {watchInfo.watchCount}회 시청
                      </span>
                    )}
                  </p>
                </div>
                
                {/* 본 영상에서 즐겨찾기 버튼 표시 */}
                {filterMode === 'watched' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      startAddToFavorites(video);
                    }}
                    className={`text-xs px-2 py-1 h-6 ${isFavorite(video.videoId) ? 'text-yellow-500' : 'text-gray-400'}`}
                    title={isFavorite(video.videoId) ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
                  >
                    ⭐
                  </Button>
                )}

                {/* 안 본 영상에서만 블랙리스트 버튼 표시 */}
                {filterMode === 'unwatched' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToBlacklist(video);
                    }}
                    className="text-xs px-2 py-1 h-6"
                    title="안 볼 영상으로 이동"
                  >
                    ×
                  </Button>
                )}
                
                {/* 블랙리스트에서 제거 버튼 */}
                {filterMode === 'blacklisted' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromBlacklist(video.videoId);
                    }}
                    className="text-xs px-2 py-1 h-6"
                    title="블랙리스트에서 제거"
                  >
                    ↻
                  </Button>
                )}
                
              </div>
            );
          })}
          
          {/* 더 보기 버튼 - 안본 영상에서만 표시 */}
          {nextPageToken && !isLoadingMore && filterMode === 'unwatched' && (
            <div className="text-center py-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSearch(nextPageToken)}
                className="text-xs"
              >
                더 많은 영상 보기
              </Button>
            </div>
          )}
          
          {/* 로딩 표시 */}
          {isLoadingMore && (
            <div className="text-center py-2">
              <div className="text-xs text-gray-500">추가 영상 로딩 중...</div>
            </div>
          )}
        </div>
      )}
      
      {/* 필터링 결과 없음 메시지 */}
      {shouldShow && searchResults.length > 0 && filteredResults.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          {filterMode === 'watched' ? '시청한 영상이 없습니다.' : 
           filterMode === 'blacklisted' ? '안 볼 영상이 없습니다.' : 
           '새로운 영상이 없습니다.'}
        </div>
      )}
      
      {/* 자동 숨김 모드 토글 버튼 */}
      {autoHide && shouldShow && (
        <div className="text-center mt-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setIsVisible(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            검색창 숨기기
          </Button>
        </div>
      )}
      </div>
      
      {/* 폴더 선택 모달 */}
      <FolderSelector
        isOpen={folderSelectorOpen}
        onClose={() => {
          setFolderSelectorOpen(false);
          setSelectedVideoForFolder(null);
        }}
        onSelectFolder={addToFavoritesWithFolder}
        videoTitle={selectedVideoForFolder?.title || ""}
      />
    </>
  );
};

export default VideoLoader;
