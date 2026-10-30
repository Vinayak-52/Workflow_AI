import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Shield, Key, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    if (!confirm('Disconnect Google account? This will revoke access and remove encrypted credentials.')) return;
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Settings & Integrations</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your account permissions and verified read-only Google connections.
        </p>
      </div>

      {/* Google Integration Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-200">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-100">Google Workspace (Read-Only)</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Enables read-only access to Gmail messages and Google Calendar events.
              </p>
            </div>
          </div>

          <Badge variant={status?.connected ? 'success' : 'default'}>
            {status?.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Permissions list */}
        <div className="p-3 bg-zinc-900/60 rounded border border-zinc-800/80 space-y-2 text-xs">
          <span className="font-medium text-zinc-300 block">Requested OAuth Scopes:</span>
          <div className="space-y-1 font-mono text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>https://www.googleapis.com/auth/gmail.readonly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span>https://www.googleapis.com/auth/calendar.readonly</span>
            </div>
          </div>
          <div className="pt-2 text-[11px] text-zinc-500 border-t border-zinc-800">
            <strong>Security Boundary:</strong> No send, compose, modify, delete, or calendar write permissions are ever requested.
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {status?.connected ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-300 font-mono">
                Account: {status.email || 'Test Account'}
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

      {/* User Preferences Card */}
      <Card className="p-5 space-y-4">
        <h3 className="text-xs font-semibold text-zinc-100">Workspace & Timezone Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1">Configured Timezone</label>
            <input
              type="text"
              readOnly
              value="Asia/Kolkata (IST)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1">Working Hours</label>
            <input
              type="text"
              readOnly
              value="09:00 - 18:00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 text-xs font-mono"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
