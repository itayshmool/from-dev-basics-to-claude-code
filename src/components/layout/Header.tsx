import { LEVELS } from '../../lib/constants';
import { useProgress } from '../../hooks/useProgress';

interface HeaderProps {
  currentLevel: number;
}

export function Header({ currentLevel }: HeaderProps) {
  const { getLevelCompletedCount } = useProgress();
  const levelInfo = LEVELS[currentLevel];
  const completed = getLevelCompletedCount(currentLevel);
  const total = levelInfo?.lessonCount ?? 1;
  const pct = Math.round((completed / total) * 100);

  return (
    <header className="flex items-center justify-between px-5 py-2.5 bg-bg-card border-b border-border" style={{ boxShadow: 'var(--shadow-xs)' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-lavender flex items-center justify-center" style={{ boxShadow: 'var(--shadow-button)' }}>
          <span className="text-white text-sm font-bold leading-none">&gt;_</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-text-primary leading-tight">Terminal Trainer</h1>
          <p className="text-xs text-text-muted">
            Level {currentLevel} &middot; {levelInfo?.title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold text-text-secondary">{completed}/{total}</span>
        <div className="w-20 h-2 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-lavender rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-lavender">{pct}%</span>
      </div>
    </header>
  );
}
