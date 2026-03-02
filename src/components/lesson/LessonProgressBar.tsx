interface LessonProgressBarProps {
  current: number;
  total: number;
  onClose: () => void;
}

export function LessonProgressBar({ current, total, onClose }: LessonProgressBarProps) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 md:px-6">
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors flex-shrink-0"
        aria-label="Close lesson"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden">
        <div
          className="h-full bg-purple rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <span className="text-xs font-semibold text-text-muted tabular-nums flex-shrink-0">
        {current + 1}/{total}
      </span>
    </div>
  );
}
