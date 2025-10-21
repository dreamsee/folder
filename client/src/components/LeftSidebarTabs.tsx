// 왼쪽 세로 탭 컴포넌트
import React from 'react';

interface LeftSidebarTabsProps {
  activeTab: 'note' | 'overlay' | 'zoom';
  onTabChange: (tab: 'note' | 'overlay' | 'zoom') => void;
}

export const LeftSidebarTabs: React.FC<LeftSidebarTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'note' as const, label: '노트' },
    { id: 'overlay' as const, label: '화면글자' },
    { id: 'zoom' as const, label: '돋보기' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '27px', background: 'transparent', borderRight: 'none' }}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '48px',
            border: '1px solid #e5e7eb',
            borderBottom: index === tabs.length - 1 ? '1px solid #e5e7eb' : 'none',
            background: activeTab === tab.id
              ? (tab.id === 'note' ? '#8b5cf6' : tab.id === 'overlay' ? '#10b981' : '#f59e0b')
              : '#f8f9fa',
            color: activeTab === tab.id ? 'white' : 'inherit',
            borderColor: activeTab === tab.id
              ? (tab.id === 'note' ? '#8b5cf6' : tab.id === 'overlay' ? '#10b981' : '#f59e0b')
              : '#e5e7eb',
            opacity: activeTab === tab.id ? 0.7 : 1,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: '8px 0 0 8px',
            margin: 0,
            padding: 0
          }}
          onMouseOver={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }
          }}
          onMouseOut={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }
          }}
          onClick={() => onTabChange(tab.id)}
        >
          <div style={{
            fontSize: '9px',
            fontWeight: 500,
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            whiteSpace: 'nowrap',
            margin: 0,
            padding: 0
          }}>
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
};