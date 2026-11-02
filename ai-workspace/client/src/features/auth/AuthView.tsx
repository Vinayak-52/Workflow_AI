import React, { useState } from 'react';
import { Sparkles, Lock, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';
import { User } from '../../types/index.ts';

interface AuthViewProps {
  onSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('vinayak');
  const [password, setPassword] = useState('password123');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(username, password);
        onSuccess(res.user);
      } else {
        const res = await api.register(username, password, displayName || username);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login('vinayak', 'password123');
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] dark:bg-charcoal-950 flex flex-col justify-center items-center p-4 selection:bg-brand-blue selection:text-white transition-colors duration-200">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500/10 dark:from-brand-600/10 via-transparent to-transparent pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-charcoal-100">
            AI Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-charcoal-400">
            Department of Computer Science and Business Systems, HITK
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 rounded-3xl p-7 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 space-y-5">
          {/* Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-charcoal-800 text-slate-900 dark:text-charcoal-100 shadow-sm'
                  : 'text-slate-500 dark:text-charcoal-400 hover:text-slate-800 dark:hover:text-charcoal-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-charcoal-800 text-slate-900 dark:text-charcoal-100 shadow-sm'
                  : 'text-slate-500 dark:text-charcoal-400 hover:text-slate-800 dark:hover:text-charcoal-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block text-slate-600 dark:text-charcoal-400 font-medium mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 dark:text-charcoal-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g., Vinayak Chandra"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-700/80 text-slate-900 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-600 dark:text-charcoal-400 font-medium mb-1.5">Username</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 dark:text-charcoal-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g., vinayak"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-700/80 text-slate-900 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-charcoal-400 font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-charcoal-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-950 border border-slate-200 dark:border-charcoal-700/80 text-slate-900 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Register &amp; Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-charcoal-800 w-full"></div>
            <span className="bg-white dark:bg-charcoal-900 px-3 text-[10px] text-slate-400 dark:text-charcoal-500 uppercase tracking-widest font-mono">
              Or Fast Evaluation
            </span>
          </div>

          {/* Fast Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-slate-800 dark:text-charcoal-200 border border-slate-200/80 dark:border-charcoal-700 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>One-Click Academic Demo Sign In</span>
          </button>
          <p className="text-[10px] text-slate-400 dark:text-charcoal-500 text-center">
            Preloads @vinayak profile with seeded academic tasks, schedule &amp; models.
          </p>
        </div>

        {/* Footer Notice */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-charcoal-500">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-brand-400" />
          <span>Strictly Read-Only Integration Policy • Mentor: Prof. Sajal Mitra</span>
        </div>
      </div>
    </div>
  );
};
