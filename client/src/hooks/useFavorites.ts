import { useState, useEffect, useCallback } from "react";

interface UseFavoritesProps {
  currentVideoId: string;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

export const useFavorites = ({
  currentVideoId,
  showNotification,
}: UseFavoritesProps) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // localStorage에서 즐겨찾기 목록 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('youtube-favorites');
    if (savedFavorites) {
      try {
        const favList = JSON.parse(savedFavorites);
        setFavorites(favList);
      } catch (error) {
        console.error('즐겨찾기 목록 로드 실패:', error);
      }
    }
  }, []);

  // 현재 영상의 즐겨찾기 상태 확인
  useEffect(() => {
    if (currentVideoId) {
      setIsFavorite(favorites.includes(currentVideoId));
    }
  }, [currentVideoId, favorites]);

  // 즐겨찾기 추가/제거
  const toggleFavorite = useCallback(() => {
    if (!currentVideoId) {
      showNotification('영상 ID를 찾을 수 없습니다.', 'error');
      return;
    }

    let newFavorites;
    if (isFavorite) {
      // 즐겨찾기에서 제거
      newFavorites = favorites.filter(id => id !== currentVideoId);
      showNotification('즐겨찾기에서 제거되었습니다.', 'info');
    } else {
      // 즐겨찾기에 추가
      newFavorites = [...favorites, currentVideoId];
      showNotification('즐겨찾기에 추가되었습니다.', 'success');
    }

    setFavorites(newFavorites);
    localStorage.setItem('youtube-favorites', JSON.stringify(newFavorites));
  }, [currentVideoId, isFavorite, favorites, showNotification]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
  };
};
