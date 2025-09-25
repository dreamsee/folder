// 간단한 탭 설정 모달 - 모바일 안정성 우선
import React, { useState, useEffect } from 'react';
import { Settings, X, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';

interface SimpleTabSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: any[];  // tabConfig -> currentConfig로 변경
  onSave: (config: any[]) => void;
  tabPosition: 'top' | 'right';
  onPositionChange: (position: 'top' | 'right') => void;
}

const SimpleTabSettings: React.FC<SimpleTabSettingsProps> = ({
  isOpen,
  onClose,
  currentConfig,  // prop 이름 변경
  onSave,
  tabPosition,
  onPositionChange
}) => {
  const [localConfig, setLocalConfig] = useState(currentConfig);

  // props 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalConfig(currentConfig);
  }, [currentConfig]);

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

  // 기능 위로 이동
  const moveFeatureUp = (tabId: string, featureIndex: number) => {
    if (featureIndex === 0) return;

    setLocalConfig(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;

      const newFeatures = [...tab.features];
      [newFeatures[featureIndex - 1], newFeatures[featureIndex]] =
        [newFeatures[featureIndex], newFeatures[featureIndex - 1]];

      return { ...tab, features: newFeatures };
    }));
  };

  // 기능 아래로 이동
  const moveFeatureDown = (tabId: string, featureIndex: number) => {
    const tab = localConfig.find(t => t.id === tabId);
    if (!tab || featureIndex === tab.features.length - 1) return;

    setLocalConfig(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;

      const newFeatures = [...tab.features];
      [newFeatures[featureIndex], newFeatures[featureIndex + 1]] =
        [newFeatures[featureIndex + 1], newFeatures[featureIndex]];

      return { ...tab, features: newFeatures };
    }));
  };

  // 기능을 다른 탭으로 이동
  const moveFeatureToNextTab = (currentTabId: string, featureIndex: number) => {
    const currentTabIndex = localConfig.findIndex(tab => tab.id === currentTabId);
    const visibleTabs = localConfig.filter(tab => tab.visible);
    const currentVisibleIndex = visibleTabs.findIndex(tab => tab.id === currentTabId);
    const nextTab = visibleTabs[(currentVisibleIndex + 1) % visibleTabs.length];

    if (!nextTab || nextTab.id === currentTabId) return;

    const feature = localConfig[currentTabIndex].features[featureIndex];

    setLocalConfig(prev => prev.map((tab) => {
      if (tab.id === currentTabId) {
        // 현재 탭에서 기능 제거
        const newFeatures = [...tab.features];
        newFeatures.splice(featureIndex, 1);
        return { ...tab, features: newFeatures };
      } else if (tab.id === nextTab.id) {
        // 다음 탭에 기능 추가
        return { ...tab, features: [...tab.features, feature] };
      }
      return tab;
    }));
  };

  // 기능 이름 가져오기 (실제 UI 제목과 일치)
  const getFeatureName = (featureId: string): string => {
    const featureNames: { [key: string]: string } = {
      'overlayText': '텍스트 입력창',  // UI에는 제목 없지만 명확하게
      'positionGrid': '위치 설정',      // UI 제목과 일치
      'coordinateInput': '좌표 직접 입력',  // UI 제목과 일치
      'textAlign': '텍스트 정렬',      // UI 제목과 일치
      'addButton': '오버레이 추가',    // UI 버튼 텍스트와 일치
      'fontSize': '글자 크기',
      'padding': '여백',
      'rotation': '회전 각도',         // UI 제목과 일치
      'textColor': '글자색',
      'bgColor': '배경색',
      'bgOpacity': '배경 투명도',
      'duration': '지속 시간',         // UI 제목과 일치
      'overlayList': '등록된 오버레이'  // UI 제목과 일치
    };
    return featureNames[featureId] || featureId;
  };

  // 저장
  const handleSave = () => {
    try {
      onSave(localConfig);
      localStorage.setItem('overlayTabConfig', JSON.stringify(localConfig));
      localStorage.setItem('overlayTabPosition', tabPosition);
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
          {/* 탭 위치 설정 */}
          <div className="border rounded-lg p-3">
            <div className="mb-2 font-medium">탭 위치</div>
            <div className="flex gap-2">
              <button
                onClick={() => onPositionChange('top')}
                className={`flex-1 px-3 py-2 rounded border ${
                  tabPosition === 'top'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                상단
              </button>
              <button
                onClick={() => onPositionChange('right')}
                className={`flex-1 px-3 py-2 rounded border ${
                  tabPosition === 'right'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                오른쪽
              </button>
            </div>
          </div>

          {/* 탭 설정 */}
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

              {/* 기능 순서 변경 영역 */}
              {tab.visible && tab.features && tab.features.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs text-gray-600 font-medium mb-1">기능 순서:</div>
                  {tab.features.map((featureId, index) => (
                    <div key={featureId} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                      <span className="text-xs text-gray-700">{getFeatureName(featureId)}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveFeatureUp(tab.id, index)}
                          disabled={index === 0}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                          title="위로"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveFeatureDown(tab.id, index)}
                          disabled={index === tab.features.length - 1}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                          title="아래로"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveFeatureToNextTab(tab.id, index)}
                          className="p-0.5 hover:bg-gray-200 rounded"
                          title="다른 탭으로"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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