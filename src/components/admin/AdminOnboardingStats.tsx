import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

interface OnboardingStats {
  enabled: boolean;
  provider: 'anthropic' | 'gemini';
  totalGenerations: number;
  uniqueUsers: number;
  activePlans: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  usageByProvider: {
    anthropic: { generations: number; inputTokens: number; outputTokens: number };
    gemini: { generations: number; inputTokens: number; outputTokens: number };
  };
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
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [testingProvider, setTestingProvider] = useState<'anthropic' | 'gemini' | null>(null);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    provider: 'anthropic' | 'gemini';
    model?: string;
    latencyMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    message?: string;
  } | null>(null);

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

  async function setProvider(provider: 'anthropic' | 'gemini') {
    if (!stats || stats.provider === provider) return;
    setSwitchingProvider(true);
    try {
      const res = await apiFetch('/api/admin/settings/ai_provider', {
        method: 'PUT',
        body: JSON.stringify({ value: provider }),
      });
      if (!res.ok) throw new Error('Failed to update AI provider');
      setStats((prev) => (prev ? { ...prev, provider } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch provider');
    } finally {
      setSwitchingProvider(false);
    }
  }

  async function testProvider(provider: 'anthropic' | 'gemini') {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const res = await apiFetch('/api/admin/onboarding/test-provider', {
        method: 'POST',
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Provider test failed' }));
        throw new Error(data.error || 'Provider test failed');
      }
      const data = await res.json();
      setTestResult({
        ok: true,
        provider,
        model: data.model,
        latencyMs: data.latencyMs,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
      });
    } catch (err) {
      setTestResult({
        ok: false,
        provider,
        message: err instanceof Error ? err.message : 'Provider test failed',
      });
    } finally {
      setTestingProvider(null);
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

      <div className="bg-bg-card rounded-xl border border-border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-3">AI Provider</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setProvider('anthropic')}
            disabled={switchingProvider}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors disabled:opacity-50 ${
              stats.provider === 'anthropic'
                ? 'bg-purple-soft border-purple/30 text-purple'
                : 'border-border text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            Anthropic
          </button>
          <button
            onClick={() => setProvider('gemini')}
            disabled={switchingProvider}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors disabled:opacity-50 ${
              stats.provider === 'gemini'
                ? 'bg-purple-soft border-purple/30 text-purple'
                : 'border-border text-text-secondary hover:bg-bg-elevated'
            }`}
          >
            Gemini
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
            Provider API Test (before enabling to users)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => testProvider('anthropic')}
              disabled={testingProvider !== null}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-text-secondary hover:bg-bg-elevated transition-colors disabled:opacity-50"
            >
              {testingProvider === 'anthropic' ? 'Testing Anthropic...' : 'Test Anthropic API'}
            </button>
            <button
              onClick={() => testProvider('gemini')}
              disabled={testingProvider !== null}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-text-secondary hover:bg-bg-elevated transition-colors disabled:opacity-50"
            >
              {testingProvider === 'gemini' ? 'Testing Gemini...' : 'Test Gemini API'}
            </button>
          </div>

          {testResult && (
            <div className={`mt-3 rounded-lg border px-3 py-2 text-xs font-mono ${
              testResult.ok
                ? 'border-green/30 bg-green-soft text-green'
                : 'border-red/30 bg-red-soft text-red'
            }`}>
              {testResult.ok ? (
                <p>
                  {testResult.provider} OK · {testResult.model} · {testResult.latencyMs}ms · in {testResult.inputTokens} / out {testResult.outputTokens}
                </p>
              ) : (
                <p>{testResult.provider} failed: {testResult.message}</p>
              )}
            </div>
          )}
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProviderUsageCard
          label="Anthropic Usage"
          usage={stats.usageByProvider.anthropic}
        />
        <ProviderUsageCard
          label="Gemini Usage"
          usage={stats.usageByProvider.gemini}
        />
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
                      {log.model}
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

function ProviderUsageCard({
  label,
  usage,
}: {
  label: string;
  usage: { generations: number; inputTokens: number; outputTokens: number };
}) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
      <h3 className="text-sm font-semibold text-text-primary font-mono mb-3">{label}</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Generations</p>
          <p className="text-lg font-semibold text-text-primary font-mono">{usage.generations.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Input</p>
          <p className="text-lg font-semibold text-text-primary font-mono">{usage.inputTokens.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Output</p>
          <p className="text-lg font-semibold text-text-primary font-mono">{usage.outputTokens.toLocaleString()}</p>
        </div>
      </div>
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
