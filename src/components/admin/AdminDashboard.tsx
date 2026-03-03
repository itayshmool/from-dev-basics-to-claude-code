import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

interface Stats {
  totalUsers: number;
  totalCompletions: number;
  activeUsersLast7Days: number;
  completionsPerLevel: {
    levelId: number;
    levelTitle: string;
    completions: number;
    totalPossible: number;
  }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
      })
      .then(setStats)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-red text-sm">{error}</p>;
  }

  if (!stats) {
    return <p className="text-text-muted text-sm font-mono">Loading stats...</p>;
  }

  const avgRate = stats.completionsPerLevel.length > 0
    ? Math.round(
        stats.completionsPerLevel.reduce((sum, l) =>
          sum + (l.totalPossible > 0 ? (l.completions / l.totalPossible) * 100 : 0), 0
        ) / stats.completionsPerLevel.length
      )
    : 0;

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Students" value={stats.totalUsers} />
        <StatCard label="Completions" value={stats.totalCompletions} />
        <StatCard label="Active (7d)" value={stats.activeUsersLast7Days} />
        <StatCard label="Avg Rate" value={`${avgRate}%`} />
      </div>

      {/* Per-level chart */}
      <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Completion by Level</h2>
      <div className="space-y-3">
        {stats.completionsPerLevel.map(level => {
          const pct = level.totalPossible > 0
            ? Math.round((level.completions / level.totalPossible) * 100)
            : 0;
          return (
            <div key={level.levelId} className="flex items-center gap-3">
              <span className="text-xs font-mono text-text-muted w-40 truncate">
                L{level.levelId}: {level.levelTitle}
              </span>
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-text-muted w-16 text-right">
                {level.completions}/{level.totalPossible}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-4">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-text-primary font-mono mt-1">{value}</p>
    </div>
  );
}
