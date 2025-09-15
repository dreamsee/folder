// YouTube 영상 설명란에서 챕터 정보를 파싱하는 유틸리티

export interface Chapter {
  time: string;         // "2:30"
  title: string;        // "메인 내용 설명"
  seconds: number;      // 150
  duration?: number;    // 해당 챕터 길이 (다음 챕터까지의 시간)
  width?: number;       // UI에서 사용할 바의 너비 비율 (%)
}

/**
 * 시간 문자열을 초로 변환
 * @param timeStr "2:30", "1:23:45" 형식
 * @returns 초 단위 숫자
 */
export function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS 형식
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS 형식
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

/**
 * 초를 시간 문자열로 변환
 * @param seconds 초 단위 숫자
 * @returns "2:30" 또는 "1:23:45" 형식
 */
export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * YouTube 영상 설명란에서 챕터 정보 추출
 * @param description 영상 설명란 텍스트
 * @param totalDuration 영상 전체 길이 (초)
 * @returns Chapter 배열
 */
export function parseChapters(description: string, totalDuration?: number): Chapter[] {
  if (!description) return [];
  
  // 타임스탬프 패턴: 시간 + 공백 + 제목
  // 지원 형식: "0:00", "2:30", "1:23:45"
  const timeRegex = /^(\d{1,2}:(?:\d{1,2}:)?\d{2})\s+(.+)$/gm;
  const chapters: Chapter[] = [];
  
  let match;
  while ((match = timeRegex.exec(description)) !== null) {
    const timeStr = match[1];
    const title = match[2].trim();
    const seconds = timeToSeconds(timeStr);
    
    // 제목이 너무 짧거나 의미없는 경우 제외
    if (title.length < 2) continue;
    
    chapters.push({
      time: timeStr,
      title: title,
      seconds: seconds
    });
  }
  
  // 시간순으로 정렬
  chapters.sort((a, b) => a.seconds - b.seconds);
  
  // 중복 시간 제거
  const uniqueChapters: Chapter[] = [];
  for (const chapter of chapters) {
    if (uniqueChapters.length === 0 || uniqueChapters[uniqueChapters.length - 1].seconds !== chapter.seconds) {
      uniqueChapters.push(chapter);
    }
  }
  
  // 각 챕터의 지속 시간과 너비 비율 계산
  if (totalDuration && uniqueChapters.length > 0) {
    for (let i = 0; i < uniqueChapters.length; i++) {
      const currentChapter = uniqueChapters[i];
      const nextChapter = uniqueChapters[i + 1];
      
      // 챕터 지속 시간 계산
      if (nextChapter) {
        currentChapter.duration = nextChapter.seconds - currentChapter.seconds;
      } else {
        // 마지막 챕터는 영상 끝까지
        currentChapter.duration = totalDuration - currentChapter.seconds;
      }
      
      // 너비 비율 계산 (%)
      currentChapter.width = (currentChapter.duration / totalDuration) * 100;
    }
  }
  
  return uniqueChapters;
}

/**
 * 현재 재생 시간에 해당하는 챕터 찾기
 * @param chapters 챕터 배열
 * @param currentTime 현재 재생 시간 (초)
 * @returns 현재 챕터의 인덱스 (-1이면 해당 없음)
 */
export function getCurrentChapterIndex(chapters: Chapter[], currentTime: number): number {
  if (chapters.length === 0) return -1;
  
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTime >= chapters[i].seconds) {
      return i;
    }
  }
  
  return -1;
}

/**
 * YouTube duration 형식을 초로 변환 (PT4M13S -> 253초)
 * @param duration YouTube API에서 받은 duration 문자열
 * @returns 초 단위 숫자
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}