import { LEVELS } from '../../lib/constants';
import { useProgress } from '../../hooks/useProgress';
import { ClaudeIcon } from '../icons/ClaudeIcon';

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
    <header className="flex items-center justify-between px-5 py-3 bg-bg-secondary border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple flex items-center justify-center" style={{ boxShadow: 'var(--shadow-button)' }}>
          <ClaudeIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-text-primary leading-tight">From Zero to Claude Code</h1>
          <p className="text-xs text-text-muted">
            Level {currentLevel} &middot; {levelInfo?.title}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-text-muted">{completed}/{total}</span>
        <div className="w-24 h-2 bg-bg-primary rounded-full overflow-hidden">
          <div
            className="h-full bg-purple rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-purple">{pct}%</span>
      </div>
    </header>
  );
}
