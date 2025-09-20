// 간단한 탭 설정 모달 - 모바일 안정성 우선
import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

interface SimpleTabSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  tabConfig: any[];
  onSave: (config: any[]) => void;
}

const SimpleTabSettings: React.FC<SimpleTabSettingsProps> = ({
  isOpen,
  onClose,
  tabConfig,
  onSave
}) => {
  const [localConfig, setLocalConfig] = useState(tabConfig);

  // props 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalConfig(tabConfig);
  }, [tabConfig]);

  // 탭 이름 변경
  const updateTabName = (tabId: string, newName: string) => {
    setLocalConfig(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    ));
  };

  // 탭 표시/숨김 토글
  const toggleTabVisibility = (tabId: string) => {
    setLocalConfig(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, visible: !tab.visible } : tab
    ));
  };

  // 저장
  const handleSave = () => {
    try {
      onSave(localConfig);
      localStorage.setItem('overlayTabConfig', JSON.stringify(localConfig));
      onClose();
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-lg font-semibold">탭 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 설정 내용 */}
        <div className="p-4 space-y-4">
          {localConfig.map((tab) => (
            <div key={tab.id} className="border rounded-lg p-3">
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5" />
                <input
                  type="text"
                  value={tab.name}
                  onChange={(e) => updateTabName(tab.id, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="탭 이름"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tab.visible}
                    onChange={() => toggleTabVisibility(tab.id)}
                  />
                  <span className="text-sm">표시</span>
                </label>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                기능: {tab.features?.length || 0}개
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTabSettings;