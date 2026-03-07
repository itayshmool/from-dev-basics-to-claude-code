import { SECTION_TYPE_LABELS } from './sectionLabels';

interface LessonProgressBarProps {
  current: number;
  total: number;
  onClose: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  lessonTitle?: string;
  onReportBug?: () => void;
  sectionType?: string;
}

export function LessonProgressBar({ current, total, onClose, onBack, canGoBack, lessonTitle, onReportBug, sectionType }: LessonProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex-shrink-0 px-4 py-3 md:px-8 lg:px-12 xl:px-16">
      <div className="flex items-center gap-3">
        {/* Back or close button */}
        {canGoBack && onBack ? (
          <div className="relative flex-shrink-0 group">
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="pointer-events-none absolute top-full left-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
              Go back
            </span>
          </div>
        ) : (
          <div className="relative flex-shrink-0 group">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="Close lesson"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="pointer-events-none absolute top-full left-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
              Close lesson
            </span>
          </div>
        )}

        <div className="flex-1 h-3 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-purple rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, boxShadow: pct > 0 ? '0 0 8px rgba(255, 107, 53, 0.3)' : undefined }}
          />
        </div>

        <span className="text-[11px] font-mono font-semibold text-text-muted tabular-nums flex-shrink-0">
          <span className="hidden sm:inline">Section </span>{current + 1}<span className="text-text-muted/60"> of </span>{total}
        </span>

        {onReportBug && (
          <div className="relative flex-shrink-0 group">
            <button
              onClick={onReportBug}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="Report a bug"
              title="Report a bug"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.97l-7-12a2 2 0 00-3.5 0l-7 12A2 2 0 005.07 19z" />
              </svg>
            </button>
            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
              Report a bug
            </span>
          </div>
        )}

      </div>

      {/* Lesson title + section type indicator */}
      <div className="flex items-center justify-center gap-2 mt-1.5">
        {sectionType && SECTION_TYPE_LABELS[sectionType] && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-soft border border-purple/10 text-[11px] font-mono font-semibold text-purple flex-shrink-0">
            <span>{SECTION_TYPE_LABELS[sectionType].icon}</span>
            {SECTION_TYPE_LABELS[sectionType].label}
          </span>
        )}
        {lessonTitle && (
          <p className="text-xs text-text-muted truncate">
            {lessonTitle}
          </p>
        )}
      </div>
    </div>
  );
}
