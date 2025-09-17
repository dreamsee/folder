// 타임스탬프 테스트 페이지
// SimpleNoteArea 컴포넌트를 독립적으로 테스트하는 페이지

import React, { useState, useRef, useEffect } from 'react';
import SimpleNoteArea from '@/components/SimpleNoteArea';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, FileText, Play } from 'lucide-react';
import { formatTime } from '@/lib/youtubeUtils';

const TestTimestampPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('timestamp');
  const [noteText, setNoteText] = useState(`타임스탬프 테스트 노트

📌 기본 타임스탬프:
[00:00:10-00:00:15, 100%, 1.00x] 인트로 부분

📌 볼륨/속도 변경:
[00:00:30-00:00:40, 80%, 1.25x] 중요한 설명

📌 자동 점프:
[00:01:00-00:01:10, 100%, 1.50x, ->] 다음으로 자동 이동

📌 정지 기능:
[00:01:30-00:01:40, 100%, 1.00x, |3] 3초간 정지 후 재생

📌 연속 타임스탬프:
[00:02:00-00:02:05, 90%, 1.25x, ->] 첫 번째 구간
[00:02:10-00:02:15, 100%, 1.00x] 두 번째 구간
`);

  // 테스트용 비디오 데이터
  const [testVideoId, setTestVideoId] = useState('dQw4w9WgXcQ');

  // YouTube 플레이어 관련 상태
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState(-1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
    id: number;
  } | null>(null);

  // 알림 표시 함수
  const showNotification = (message: string, type: "info" | "success" | "warning" | "error") => {
    const id = Date.now();
    setNotification({ message, type, id });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // 플레이어 준비 완료 핸들러
  const handlePlayerReady = (playerInstance: any) => {
    setPlayer(playerInstance);
    setIsPlayerReady(true);
    showNotification('플레이어가 준비되었습니다', 'success');
  };

  // 플레이어 상태 변경 핸들러
  const handlePlayerStateChange = (state: number) => {
    setPlayerState(state);
    setIsBuffering(state === 3);
  };


  const testVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
    { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee' },
    { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE(강남스타일) M/V' }
  ];

  // 탭 전환시 애니메이션 효과를 위한 스타일
  const tabContentStyle = {
    animation: 'fadeIn 0.3s ease-in-out',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-4">타임스탬프 시스템 테스트</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="timestamp" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              타임스탬프
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              사용법
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 bg-white rounded-lg shadow-lg">
            <TabsContent value="timestamp" style={tabContentStyle}>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">SimpleNoteArea 테스트</h2>

                {/* 비디오 선택 */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">테스트 비디오 선택:</h3>
                  <div className="flex flex-wrap gap-2">
                    {testVideos.map((video) => (
                      <Button
                        key={video.id}
                        size="sm"
                        variant={testVideoId === video.id ? "default" : "outline"}
                        onClick={() => setTestVideoId(video.id)}
                        className="text-xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {video.title.substring(0, 20)}...
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    현재 비디오 ID: <span className="font-mono">{testVideoId}</span>
                  </p>
                </div>

                {/* YouTube 플레이어 */}
                <div className="mb-4 border rounded-lg overflow-hidden">
                  <YouTubePlayer
                    player={player}
                    setPlayer={setPlayer}
                    isPlayerReady={isPlayerReady}
                    setIsPlayerReady={setIsPlayerReady}
                    currentVideoId={testVideoId}
                    setPlayerState={setPlayerState}
                    showNotification={showNotification}
                    className="w-full h-64"
                  />
                </div>

                {/* 플레이어 상태 정보 */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">플레이어 상태:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        isPlayerReady ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isPlayerReady ? '준비됨' : '준비 중'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">재생 상태:</span>
                      <span className="ml-2">
                        {playerState === -1 ? '초기화' :
                         playerState === 0 ? '종료' :
                         playerState === 1 ? '재생' :
                         playerState === 2 ? '일시정지' :
                         playerState === 3 ? '버퍼링' :
                         playerState === 5 ? '큐됨' : '알 수 없음'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">현재 시간:</span>
                      <span className="ml-2 font-mono">{formatTime(currentTime)}</span>
                    </div>
                    <div>
                      <span className="font-medium">총 길이:</span>
                      <span className="ml-2 font-mono">{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* SimpleNoteArea 컴포넌트 */}
                <div className="border rounded-lg">
                  <SimpleNoteArea
                    player={player}
                    isPlayerReady={isPlayerReady}
                    showNotification={showNotification}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" style={tabContentStyle}>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">타임스탬프 시스템 사용법</h2>

                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium mb-2">기본 형식</h3>
                    <code className="text-sm bg-white px-2 py-1 rounded">
                      [HH:MM:SS-HH:MM:SS, 볼륨%, 속도x]
                    </code>
                    <p className="text-sm text-gray-600 mt-2">
                      예: [00:01:30-00:01:35, 100%, 1.25x]
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium mb-2">자동 점프</h3>
                    <code className="text-sm bg-white px-2 py-1 rounded">
                      [시작-종료, 볼륨%, 속도x, -&gt;]
                    </code>
                    <p className="text-sm text-gray-600 mt-2">
                      구간 종료 후 다음 타임스탬프로 자동 이동
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-medium mb-2">정지 기능</h3>
                    <code className="text-sm bg-white px-2 py-1 rounded">
                      [시작-종료, 볼륨%, 속도x, |3]
                    </code>
                    <p className="text-sm text-gray-600 mt-2">
                      구간 시작 시 3초간 정지 후 재생 계속
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-medium mb-2">더블클릭 기능</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 시작시간 더블클릭: 해당 시간으로 이동 후 타임스탬프 설정 적용</li>
                      <li>• 종료시간 더블클릭: 해당 시간으로 이동 후 자동 이탈 처리</li>
                      <li>• 재생 중에만 자동 감지 시스템 작동</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h3 className="font-medium mb-2">주의사항</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 시간 형식: HH:MM:SS (시:분:초)</li>
                      <li>• 볼륨: 0-100% 범위</li>
                      <li>• 속도: 0.25-2.0x 범위</li>
                      <li>• 쉼표와 공백 정확히 입력 필요</li>
                    </ul>
                  </div>
                </div>

                <Button
                  onClick={() => setActiveTab('timestamp')}
                  className="w-full mt-6"
                >
                  타임스탬프 테스트로 돌아가기
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* 디버그 정보 패널 */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">디버그 정보</h3>
          <div className="text-sm space-y-1">
            <p>현재 탭: <span className="font-mono bg-gray-100 px-1">{activeTab}</span></p>
            <p>비디오 ID: <span className="font-mono bg-gray-100 px-1">{testVideoId}</span></p>
            <p>노트 텍스트 길이: <span className="font-mono bg-gray-100 px-1">{noteText.length}</span></p>
            <p>타임스탬프 개수: <span className="font-mono bg-gray-100 px-1">
              {(noteText.match(/\[\d{2}:\d{2}:\d{2}-\d{2}:\d{2}:\d{2},\s*\d+%,\s*[\d.]+x(?:,\s*(?:->|\|\d+))?\]/g) || []).length}
            </span></p>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNoteText(`간단한 테스트 노트

[00:00:05-00:00:10, 100%, 1.00x] 시작 부분
[00:00:15-00:00:20, 80%, 1.25x, ->] 중간 부분
[00:00:25-00:00:30, 100%, 1.50x] 마지막 부분
`);
              }}
            >
              간단한 노트로 변경
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const timestamps = noteText.match(/\[\d{2}:\d{2}:\d{2}-\d{2}:\d{2}:\d{2},\s*\d+%,\s*[\d.]+x(?:,\s*(?:->|\|\d+))?\]/g) || [];
                alert(`발견된 타임스탬프:\n${timestamps.join('\n') || '없음'}`);
              }}
            >
              타임스탬프 분석
            </Button>
          </div>
        </div>
      </div>

      {/* 알림 표시 */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
          notification.type === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
          'bg-blue-100 text-blue-700 border border-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

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

export default TestTimestampPage;