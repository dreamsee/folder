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
    <div className="left-sidebar-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''} ${activeTab === tab.id ? `active-${tab.id}` : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="tab-label">{tab.label}</div>
        </button>
      ))}

      <style jsx>{`
        .left-sidebar-tabs {
          display: flex;
          flex-direction: column;
          width: 27px;
          background: transparent;
          border-right: none;
        }

        .sidebar-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 48px;
          border: 1px solid #e5e7eb;
          border-bottom: none;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 8px 0 0 8px;
          margin: 0;
          padding: 0;
        }

        .sidebar-tab:last-child {
          border-bottom: 1px solid #e5e7eb;
        }

        .sidebar-tab:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .sidebar-tab.active-note {
          background: #8b5cf6;
          color: white;
          border-color: #8b5cf6;
          opacity: 0.7;
        }

        .sidebar-tab.active-overlay {
          background: #10b981;
          color: white;
          border-color: #10b981;
          opacity: 0.7;
        }

        .sidebar-tab.active-zoom {
          background: #f59e0b;
          color: white;
          border-color: #f59e0b;
          opacity: 0.7;
        }

        .tab-icon {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .tab-label {
          font-size: 9px;
          font-weight: 500;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          white-space: nowrap;
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
};