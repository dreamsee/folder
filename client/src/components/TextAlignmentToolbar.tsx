import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { alignSelectedText, getLastDebugData, AlignmentDebugData } from "@/lib/formatUtils";
import { AlignJustify, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DebugModal from './DebugModal';

interface TextAlignmentToolbarProps {
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (text: string) => void; // 부모 컴포넌트에 변경사항을 알리기 위한 콜백
}

export default function TextAlignmentToolbar({ textAreaRef, onTextChange }: TextAlignmentToolbarProps) {
  const { toast } = useToast();
  const [showToolbar, setShowToolbar] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<AlignmentDebugData | null>(null);
  
  // 선택된 텍스트 감지 및 툴바 표시
  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
    
    const handleSelectionChange = () => {
      const { selectionStart, selectionEnd } = textArea;
      if (selectionStart !== selectionEnd) {
        // 텍스트가 선택되었을 때
        const selected = textArea.value.substring(selectionStart, selectionEnd);
        setSelectedText(selected);
        
        // 선택된 텍스트의 위치 계산 (수정)
        const textareaRect = textArea.getBoundingClientRect();
        
        // 선택 영역의 위치를 화면 좌표로 계산하기 (단순화된 방식)
        // 선택 영역 바로 위에 고정된 위치로 표시
        setPosition({
          x: textareaRect.left + 20, // 왼쪽에서 20px
          y: textareaRect.top + 20   // 상단에서 20px
        });
        
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    };
    
    const handleMouseUp = () => {
      handleSelectionChange();
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // 방향키, Shift, Ctrl 등을 누르면서 선택할 때
      if (e.key.includes('Arrow') || e.key === 'Shift' || e.key === 'Control') {
        handleSelectionChange();
      }
    };
    
    // 클릭 외부 처리
    textArea.addEventListener('mouseup', handleMouseUp);
    textArea.addEventListener('keyup', handleKeyUp);
    
    return () => {
      textArea.removeEventListener('mouseup', handleMouseUp);
      textArea.removeEventListener('keyup', handleKeyUp);
    };
  }, [textAreaRef]);
  
  // 텍스트 정렬 처리
  const handleAlign = (e: React.MouseEvent) => {
    // 클릭 이벤트 전파 중단
    e.preventDefault();
    e.stopPropagation();
    
    const textArea = textAreaRef.current;
    if (!textArea || !selectedText) return;
    
    try {
      // 1단계: 디버깅 정보 기록
      console.log("=== 정렬 작업 시작 ===");
      console.log("선택된 텍스트:", selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''));
      console.log("선택 범위:", textArea.selectionStart, textArea.selectionEnd);
      
      // 2단계: 패턴 확인 (이제는 자동 패턴 인식이므로 모든 패턴을 처리할 수 있음)
      // 패턴을 분석하여 정렬 가능한지 확인
      const patternRegex = /[a-zA-Z0-9_]+\[[0-9]+\]=[^,\s]+|[a-zA-Z0-9_]+=(?:[^,\s]+)/g;
      const hasPatterns = patternRegex.test(selectedText);
      
      if (!hasPatterns) {
        toast({
          title: "정렬 불가",
          description: "선택한 텍스트에서 정렬할 패턴을 찾을 수 없습니다.",
          variant: "destructive"
        });
        return;
      }
      
      // 3단계: 현재 상태 저장
      const { selectionStart, selectionEnd, scrollTop } = textArea;
      
      // 4단계: 정렬 처리 (선택된 텍스트만) - 디버그 모드 활성화
      const aligned = alignSelectedText(selectedText, true);
      
      // 디버그 데이터 가져오기
      const debugResult = getLastDebugData();
      if (debugResult) {
        setDebugData(debugResult);
      }
      
      // 5단계: 정렬 전후 비교 및 검증
      if (selectedText === aligned) {
        console.log("정렬 전후 텍스트가 동일합니다.");
        toast({
          title: "변경 없음",
          description: "정렬할 필요가 없거나 이미 정렬된 상태입니다.",
        });
        return;
      }
      
      // 6단계: 변경사항 적용
      const beforeText = textArea.value.substring(0, selectionStart);
      const afterText = textArea.value.substring(selectionEnd);
      const newValue = beforeText + aligned + afterText;
      
      // 스크롤 위치 저장
      const originalScrollTop = textArea.scrollTop;
      
      // 텍스트 업데이트 - 두 가지 방법으로 처리
      
      // 1. 부모 컴포넌트에 직접 변경사항 알리기 (React 상태 업데이트)
      onTextChange(newValue);
      
      // 2. DOM 요소에도 값 설정 (동기화)
      textArea.value = newValue;
      
      // 3. React에 입력 이벤트 알리기 (이미 상태는 업데이트되었지만 이벤트 호출을 위해)
      // 이렇게 하면 React의 onChange 핸들러가 중복 호출되어도, 이미 같은 값이므로 상태가 변경되지 않음
      const event = new Event('input', { bubbles: true });
      textArea.dispatchEvent(event);
      
      // 7단계: 커서 및 스크롤 위치 복원
      textArea.focus();
      textArea.scrollTop = originalScrollTop;
      
      // 선택 영역 설정 및 툴바 제거
      setTimeout(() => {
        // 선택 영역을 정확히 유지
        textArea.setSelectionRange(selectionStart, selectionStart + aligned.length);
        
        // 스크롤 위치 한번 더 확인
        if (textArea.scrollTop !== originalScrollTop) {
          textArea.scrollTop = originalScrollTop;
        }
        
        // 툴바 숨기기
        setShowToolbar(false);
        
        console.log("=== 정렬 작업 완료 ===");
      }, 50);
      
      // 8단계: 사용자에게 알림 (디버그 옵션 추가)
      toast({
        title: "정렬 완료",
        description: "선택한 텍스트가 자동으로 정렬되었습니다.",
        action: (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowDebugModal(true)}
            className="flex items-center gap-1"
          >
            <Bug className="h-3 w-3" /> 디버그
          </Button>
        )
      });
    } catch (error) {
      // 오류 처리
      console.error("정렬 중 오류 발생:", error);
      toast({
        title: "정렬 오류",
        description: "텍스트 정렬 처리 중 문제가 발생했습니다. 개발자 콘솔을 확인해주세요.",
        variant: "destructive"
      });
    }
  };
  
  if (!showToolbar) {
    // 툴바가 표시되지 않을 때도 디버그 모달은 표시 가능
    return (
      <DebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        debugData={debugData}
      />
    );
  }
  
  return (
    <>
      <div 
        className="fixed z-50 shadow-xl bg-white rounded-md border-2 border-blue-300 p-2"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          animation: 'fadeIn 0.3s ease',
          opacity: 1
        }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAlign}
                className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>코드 정렬</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* 디버그 모달 */}
      <DebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        debugData={debugData}
      />
    </>
  );
}