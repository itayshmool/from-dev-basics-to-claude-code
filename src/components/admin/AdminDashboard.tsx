import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

const LEVEL_EMOJI: Record<number, string> = {
  0: '\u{1F4BB}', 1: '\u{1F4DF}', 2: '\u{1F4D6}', 3: '\u{1F500}',
  4: '\u{2601}\uFE0F', 5: '\u{1F528}', 6: '\u{1F916}', 7: '\u{1F680}',
};

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
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-text-primary font-mono">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value={stats.totalUsers} icon={'\u{1F465}'} />
        <StatCard label="Completions" value={stats.totalCompletions} icon={'\u{2705}'} />
        <StatCard label="Active (7d)" value={stats.activeUsersLast7Days} icon={'\u{1F525}'} />
        <StatCard label="Avg Rate" value={`${avgRate}%`} icon={'\u{1F4CA}'} />
      </div>

      {/* Per-level chart */}
      <div className="bg-bg-card rounded-xl border border-border p-5 md:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-5">Completion by Level</h2>
        <div className="space-y-4">
          {stats.completionsPerLevel.map(level => {
            const pct = level.totalPossible > 0
              ? Math.round((level.completions / level.totalPossible) * 100)
              : 0;
            return (
              <div key={level.levelId} className="flex items-center gap-3">
                <span className="text-base flex-shrink-0">{LEVEL_EMOJI[level.levelId] ?? '\u{1F4DA}'}</span>
                <span className="text-xs font-mono text-text-secondary w-36 truncate">
                  {level.levelTitle}
                </span>
                <div className="flex-1 h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-text-muted w-20 text-right tabular-nums">
                  {level.completions}/{level.totalPossible} ({pct}%)
                </span>
              </div>
            );
          })}
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
