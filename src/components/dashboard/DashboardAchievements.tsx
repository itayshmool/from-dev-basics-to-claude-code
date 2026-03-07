import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { AchievementBadge } from './AchievementBadge';

interface EarnedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: string | null;
}

interface AvailableAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
}

interface AchievementsData {
  earned: EarnedAchievement[];
  available: AvailableAchievement[];
  totalEarned: number;
  totalAvailable: number;
}

export function DashboardAchievements() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/progress/achievements');
        if (res.ok) setData(await res.json());
      } catch {
        // Failed
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-text-muted text-sm font-mono animate-pulse">Loading achievements...</p>;
  }

  if (!data) {
    return <p className="text-text-muted text-sm font-mono">Failed to load achievements.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary font-mono">Achievements</h1>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-mono text-purple">{data.totalEarned}</span>
          <span className="text-sm font-mono text-text-muted">/ {data.totalAvailable}</span>
        </div>
      </div>

      {/* Next achievement preview */}
      {(() => {
        const closest = data.available
          .filter(a => a.progress > 0)
          .sort((a, b) => b.progress - a.progress)[0];
        if (!closest) return null;
        const pct = Math.round(closest.progress * 100);
        return (
          <div className="mb-6 bg-purple-soft border border-purple/20 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl grayscale">{closest.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-purple uppercase tracking-wider">Almost there</p>
              <p className="text-sm font-mono text-text-primary font-medium">{closest.title}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden max-w-[160px]">
                  <div className="h-full bg-purple rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] font-mono text-text-muted tabular-nums">{pct}%</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Earned */}
      {data.earned.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-primary font-mono mb-3">
            Earned ({data.earned.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list" aria-label="Earned achievements">
            {data.earned.map(a => (
              <AchievementBadge
                key={a.id}
                icon={a.icon}
                title={a.title}
                description={a.description}
                earned
                earnedAt={a.earnedAt}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked / In Progress */}
      {data.available.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-primary font-mono mb-3">
            Locked ({data.available.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="list" aria-label="Locked achievements">
            {data.available.map(a => (
              <AchievementBadge
                key={a.id}
                icon={a.icon}
                title={a.title}
                description={a.description}
                earned={false}
                progress={a.progress}
                hint={a.progress === 0 ? 'Keep learning!' : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {data.earned.length === 0 && data.available.length === 0 && (
        <p className="text-text-muted text-sm font-mono text-center py-8">
          No achievements available yet.
        </p>
      )}
    </div>
  );
}
