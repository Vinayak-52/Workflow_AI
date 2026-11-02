import React, { useState } from 'react';
import {
  LayoutDashboard, CheckSquare, BookOpen, Calendar, FileText,
  Bell, Settings, Bot, Sparkles, Plus, Menu, X, ChevronRight, User, LogOut
} from 'lucide-react';
import { LiveClock } from './LiveClock.tsx';
import { DashboardView } from '../features/dashboard/DashboardView.tsx';
import { TasksView } from '../features/tasks/TasksView.tsx';
import { NotesView } from '../features/notes/NotesView.tsx';
import { CalendarView } from '../features/calendar/CalendarView.tsx';
import { DocumentsView } from '../features/documents/DocumentsView.tsx';
import { RemindersView } from '../features/reminders/RemindersView.tsx';
import { SettingsView } from '../features/settings/SettingsView.tsx';
import { AssistantPanel } from '../features/assistant/AssistantPanel.tsx';
import { User as UserType } from '../types/index.ts';

interface AppShellProps {
  currentUser?: UserType | null;
  onSignOut?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ currentUser, onSignOut }) => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks & Priority', icon: CheckSquare },
    { id: 'notes', label: 'Notes & Actions', icon: BookOpen },
    { id: 'calendar', label: 'Calendar & Plan', icon: Calendar },
    { id: 'documents', label: 'Docs & Summary', icon: FileText },
    { id: 'reminders', label: 'Smart Reminders', icon: Bell },
    { id: 'settings', label: 'Settings & Policy', icon: Settings }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setCurrentView}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          />
        );
      case 'tasks':
        return (
          <TasksView
            isCreateOpen={isCreateTaskOpen}
            onCloseCreate={() => setIsCreateTaskOpen(false)}
          />
        );
      case 'notes':
        return <NotesView onTaskCreated={() => setCurrentView('tasks')} />;
      case 'calendar':
        return <CalendarView />;
      case 'documents':
        return <DocumentsView onTaskCreated={() => setCurrentView('tasks')} />;
      case 'reminders':
        return <RemindersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigate={setCurrentView}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          />
        );
    }
  };

  const displayName = currentUser?.displayName || 'Vinayak Chandra';
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-charcoal-950 text-charcoal-100 font-sans selection:bg-brand-600 selection:text-white">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } shrink-0 bg-charcoal-900 border-r border-charcoal-800 flex flex-col transition-all duration-200 z-30`}
      >
        {/* Brand */}
        <div className="p-4 border-b border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && (
              <div className="truncate">
                <span className="font-bold text-sm tracking-tight text-charcoal-100 block">
                  AI Workspace
                </span>
                <span className="text-[10px] text-charcoal-400 font-medium block">
                  HITK • CBS3293
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition hidden md:block"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30 shadow-sm'
                    : 'text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-400' : 'text-charcoal-400'}`} />
                {isSidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Sign Out badge */}
        {isSidebarOpen && (
          <div className="p-3 border-t border-charcoal-800 bg-charcoal-950/40 text-[11px] text-charcoal-400 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-charcoal-800 border border-charcoal-700 flex items-center justify-center font-bold text-xs text-brand-400 shrink-0">
                  {initials}
                </div>
                <div className="truncate">
                  <p className="font-semibold text-charcoal-200 truncate">{displayName}</p>
                  <p className="text-[10px] text-charcoal-500 truncate">{currentUser?.email || 'vinayak@hitk.edu.in'}</p>
                </div>
              </div>
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Sign Out / Switch Account"
                  className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-400 hover:bg-charcoal-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-[10px] text-charcoal-500 flex items-center justify-between pt-1 border-t border-charcoal-800/60">
              <span>Mentor: Prof. Sajal Mitra</span>
              <span className="text-emerald-400 text-[9px] font-mono">Logged In</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <header className="h-16 border-b border-charcoal-800 bg-charcoal-900/60 backdrop-blur-md px-6 flex items-center justify-between gap-4 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-200 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-charcoal-500">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-600" />
              <span className="font-semibold text-charcoal-200 capitalize">
                {currentView.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Timezone Clock */}
            <LiveClock timezone="Asia/Kolkata" />

            {/* Quick Action */}
            <button
              onClick={() => {
                setCurrentView('tasks');
                setIsCreateTaskOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 text-xs font-medium border border-charcoal-700 transition"
            >
              <Plus className="w-3.5 h-3.5 text-brand-400" />
              Quick Task
            </button>

            {/* Contextual Assistant Trigger Button */}
            <button
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isAssistantOpen
                  ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/20'
                  : 'bg-charcoal-800 hover:bg-charcoal-700 text-brand-400 border-charcoal-700'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            {/* Sign Out Button in TopBar */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-400 hover:text-rose-400 border border-charcoal-700 transition flex items-center gap-1 text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Contextual Assistant Slide-Out Panel */}
      <AssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        activeContext={{
          type: currentView,
          id: null,
          label: currentView.toUpperCase()
        }}
        onTaskCreated={() => {
          if (currentView === 'tasks') {
            // Re-render
          }
        }}
      />
    </div>
  );
};
