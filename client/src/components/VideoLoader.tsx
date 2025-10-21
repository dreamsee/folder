import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { YoutubeSearchResponse, YoutubeVideo } from "@shared/schema";
import FolderSelector from "./FolderSelector";
import SearchResultItem from "./SearchResultItem";
import { useVideoFilter } from "@/hooks/useVideoFilter";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useBlacklist } from "@/hooks/useBlacklist";

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
  keepSearchResults?: boolean;
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
  keepSearchResults = false,
}) => {
  const [isVisible, setIsVisible] = useState(!autoHide);
  const [isHovering, setIsHovering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
  const [selectedVideoForFolder, setSelectedVideoForFolder] = useState<YoutubeVideo | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 커스텀 훅 사용
  const {
    filterMode,
    setFilterMode,
    filteredResults,
    watchedSortOrder,
    setWatchedSortOrder,
    unwatchedSortOrder,
    setUnwatchedSortOrder,
    applyFilter,
    clearFilteredResults,
  } = useVideoFilter();

  const { getWatchInfo, incrementWatchCount, formatWatchDate } = useWatchHistory();

  const { addToBlacklist: addToBlacklistHook, removeFromBlacklist: removeFromBlacklistHook } = useBlacklist();

  const handleSearch = async (pageToken?: string) => {
    if (!pageToken && searchQuery.trim() === "") {
      showNotification("검색어를 입력해주세요.", "error");
      return;
    }

    const isInitialSearch = !pageToken;
    if (isInitialSearch) {
      setIsSearching(true);
      setSearchResults([]);
      clearFilteredResults();
      setNextPageToken(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      let url = `/api/youtube/search?q=${encodeURIComponent(searchQuery)}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url);

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

      const decodeHtmlEntities = (text: string): string => {
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&#x27;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
      };

      if (data.videos) {
        data.videos = data.videos.map((video: any) => ({
          ...video,
          title: decodeHtmlEntities(video.title || ''),
          channelTitle: decodeHtmlEntities(video.channelTitle || '')
        }));
      }

      if (data.videos && data.videos.length > 0) {
        const validVideos = data.videos.filter((v: any) => v.videoId);
        const invalidCount = data.videos.length - validVideos.length;

        const newVideos = isInitialSearch
          ? validVideos
          : [...searchResults, ...validVideos];

        const uniqueVideos = newVideos.filter((video, index, self) =>
          index === self.findIndex((v) => v.videoId === video.videoId)
        );

        console.log("중복 제거 전:", newVideos.length, "중복 제거 후:", uniqueVideos.length);

        setSearchResults(uniqueVideos);
        setNextPageToken(data.nextPageToken || null);

        applyFilter(uniqueVideos, filterMode);

        if (isInitialSearch) {
          if (invalidCount > 0) {
            showNotification(`${validVideos.length}개의 검색 결과를 찾았습니다.`, "success");
          } else {
            showNotification(`${validVideos.length}개의 검색 결과를 찾았습니다.`, "success");
          }
        }
      } else {
        if (isInitialSearch) {
          setSearchResults([]);
          clearFilteredResults();
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

  // 블랙리스트 추가 핸들러 (훅 사용)
  const handleAddToBlacklist = (video: YoutubeVideo) => {
    addToBlacklistHook(video, (message) => {
      applyFilter(searchResults, filterMode);
      showNotification(message, "info");
    });
  };

  // 블랙리스트 제거 핸들러 (훅 사용)
  const handleRemoveFromBlacklist = (videoId: string) => {
    removeFromBlacklistHook(videoId, (message) => {
      applyFilter(searchResults, filterMode);
      showNotification(message, "info");
    });
  };

  const startAddToFavorites = (video: YoutubeVideo) => {
    const favorites = JSON.parse(localStorage.getItem('videoFavorites') || '{}');

    if (favorites[video.videoId]) {
      delete favorites[video.videoId];
      localStorage.setItem('videoFavorites', JSON.stringify(favorites));
      showNotification(`"${video.title}"을(를) 즐겨찾기에서 제거했습니다.`, "info");
      applyFilter(searchResults, filterMode);
    } else {
      setSelectedVideoForFolder(video);
      setFolderSelectorOpen(true);
    }
  };

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

  const isFavorite = (videoId: string) => {
    const favorites = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    return !!favorites[videoId];
  };

  const handleVideoSelect = (video: YoutubeVideo) => {
    // 시청 기록 업데이트 (커스텀 훅 사용)
    incrementWatchCount(video);

    setCurrentVideoInfo({
      title: video.title,
      channelName: video.channelTitle,
      thumbnailUrl: video.thumbnail,
    });

    setCurrentVideoId(video.videoId);

    // 검색 목록 유지 설정에 따라 검색 결과 처리
    if (keepSearchResults) {
      // 목록 유지: 필터만 재적용
      applyFilter(searchResults, filterMode);
    } else {
      // 목록 숨김: 검색 결과 및 필터 결과 모두 초기화
      setSearchResults([]);
      clearFilteredResults();
    }

    if (autoHide) {
      setTimeout(() => setIsVisible(false), 1000);
    }

    if (isPopup && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (searchResults.length > 0) {
      applyFilter(searchResults, filterMode);
    }
  }, [filterMode, watchedSortOrder, unwatchedSortOrder]);

  useEffect(() => {
    if (isPopup && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isPopup]);

  const shouldShow = !autoHide || isVisible || isHovering;

  return (
    <>
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
            onClick={() => {
              if (filterMode === 'unwatched') {
                if (unwatchedSortOrder === 'none') {
                  setUnwatchedSortOrder('desc');
                } else if (unwatchedSortOrder === 'desc') {
                  setUnwatchedSortOrder('asc');
                } else {
                  setUnwatchedSortOrder('none');
                }
              } else {
                setFilterMode('unwatched');
              }
            }}
            className="text-xs flex items-center gap-1"
          >
            안 본 영상 ({searchResults.filter(v => {
              const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
              const blacklist = JSON.parse(localStorage.getItem('videoBlacklist') || '{}');
              return !watchHistory[v.videoId] && !blacklist[v.videoId];
            }).length})
            {filterMode === 'unwatched' && unwatchedSortOrder !== 'none' && (
              <span className="text-[10px]">
                📅{unwatchedSortOrder === 'desc' ? '↓' : '↑'}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant={filterMode === 'watched' ? 'default' : 'outline'}
            onClick={() => {
              setFilterMode('watched');
              if (filterMode === 'watched') {
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

      <div className="flex gap-2 mb-3">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="YouTube 영상 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          onClick={() => handleSearch()}
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

      {shouldShow && filteredResults.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2 bg-white">
          {filteredResults.map((video) => (
            <SearchResultItem
              key={video.videoId}
              video={video}
              filterMode={filterMode}
              watchInfo={getWatchInfo(video.videoId)}
              isFavorite={isFavorite(video.videoId)}
              formatWatchDate={formatWatchDate}
              onVideoSelect={handleVideoSelect}
              onAddToFavorites={startAddToFavorites}
              onAddToBlacklist={handleAddToBlacklist}
              onRemoveFromBlacklist={handleRemoveFromBlacklist}
            />
          ))}

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

          {isLoadingMore && (
            <div className="text-center py-2">
              <div className="text-xs text-gray-500">추가 영상 로딩 중...</div>
            </div>
          )}
        </div>
      )}

      {shouldShow && searchResults.length > 0 && filteredResults.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          {filterMode === 'watched' ? '시청한 영상이 없습니다.' :
           filterMode === 'blacklisted' ? '안 볼 영상이 없습니다.' :
           '새로운 영상이 없습니다.'}
        </div>
      )}

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
