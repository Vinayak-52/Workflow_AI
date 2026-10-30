import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { NavItemKey } from '../components/layout/Sidebar';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InboxPage } from '../features/inbox/InboxPage';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { NotesPage } from '../features/notes/NotesPage';
import { TasksPage } from '../features/tasks/TasksPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'inbox':
        return <InboxPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'notes':
        return <NotesPage />;
      case 'tasks':
        return <TasksPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      activeContext={{
        type: currentTab,
        label: `${currentTab.toUpperCase()} Workspace`,
      }}
    >
      {renderContent()}
    </AppShell>
  );
};
