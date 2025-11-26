import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, HardDrive } from "lucide-react";
import { getStorageInfo, StorageInfo } from "@/lib/localStorageUtils";

interface HeaderProps {
  onNewOriginalClick: () => void;
}

export default function Header({ onNewOriginalClick }: HeaderProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    // 초기 로드
    setStorageInfo(getStorageInfo());

    // storage 이벤트 리스닝 (다른 탭에서 변경시)
    const handleStorageChange = () => {
      setStorageInfo(getStorageInfo());
    };

    window.addEventListener('storage', handleStorageChange);

    // 5초마다 갱신 (같은 탭 내 변경 감지용)
    const interval = setInterval(() => {
      setStorageInfo(getStorageInfo());
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = (status: StorageInfo['status']) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'danger': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: StorageInfo['status']) => {
    switch (status) {
      case 'good': return '양호';
      case 'warning': return '주의';
      case 'danger': return '경고';
      default: return '-';
    }
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-800">두개의 노트 비교</h1>
        <div className="flex items-center space-x-2">
          {storageInfo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${getStatusColor(storageInfo.status)}`}>
                    <HardDrive className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-56 p-3">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">로컬 저장소 사용량</div>
                    <div className="text-xs text-gray-600">
                      현재: {storageInfo.usedFormatted} / {storageInfo.maxFormatted}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          storageInfo.status === 'good' ? 'bg-green-500' :
                          storageInfo.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {storageInfo.percentage.toFixed(1)}% 사용 중
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="text-xs text-gray-500">
                        쾌적 기준: {storageInfo.comfortableFormatted} 이하
                      </div>
                      <div className={`text-xs font-medium ${getStatusColor(storageInfo.status)}`}>
                        상태: {getStatusText(storageInfo.status)}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center"
            onClick={onNewOriginalClick}
          >
            <FileText className="h-4 w-4 mr-1" /> 새 원본 추가
          </Button>
        </div>
      </div>
    </header>
  );
}
