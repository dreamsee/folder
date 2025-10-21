import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock } from "lucide-react";
import { LeftSidebarTabs } from "../LeftSidebarTabs";
import { NoteTabs } from "../NoteTabs";
import OverlayInput from "../OverlayInput";
import { ZoomContent } from "../ZoomContent";
import { OverlayData } from "../TextOverlay";
import { UISettings } from "../SettingsPanel";
import { NotePageState } from "../../types/NotePage";

interface LeftTabLayoutProps {
  uiSettings: UISettings;
  noteText: string;
  setNoteText: (text: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleTimestampClick: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  pageState: NotePageState;
  pageManagement: any;
  overlays: OverlayData[];
  setOverlays: React.Dispatch<React.SetStateAction<OverlayData[]>>;
  isPlayerReady: boolean;
  player: any;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  onSettingsChange: (settings: UISettings) => void;
  currentVideoId: string;
  currentTime: number;
}

const LeftTabLayout: React.FC<LeftTabLayoutProps> = ({
  uiSettings,
  noteText,
  setNoteText,
  textareaRef,
  handleTimestampClick,
  pageState,
  pageManagement,
  overlays,
  setOverlays,
  isPlayerReady,
  player,
  showNotification,
  onSettingsChange,
  currentVideoId,
  currentTime,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'note' | 'overlay' | 'zoom'>('note');

  return (
    <div className="flex-1 flex">
      {/* 왼쪽 세로 탭 */}
      <LeftSidebarTabs
        activeTab={activeMainTab}
        onTabChange={setActiveMainTab}
      />

      {/* 우측 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col ml-1">
        {/* 노트 탭 */}
        {activeMainTab === 'note' && uiSettings?.노트영역?.표시 !== false && (
          <div className="flex-1 flex">
            {/* 노트 영역 */}
            <div className="flex-1 flex flex-col">
              <Textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onDoubleClick={handleTimestampClick}
                placeholder="여기에 노트를 작성하세요.

📌 사용법:
• 도장 버튼: [HH:MM:SS, 100%, 1.00x] 형식으로 타임스탬프 생성
• 더블클릭: 타임스탬프 시간으로 이동
• 자동점프: 다음 스탬프로 자동 이동, 끝에 &quot;, -&gt;&quot; 추가
• 정지재생: 끝에 &quot;, |3&quot; (3초 정지) 추가

예시: [00:01:30-00:01:35, 100%, 1.25x, -&gt;]
     [00:01:30-00:01:35, 100%, 1.25x, |3]"
                className="w-full resize-y min-h-[130px] overflow-auto scrollbar-hide"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />

              {/* 페이지 탭 시스템 - 하단에 표시 */}
              <div ref={pageManagement.noteTabsRef} style={{ marginTop: '4px' }}>
                <NoteTabs
                  pageState={pageState}
                  onPageChange={pageManagement.handlePageChange}
                  onPageUpdate={pageManagement.handlePageUpdate}
                  onPageAdd={pageManagement.handlePageAdd}
                  onPageDelete={pageManagement.handlePageDelete}
                  onPageReorder={pageManagement.handlePageReorder}
                  onEmojiClick={pageManagement.handleEmojiClick}
                  onColorClick={pageManagement.handleColorClick}
                />
              </div>
            </div>

            {/* 전체 페이지 전용: 타임스탬프 가져오기 세로 버튼 */}
            {pageManagement.getCurrentPage()?.isSpecial && (
              <div className="ml-1 flex flex-col justify-start">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    pageManagement.setShowTimestampImporter(!pageManagement.showTimestampImporter);
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-xs px-1 py-8 writing-mode-vertical bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    height: '140px',
                    width: '30px',
                    fontWeight: '400'
                  }}
                >
                  전체 도장 가져오기
                  <Clock className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 화면텍스트 탭 */}
        {activeMainTab === 'overlay' && uiSettings?.화면텍스트?.패널표시 !== false && (
          <div className="flex-1">
            <OverlayInput
              overlays={overlays || []}
              setOverlays={setOverlays}
              isPlayerReady={isPlayerReady}
              player={player}
              showNotification={showNotification}
              uiSettings={uiSettings}
              onSettingsChange={onSettingsChange}
              noteText={noteText}
              currentVideoId={currentVideoId}
            />
          </div>
        )}

        {/* 돋보기 탭 */}
        {activeMainTab === 'zoom' && (
          <div className="flex-1">
            <ZoomContent
              player={player}
              isPlayerReady={isPlayerReady}
              currentTime={currentTime}
              showNotification={showNotification}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftTabLayout;
