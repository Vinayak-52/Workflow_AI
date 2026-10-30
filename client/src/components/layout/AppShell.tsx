import React, { useState } from 'react';
import { Sidebar, NavItemKey } from './Sidebar';
import { TopBar } from './TopBar';
import { ContextualAssistantDrawer } from './ContextualAssistantDrawer';

interface AppShellProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  children: React.ReactNode;
  activeContext?: {
    type: 'notes' | 'tasks' | 'inbox' | 'calendar' | 'dashboard' | 'settings' | 'global';
    id?: string;
    label?: string;
  };
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  children,
  activeContext,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-workspace-bg">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          title={currentTab}
          assistantOpen={assistantOpen}
          onToggleAssistant={() => setAssistantOpen(!assistantOpen)}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-workspace-bg">
          {children}
        </main>
      </div>

      {/* Right Assistant Panel */}
      <ContextualAssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        activeContext={activeContext || { type: currentTab, label: currentTab }}
      />
    </div>
  );
};
