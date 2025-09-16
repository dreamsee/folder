import { useEffect } from 'react';

interface LargeTextWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  textStats: {
    originalLines: number;
    modifiedLines: number;
    originalChars: number;
    modifiedChars: number;
  };
}

export default function LargeTextWarningModal({
  isOpen,
  onClose,
  onProceed,
  textStats
}: LargeTextWarningModalProps) {
  const totalLines = Math.max(textStats.originalLines, textStats.modifiedLines);
  const totalChars = textStats.originalChars + textStats.modifiedChars;
  
  // 예상 처리 시간 계산 (대략적)
  const estimatedTime = Math.ceil(totalLines / 100); // 100줄당 1초 가정
  
  useEffect(() => {
    if (isOpen) {
      const message = `⚠️ 대용량 텍스트 경고

매우 큰 텍스트를 비교하려고 합니다.
처리 시간이 오래 걸리거나 브라우저가 느려질 수 있습니다.

📊 텍스트 정보:
• 총 라인 수: ${totalLines.toLocaleString()}줄
• 총 문자 수: ${totalChars.toLocaleString()}자
• 예상 시간: ${estimatedTime}초 이상

💡 권장사항:
• 텍스트를 작은 단위로 나누어 비교
• 불필요한 공백이나 중복 내용 제거
• 주요 부분만 선택하여 비교

계속 진행하시겠습니까?`;

      const result = window.confirm(message);
      
      if (result) {
        onProceed();
      } else {
        onClose();
      }
    }
  }, [isOpen, totalLines, totalChars, estimatedTime, onProceed, onClose]);
  
  return null; // confirm 대화상자는 브라우저 네이티브 사용
}