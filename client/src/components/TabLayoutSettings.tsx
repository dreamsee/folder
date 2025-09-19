import React, { useState, useEffect } from 'react';
import { Type, Palette, Clock, Sliders, Settings, ChevronUp, ChevronDown, ArrowRight, X } from 'lucide-react';

// 탭 설정 인터페이스
interface TabConfig {
  id: string;
  name: string;
  icon: any;
  visible: boolean;
  features: string[];
}

// 기능 정의
interface FeatureDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
}

// 기본 탭 설정
const defaultTabConfig: TabConfig[] = [
  {
    id: 'settings',
    name: '설정',
    icon: Settings,
    visible: true,
    features: ['tabConfiguration', 'layoutSettings']
  },
  {
    id: 'note',
    name: '노트',
    icon: Type,
    visible: true,
    features: ['overlayText', 'positionGrid', 'coordinateInput', 'textAlign', 'addButton']
  },
  {
    id: 'size',
    name: '크기',
    icon: Sliders,
    visible: true,
    features: ['fontSize', 'padding', 'rotation']
  },
  {
    id: 'color',
    name: '색상',
    icon: Palette,
    visible: true,
    features: ['textColor', 'bgColor', 'bgOpacity']
  },
  {
    id: 'time',
    name: '시간',
    icon: Clock,
    visible: true,
    features: ['duration', 'overlayList']
  }
];

// 모든 가능한 기능들
const allFeatures: FeatureDefinition[] = [
  { id: 'tabConfiguration', title: '탭 설정', description: '탭의 이름, 순서, 표시/숨김 설정', category: 'settings' },
  { id: 'layoutSettings', title: '레이아웃 설정', description: '탭 레이아웃 구성 및 기능 배치', category: 'settings' },
  { id: 'overlayText', title: '텍스트 입력', description: '화면에 표시할 텍스트 작성', category: 'input' },
  { id: 'positionGrid', title: '위치 그리드', description: '9개 위치 버튼으로 배치 선택', category: 'layout' },
  { id: 'coordinateInput', title: '좌표 직접 입력', description: 'X, Y 좌표값을 숫자로 정밀 지정', category: 'layout' },
  { id: 'textAlign', title: '텍스트 정렬', description: '좌측/중앙/우측 정렬 선택', category: 'layout' },
  { id: 'addButton', title: '추가 버튼', description: '오버레이 추가/수정 완료 버튼', category: 'action' },
  { id: 'fontSize', title: '글자 크기', description: '폰트 크기 슬라이더 (12-48px)', category: 'style' },
  { id: 'padding', title: '여백 설정', description: '텍스트 주변 여백 조정', category: 'style' },
  { id: 'rotation', title: '회전 각도', description: '텍스트 회전 (-180~180도)', category: 'style' },
  { id: 'textColor', title: '글자 색상', description: '텍스트 색상 선택기', category: 'color' },
  { id: 'bgColor', title: '배경 색상', description: '배경 색상 선택기', category: 'color' },
  { id: 'bgOpacity', title: '투명도', description: '배경 투명도 슬라이더', category: 'color' },
  { id: 'duration', title: '지속 시간', description: '오버레이 표시 시간 설정', category: 'timing' },
  { id: 'overlayList', title: '오버레이 목록', description: '등록된 오버레이 관리', category: 'management' }
];

interface TabLayoutSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: TabConfig[]) => void;
  currentConfig?: TabConfig[];
}

const TabLayoutSettings: React.FC<TabLayoutSettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig = defaultTabConfig
}) => {
  const [tabConfig, setTabConfig] = useState<TabConfig[]>(currentConfig);

  // props 변경 시 상태 동기화
  useEffect(() => {
    setTabConfig(currentConfig);
  }, [currentConfig]);

  // 탭 이름 변경
  const updateTabName = (tabId: string, newName: string) => {
    setTabConfig(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    ));
  };

  // 탭 표시/숨김 토글
  const toggleTabVisibility = (tabId: string) => {
    setTabConfig(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, visible: !tab.visible } : tab
    ));
  };

  // 기능 위로 이동 (같은 탭 내)
  const moveFeatureUp = (tabId: string, featureIndex: number) => {
    if (featureIndex === 0) return; // 이미 맨 위

    setTabConfig(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;

      const newFeatures = [...tab.features];
      [newFeatures[featureIndex - 1], newFeatures[featureIndex]] =
      [newFeatures[featureIndex], newFeatures[featureIndex - 1]];

      return { ...tab, features: newFeatures };
    }));
  };

  // 기능 아래로 이동 (같은 탭 내)
  const moveFeatureDown = (tabId: string, featureIndex: number) => {
    const tab = tabConfig.find(t => t.id === tabId);
    if (!tab || featureIndex === tab.features.length - 1) return; // 이미 맨 아래

    setTabConfig(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;

      const newFeatures = [...tab.features];
      [newFeatures[featureIndex], newFeatures[featureIndex + 1]] =
      [newFeatures[featureIndex + 1], newFeatures[featureIndex]];

      return { ...tab, features: newFeatures };
    }));
  };

  // 기능을 다음 탭으로 이동
  const moveFeatureToNextTab = (currentTabId: string, featureIndex: number) => {
    const currentTabIndex = tabConfig.findIndex(tab => tab.id === currentTabId);
    const nextTabIndex = (currentTabIndex + 1) % tabConfig.length;
    const nextTabId = tabConfig[nextTabIndex].id;

    const feature = tabConfig[currentTabIndex].features[featureIndex];

    setTabConfig(prev => prev.map((tab, index) => {
      if (index === currentTabIndex) {
        // 현재 탭에서 기능 제거
        const newFeatures = [...tab.features];
        newFeatures.splice(featureIndex, 1);
        return { ...tab, features: newFeatures };
      } else if (index === nextTabIndex) {
        // 다음 탭에 기능 추가
        return { ...tab, features: [...tab.features, feature] };
      }
      return tab;
    }));
  };

  // 저장 처리
  const handleSave = () => {
    onSave(tabConfig);
    onClose();
  };

  // 기능 정보 가져오기
  const getFeatureInfo = (featureId: string): FeatureDefinition => {
    return allFeatures.find(f => f.id === featureId) || {
      id: featureId,
      title: featureId,
      description: '',
      category: 'unknown'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-lg font-semibold">탭 레이아웃 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 설정 내용 */}
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          {tabConfig.map((tab, tabIndex) => (
            <div key={tab.id} className="border rounded-lg p-4">
              {/* 탭 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                {tab.id === 'settings' && <Settings className="w-5 h-5" />}
                {tab.id === 'note' && <Type className="w-5 h-5" />}
                {tab.id === 'size' && <Sliders className="w-5 h-5" />}
                {tab.id === 'color' && <Palette className="w-5 h-5" />}
                {tab.id === 'time' && <Clock className="w-5 h-5" />}
                <input
                  type="text"
                  value={tab.name}
                  onChange={(e) => updateTabName(tab.id, e.target.value)}
                  className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* 기능 목록 */}
              <div className="space-y-2">
                {tab.features.map((featureId, featureIndex) => {
                  const featureInfo = getFeatureInfo(featureId);
                  return (
                    <div
                      key={featureId}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{featureInfo.title}</div>
                        <div className="text-xs text-gray-500">{featureInfo.description}</div>
                      </div>

                      {/* 컨트롤 버튼들 */}
                      <div className="flex gap-1">
                        {/* 위로 이동 */}
                        <button
                          onClick={() => moveFeatureUp(tab.id, featureIndex)}
                          disabled={featureIndex === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="위로 이동"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        {/* 아래로 이동 */}
                        <button
                          onClick={() => moveFeatureDown(tab.id, featureIndex)}
                          disabled={featureIndex === tab.features.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="아래로 이동"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* 다음 탭으로 이동 */}
                        <button
                          onClick={() => moveFeatureToNextTab(tab.id, featureIndex)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title={`${tabConfig[(tabIndex + 1) % tabConfig.length].name} 탭으로 이동`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 빈 탭 안내 */}
                {tab.features.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    이 탭에는 기능이 없습니다
                  </div>
                )}
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

export default TabLayoutSettings;