import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, CheckCircle2, Lock, ExternalLink, Cpu } from 'lucide-react';
import { api } from '../../services/api.ts';

export const SettingsView: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('18:00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
      if (u.preferences?.workingHours) {
        setWorkingStart(u.preferences.workingHours.start);
        setWorkingEnd(u.preferences.workingHours.end);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePreferences({
        workingHours: { start: workingStart, end: workingEnd }
      });
      alert('Preferences saved successfully!');
    } catch (e: any) {
      alert(`Error saving preferences: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-charcoal-100">
          Settings &amp; Academic Configuration
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          Manage workspace profile, calendar working hours, and read-only integration policies.
        </p>
      </div>

      {/* User Profile & Working Hours Form */}
      <form onSubmit={handleSavePreferences} className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-4">
        <h2 className="text-sm font-bold text-charcoal-200 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-400" /> Working Hours &amp; Timezone
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-charcoal-400 mb-1 font-medium">User Profile</label>
            <input
              type="text"
              disabled
              value={user?.displayName || 'Vinayak Chandra (HITK CSBS)'}
              className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-300"
            />
          </div>

          <div>
            <label className="block text-charcoal-400 mb-1 font-medium">IANA Timezone</label>
            <input
              type="text"
              disabled
              value="Asia/Kolkata (UTC +05:30)"
              className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-charcoal-400 mb-1 font-medium">Work Day Starts</label>
            <input
              type="time"
              value={workingStart}
              onChange={e => setWorkingStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-200 focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-charcoal-400 mb-1 font-medium">Work Day Ends</label>
            <input
              type="time"
              value={workingEnd}
              onChange={e => setWorkingEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-charcoal-700 text-charcoal-200 focus:border-brand-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition"
          >
            {saving ? 'Saving...' : 'Update Working Hours'}
          </button>
        </div>
      </form>

      {/* Integration Boundaries & Security Policy */}
      <div className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-4">
        <h2 className="text-sm font-bold text-charcoal-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" /> Integration Boundaries &amp; Security Policy
        </h2>

        <div className="p-4 rounded-xl bg-charcoal-950/60 border border-charcoal-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-charcoal-200">Google Calendar API</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Read-Only
            </span>
          </div>
          <p className="text-[11px] text-charcoal-400">
            Scope: <code className="text-brand-300">https://www.googleapis.com/auth/calendar.readonly</code>. The AI cannot create, modify, or delete calendar events.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-charcoal-950/60 border border-charcoal-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-charcoal-200">Gmail API</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Read-Only
            </span>
          </div>
          <p className="text-[11px] text-charcoal-400">
            Scope: <code className="text-brand-300">https://www.googleapis.com/auth/gmail.readonly</code>. No send, compose, or trash permissions granted.
          </p>
        </div>
      </div>

      {/* Academic Project Credits */}
      <div className="p-6 rounded-2xl bg-charcoal-900 border border-charcoal-800 space-y-3 text-xs">
        <h2 className="text-sm font-bold text-charcoal-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-500" /> Project &amp; Team Details
        </h2>
        <div className="text-charcoal-400 space-y-1 text-xs">
          <p><strong>Institution:</strong> Heritage Institute of Technology, Kolkata (HITK)</p>
          <p><strong>Department:</strong> Computer Science and Business Systems</p>
          <p><strong>Project Title:</strong> AI Workspace (Group 7)</p>
          <p><strong>Mentor:</strong> Prof. Sajal Mitra</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-charcoal-800 text-[11px]">
          <div className="p-2.5 rounded-lg bg-charcoal-800/50">
            <span className="font-semibold text-charcoal-200">Member 1: Ayantik Goswami (2360006)</span>
            <p className="text-charcoal-400">Machine Learning, Random Forest Prioritization, Smart Reminders</p>
          </div>
          <div className="p-2.5 rounded-lg bg-charcoal-800/50">
            <span className="font-semibold text-charcoal-200">Member 2: Ankit Kumar Kunwar (2360031)</span>
            <p className="text-charcoal-400">Node/Express Backend, REST APIs, Database, Cloud Deployment</p>
          </div>
          <div className="p-2.5 rounded-lg bg-charcoal-800/50">
            <span className="font-semibold text-charcoal-200">Member 3: Vinayak Chandra (2360035)</span>
            <p className="text-charcoal-400">React Frontend, Dashboard, Tasks, Calendar, Notes, UI/UX</p>
          </div>
          <div className="p-2.5 rounded-lg bg-charcoal-800/50">
            <span className="font-semibold text-charcoal-200">Member 4: Yash Raj (2360014)</span>
            <p className="text-charcoal-400">Research Mapping, Testing, Postman Test Suite, QA &amp; Evaluation</p>
          </div>
        </div>
      </div>
    </div>
  );
};
