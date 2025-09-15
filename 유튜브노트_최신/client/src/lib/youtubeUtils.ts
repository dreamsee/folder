/**
 * YouTube 관련 유틸리티 함수
 */

/**
 * YouTube URL에서 비디오 ID 추출
 * @param url YouTube URL
 * @returns 비디오 ID 또는 null
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // YouTube URL 형식 검사 (www.youtube.com/watch?v=xxx, youtu.be/xxx 등 다양한 형식 지원)
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regExp);

  return match && match[1].length === 11 ? match[1] : null;
}

/**
 * 초를 HH:MM:SS 형식으로 변환
 * @param seconds 초
 * @returns HH:MM:SS 형식의 문자열
 */
export function formatTime(seconds: number): string {
  seconds = Math.floor(seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;
}

/**
 * 숫자에 앞에 0을 채우는 함수
 * @param num 숫자
 * @returns 2자리 문자열 (예: '05', '12')
 */
function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * HH:MM:SS 형식의 타임스탬프를 초로 변환
 * @param timestamp HH:MM:SS 형식의 타임스탬프
 * @returns 초
 */
export function timeToSeconds(timestamp: string): number {
  const [hours, minutes, seconds] = timestamp.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}
