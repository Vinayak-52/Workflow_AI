import React, { useState } from 'react';
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
  FolderKanban,
  Bookmark,
  Layers,
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
  const [activeCollection, setActiveCollection] = useState<'all' | 'academic' | 'google'>('all');

  const dockNav: Array<{ key: NavItemKey; label: string; icon: React.ReactNode }> = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={18} /> },
    { key: 'notes', label: 'Notes', icon: <FileText size={18} /> },
    { key: 'calendar', label: 'Calendar', icon: <Calendar size={18} /> },
    { key: 'inbox', label: 'Inbox', icon: <Mail size={18} /> },
  ];

  return (
    <div className="flex h-screen select-none shrink-0 relative z-30">
      {/* 1. Leftmost Iconic Dock (Width 64px) - Inspired by Reference 1 */}
      <aside className="w-16 h-screen bg-[#090a0f] border-r border-white/[0.07] flex flex-col items-center justify-between py-4 shrink-0">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo / Brand Icon */}
          <div className="relative group cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:scale-105 transition-all">
              <Sparkles size={18} />
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-[#090a0f]" />
          </div>

          {/* Core Module Icons */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
            {dockNav.map((item) => {
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectTab(item.key)}
                  title={item.label}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative group ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {/* Active vertical pill indicator */}
                  {isActive && (
                    <span className="absolute -left-2 w-1 h-5 rounded-r-full bg-white shadow-[0_0_8px_white]" />
                  )}
                  {item.icon}

                  {/* Tooltip on hover */}
                  <span className="absolute left-14 bg-[#1a1b28] border border-white/10 text-white text-[11px] font-medium px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dock Bottom Items: Settings, User Profile */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={() => onSelectTab('settings')}
            title="Settings & OAuth"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              currentTab === 'settings'
                ? 'bg-white/[0.1] text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Settings size={18} />
          </button>

          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand Workspace Panel' : 'Collapse Workspace Panel'}
            className="w-10 h-10 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] flex items-center justify-center transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* User Avatar */}
          <div
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-900 to-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-indigo-300 shadow-sm cursor-pointer"
            title="Vinayak Chandra (HITK Academic Lab)"
          >
            VC
          </div>
        </div>
      </aside>

      {/* 2. Secondary Workspace Panel (Inspired by Reference 1 & 2) */}
      {!collapsed && (
        <aside className="w-56 h-screen bg-[#0e0f16] border-r border-white/[0.06] flex flex-col justify-between py-4 px-3.5 shrink-0 overflow-y-auto">
          <div className="space-y-6">
            {/* Header: Workspace title */}
            <div className="px-1.5 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  Workflow AI
                  <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.2 rounded">
                    MVP
                  </span>
                </h2>
                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                  HITK Computer Science
                </span>
              </div>
            </div>

            {/* Quick Collections (like "My collections" in Image 1) */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block px-1.5 font-semibold">
                Collections
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveCollection('all');
                    onSelectTab('dashboard');
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeCollection === 'all' && currentTab === 'dashboard'
                      ? 'bg-white/[0.08] text-white border border-white/[0.08] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <Layers size={14} className="text-indigo-400" />
                  <span>Main Workspace</span>
                </button>

                <button
                  onClick={() => {
                    setActiveCollection('academic');
                    onSelectTab('tasks');
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeCollection === 'academic' && currentTab === 'tasks'
                      ? 'bg-white/[0.08] text-white border border-white/[0.08] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <FolderKanban size={14} className="text-amber-400" />
                  <span>Academic Lab MVP</span>
                </button>

                <button
                  onClick={() => {
                    setActiveCollection('google');
                    onSelectTab('calendar');
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeCollection === 'google' && currentTab === 'calendar'
                      ? 'bg-white/[0.08] text-white border border-white/[0.08] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Google Workspace</span>
                </button>
              </div>
            </div>

            {/* Quick Modules Sub-List */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block px-1.5 font-semibold">
                Modules
              </span>
              <div className="space-y-1">
                {dockNav.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => onSelectTab(item.key)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      currentTab === item.key
                        ? 'text-indigo-300 font-medium bg-indigo-500/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                    {item.key === 'tasks' && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        ML 96%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary Panel Footer: Google Sync Status */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-zinc-300">Read-Only Guard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">
              OAuth tokens encrypted with AES-256 server-side. Zero write permissions.
            </p>
          </div>
        </aside>
      )}
    </div>
  );
};
