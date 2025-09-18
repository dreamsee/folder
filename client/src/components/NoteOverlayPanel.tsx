/*
 * NoteOverlayPanel.tsx - 오버레이 노트 입력 패널 컴포넌트
 *
 * 가상 키보드가 올라와도 영상 위치는 고정되고
 * 입력 패널만 오버레이로 표시되는 컴포넌트
 */

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Check, Clock } from "lucide-react";

interface NoteOverlayPanelProps {
  isOpen: boolean;
  noteText: string;
  onNoteChange: (text: string) => void;
  onClose: () => void;
  onAddTimestamp?: () => void;
  currentTime?: string;
  playerElement?: React.ReactNode; // 영상 플레이어 요소
  sourceNoteText?: string; // 메인 노트 영역의 텍스트 (타임스탬프 추출용)
}

const NoteOverlayPanel: React.FC<NoteOverlayPanelProps> = ({
  isOpen,
  noteText,
  onNoteChange,
  onClose,
  onAddTimestamp,
  currentTime,
  playerElement
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localText, setLocalText] = useState(noteText);

  // 패널이 열릴 때 텍스트 동기화 및 포커스
  useEffect(() => {
    if (isOpen) {
      setLocalText(noteText);
      // 약간의 지연 후 포커스 (모바일 키보드 대응)
      setTimeout(() => {
        textareaRef.current?.focus();
        // 커서를 끝으로 이동
        if (textareaRef.current) {
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 100);
    }
  }, [isOpen, noteText]);


  // 저장 처리
  const handleSave = () => {
    onNoteChange(localText);
    onClose();
  };

  // 취소 처리
  const handleCancel = () => {
    setLocalText(noteText); // 원래 텍스트로 복원
    onClose();
  };


  // 타임스탬프 추가
  const handleAddTimestamp = () => {
    if (onAddTimestamp) {
      onAddTimestamp();
    } else if (currentTime) {
      // currentTime이 제공되면 직접 추가
      const timestamp = `[${currentTime}] `;
      const newText = localText + (localText ? '\n' : '') + timestamp;
      setLocalText(newText);

      // textarea에 포커스 후 커서를 끝으로 이동
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = newText;
          const len = newText.length;
          textareaRef.current.setSelectionRange(len, len);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 (반투명) */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancel}
      />

      {/* 입력 패널 + 플레이어 - 하단에 고정 */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* 플레이어 영역 - 입력 패널 위에 붙임 */}
        {playerElement && (
          <div className="mb-0 bg-white border-t border-l border-r rounded-t-lg shadow-lg">
            <div className="overflow-hidden rounded-t-lg">
              {playerElement}
            </div>
          </div>
        )}

        {/* 입력 패널 */}
        <Card className={`shadow-2xl bg-white ${playerElement ? 'rounded-none rounded-b-xl' : 'rounded-t-xl rounded-b-none'}`}>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm">노트 편집</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleSave}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                저장
              </Button>
              {(onAddTimestamp || currentTime) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddTimestamp}
                  className="text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  타임스탬프
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="text-xs"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 텍스트 입력 영역 */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              placeholder="노트를 입력하세요..."
              className="w-full min-h-[150px] max-h-[300px] resize-none text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 overlay-textarea-scrollbar"
              style={{
                fontSize: '16px',
                WebkitTextSizeAdjust: 'none'
              }}
            />
          </div>
        </Card>
      </div>
    </>
  );
};

export default NoteOverlayPanel;