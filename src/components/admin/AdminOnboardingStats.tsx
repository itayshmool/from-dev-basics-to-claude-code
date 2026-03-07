import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

interface OnboardingStats {
  enabled: boolean;
  totalGenerations: number;
  uniqueUsers: number;
  activePlans: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  recentLogs: {
    id: number;
    userId: string;
    inputTokens: number;
    outputTokens: number;
    model: string;
    createdAt: string;
  }[];
}

export function AdminOnboardingStats() {
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await apiFetch('/api/admin/onboarding/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  async function toggleEnabled() {
    if (!stats) return;
    setToggling(true);
    try {
      const res = await apiFetch('/api/admin/settings/ai_onboarding_enabled', {
        method: 'PUT',
        body: JSON.stringify({ value: !stats.enabled }),
      });
      if (!res.ok) throw new Error('Failed to update setting');
      setStats((prev) => (prev ? { ...prev, enabled: !prev.enabled } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle');
    } finally {
      setToggling(false);
    }
  }

  if (error) {
    return <p className="text-red text-sm">{error}</p>;
  }

  if (!stats) {
    return <p className="text-text-muted text-sm font-mono">Loading stats...</p>;
  }

  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-text-primary font-mono">AI Onboarding</h1>

        {/* Toggle */}
        <button
          onClick={toggleEnabled}
          disabled={toggling}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm font-mono transition-colors hover:bg-bg-elevated disabled:opacity-50"
        >
          <span
            className={`w-2 h-2 rounded-full ${stats.enabled ? 'bg-green' : 'bg-red'}`}
          />
          <span className="text-text-secondary">
            {stats.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Generations" value={stats.totalGenerations} icon="🤖" />
        <StatCard label="Unique Users" value={stats.uniqueUsers} icon="👤" />
        <StatCard label="Active Plans" value={stats.activePlans} icon="📋" />
        <StatCard label="Total Tokens" value={totalTokens.toLocaleString()} icon="🔤" />
      </div>

      {/* Token breakdown */}
      <div className="bg-bg-card rounded-xl border border-border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-3">Token Usage</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Input Tokens</p>
            <p className="text-lg font-semibold text-text-primary font-mono">{stats.totalInputTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Output Tokens</p>
            <p className="text-lg font-semibold text-text-primary font-mono">{stats.totalOutputTokens.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Recent generations */}
      {stats.recentLogs.length > 0 && (
        <div className="bg-bg-card rounded-xl border border-border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-semibold text-text-primary font-mono mb-3">
            Recent Generations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-text-muted text-[10px] uppercase tracking-wider">
                  <th className="text-left pb-2">Date</th>
                  <th className="text-left pb-2">User</th>
                  <th className="text-right pb-2">Input</th>
                  <th className="text-right pb-2">Output</th>
                  <th className="text-right pb-2">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentLogs.map((log) => (
                  <tr key={log.id} className="text-text-secondary">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()}{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 pr-3 text-text-muted truncate max-w-[120px]">
                      {log.userId.slice(0, 8)}...
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{log.inputTokens}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{log.outputTokens}</td>
                    <td className="py-2 text-right text-text-muted truncate max-w-[120px]">
                      {log.model.replace('claude-', '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 md:p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl lg:text-3xl font-semibold text-text-primary font-mono">{value}</p>
    </div>
  );
}
