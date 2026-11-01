import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Shield, Key, RefreshCw, AlertCircle, CheckCircle2, Lock, Clock, Globe } from 'lucide-react';
import { api, GoogleIntegrationStatus } from '../../lib/api';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = () => {
    api.getIntegrationStatus().then(setStatus).catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnectGoogle = () => {
    window.location.href = '/api/v1/auth/google';
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Disconnect Google account? This will revoke access and scrub encrypted credentials.')) return;
    setLoading(true);
    try {
      await api.disconnectGoogle();
      fetchStatus();
    } catch {
      alert('Failed to disconnect Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 pb-12">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white tracking-tight">Settings & Integrations</h2>
        <p className="text-xs text-zinc-400">
          Manage your account permissions, verified read-only Google connection, and scheduling parameters.
        </p>
      </div>

      {/* Google Integration Card */}
      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-tight">
                Google Workspace (Read-Only)
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Enables read-only access to Gmail threads and Google Calendar events.
              </p>
            </div>
          </div>

          <Badge variant={status?.connected ? 'success' : 'default'} dot>
            {status?.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Permissions list & security explanation */}
        <div className="p-4 bg-[#0d0e14] rounded-xl border border-white/[0.06] space-y-3 text-xs">
          <span className="font-semibold text-zinc-300 block text-[11px] uppercase tracking-wider font-mono">
            Requested OAuth Scopes:
          </span>
          <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>https://www.googleapis.com/auth/gmail.readonly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>https://www.googleapis.com/auth/calendar.readonly</span>
            </div>
          </div>

          <div className="pt-2.5 text-[11px] text-zinc-400 border-t border-white/[0.06] flex items-start gap-2">
            <Lock size={13} className="text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-200">Security Boundary:</strong> No send, compose, modify, delete, or calendar write operations are requested or possible. Tokens are encrypted server-side using AES-256.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          {status?.connected ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-zinc-300 font-mono">
                Connected Account: <strong className="text-white">{status.email || 'Test Account'}</strong>
              </span>
              <Button size="sm" variant="danger" onClick={handleDisconnectGoogle} disabled={loading}>
                Disconnect & Revoke
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="primary" onClick={handleConnectGoogle}>
              Connect Google Account
            </Button>
          )}
        </div>
      </Card>

      {/* Workspace Preferences Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
          <Clock size={16} className="text-indigo-400" />
          <h3 className="text-xs font-semibold text-white tracking-tight uppercase tracking-wider">
            Workspace & Scheduling Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-zinc-400 text-[11px] font-medium mb-1">
              Configured Timezone
            </label>
            <input
              type="text"
              readOnly
              value="Asia/Kolkata (IST)"
              className="w-full bg-[#0d0e14] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-200 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-[11px] font-medium mb-1">
              Working Hours
            </label>
            <input
              type="text"
              readOnly
              value="09:00 – 18:00"
              className="w-full bg-[#0d0e14] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-200 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-[11px] font-medium mb-1">
              Cognitive Break Buffer
            </label>
            <input
              type="text"
              readOnly
              value="15 Minutes"
              className="w-full bg-[#0d0e14] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-200 text-xs font-mono"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
