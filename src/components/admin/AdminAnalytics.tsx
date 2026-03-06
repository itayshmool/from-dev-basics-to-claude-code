import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api.js';
import { AdminLoadingState } from './shared/AdminLoadingState.js';
import { getLevelDisplayNumber } from '../../lib/constants';

interface LevelCompletion {
  levelId: number;
  levelTitle: string;
  completions: number;
  totalPossible: number;
}

interface Stats {
  totalUsers: number;
  totalCompletions: number;
  activeUsersLast7Days: number;
  completionsPerLevel: LevelCompletion[];
}

export function AdminAnalytics() {
  const useApi = import.meta.env.VITE_USE_API === 'true';

  if (!useApi) {
    return (
      <div className="bg-bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-text-muted text-sm font-mono">Analytics requires the backend API.</p>
        <p className="text-text-muted text-xs mt-2">Set VITE_USE_API=true and start the server.</p>
      </div>
    );
  }

  return <AnalyticsDashboard />;
}

function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/admin/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load analytics');
        return res.json();
      })
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <AdminLoadingState message="Loading analytics..." />;
  }

  if (error) {
    return (
      <div className="bg-bg-card rounded-xl border border-border p-6">
        <p className="text-red text-sm font-mono">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-bg-card rounded-xl border border-border p-6">
        <p className="text-text-muted text-sm font-mono">No data available</p>
      </div>
    );
  }

  const maxCompletions = Math.max(...stats.completionsPerLevel.map(l => l.completions), 1);

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Total Users" value={stats.totalUsers} />
        <SummaryCard label="Total Completions" value={stats.totalCompletions} />
        <SummaryCard label="Active (7d)" value={stats.activeUsersLast7Days} />
      </div>

      {/* Completion Funnel */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">
          Completion Funnel
        </h2>
        <div className="bg-bg-card rounded-xl border border-border p-4 space-y-3">
          {stats.completionsPerLevel.map(level => (
            <CompletionBar
              key={level.levelId}
              label={`L${getLevelDisplayNumber(level.levelId)}: ${level.levelTitle}`}
              value={level.completions}
              maxValue={maxCompletions}
              displayValue={String(level.completions)}
            />
          ))}
        </div>
      </section>

      {/* Completion Rate by Level */}
      <section>
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">
          Completion Rate by Level
        </h2>
        <div className="bg-bg-card rounded-xl border border-border p-4 space-y-3">
          {stats.completionsPerLevel.map(level => {
            const rate = level.totalPossible > 0
              ? Math.round((level.completions / level.totalPossible) * 100)
              : 0;
            return (
              <CompletionRateBar
                key={level.levelId}
                label={`L${getLevelDisplayNumber(level.levelId)}: ${level.levelTitle}`}
                rate={rate}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-4">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-text-primary font-mono mt-1">{value}</p>
    </div>
  );
}

interface CompletionBarProps {
  label: string;
  value: number;
  maxValue: number;
  displayValue: string;
}

function CompletionBar({ label, value, maxValue, displayValue }: CompletionBarProps) {
  const widthPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-text-muted w-40 truncate">{label}</span>
      <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-purple rounded-full transition-all"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-muted w-12 text-right">{displayValue}</span>
    </div>
  );
}

interface CompletionRateBarProps {
  label: string;
  rate: number;
}

function CompletionRateBar({ label, rate }: CompletionRateBarProps) {
  let barColorClass: string;
  if (rate >= 75) {
    barColorClass = 'bg-green';
  } else if (rate >= 50) {
    barColorClass = 'bg-yellow';
  } else {
    barColorClass = 'bg-red';
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-text-muted w-40 truncate">{label}</span>
      <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColorClass}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-muted w-12 text-right">{rate}%</span>
    </div>
  );
}
