import React from 'react';
import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  CheckSquare,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type NavItemKey = 'dashboard' | 'inbox' | 'calendar' | 'notes' | 'tasks' | 'settings';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const navItems: Array<{ key: NavItemKey; label: string; icon: React.ReactNode }> = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'inbox', label: 'Inbox', icon: <Mail size={18} /> },
    { key: 'calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    { key: 'notes', label: 'Notes', icon: <FileText size={18} /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside
      className={`h-screen bg-workspace-sidebar border-r border-workspace-border flex flex-col justify-between transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div>
        {/* Brand header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-workspace-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles size={18} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-white leading-none">
                  Workflow AI
                </span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider mt-0.5">
                  AI WORKSPACE
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-workspace-card"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-workspace-card'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-zinc-400'}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User workspace status */}
      <div className="p-3 border-t border-workspace-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
            VC
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-medium text-zinc-200 truncate">Demo User</span>
              <span className="text-[10px] text-zinc-500 truncate">HITK Academic Lab</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
