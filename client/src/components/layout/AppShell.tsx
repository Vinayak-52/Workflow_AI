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
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090c] text-zinc-100 antialiased font-sans">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Soft top ambient light (inspired by Alien AI reference) */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-indigo-500/[0.04] to-transparent pointer-events-none" />

        <TopBar
          title={currentTab}
          assistantOpen={assistantOpen}
          onToggleAssistant={() => setAssistantOpen(!assistantOpen)}
        />

        <main className="flex-1 overflow-y-auto p-7 bg-[#08090c] relative z-10">
          {children}
        </main>
      </div>

      {/* Right Assistant Panel */}
      <ContextualAssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        activeContext={activeContext || { type: currentTab, label: `${currentTab.toUpperCase()} Workspace` }}
      />
    </div>
  );
};
