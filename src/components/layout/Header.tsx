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
    <header className="flex items-center justify-between px-6 py-3 bg-bg-card border-b border-border" style={{ boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="w-9 h-9 rounded-xl bg-lavender flex items-center justify-center" style={{ boxShadow: 'var(--shadow-button)' }}>
          <span className="text-white text-lg font-bold leading-none">&gt;_</span>
        </div>
        <div>
          <h1 className="text-base font-extrabold text-text-primary tracking-tight leading-tight">
            Terminal Trainer
          </h1>
          <p className="text-xs font-semibold text-lavender">
            Level {currentLevel} <span className="text-text-muted font-medium">&middot; {levelInfo?.title}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Streak / progress badge */}
        <div className="flex items-center gap-2 bg-sunshine-light px-3 py-1.5 rounded-full">
          <span className="text-base leading-none">&#9889;</span>
          <span className="text-xs font-bold text-text-primary">{completed}/{total}</span>
        </div>

        {/* Progress bar */}
        <div className="w-28 h-3 bg-lavender-light rounded-full overflow-hidden">
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
