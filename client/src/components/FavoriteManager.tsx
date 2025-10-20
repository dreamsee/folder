import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, FolderOpen, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  order: number;
}

interface FavoriteVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  folderId: string | null;
  addedAt: string;
  publishedAt?: string;
}

interface FavoriteChannel {
  id: string;
  name: string;
  addedAt: string;
}

interface FavoriteManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoSelect: (videoId: string) => void;
  currentVideoId?: string;
  showNotification?: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

const FavoriteManager: React.FC<FavoriteManagerProps> = ({
  isOpen,
  onClose,
  onVideoSelect,
  currentVideoId,
  showNotification
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
  const [channels, setChannels] = useState<FavoriteChannel[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [newChannelName, setNewChannelName] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channelVideos, setChannelVideos] = useState<FavoriteVideo[]>([]);
  const [loadingChannelVideos, setLoadingChannelVideos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    // 폴더 데이터 로드
    const foldersData = JSON.parse(localStorage.getItem('favoriteFolders') || '{}');
    const folderList = Object.values(foldersData) as Folder[];
    folderList.sort((a, b) => a.order - b.order);
    setFolders(folderList);

    // 즐겨찾기 데이터 로드
    const favoritesData = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    const favoriteList = Object.values(favoritesData) as FavoriteVideo[];
    favoriteList.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    setFavorites(favoriteList);

    // 구독 채널 데이터 로드
    const channelsData = JSON.parse(localStorage.getItem('favoriteChannels') || '[]');
    setChannels(channelsData);
  };

  // 폴더별 영상 필터링
  const getVideosByFolder = (folderId: string | null) => {
    return favorites.filter(video => video.folderId === folderId);
  };

  // 전체 영상
  const getAllVideos = () => {
    return favorites;
  };

  // 영상 선택/해제
  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  // 현재 영상을 즐겨찾기에 추가
  const addCurrentVideoToFavorites = async () => {
    if (!currentVideoId) return;
    
    // 이미 즐겨찾기에 있는지 확인
    const favoritesData = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    if (favoritesData[currentVideoId]) {
      showNotification?.('이미 즐겨찾기에 추가된 영상입니다.', 'info');
      return;
    }

    try {
      // YouTube API로 영상 정보 가져오기
      const response = await fetch(`/api/youtube/video-info?videoId=${currentVideoId}`);
      const videoData = await response.json();
      
      const favoriteVideo: FavoriteVideo = {
        videoId: currentVideoId,
        title: videoData.title || '제목 없음',
        channelTitle: videoData.channelTitle || '채널 없음',
        thumbnail: videoData.thumbnail || '',
        folderId: null,
        addedAt: new Date().toISOString()
      };

      favoritesData[currentVideoId] = favoriteVideo;
      localStorage.setItem('videoFavorites', JSON.stringify(favoritesData));
      loadData();
      showNotification?.('즐겨찾기에 추가되었습니다.', 'success');
    } catch (error) {
      console.error('Failed to add video to favorites:', error);
      showNotification?.('즐겨찾기 추가에 실패했습니다.', 'error');
    }
  };

  // 즐겨찾기에서 제거
  const removeFromFavorites = (videoIds: string[]) => {
    const favoritesData = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    videoIds.forEach(videoId => {
      delete favoritesData[videoId];
    });
    localStorage.setItem('videoFavorites', JSON.stringify(favoritesData));
    loadData();
    setSelectedVideos(new Set());
  };

  // 선택된 영상들을 다른 폴더로 이동
  const moveVideosToFolder = (videoIds: string[], targetFolderId: string | null) => {
    const favoritesData = JSON.parse(localStorage.getItem('videoFavorites') || '{}');
    videoIds.forEach(videoId => {
      if (favoritesData[videoId]) {
        favoritesData[videoId].folderId = targetFolderId;
      }
    });
    localStorage.setItem('videoFavorites', JSON.stringify(favoritesData));
    loadData();
    setSelectedVideos(new Set());
  };

  // 영상 재생
  const handleVideoPlay = (videoId: string) => {
    // 시청 횟수만 증가
    const watchHistory = JSON.parse(localStorage.getItem('watchHistory') || '{}');
    const video = favorites.find(v => v.videoId === videoId);
    
    if (!watchHistory[videoId]) {
      watchHistory[videoId] = {
        videoId: videoId,
        firstWatchedAt: new Date().toISOString(),
        lastWatchedAt: new Date().toISOString(),
        watchCount: 1,
        totalWatchTime: 0,
        lastPosition: 0,
        duration: 0,
        title: video?.title || '제목 없음',
        channelTitle: video?.channelTitle || '채널 없음',
        thumbnail: video?.thumbnail || ''
      };
    } else {
      watchHistory[videoId].watchCount = (watchHistory[videoId].watchCount || 0) + 1;
      watchHistory[videoId].lastWatchedAt = new Date().toISOString();
    }
    
    localStorage.setItem('watchHistory', JSON.stringify(watchHistory));
    
    onVideoSelect(videoId);
    onClose();
  };

  // 탭 목록 생성
  const createTabsList = () => {
    const tabs = [
      { id: "all", label: "전체", count: favorites.length }
    ];

    // 미분류 폴더
    const uncategorizedCount = getVideosByFolder(null).length;
    if (uncategorizedCount > 0) {
      tabs.push({ id: "uncategorized", label: "미분류", count: uncategorizedCount });
    }

    // 기타 폴더들
    folders.forEach(folder => {
      const count = getVideosByFolder(folder.id).length;
      if (count > 0) {
        tabs.push({ id: folder.id, label: folder.name, count });
      }
    });

    // 구독 채널 탭 추가
    tabs.push({ id: "channels", label: "구독 채널", count: channels.length });

    return tabs;
  };

  // 현재 탭의 영상들
  const getCurrentVideos = () => {
    if (activeTab === "all") {
      return getAllVideos();
    } else if (activeTab === "uncategorized") {
      return getVideosByFolder(null);
    } else {
      return getVideosByFolder(activeTab);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffHours < 48) return '어제';
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getFolderInfo = (folderId: string | null) => {
    if (!folderId) return { name: '미분류', color: '#6B7280' };
    const folder = folders.find(f => f.id === folderId);
    return folder ? { name: folder.name, color: folder.color } : { name: '알 수 없음', color: '#6B7280' };
  };

  // 채널 추가 함수
  const addChannel = () => {
    if (!newChannelName.trim()) {
      showNotification?.('채널명을 입력해주세요.', 'warning');
      return;
    }

    const channelsData = JSON.parse(localStorage.getItem('favoriteChannels') || '[]');

    // 중복 확인
    if (channelsData.some((ch: FavoriteChannel) => ch.name === newChannelName.trim())) {
      showNotification?.('이미 추가된 채널입니다.', 'info');
      return;
    }

    const newChannel: FavoriteChannel = {
      id: Date.now().toString(),
      name: newChannelName.trim(),
      addedAt: new Date().toISOString()
    };

    channelsData.push(newChannel);
    localStorage.setItem('favoriteChannels', JSON.stringify(channelsData));
    setChannels(channelsData);
    setNewChannelName("");
    setIsAddingChannel(false);
    showNotification?.('채널이 추가되었습니다.', 'success');
  };

  // 채널 삭제 함수
  const deleteChannel = (channelId: string) => {
    const channelsData = JSON.parse(localStorage.getItem('favoriteChannels') || '[]');
    const updatedChannels = channelsData.filter((ch: FavoriteChannel) => ch.id !== channelId);
    localStorage.setItem('favoriteChannels', JSON.stringify(updatedChannels));
    setChannels(updatedChannels);
    showNotification?.('채널이 삭제되었습니다.', 'success');
  };

  // 채널 선택시 영상 검색 함수
  const loadChannelVideos = async (channelName: string) => {
    setSelectedChannel(channelName);
    setLoadingChannelVideos(true);
    setChannelVideos([]);

    try {
      // YouTube API로 채널 영상 검색 (최대 50개 검색 후 필터링)
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(channelName)}&maxResults=50`);
      const data = await response.json();

      if (data.videos && data.videos.length > 0) {
        const allVideos = data.videos.map((video: any) => ({
          videoId: video.videoId,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnail: video.thumbnail,
          folderId: null,
          addedAt: new Date().toISOString(),
          publishedAt: video.publishedAt
        }));

        // 채널명으로 필터링 (입력한 채널명과 정확히 일치하는 영상만)
        const filteredVideos = allVideos.filter((video) =>
          video.channelTitle.toLowerCase().includes(channelName.toLowerCase())
        );

        // 최신순으로 정렬 (publishedAt 기준 내림차순)
        filteredVideos.sort((a, b) => {
          if (!a.publishedAt) return 1;
          if (!b.publishedAt) return -1;
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        });

        // 상위 25개만 표시
        const top25Videos = filteredVideos.slice(0, 25);

        if (top25Videos.length > 0) {
          setChannelVideos(top25Videos);
          showNotification?.(`${top25Videos.length}개 영상을 불러왔습니다.`, 'success');
        } else {
          showNotification?.('해당 채널의 영상을 찾을 수 없습니다.', 'info');
        }
      } else {
        showNotification?.('검색 결과가 없습니다.', 'info');
      }
    } catch (error) {
      console.error('채널 영상 로딩 에러:', error);
      showNotification?.('영상을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoadingChannelVideos(false);
    }
  };

  // 채널 뷰로 돌아가기
  const backToChannelList = () => {
    setSelectedChannel(null);
    setChannelVideos([]);
  };

  const currentVideos = getCurrentVideos();
  const tabsList = createTabsList();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>즐겨찾기</DialogTitle>
        </DialogHeader>
        
        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              저장된 즐겨찾기가 없습니다.
            </div>
            {currentVideoId && (
              <Button
                size="sm"
                variant="outline"
                onClick={addCurrentVideoToFavorites}
                className="text-xs"
              >
                현재 영상 추가
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 상단 버튼 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600">
                  총 {favorites.length}개 영상
                </div>
                {currentVideoId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addCurrentVideoToFavorites}
                    className="text-xs"
                  >
                    현재 영상 추가
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {editMode && selectedVideos.size > 0 && (
                  <Select onValueChange={(folderId) => moveVideosToFolder(Array.from(selectedVideos), folderId === "uncategorized" ? null : folderId)}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <FolderOpen className="h-4 w-4 mr-1" />
                      <SelectValue placeholder={`이동 (${selectedVideos.size})`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">미분류</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: folder.color }}
                            />
                            {folder.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button
                  size="sm"
                  variant={editMode ? "default" : "outline"}
                  onClick={() => {
                    setEditMode(!editMode);
                    if (!editMode) setSelectedVideos(new Set());
                  }}
                >
                  {editMode ? "완료" : "편집"}
                </Button>
              </div>
            </div>

            {/* 탭 목록 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabsList.length}, 1fr)` }}>
                {tabsList.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                    {tab.label} ({tab.count})
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabsList.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.id === "channels" ? (
                    // 구독 채널 탭 콘텐츠
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {selectedChannel ? (
                        // 채널 영상 목록 표시
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={backToChannelList}
                              className="text-xs"
                            >
                              ← 채널 목록으로
                            </Button>
                            <span className="text-sm text-gray-600">{selectedChannel}</span>
                          </div>

                          {loadingChannelVideos ? (
                            <div className="text-center py-8 text-gray-500">
                              영상을 불러오는 중...
                            </div>
                          ) : channelVideos.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              영상을 찾을 수 없습니다.
                            </div>
                          ) : (
                            channelVideos.map((video) => (
                              <div
                                key={video.videoId}
                                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                                onClick={() => handleVideoPlay(video.videoId)}
                              >
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  className="w-24 h-16 object-cover rounded flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium line-clamp-2 mb-1">
                                    {video.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{video.channelTitle}</span>
                                    {video.publishedAt && (
                                      <>
                                        <span>•</span>
                                        <span>{formatDate(video.publishedAt)}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        // 채널 목록 표시
                        <div>
                          {channels.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              등록된 채널이 없습니다.
                            </div>
                          ) : (
                            channels.map((channel) => (
                              <div
                                key={channel.id}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                              >
                                <button
                                  className="flex-1 text-left"
                                  onClick={() => loadChannelVideos(channel.name)}
                                >
                                  <div className="text-sm font-medium">{channel.name}</div>
                                  <div className="text-xs text-gray-500">{formatDate(channel.addedAt)}</div>
                                </button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteChannel(channel.id)}
                                  className="text-xs px-2 py-1 h-6"
                                  title="채널 삭제"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}

                          {/* 채널 추가 UI */}
                          <div className="mt-4">
                            {isAddingChannel ? (
                              <div className="flex gap-2">
                                <Input
                                  value={newChannelName}
                                  onChange={(e) => setNewChannelName(e.target.value)}
                                  placeholder="채널명 입력 (예: 침착맨)"
                                  className="flex-1 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') addChannel();
                                    if (e.key === 'Escape') {
                                      setIsAddingChannel(false);
                                      setNewChannelName("");
                                    }
                                  }}
                                  autoFocus
                                />
                                <Button size="sm" onClick={addChannel}>추가</Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setIsAddingChannel(false);
                                    setNewChannelName("");
                                  }}
                                >
                                  취소
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAddingChannel(true)}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                채널 추가
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // 기존 영상 탭 콘텐츠
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {getCurrentVideos().map((video) => {
                        const folderInfo = getFolderInfo(video.folderId);
                        return (
                        <div
                          key={video.videoId}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                            editMode && selectedVideos.has(video.videoId) ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                          onClick={() => editMode ? toggleVideoSelection(video.videoId) : handleVideoPlay(video.videoId)}
                        >
                          {editMode && (
                            <input
                              type="checkbox"
                              checked={selectedVideos.has(video.videoId)}
                              onChange={() => toggleVideoSelection(video.videoId)}
                              className="mr-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-24 h-16 object-cover rounded flex-shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium line-clamp-2 mb-1">
                              {video.title}
                            </h3>
                            <p className="text-xs text-gray-500 mb-1">
                              {video.channelTitle}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: folderInfo.color }}
                              />
                              <span>{folderInfo.name}</span>
                              <span>•</span>
                              <span>{formatDate(video.addedAt)}</span>
                            </div>
                          </div>

                          {!editMode && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromFavorites([video.videoId]);
                              }}
                              className="text-xs px-2 py-1 h-6"
                              title="즐겨찾기에서 제거"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FavoriteManager;