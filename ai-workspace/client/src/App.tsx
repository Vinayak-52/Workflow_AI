import React, { useState, useEffect } from 'react';
import { AppShell } from './components/AppShell.tsx';
import { AuthView } from './features/auth/AuthView.tsx';
import { api } from './services/api.ts';
import { User } from './types/index.ts';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ai_workspace_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ai_workspace_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('ai_workspace_token');
    if (savedToken) {
      api.getMe()
        .then(user => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem('ai_workspace_token');
          setCurrentUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleSignOut = () => {
    api.clearToken();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] dark:bg-charcoal-950 flex items-center justify-center text-xs text-slate-500 dark:text-charcoal-400 font-mono">
        Loading AI Workspace...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthView
        onSuccess={user => setCurrentUser(user)}
      />
    );
  }

  return (
    <AppShell
      currentUser={currentUser}
      onSignOut={handleSignOut}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
};

export default App;
