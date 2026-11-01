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
  ShieldCheck,
  Zap,
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
  const primaryNav: Array<{ key: NavItemKey; label: string; icon: React.ReactNode; badge?: string }> = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={17} />, badge: 'ML' },
    { key: 'notes', label: 'Notes', icon: <FileText size={17} /> },
    { key: 'calendar', label: 'Calendar', icon: <Calendar size={17} /> },
    { key: 'inbox', label: 'Inbox', icon: <Mail size={17} /> },
  ];

  return (
    <aside
      className={`h-screen bg-[#0c0d12] border-r border-white/[0.06] flex flex-col justify-between transition-all duration-200 select-none relative z-30 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <div>
        {/* Workspace Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <Sparkles size={16} />
              </div>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs tracking-tight text-white flex items-center gap-1.5 truncate">
                  Workflow AI
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">
                  Academic Lab
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-6">
          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">
                Workspace
              </div>
            )}
            <nav className="space-y-1">
              {primaryNav.map((item) => {
                const isActive = currentTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelectTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent text-indigo-200 font-semibold border-l-2 border-indigo-500 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={`transition-colors shrink-0 ${
                        isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="truncate flex-1 text-left tracking-tight">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            {!collapsed && (
              <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest font-mono">
                System
              </div>
            )}
            <nav className="space-y-1">
              <button
                onClick={() => onSelectTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                  currentTab === 'settings'
                    ? 'bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent text-indigo-200 font-semibold border-l-2 border-indigo-500 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
                title={collapsed ? 'Settings' : undefined}
              >
                <span
                  className={`transition-colors shrink-0 ${
                    currentTab === 'settings' ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  <Settings size={17} />
                </span>
                {!collapsed && (
                  <span className="truncate flex-1 text-left tracking-tight">
                    Settings & OAuth
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* User profile & Google connection badge */}
      <div className="p-3 border-t border-white/[0.06] bg-[#090a0e]/60">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-900 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
            VC
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-xs font-medium text-zinc-200 truncate">Vinayak Chandra</span>
              <span className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-400 shrink-0" /> Read-Only Auth
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
