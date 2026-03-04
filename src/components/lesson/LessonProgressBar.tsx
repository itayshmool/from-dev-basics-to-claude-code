import { useTheme } from '../../hooks/useTheme';

interface LessonProgressBarProps {
  current: number;
  total: number;
  onClose: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  lessonTitle?: string;
  lessonId?: string;
  onReportBug?: () => void;
}

export function LessonProgressBar({ current, total, onClose, onBack, canGoBack, lessonTitle, lessonId, onReportBug }: LessonProgressBarProps) {
  const { theme, toggle: toggleTheme } = useTheme();
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex-shrink-0 px-4 py-3 md:px-8 lg:px-12 xl:px-16">
      <div className="flex items-center gap-3">
        {/* Back or close button */}
        {canGoBack && onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors flex-shrink-0"
            aria-label="Close lesson"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-purple rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="text-[11px] font-mono font-semibold text-text-muted tabular-nums flex-shrink-0">
          {current + 1}/{total}
        </span>

        {onReportBug && (
          <button
            onClick={onReportBug}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors flex-shrink-0"
            aria-label="Report a bug"
            title="Report a bug"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97l-7-12a2 2 0 00-3.5 0l-7 12A2 2 0 005.07 19z" />
            </svg>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors flex-shrink-0"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Lesson title */}
      {lessonTitle && (
        <p className="text-xs text-text-muted text-center mt-1.5 truncate">
          {lessonId ? `${lessonId}: ` : ''}{lessonTitle}
        </p>
      )}
    </div>
  );
}
