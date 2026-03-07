interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  earnedAt?: string | null;
  progress?: number; // 0-1 for unearned
  hint?: string; // hint for how to earn
}

export function AchievementBadge({ icon, title, description, earned, earnedAt, progress, hint }: AchievementBadgeProps) {
  const pct = progress !== undefined ? Math.round(progress * 100) : 0;

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        earned
          ? 'bg-bg-card border-purple/20 shadow-glow'
          : 'bg-bg-elevated border-border opacity-70 hover:opacity-90'
      }`}
      role="listitem"
      aria-label={`${title}${earned ? ' — earned' : ` — ${pct}% progress`}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${
            earned ? 'bg-purple-soft' : 'bg-bg-card grayscale-[0.5]'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-mono font-medium ${earned ? 'text-text-primary' : 'text-text-muted'}`}>
            {title}
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">{description}</p>
          {earned && earnedAt && (
            <p className="text-[9px] font-mono text-text-muted mt-1">
              Earned {new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {!earned && (
            <div className="mt-2">
              <div className="h-1 bg-bg-card rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct > 0 ? 'bg-purple/40' : 'bg-border'}`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <p className="text-[9px] font-mono text-text-muted mt-0.5">
                {pct > 0 ? `${pct}%` : hint || 'Not started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
