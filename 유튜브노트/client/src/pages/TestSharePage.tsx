// 카카오톡 스타일 공유창 테스트 페이지
// 독립적으로 SimpleShareArea 컴포넌트를 테스트하는 페이지

import React, { useState } from 'react';
import SimpleShareArea from '@/components/SimpleShareArea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, FileText } from 'lucide-react';

const TestSharePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('share');
  const [editorComment, setEditorComment] = useState('');

  // 테스트용 비디오 데이터
  const [videoData, setVideoData] = useState({
    videoId: 'dQw4w9WgXcQ',
    title: 'React 기초 강좌 #1 - 컴포넌트와 Props',
    channelName: '코딩 채널',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    editorComment: '',
    timestamp: '[00:01:30-00:01:35, 100%, 1.25x]'
  });

  // 탭 전환시 애니메이션 효과를 위한 스타일
  const tabContentStyle = {
    animation: 'fadeIn 0.3s ease-in-out',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-4">카카오톡 스타일 공유창 테스트</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="note" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              유튜브노트
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              공유창
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 bg-white rounded-lg shadow-lg min-h-[600px]">
            <TabsContent value="note" style={tabContentStyle}>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">유튜브 노트 영역</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">현재 영상 정보:</p>
                    <p className="font-medium">{videoData.title}</p>
                    <p className="text-sm text-gray-500">{videoData.channelName}</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">노트 내용 (예시):</p>
                    <p className="text-sm">
                      {videoData.timestamp} 여기서 중요한 개념 설명<br />
                      - Props는 부모에서 자식으로 전달되는 데이터<br />
                      - State는 컴포넌트 내부에서 관리되는 데이터<br />
                      - 불변성을 유지해야 함
                    </p>
                  </div>

                  <Button
                    onClick={() => setActiveTab('share')}
                    className="w-full"
                  >
                    공유창으로 이동
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="share" style={tabContentStyle}>
              <SimpleShareArea
                videoData={videoData}
                onCommentChange={(comment) => {
                  setEditorComment(comment);
                  console.log('편집자 코멘트 변경:', comment);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* 디버그 정보 패널 */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">디버그 정보</h3>
          <div className="text-sm space-y-1">
            <p>현재 탭: <span className="font-mono bg-gray-100 px-1">{activeTab}</span></p>
            <p>편집자 코멘트 길이: <span className="font-mono bg-gray-100 px-1">{editorComment.length}</span></p>
            <p>비디오 ID: <span className="font-mono bg-gray-100 px-1">{videoData.videoId}</span></p>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setVideoData({
                  ...videoData,
                  title: '다른 테스트 영상',
                  channelName: '테스트 채널 2',
                  timestamp: '[00:02:45-00:02:50, 80%, 1.5x]'
                });
              }}
            >
              비디오 데이터 변경
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                alert(`현재 편집자 코멘트:\n${editorComment || '(비어있음)'}`);
              }}
            >
              코멘트 확인
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TestSharePage;