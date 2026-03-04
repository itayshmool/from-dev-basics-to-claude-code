interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  earned: boolean;
  earnedAt?: string | null;
  progress?: number; // 0-1 for unearned
}

export function AchievementBadge({ icon, title, description, earned, earnedAt, progress }: AchievementBadgeProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        earned
          ? 'bg-bg-card border-purple/20 shadow-glow'
          : 'bg-bg-elevated border-border opacity-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${
            earned ? 'bg-purple-soft' : 'bg-bg-card'
          }`}
        >
          {earned ? icon : '\u{1F512}'}
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
          {!earned && progress !== undefined && progress > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-bg-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple/40 rounded-full"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-[9px] font-mono text-text-muted mt-0.5">
                {Math.round(progress * 100)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
